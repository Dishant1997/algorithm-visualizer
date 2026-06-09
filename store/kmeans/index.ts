import { create } from "zustand";

import { generateDataset, initKMeans, stepKMeans } from "@/engine/kmeans";
import type { DatasetShape, KMeansState } from "@/engine/kmeans";

export type KMeansPlayback = "idle" | "running" | "paused" | "converged";
export type KMeansSpeed = 0.5 | 1 | 2;

export type InertiaPoint = { readonly iteration: number; readonly inertia: number };

const SPEED_MS: Record<string, number> = { "0.5": 2000, "1": 1000, "2": 500 };
const N_POINTS = 200;

let stopTimer: (() => void) | null = null;

function disposeTimer(): void {
  stopTimer?.();
  stopTimer = null;
}

function buildInitialState(k: number, shape: DatasetShape, seed: number): KMeansState {
  const points = generateDataset(shape, k, N_POINTS, seed);
  return initKMeans(points, k, seed + 1);
}

const DEFAULT_K = 3;
const DEFAULT_SHAPE: DatasetShape = "blobs";
const DEFAULT_SEED = 42;

export type KMeansStore = {
  readonly k: number;
  readonly datasetShape: DatasetShape;
  readonly speed: KMeansSpeed;
  readonly seed: number;
  readonly state: KMeansState;
  readonly inertiaHistory: readonly InertiaPoint[];
  readonly playback: KMeansPlayback;

  setK: (k: number) => void;
  setShape: (shape: DatasetShape) => void;
  setSpeed: (speed: KMeansSpeed) => void;
  step: () => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  newSeed: () => void;
};

export const useKMeansStore = create<KMeansStore>((set, get) => ({
  k: DEFAULT_K,
  datasetShape: DEFAULT_SHAPE,
  speed: 1,
  seed: DEFAULT_SEED,
  state: buildInitialState(DEFAULT_K, DEFAULT_SHAPE, DEFAULT_SEED),
  inertiaHistory: [],
  playback: "idle",

  setK: (k) => {
    disposeTimer();
    const { datasetShape, seed } = get();
    set({ k, state: buildInitialState(k, datasetShape, seed), inertiaHistory: [], playback: "idle" });
  },

  setShape: (shape) => {
    disposeTimer();
    const { k, seed } = get();
    set({ datasetShape: shape, state: buildInitialState(k, shape, seed), inertiaHistory: [], playback: "idle" });
  },

  setSpeed: (speed) => {
    const wasRunning = get().playback === "running";
    set({ speed });
    if (wasRunning) {
      disposeTimer();
      const id = window.setInterval(() => { get().step(); }, SPEED_MS[String(speed)]);
      stopTimer = () => window.clearInterval(id);
    }
  },

  step: () => {
    const { state, inertiaHistory } = get();
    if (state.phase === "converged") {
      disposeTimer();
      set({ playback: "converged" });
      return;
    }
    const next = stepKMeans(state);
    const newHistory: InertiaPoint[] = [
      ...inertiaHistory,
      { iteration: next.iteration, inertia: next.inertia },
    ];
    if (next.phase === "converged") {
      disposeTimer();
      set({ state: next, inertiaHistory: newHistory, playback: "converged" });
    } else {
      set({ state: next, inertiaHistory: newHistory });
    }
  },

  start: () => {
    if (typeof window === "undefined") return;
    const { playback, speed, state } = get();
    if (playback === "running" || state.phase === "converged") return;
    disposeTimer();
    const id = window.setInterval(() => { get().step(); }, SPEED_MS[String(speed)]);
    stopTimer = () => window.clearInterval(id);
    set({ playback: "running" });
  },

  pause: () => {
    disposeTimer();
    if (get().playback === "running") set({ playback: "paused" });
  },

  reset: () => {
    disposeTimer();
    const { k, datasetShape, seed } = get();
    set({ state: buildInitialState(k, datasetShape, seed), inertiaHistory: [], playback: "idle" });
  },

  newSeed: () => {
    disposeTimer();
    const { k, datasetShape } = get();
    const seed = Math.floor(Math.random() * 99999);
    set({ seed, state: buildInitialState(k, datasetShape, seed), inertiaHistory: [], playback: "idle" });
  },
}));
