import type { StreamingSimulationConfig } from "@/engine/streaming/types";
import {
  consumerGroupId,
  consumerId,
  producerId,
  topicId,
} from "@/engine/streaming/branded";

const TOPIC = topicId("events");
const GROUP = consumerGroupId("processors");

export type StreamingControlValues = {
  readonly producerCount: number;
  readonly partitionCount: number;
  readonly consumerCount: number;
  /** Each producer emits this many messages per simulation tick. */
  readonly producerMessagesPerTick: number;
  /** Each consumer can process up to this many messages per tick. */
  readonly consumerMessagesPerTick: number;
  /**
   * 0–100: maps to max delivery attempts (1–10) before dead-lettering.
   * Higher values tolerate more transient processing failures.
   */
  readonly retryProbabilityPercent: number;
  readonly failureEnabled: boolean;
  /**
   * Approximate chance (1–50%) that a processing attempt fails synthetically.
   * Drives engine `failureMod` when `failureEnabled` is true.
   */
  readonly failureProbabilityPercent: number;
};

const LIMITS = {
  producerCount: { min: 1, max: 12 },
  partitionCount: { min: 1, max: 32 },
  consumerCount: { min: 1, max: 16 },
  producerMessagesPerTick: { min: 0, max: 50 },
  consumerMessagesPerTick: { min: 0, max: 50 },
  retryProbabilityPercent: { min: 0, max: 100 },
  failureProbabilityPercent: { min: 1, max: 50 },
} as const;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Builds a full engine config from UI controls. Keeps topic/group ids stable for metrics continuity.
 */
export function buildConfigFromControls(
  input: StreamingControlValues,
): StreamingSimulationConfig {
  const producerCount = clamp(
    Math.round(input.producerCount),
    LIMITS.producerCount.min,
    LIMITS.producerCount.max,
  );
  const partitionCount = clamp(
    Math.round(input.partitionCount),
    LIMITS.partitionCount.min,
    LIMITS.partitionCount.max,
  );
  const consumerCount = clamp(
    Math.round(input.consumerCount),
    LIMITS.consumerCount.min,
    LIMITS.consumerCount.max,
  );

  const producerRate = clamp(
    input.producerMessagesPerTick,
    LIMITS.producerMessagesPerTick.min,
    LIMITS.producerMessagesPerTick.max,
  );
  const consumerRate = clamp(
    input.consumerMessagesPerTick,
    LIMITS.consumerMessagesPerTick.min,
    LIMITS.consumerMessagesPerTick.max,
  );

  const retryPct = clamp(
    input.retryProbabilityPercent,
    LIMITS.retryProbabilityPercent.min,
    LIMITS.retryProbabilityPercent.max,
  );
  /** 1 = no retries (dead-letter after first failure), 10 = up to nine retries. */
  const maxAttempts = Math.max(
    1,
    Math.min(10, Math.round(1 + (retryPct / 100) * 9)),
  );

  const failPct = clamp(
    input.failureProbabilityPercent,
    LIMITS.failureProbabilityPercent.min,
    LIMITS.failureProbabilityPercent.max,
  );
  const failureMod =
    input.failureEnabled && failPct > 0
      ? clamp(Math.round(100 / failPct), 2, 80)
      : 0;

  const producers = Array.from({ length: producerCount }, (_, i) => ({
    id: producerId(`producer-${i + 1}`),
    topicId: TOPIC,
    rate: { messagesPerTick: producerRate },
    routing: "hash" as const,
  }));

  const memberIds = Array.from({ length: consumerCount }, (_, i) =>
    consumerId(`consumer-${i + 1}`),
  );

  const consumers = memberIds.map((id) => ({
    id,
    groupId: GROUP,
    maxMessagesPerTick: consumerRate,
  }));

  return {
    msPerTick: 50,
    topics: [
      {
        id: TOPIC,
        name: "events",
        partitionCount,
      },
    ],
    producers,
    consumers,
    consumerGroups: [
      {
        id: GROUP,
        topicId: TOPIC,
        memberIds,
      },
    ],
    retryPolicy: {
      maxAttempts,
      backoffTicks: 2,
    },
    deterministicFailure: {
      failureMod,
    },
  };
}

/**
 * Derives control panel values from the active store config (single topic / single group).
 */
export function parseControlsFromConfig(
  config: StreamingSimulationConfig,
): StreamingControlValues {
  const topic = config.topics[0];
  const group = config.consumerGroups[0];

  const producers = topic
    ? config.producers.filter((p) => p.topicId === topic.id)
    : config.producers;
  const consumers = group
    ? config.consumers.filter((c) => c.groupId === group.id)
    : config.consumers;

  const producerCount = Math.max(
    LIMITS.producerCount.min,
    producers.length || LIMITS.producerCount.min,
  );
  const partitionCount = clamp(
    topic?.partitionCount ?? 1,
    LIMITS.partitionCount.min,
    LIMITS.partitionCount.max,
  );
  const consumerCount = Math.max(
    LIMITS.consumerCount.min,
    consumers.length || LIMITS.consumerCount.min,
  );

  const producerMessagesPerTick = clamp(
    producers[0]?.rate.messagesPerTick ?? 0,
    LIMITS.producerMessagesPerTick.min,
    LIMITS.producerMessagesPerTick.max,
  );
  const consumerMessagesPerTick = clamp(
    consumers[0]?.maxMessagesPerTick ?? 0,
    LIMITS.consumerMessagesPerTick.min,
    LIMITS.consumerMessagesPerTick.max,
  );

  const maxAttempts = config.retryPolicy.maxAttempts;
  const retryProbabilityPercent = clamp(
    ((maxAttempts - 1) / 9) * 100,
    LIMITS.retryProbabilityPercent.min,
    LIMITS.retryProbabilityPercent.max,
  );

  const failureMod = config.deterministicFailure.failureMod;
  const failureEnabled = failureMod > 0;
  const failureProbabilityPercent = failureEnabled
    ? clamp(
        Math.round(100 / failureMod),
        LIMITS.failureProbabilityPercent.min,
        LIMITS.failureProbabilityPercent.max,
      )
    : 10;

  return {
    producerCount,
    partitionCount,
    consumerCount,
    producerMessagesPerTick,
    consumerMessagesPerTick,
    retryProbabilityPercent,
    failureEnabled,
    failureProbabilityPercent,
  };
}

export const streamingControlLimits = LIMITS;
