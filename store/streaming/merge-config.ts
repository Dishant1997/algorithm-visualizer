import type { StreamingSimulationConfig } from "@/engine/streaming/types";

export type StreamingConfigPatch = {
  readonly msPerTick?: number;
  readonly topics?: StreamingSimulationConfig["topics"];
  readonly producers?: StreamingSimulationConfig["producers"];
  readonly consumers?: StreamingSimulationConfig["consumers"];
  readonly consumerGroups?: StreamingSimulationConfig["consumerGroups"];
  readonly retryPolicy?: Partial<StreamingSimulationConfig["retryPolicy"]>;
  readonly deterministicFailure?: Partial<
    StreamingSimulationConfig["deterministicFailure"]
  >;
};

/**
 * Immutable merge for UI-driven config edits. Arrays replace wholesale when provided.
 */
export function mergeStreamingConfig(
  base: StreamingSimulationConfig,
  patch: StreamingConfigPatch,
): StreamingSimulationConfig {
  return {
    msPerTick: patch.msPerTick ?? base.msPerTick,
    topics: patch.topics ?? base.topics,
    producers: patch.producers ?? base.producers,
    consumers: patch.consumers ?? base.consumers,
    consumerGroups: patch.consumerGroups ?? base.consumerGroups,
    retryPolicy: {
      ...base.retryPolicy,
      ...patch.retryPolicy,
    },
    deterministicFailure: {
      ...base.deterministicFailure,
      ...patch.deterministicFailure,
    },
  };
}
