"use client";

import { Pause, Play, RotateCcw, Shuffle, SkipForward } from "lucide-react";

import { useKMeansStore, type KMeansSpeed } from "@/store/kmeans";
import type { DatasetShape } from "@/engine/kmeans";

import { KMeansWhyItWorks } from "./KMeansWhyItWorks";

const SPEEDS: { value: KMeansSpeed; label: string }[] = [
  { value: 0.5, label: "0.5×" },
  { value: 1, label: "1×" },
  { value: 2, label: "2×" },
];

const SHAPES: { value: DatasetShape; label: string; hint: string }[] = [
  { value: "blobs", label: "Blobs", hint: "Gaussian clusters — K-Means ideal case" },
  { value: "moons", label: "Moons", hint: "Concave crescents — shows algorithm limits" },
  { value: "rings", label: "Rings", hint: "Concentric circles — hard non-convex case" },
];

export function KMeansControlPanel() {
  const k = useKMeansStore((s) => s.k);
  const datasetShape = useKMeansStore((s) => s.datasetShape);
  const speed = useKMeansStore((s) => s.speed);
  const playback = useKMeansStore((s) => s.playback);
  const setK = useKMeansStore((s) => s.setK);
  const setShape = useKMeansStore((s) => s.setShape);
  const setSpeed = useKMeansStore((s) => s.setSpeed);
  const step = useKMeansStore((s) => s.step);
  const start = useKMeansStore((s) => s.start);
  const pause = useKMeansStore((s) => s.pause);
  const reset = useKMeansStore((s) => s.reset);
  const newSeed = useKMeansStore((s) => s.newSeed);

  const running = playback === "running";
  const converged = playback === "converged";

  const statusLabel =
    converged ? "Converged ✓" :
    running ? "Running" :
    playback === "paused" ? "Paused" :
    "Idle";

  return (
    <div className="space-y-6">
      {/* Playback */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Playback
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => (running ? pause() : start())}
            disabled={converged}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? (
              <>
                <Pause className="size-3.5" aria-hidden />
                Pause
              </>
            ) : (
              <>
                <Play className="size-3.5" aria-hidden />
                Run
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => step()}
            disabled={converged}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SkipForward className="size-3.5" aria-hidden />
            Step
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </button>
          <button
            type="button"
            onClick={() => newSeed()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
            title="Randomize dataset and centroid initialization"
          >
            <Shuffle className="size-3.5" aria-hidden />
            Shuffle
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">
          Status:{" "}
          <span
            className={`font-medium ${converged ? "text-emerald-400" : "text-zinc-300"}`}
          >
            {statusLabel}
          </span>
        </p>
      </div>

      {/* Speed */}
      <div className="space-y-3 border-t border-white/10 pt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Speed
        </p>
        <div className="flex gap-2">
          {SPEEDS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSpeed(value)}
              className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                speed === value
                  ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500">
          Step-through: click <strong className="text-zinc-300">Step</strong> manually to inspect each iteration.
        </p>
      </div>

      {/* K slider */}
      <div className="space-y-3 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Clusters (K)
          </p>
          <span className="font-mono text-sm font-semibold text-emerald-300">{k}</span>
        </div>
        <input
          type="range"
          min={2}
          max={8}
          step={1}
          value={k}
          onChange={(e) => setK(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer accent-emerald-400"
          aria-label="Number of clusters K"
        />
        <div className="flex justify-between text-[10px] text-zinc-600">
          <span>2</span>
          <span>8</span>
        </div>
      </div>

      {/* Dataset shape */}
      <div className="space-y-3 border-t border-white/10 pt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Dataset shape
        </p>
        <div className="flex flex-col gap-2">
          {SHAPES.map(({ value, label, hint }) => (
            <button
              key={value}
              type="button"
              onClick={() => setShape(value)}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${
                datasetShape === value
                  ? "border-emerald-400/40 bg-emerald-500/15"
                  : "border-white/10 bg-white/5 hover:bg-white/8"
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  datasetShape === value ? "text-emerald-300" : "text-zinc-300"
                }`}
              >
                {label}
              </p>
              <p className="text-[10px] leading-tight text-zinc-500">{hint}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Why it works — collapsible */}
      <KMeansWhyItWorks />
    </div>
  );
}
