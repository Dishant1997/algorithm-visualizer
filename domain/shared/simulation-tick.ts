/**
 * Logical time step for deterministic simulators (streaming, queues, etc.).
 * Wall-clock is intentionally omitted; engines map ticks to display time if needed.
 */
export interface SimulationTick {
  /** Monotonic step counter, starting at 0 after reset. */
  readonly index: number;
  /** Cumulative simulated time in milliseconds (logical clock). */
  readonly timeMs: number;
}
