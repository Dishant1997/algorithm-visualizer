import type { SimulationTick } from "../shared/simulation-tick";
import type { TopicId } from "../shared/ids";

/**
 * Discriminator for future non-streaming modules (algorithms, math, etc.).
 * Streaming metrics snapshots use `module: "streaming"`.
 */
export type MetricsModuleKind = "streaming";

export interface PartitionLagMetric {
  readonly topicId: TopicId;
  readonly partitionIndex: number;
  readonly logEndOffset: number;
  readonly committedOffset: number;
  readonly lag: number;
}

export interface ThroughputMetric {
  /** Messages (or payload-equivalent units) per tick in this window. */
  readonly messagesPerTick: number;
  /** Optional derived rate for charts that prefer per-second units. */
  readonly messagesPerSecond?: number;
}

/**
 * Point-in-time metrics for the streaming simulator at a tick boundary.
 * Intended for persistence, UI subscription, and tests (plain data only).
 */
export interface MetricsSnapshot {
  readonly module: MetricsModuleKind;
  readonly tick: SimulationTick;
  readonly producerThroughput: ThroughputMetric;
  readonly consumerThroughput: ThroughputMetric;
  readonly perPartition: readonly PartitionLagMetric[];
  readonly totalLag: number;
  readonly retryDepth: number;
  readonly deadLetterDepth: number;
}
