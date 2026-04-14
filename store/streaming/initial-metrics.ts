import { buildStreamingMetricsSnapshot } from "@/engine/streaming/metrics";
import type {
  StreamingSimulationConfig,
  StreamingRuntimeState,
} from "@/engine/streaming/types";
import type { MetricsSnapshot } from "@/domain";

/**
 * Metrics aligned to tick zero before any `stepStreamingSimulation` call.
 */
export function buildInitialMetricsSnapshot(params: {
  readonly config: StreamingSimulationConfig;
  readonly runtime: StreamingRuntimeState;
}): MetricsSnapshot {
  const { config, runtime } = params;
  return buildStreamingMetricsSnapshot({
    state: runtime,
    config,
    nextTick: runtime.tick,
    producedMessages: 0,
    successfulConsumptions: 0,
  });
}
