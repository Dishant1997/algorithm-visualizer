import type { MessageId, TopicId } from "../shared/ids";

/** Logical clock for ordering and metrics (not wall time). */
export type SimulationTimeMs = number;

/**
 * A record in a topic partition log. Payload stays abstract so engines can store
 * hashes, sizes, or opaque blobs without pulling UI concerns into the domain.
 */
export interface Message {
  readonly id: MessageId;
  readonly topicId: TopicId;
  readonly partitionIndex: number;
  /** Per-partition monotonic offset (0-based or 1-based; engine defines origin). */
  readonly offset: number;
  readonly producedAt: SimulationTimeMs;
  /** Optional partition key for visualization / routing semantics. */
  readonly key?: string;
  /** Simulated payload size in bytes (for throughput visuals without real bytes). */
  readonly payloadByteLength: number;
}
