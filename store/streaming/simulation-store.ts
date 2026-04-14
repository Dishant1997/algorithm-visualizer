import { create } from "zustand";

import {
  createInitialStreamingState,
  stepStreamingSimulation,
} from "@/engine/streaming";
import type { StreamingSimulationEvent } from "@/engine/streaming";
import type {
  StreamingSimulationConfig,
  StreamingRuntimeState,
  TickResult,
} from "@/engine/streaming/types";
import type { MetricsSnapshot } from "@/domain";

import { createDefaultStreamingConfig } from "./default-config";
import { buildInitialMetricsSnapshot } from "./initial-metrics";
import {
  mergeStreamingConfig,
  type StreamingConfigPatch,
} from "./merge-config";
import {
  startAnimationFrameLoop,
  startWallClockLoop,
  type WallTimerDisposer,
} from "./tick-scheduler";

export type PlaybackStatus = "idle" | "running" | "paused";

export type TickHistoryEntry = {
  readonly tickIndex: number;
  readonly produced: number;
  readonly successful: number;
  readonly failedProcessing: number;
};

/** One point per simulation tick for charts (bounded ring buffer). */
export type MetricsSeriesPoint = {
  readonly tickIndex: number;
  /** Messages produced this tick (instantaneous throughput sample). */
  readonly produced: number;
  /** Messages successfully consumed this tick. */
  readonly consumed: number;
  /** Total consumer lag after this tick. */
  readonly lag: number;
};

const zeroCounts: TickResult["counts"] = {
  producedMessages: 0,
  successfulConsumptions: 0,
  failedProcessingAttempts: 0,
  deadLettered: 0,
};

let stopWallClock: WallTimerDisposer | null = null;

function disposeScheduler(): void {
  stopWallClock?.();
  stopWallClock = null;
}

function attachScheduler(get: () => StreamingSimulationStore): void {
  if (typeof window === "undefined") return;
  const { pacing, wallIntervalMs } = get();
  const runner =
    pacing === "raf" ? startAnimationFrameLoop : startWallClockLoop;
  stopWallClock = runner(
    () => {
      get().step();
    },
    { wallIntervalMs },
  );
}

function bootstrap(config: StreamingSimulationConfig): {
  readonly runtime: StreamingRuntimeState;
  readonly lastMetrics: MetricsSnapshot;
} {
  const runtime = createInitialStreamingState(config);
  const lastMetrics = buildInitialMetricsSnapshot({ config, runtime });
  return { runtime, lastMetrics };
}

const defaultConfig = createDefaultStreamingConfig();
const boot = bootstrap(defaultConfig);

export type StreamingSimulationStore = {
  readonly config: StreamingSimulationConfig;
  readonly runtime: StreamingRuntimeState;
  readonly lastMetrics: MetricsSnapshot;
  readonly lastTickCounts: TickResult["counts"];
  readonly playback: PlaybackStatus;
  /** Wall-clock spacing between automatic simulation steps. */
  readonly wallIntervalMs: number;
  readonly pacing: "interval" | "raf";
  readonly recentTicks: readonly TickHistoryEntry[];
  readonly recentTicksCapacity: number;
  /** Cumulative messages produced since last reset / config change. */
  readonly cumulativeProduced: number;
  /** Cumulative successful consumptions since last reset / config change. */
  readonly cumulativeConsumed: number;
  /** Time series for throughput & lag charts. */
  readonly metricsSeries: readonly MetricsSeriesPoint[];
  readonly metricsSeriesCapacity: number;
  /** Ring buffer of engine events (newest appended; capped in `step`). */
  readonly eventLog: readonly StreamingSimulationEvent[];
  readonly eventLogCapacity: number;

  start: () => void;
  pause: () => void;
  reset: () => void;
  /** Single deterministic engine step (safe while paused or running). */
  step: () => void;
  updateConfig: (patch: StreamingConfigPatch) => void;
  setWallIntervalMs: (ms: number) => void;
  setPacing: (mode: "interval" | "raf") => void;
};

export const useStreamingSimulationStore = create<StreamingSimulationStore>(
  (set, get) => ({
    config: defaultConfig,
    runtime: boot.runtime,
    lastMetrics: boot.lastMetrics,
    lastTickCounts: zeroCounts,
    playback: "idle",
    wallIntervalMs: 120,
    pacing: "interval",
    recentTicks: [],
    recentTicksCapacity: 48,
    cumulativeProduced: 0,
    cumulativeConsumed: 0,
    metricsSeries: [],
    metricsSeriesCapacity: 96,
    eventLog: [],
    eventLogCapacity: 100,

    start: () => {
      if (typeof window === "undefined") return;
      const { playback } = get();
      if (playback === "running") return;

      disposeScheduler();
      attachScheduler(get);
      set({ playback: "running" });
    },

    pause: () => {
      disposeScheduler();
      const { playback } = get();
      if (playback === "running") {
        set({ playback: "paused" });
      }
    },

    reset: () => {
      disposeScheduler();
      const { config } = get();
      const { runtime, lastMetrics } = bootstrap(config);
      set({
        runtime,
        lastMetrics,
        lastTickCounts: zeroCounts,
        playback: "idle",
        recentTicks: [],
        cumulativeProduced: 0,
        cumulativeConsumed: 0,
        metricsSeries: [],
        eventLog: [],
      });
    },

    step: () => {
      const state = get();
      const result = stepStreamingSimulation(state.runtime, state.config);
      const entry: TickHistoryEntry = {
        tickIndex: result.state.tick.index,
        produced: result.counts.producedMessages,
        successful: result.counts.successfulConsumptions,
        failedProcessing: result.counts.failedProcessingAttempts,
      };
      const recentTicks = [...state.recentTicks, entry].slice(
        -state.recentTicksCapacity,
      );

      const seriesPoint: MetricsSeriesPoint = {
        tickIndex: result.state.tick.index,
        produced: result.counts.producedMessages,
        consumed: result.counts.successfulConsumptions,
        lag: result.metrics.totalLag,
      };
      const metricsSeries = [...state.metricsSeries, seriesPoint].slice(
        -state.metricsSeriesCapacity,
      );

      const eventLog = [...state.eventLog, ...result.events].slice(
        -state.eventLogCapacity,
      );

      set({
        runtime: result.state,
        lastMetrics: result.metrics,
        lastTickCounts: result.counts,
        recentTicks,
        cumulativeProduced: state.cumulativeProduced + result.counts.producedMessages,
        cumulativeConsumed:
          state.cumulativeConsumed + result.counts.successfulConsumptions,
        metricsSeries,
        eventLog,
      });
    },

    updateConfig: (patch) => {
      disposeScheduler();
      const nextConfig = mergeStreamingConfig(get().config, patch);
      const { runtime, lastMetrics } = bootstrap(nextConfig);
      set({
        config: nextConfig,
        runtime,
        lastMetrics,
        lastTickCounts: zeroCounts,
        playback: "idle",
        recentTicks: [],
        cumulativeProduced: 0,
        cumulativeConsumed: 0,
        metricsSeries: [],
        eventLog: [],
      });
    },

    setWallIntervalMs: (ms) => {
      const next = Math.max(1, ms);
      const wasRunning = get().playback === "running";
      set({ wallIntervalMs: next });
      if (wasRunning) {
        disposeScheduler();
        attachScheduler(get);
        set({ playback: "running" });
      }
    },

    setPacing: (mode) => {
      const wasRunning = get().playback === "running";
      set({ pacing: mode });
      if (wasRunning) {
        disposeScheduler();
        attachScheduler(get);
        set({ playback: "running" });
      }
    },
  }),
);
