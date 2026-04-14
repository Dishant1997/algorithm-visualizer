import type { MetricsSnapshot, PartitionLagMetric } from "@/domain";

import { committedKey, partitionKey } from "./keys";
import type { StreamingSimulationConfig, StreamingRuntimeState } from "./types";

export function buildStreamingMetricsSnapshot(params: {
  readonly state: StreamingRuntimeState;
  readonly config: StreamingSimulationConfig;
  readonly nextTick: { readonly index: number; readonly timeMs: number };
  readonly producedMessages: number;
  readonly successfulConsumptions: number;
}): MetricsSnapshot {
  const { state, config, nextTick, producedMessages, successfulConsumptions } =
    params;

  const topicsById = new Map(config.topics.map((t) => [t.id, t]));
  const perPartition: PartitionLagMetric[] = [];

  for (const group of config.consumerGroups) {
    const topic = topicsById.get(group.topicId);
    if (!topic) continue;

    for (let p = 0; p < topic.partitionCount; p++) {
      const pk = partitionKey(topic.id, p);
      const log = state.partitionLogs[pk] ?? [];
      const logEndOffset = log.length;
      const ck = committedKey(group.id, topic.id, p);
      const committedOffset = state.committedOffsets[ck] ?? 0;
      const lag = Math.max(0, logEndOffset - committedOffset);

      perPartition.push({
        topicId: topic.id,
        partitionIndex: p,
        logEndOffset,
        committedOffset,
        lag,
      });
    }
  }

  perPartition.sort((a, b) => {
    const t = String(a.topicId).localeCompare(String(b.topicId));
    if (t !== 0) return t;
    return a.partitionIndex - b.partitionIndex;
  });

  const totalLag = perPartition.reduce((sum, row) => sum + row.lag, 0);
  const retryDepth = Object.values(state.retryEntriesByConsumer).reduce(
    (sum, entries) => sum + entries.length,
    0,
  );
  const deadLetterDepth = Object.values(state.deadLetterEntriesByTopic).reduce(
    (sum, entries) => sum + entries.length,
    0,
  );

  const tickDurationSec = config.msPerTick / 1000;

  return {
    module: "streaming",
    tick: { index: nextTick.index, timeMs: nextTick.timeMs },
    producerThroughput: {
      messagesPerTick: producedMessages,
      messagesPerSecond:
        tickDurationSec > 0 ? producedMessages / tickDurationSec : undefined,
    },
    consumerThroughput: {
      messagesPerTick: successfulConsumptions,
      messagesPerSecond:
        tickDurationSec > 0
          ? successfulConsumptions / tickDurationSec
          : undefined,
    },
    perPartition,
    totalLag,
    retryDepth,
    deadLetterDepth,
  };
}
