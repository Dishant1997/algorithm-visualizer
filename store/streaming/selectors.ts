import type { PartitionLagMetric } from "@/domain";

import type { StreamingSimulationStore } from "./simulation-store";

export type StreamingSimulationSnapshot = Pick<
  StreamingSimulationStore,
  | "config"
  | "runtime"
  | "lastMetrics"
  | "lastTickCounts"
  | "playback"
  | "wallIntervalMs"
  | "pacing"
  | "recentTicks"
  | "cumulativeProduced"
  | "cumulativeConsumed"
  | "metricsSeries"
>;

/** End-to-end consumer lag summed across partitions (from latest metrics). */
export function selectTotalLag(s: StreamingSimulationSnapshot): number {
  return s.lastMetrics.totalLag;
}

/** Latest producer / consumer throughput (per simulation tick and optional per-second). */
export function selectThroughput(s: StreamingSimulationSnapshot): {
  readonly producerMessagesPerTick: number;
  readonly consumerMessagesPerTick: number;
  readonly producerMessagesPerSecond?: number;
  readonly consumerMessagesPerSecond?: number;
} {
  return {
    producerMessagesPerTick: s.lastMetrics.producerThroughput.messagesPerTick,
    consumerMessagesPerTick: s.lastMetrics.consumerThroughput.messagesPerTick,
    producerMessagesPerSecond: s.lastMetrics.producerThroughput.messagesPerSecond,
    consumerMessagesPerSecond: s.lastMetrics.consumerThroughput.messagesPerSecond,
  };
}

/**
 * Retry backlog: messages sitting in consumer retry queues (from metrics snapshot).
 */
export function selectRetryBacklog(s: StreamingSimulationSnapshot): number {
  return s.lastMetrics.retryDepth;
}

/**
 * Processing failures in the last engine tick (drives retries / DLQ in the engine).
 * Rolling average is often more stable for UI—see `selectRollingProcessingFailureRate`.
 */
export function selectLastTickProcessingFailures(s: StreamingSimulationSnapshot): number {
  return s.lastTickCounts.failedProcessingAttempts;
}

/**
 * Average processing failures per tick over the recent window (retry pressure proxy).
 * Alias: `selectRetryRate`.
 */
export function selectRollingProcessingFailureRate(s: StreamingSimulationSnapshot): number {
  const window = s.recentTicks;
  if (window.length === 0) return 0;
  const sum = window.reduce((acc, row) => acc + row.failedProcessing, 0);
  return sum / window.length;
}

/** Rolling average of processing failures per tick (same as `selectRollingProcessingFailureRate`). */
export const selectRetryRate = selectRollingProcessingFailureRate;

/**
 * Per-topic spread between hottest and coldest partition (max lag − min lag).
 * Large values imply uneven consumption or skewed produce routing.
 */
export function selectPartitionImbalanceByTopic(
  s: StreamingSimulationSnapshot,
): ReadonlyMap<string, number> {
  const buckets = new Map<string, number[]>();

  for (const row of s.lastMetrics.perPartition) {
    const key = String(row.topicId);
    const list = buckets.get(key);
    if (list) {
      list.push(row.lag);
    } else {
      buckets.set(key, [row.lag]);
    }
  }

  const spreads = new Map<string, number>();
  for (const [topicId, lags] of buckets) {
    if (lags.length === 0) {
      spreads.set(topicId, 0);
      continue;
    }
    spreads.set(topicId, Math.max(...lags) - Math.min(...lags));
  }
  return spreads;
}

export function selectMaxPartitionImbalance(s: StreamingSimulationSnapshot): number {
  let max = 0;
  for (const v of selectPartitionImbalanceByTopic(s).values()) {
    max = Math.max(max, v);
  }
  return max;
}

export function selectPartitionMetrics(
  s: StreamingSimulationSnapshot,
): readonly PartitionLagMetric[] {
  return s.lastMetrics.perPartition;
}
