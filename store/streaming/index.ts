export { createDefaultStreamingConfig } from "./default-config";
export { buildInitialMetricsSnapshot } from "./initial-metrics";
export {
  mergeStreamingConfig,
  type StreamingConfigPatch,
} from "./merge-config";
export {
  selectLastTickProcessingFailures,
  selectMaxPartitionImbalance,
  selectPartitionImbalanceByTopic,
  selectPartitionMetrics,
  selectRetryBacklog,
  selectRetryRate,
  selectRollingProcessingFailureRate,
  selectThroughput,
  selectTotalLag,
  type StreamingSimulationSnapshot,
} from "./selectors";
export {
  useStreamingSimulationStore,
  type MetricsSeriesPoint,
  type PlaybackStatus,
  type StreamingSimulationStore,
  type TickHistoryEntry,
} from "./simulation-store";
export type { StreamingSimulationEvent } from "@/engine/streaming";
export {
  startAnimationFrameLoop,
  startWallClockLoop,
} from "./tick-scheduler";
