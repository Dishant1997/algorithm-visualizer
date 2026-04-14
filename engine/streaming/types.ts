import type {
  Consumer,
  ConsumerGroup,
  DeadLetterEntry,
  Message,
  MetricsSnapshot,
  Producer,
  RetryEntry,
  SimulationTick,
  Topic,
} from "@/domain";

import type { StreamingSimulationEvent } from "./simulation-events";

/**
 * Immutable simulation input: topology, rates, and policies.
 * The engine never mutates this object.
 */
export type ProducerWithRouting = Producer & {
  /**
   * `hash` spreads keys across partitions; `roundRobin` ignores synthetic keys and stripes traffic.
   * Defaults to `hash` to mirror key-based Kafka routing.
   */
  readonly routing?: "hash" | "roundRobin";
};

export interface StreamingSimulationConfig {
  readonly msPerTick: number;
  readonly topics: readonly Topic[];
  readonly producers: readonly ProducerWithRouting[];
  readonly consumers: readonly Consumer[];
  readonly consumerGroups: readonly ConsumerGroup[];
  readonly retryPolicy: {
    readonly maxAttempts: number;
    readonly backoffTicks: number;
  };
  /**
   * Deterministic processing failures for exercising retries / DLQ.
   * `failureMod === 0` disables synthetic failures.
   * When enabled, a failure occurs if `(stableHash(seed) % failureMod) === 0`.
   */
  readonly deterministicFailure: {
    readonly failureMod: number;
  };
}

/**
 * Mutable snapshot of the world after zero or more ticks.
 * Updated only by `stepStreamingSimulation` (functional updates).
 */
export interface StreamingRuntimeState {
  readonly tick: SimulationTick;
  /**
   * `partitionKey(topicId, partitionIndex)` → append-only log for that shard.
   * Offset equals the array index for messages retained in-memory.
   */
  readonly partitionLogs: Readonly<Record<string, readonly Message[]>>;
  /**
   * `committedKey(groupId, topicId, partitionIndex)` → next offset a consumer group
   * should read (0-based). Advances on successful processing only.
   */
  readonly committedOffsets: Readonly<Record<string, number>>;
  /** Per-consumer retry backlog (FIFO semantics enforced in the tick). */
  readonly retryEntriesByConsumer: Readonly<Record<string, readonly RetryEntry[]>>;
  /** Per-topic dead-letter entries (append-only for the tick). */
  readonly deadLetterEntriesByTopic: Readonly<Record<string, readonly DeadLetterEntry[]>>;
  /** Carries fractional `messagesPerTick` across ticks (deterministic). */
  readonly producerRateCredit: Readonly<Record<string, number>>;
  /** Round-robin cursor for producers that do not attach an explicit key. */
  readonly producerPartitionCursor: Readonly<Record<string, number>>;
  /** Monotonic counter for deterministic `MessageId` generation. */
  readonly nextMessageSerial: number;
  /**
   * Precomputed range assignment: consumerId → partition indexes for its group’s topic.
   * Stored in state so the tick path stays a pure function of (state, config).
   */
  readonly partitionAssignmentByConsumer: Readonly<Record<string, readonly number[]>>;
}

export interface TickResult {
  readonly state: StreamingRuntimeState;
  readonly metrics: MetricsSnapshot;
  /** Counts for this tick only (helpful for tests / future UI). */
  readonly counts: {
    readonly producedMessages: number;
    readonly successfulConsumptions: number;
    readonly failedProcessingAttempts: number;
    readonly deadLettered: number;
  };
  /** Ordered events that occurred during this tick (for event log UIs). */
  readonly events: readonly StreamingSimulationEvent[];
}

export type PartitionLogKey = string;
export type CommittedOffsetKey = string;
