"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Pause,
  Play,
  RotateCcw,
  Shield,
  SkipForward,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { useStreamingSimulationStore } from "@/store/streaming";

import {
  buildConfigFromControls,
  parseControlsFromConfig,
  streamingControlLimits as L,
  type StreamingControlValues,
} from "./config-from-controls";

function FieldLabel({
  id,
  children,
  hint,
}: {
  id: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="text-xs font-medium leading-tight text-zinc-300"
      >
        {children}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-[11px] leading-snug text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SliderRow(props: {
  id: string;
  label: string;
  hint?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  display: string;
  icon: ReactNode;
  disabled?: boolean;
}) {
  const {
    id,
    label,
    hint,
    min,
    max,
    step = 1,
    value,
    onChange,
    display,
    icon,
    disabled = false,
  } = props;

  return (
    <div className={`space-y-2 ${disabled ? "opacity-40" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <FieldLabel id={id} hint={hint}>
          {label}
        </FieldLabel>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-emerald-300/90">
          {display}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-zinc-600" aria-hidden>
          {icon}
        </span>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer accent-emerald-400 disabled:cursor-not-allowed"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>
    </div>
  );
}

export function StreamingControlPanel() {
  const config = useStreamingSimulationStore((s) => s.config);
  const playback = useStreamingSimulationStore((s) => s.playback);
  const updateConfig = useStreamingSimulationStore((s) => s.updateConfig);
  const start = useStreamingSimulationStore((s) => s.start);
  const pause = useStreamingSimulationStore((s) => s.pause);
  const reset = useStreamingSimulationStore((s) => s.reset);
  const step = useStreamingSimulationStore((s) => s.step);

  const values = useMemo(() => parseControlsFromConfig(config), [config]);

  const apply = useCallback(
    (patch: Partial<StreamingControlValues>) => {
      const next: StreamingControlValues = { ...values, ...patch };
      updateConfig(buildConfigFromControls(next));
    },
    [updateConfig, values],
  );

  const running = playback === "running";

  const maxAttemptsFromRetry = Math.max(
    1,
    Math.min(10, Math.round(1 + (values.retryProbabilityPercent / 100) * 9)),
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Playback
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => (running ? pause() : start())}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
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
        </div>
        <p className="text-[11px] text-zinc-500">
          Status:{" "}
          <span className="font-medium text-zinc-300">
            {playback === "running"
              ? "Running"
              : playback === "paused"
                ? "Paused"
                : "Idle"}
          </span>
        </p>
      </div>

      <div className="space-y-4 border-t border-white/10 pt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Topology
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel id="producer-count" hint="Independent producers on the topic.">
              Producers
            </FieldLabel>
            <input
              id="producer-count"
              type="number"
              min={L.producerCount.min}
              max={L.producerCount.max}
              value={values.producerCount}
              onChange={(e) =>
                apply({ producerCount: Number.parseInt(e.target.value, 10) || 1 })
              }
              className="w-full rounded-lg border border-white/10 bg-zinc-900/80 px-2.5 py-2 font-mono text-xs text-zinc-100 outline-none ring-emerald-400/30 focus:ring-2"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel id="partition-count" hint="Topic shards for ordering.">
              Partitions
            </FieldLabel>
            <input
              id="partition-count"
              type="number"
              min={L.partitionCount.min}
              max={L.partitionCount.max}
              value={values.partitionCount}
              onChange={(e) =>
                apply({ partitionCount: Number.parseInt(e.target.value, 10) || 1 })
              }
              className="w-full rounded-lg border border-white/10 bg-zinc-900/80 px-2.5 py-2 font-mono text-xs text-zinc-100 outline-none ring-emerald-400/30 focus:ring-2"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <FieldLabel
            id="consumer-count"
            hint="Consumers in the single consumer group (range-assigned partitions)."
          >
            Consumers
          </FieldLabel>
          <div className="flex items-center gap-2">
            <Users className="size-4 shrink-0 text-zinc-500" aria-hidden />
            <input
              id="consumer-count"
              type="number"
              min={L.consumerCount.min}
              max={L.consumerCount.max}
              value={values.consumerCount}
              onChange={(e) =>
                apply({ consumerCount: Number.parseInt(e.target.value, 10) || 1 })
              }
              className="w-full rounded-lg border border-white/10 bg-zinc-900/80 px-2.5 py-2 font-mono text-xs text-zinc-100 outline-none ring-emerald-400/30 focus:ring-2"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-white/10 pt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Rates
        </p>
        <SliderRow
          id="producer-rate"
          label="Producer message rate"
          hint="Messages each producer emits per simulation tick."
          min={L.producerMessagesPerTick.min}
          max={L.producerMessagesPerTick.max}
          value={Math.round(values.producerMessagesPerTick)}
          onChange={(n) => apply({ producerMessagesPerTick: n })}
          display={`${Math.round(values.producerMessagesPerTick)} msg / tick each`}
          icon={<SlidersHorizontal className="size-4" />}
        />
        <SliderRow
          id="consumer-rate"
          label="Consumer processing rate"
          hint="Max messages each consumer processes per tick."
          min={L.consumerMessagesPerTick.min}
          max={L.consumerMessagesPerTick.max}
          value={Math.round(values.consumerMessagesPerTick)}
          onChange={(n) => apply({ consumerMessagesPerTick: n })}
          display={`${Math.round(values.consumerMessagesPerTick)} msg / tick each`}
          icon={<Activity className="size-4" />}
        />
      </div>

      <div className="space-y-4 border-t border-white/10 pt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Reliability
        </p>
        <SliderRow
          id="retry-probability"
          label="Retry probability"
          hint="Higher values allow more delivery attempts before dead-lettering (engine max attempts)."
          min={L.retryProbabilityPercent.min}
          max={L.retryProbabilityPercent.max}
          value={Math.round(values.retryProbabilityPercent)}
          onChange={(n) => apply({ retryProbabilityPercent: n })}
          display={`${Math.round(values.retryProbabilityPercent)}% · max attempts ${maxAttemptsFromRetry}`}
          icon={<Shield className="size-4" />}
        />

        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-900/50 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-200">Synthetic failures</p>
            <p className="text-[11px] text-zinc-500">
              Toggle processing failures to exercise retries and the dead-letter path.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={values.failureEnabled}
            onClick={() => apply({ failureEnabled: !values.failureEnabled })}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
              values.failureEnabled
                ? "border-emerald-400/40 bg-emerald-500/20"
                : "border-white/10 bg-zinc-800"
            }`}
          >
            <span
              className={`inline-block size-5 rounded-full bg-white shadow transition ${
                values.failureEnabled ? "translate-x-[1.35rem]" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <SliderRow
          id="failure-probability"
          label="Failure probability"
          hint="Approximate chance each processing attempt fails (deterministic hash in engine)."
          min={L.failureProbabilityPercent.min}
          max={L.failureProbabilityPercent.max}
          value={Math.round(values.failureProbabilityPercent)}
          onChange={(n) => apply({ failureProbabilityPercent: n })}
          disabled={!values.failureEnabled}
          display={
            values.failureEnabled
              ? `~${Math.round(values.failureProbabilityPercent)}%`
              : "Off"
          }
          icon={<AlertTriangle className="size-4" />}
        />
      </div>
    </div>
  );
}
