/**
 * Structured log lines emitted by `stepStreamingSimulation` for UI / analytics.
 * All times use the simulation logical clock (`simTimeMs`), not wall time.
 */
export type StreamingSimulationEvent = {
  readonly id: string;
  readonly tickIndex: number;
  readonly simTimeMs: number;
  readonly type:
    | "message_produced"
    | "partition_assigned"
    | "consumer_batch_processed"
    | "consumer_failure"
    | "retry_scheduled"
    | "dead_letter";
  readonly summary: string;
  readonly detail?: string;
};
