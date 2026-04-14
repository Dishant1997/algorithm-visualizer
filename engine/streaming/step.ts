import type {
  ConsumerGroupId,
  DeadLetterEntry,
  Message,
  RetryEntry,
  TopicId,
} from "@/domain";

import { messageId } from "./branded";
import { committedKey, partitionKey } from "./keys";
import { buildStreamingMetricsSnapshot } from "./metrics";
import { pickPartitionIndex, shouldFailProcessing } from "./pure";
import type { StreamingSimulationEvent } from "./simulation-events";
import type {
  StreamingSimulationConfig,
  StreamingRuntimeState,
  TickResult,
} from "./types";

type ProcessingOutcome =
  | { readonly kind: "ack" }
  | { readonly kind: "retry"; readonly failuresRecorded: number }
  | { readonly kind: "dlq"; readonly failuresRecorded: number };

/**
 * Advances the simulation by exactly one tick:
 * 1) producers append to partition logs (deterministic ordering by producer id),
 * 2) consumers drain retries first, then round-robin partition fetches,
 * 3) failures enqueue retries with backoff or move to the DLQ,
 * 4) metrics are computed from the post-tick snapshot.
 */
export function stepStreamingSimulation(
  state: StreamingRuntimeState,
  config: StreamingSimulationConfig,
): TickResult {
  const nextTick = {
    index: state.tick.index + 1,
    timeMs: state.tick.timeMs + config.msPerTick,
  };

  const tickEvents: StreamingSimulationEvent[] = [];
  let eventSeq = 0;
  const emit = (
    event: Omit<StreamingSimulationEvent, "id" | "tickIndex" | "simTimeMs">,
  ) => {
    tickEvents.push({
      id: `evt-${nextTick.index}-${eventSeq++}`,
      tickIndex: nextTick.index,
      simTimeMs: nextTick.timeMs,
      ...event,
    });
  };

  const topicsById = new Map(config.topics.map((t) => [t.id, t]));

  // --- Phase 1: produce & append to partition logs ----------------------------
  let partitionLogs: StreamingRuntimeState["partitionLogs"] = state.partitionLogs;
  let producerRateCredit = { ...state.producerRateCredit };
  let producerPartitionCursor = { ...state.producerPartitionCursor };
  let nextSerial = state.nextMessageSerial;
  let producedMessages = 0;

  const sortedProducers = [...config.producers].sort((a, b) =>
    String(a.id).localeCompare(String(b.id)),
  );

  for (const producer of sortedProducers) {
    const topic = topicsById.get(producer.topicId);
    if (!topic) continue;

    const routing = producer.routing ?? "hash";
    const producerKey = String(producer.id);
    const priorCredit = producerRateCredit[producerKey] ?? 0;
    const totalRate = producer.rate.messagesPerTick + priorCredit;
    const wholeMessages = Math.floor(totalRate);
    const remainingCredit = totalRate - wholeMessages;
    producerRateCredit = { ...producerRateCredit, [producerKey]: remainingCredit };

    let cursor = producerPartitionCursor[producerKey] ?? 0;

    for (let i = 0; i < wholeMessages; i++) {
      nextSerial += 1;
      producedMessages += 1;

      const partitionKeyInput =
        routing === "hash" ? `${producerKey}-${nextSerial}` : undefined;

      const { partitionIndex, nextRoundRobinCursor } = pickPartitionIndex({
        partitionCount: topic.partitionCount,
        partitionKey: partitionKeyInput,
        roundRobinCursor: cursor,
      });

      if (routing === "roundRobin") {
        cursor = nextRoundRobinCursor;
      }

      const pk = partitionKey(producer.topicId, partitionIndex);
      const existing = partitionLogs[pk] ?? [];
      const offset = existing.length;
      const msg: Message = {
        id: messageId(`m-${nextSerial}`),
        topicId: producer.topicId,
        partitionIndex,
        offset,
        producedAt: nextTick.timeMs,
        key: partitionKeyInput,
        payloadByteLength: 1,
      };

      partitionLogs = { ...partitionLogs, [pk]: [...existing, msg] };

      emit({
        type: "message_produced",
        summary: `Produced message ${msg.id}`,
        detail: `Producer ${String(producer.id)} → topic ${String(producer.topicId)}`,
      });
      emit({
        type: "partition_assigned",
        summary: `Routed to partition ${partitionIndex}`,
        detail: `Message ${msg.id} · offset ${msg.offset}`,
      });
    }

    producerPartitionCursor = { ...producerPartitionCursor, [producerKey]: cursor };
  }

  // --- Phase 2: consume (retries first, then partition round-robin) ------------
  let committedOffsets = { ...state.committedOffsets };
  let retryEntriesByConsumer = { ...state.retryEntriesByConsumer };
  let deadLetterEntriesByTopic = { ...state.deadLetterEntriesByTopic };

  let successfulConsumptions = 0;
  let failedProcessingAttempts = 0;
  let deadLettered = 0;

  const sortedConsumers = [...config.consumers].sort((a, b) =>
    String(a.id).localeCompare(String(b.id)),
  );

  for (const consumer of sortedConsumers) {
    const group = config.consumerGroups.find((g) => g.id === consumer.groupId);
    if (!group) continue;

    const topic = topicsById.get(group.topicId);
    if (!topic) continue;

    const assignment = [
      ...(state.partitionAssignmentByConsumer[String(consumer.id)] ?? []),
    ].sort((a, b) => a - b);

    let capacity = consumer.maxMessagesPerTick;
    const consumerKey = String(consumer.id);
    let retries = [...(retryEntriesByConsumer[consumerKey] ?? [])];
    let batchAck = 0;

    const processAttempt = (
      message: Message,
      failuresCompletedBeforeAttempt: number,
    ): ProcessingOutcome => {
      const attemptNumber = failuresCompletedBeforeAttempt + 1;
      const failed = shouldFailProcessing({
        failureMod: config.deterministicFailure.failureMod,
        seed: `${message.id}|${attemptNumber}|${nextTick.index}`,
      });

      if (!failed) {
        return { kind: "ack" };
      }

      const failuresRecorded = failuresCompletedBeforeAttempt + 1;
      if (failuresRecorded >= config.retryPolicy.maxAttempts) {
        return { kind: "dlq", failuresRecorded };
      }

      return { kind: "retry", failuresRecorded };
    };

    const appendDeadLetter = (topicId: TopicId, entry: DeadLetterEntry) => {
      const key = String(topicId);
      const prev = deadLetterEntriesByTopic[key] ?? [];
      deadLetterEntriesByTopic = { ...deadLetterEntriesByTopic, [key]: [...prev, entry] };
    };

    const commitOffset = (
      gid: ConsumerGroupId,
      t: TopicId,
      partitionIndex: number,
      nextOffset: number,
    ) => {
      const ck = committedKey(gid, t, partitionIndex);
      committedOffsets = { ...committedOffsets, [ck]: nextOffset };
    };

    /**
     * Retries block partition reads for the same message id: the log pointer stays put
     * until the retry succeeds, the message is dead-lettered, or the user resets state.
     */
    const pendingRetryIds = (entries: readonly RetryEntry[]): Set<string> =>
      new Set(entries.map((e) => String(e.message.id)));

    const sortDueRetries = (entries: readonly RetryEntry[]): RetryEntry[] =>
      entries
        .filter((e) => e.scheduledForTick <= nextTick.index)
        .sort((a, b) => {
          const bySchedule = a.scheduledForTick - b.scheduledForTick;
          if (bySchedule !== 0) return bySchedule;
          return String(a.message.id).localeCompare(String(b.message.id));
        });

    while (capacity > 0) {
      const due = sortDueRetries(retries);
      if (due.length > 0) {
        const entry = due[0];
        retries = retries.filter((e) => e.message.id !== entry.message.id);
        capacity -= 1;

        const outcome = processAttempt(entry.message, entry.attemptCount);
        if (outcome.kind === "ack") {
          successfulConsumptions += 1;
          batchAck += 1;
          commitOffset(group.id, entry.message.topicId, entry.message.partitionIndex, entry.message.offset + 1);
          continue;
        }

        failedProcessingAttempts += 1;
        emit({
          type: "consumer_failure",
          summary: "Consumer processing failed",
          detail: `${consumerKey} · message ${entry.message.id}`,
        });

        if (outcome.kind === "dlq") {
          deadLettered += 1;
          appendDeadLetter(entry.message.topicId, {
            message: entry.message,
            reason: "max-processing-attempts",
            deadLetteredAtTick: nextTick.index,
            finalAttemptCount: outcome.failuresRecorded,
          });
          emit({
            type: "dead_letter",
            summary: "Dead-lettered message",
            detail: `${entry.message.id} · attempts exhausted`,
          });
          commitOffset(group.id, entry.message.topicId, entry.message.partitionIndex, entry.message.offset + 1);
          continue;
        }

        retries = [
          ...retries,
          {
            message: entry.message,
            attemptCount: outcome.failuresRecorded,
            scheduledForTick: nextTick.index + config.retryPolicy.backoffTicks,
          },
        ];
        emit({
          type: "retry_scheduled",
          summary: "Retry scheduled",
          detail: `Message ${entry.message.id} · next tick ${nextTick.index + config.retryPolicy.backoffTicks}`,
        });
        continue;
      }

      let progressed = false;
      for (const partitionIndex of assignment) {
        if (capacity <= 0) break;

        const pk = partitionKey(topic.id, partitionIndex);
        const log = partitionLogs[pk] ?? [];
        const ck = committedKey(group.id, topic.id, partitionIndex);
        const nextOffset = committedOffsets[ck] ?? 0;

        if (nextOffset >= log.length) {
          continue;
        }

        const message = log[nextOffset];
        if (pendingRetryIds(retries).has(String(message.id))) {
          continue;
        }

        capacity -= 1;
        progressed = true;

        const outcome = processAttempt(message, 0);
        if (outcome.kind === "ack") {
          successfulConsumptions += 1;
          batchAck += 1;
          commitOffset(group.id, topic.id, partitionIndex, message.offset + 1);
          break;
        }

        failedProcessingAttempts += 1;
        emit({
          type: "consumer_failure",
          summary: "Consumer processing failed",
          detail: `${consumerKey} · message ${message.id}`,
        });

        if (outcome.kind === "dlq") {
          deadLettered += 1;
          appendDeadLetter(topic.id, {
            message,
            reason: "max-processing-attempts",
            deadLetteredAtTick: nextTick.index,
            finalAttemptCount: outcome.failuresRecorded,
          });
          emit({
            type: "dead_letter",
            summary: "Dead-lettered message",
            detail: `${message.id} · attempts exhausted`,
          });
          commitOffset(group.id, topic.id, partitionIndex, message.offset + 1);
          break;
        }

        retries = [
          ...retries,
          {
            message,
            attemptCount: outcome.failuresRecorded,
            scheduledForTick: nextTick.index + config.retryPolicy.backoffTicks,
          },
        ];
        emit({
          type: "retry_scheduled",
          summary: "Retry scheduled",
          detail: `Message ${message.id} · next tick ${nextTick.index + config.retryPolicy.backoffTicks}`,
        });
        break;
      }

      if (!progressed) {
        break;
      }
    }

    if (batchAck > 0) {
      emit({
        type: "consumer_batch_processed",
        summary: `Processed batch of ${batchAck}`,
        detail: `Consumer ${consumerKey}`,
      });
    }

    retryEntriesByConsumer = { ...retryEntriesByConsumer, [consumerKey]: retries };
  }

  const nextState: StreamingRuntimeState = {
    tick: { index: nextTick.index, timeMs: nextTick.timeMs },
    partitionLogs,
    committedOffsets,
    retryEntriesByConsumer,
    deadLetterEntriesByTopic,
    producerRateCredit,
    producerPartitionCursor,
    nextMessageSerial: nextSerial,
    partitionAssignmentByConsumer: state.partitionAssignmentByConsumer,
  };

  const metrics = buildStreamingMetricsSnapshot({
    state: nextState,
    config,
    nextTick,
    producedMessages,
    successfulConsumptions,
  });

  return {
    state: nextState,
    metrics,
    counts: {
      producedMessages,
      successfulConsumptions,
      failedProcessingAttempts,
      deadLettered,
    },
    events: tickEvents,
  };
}
