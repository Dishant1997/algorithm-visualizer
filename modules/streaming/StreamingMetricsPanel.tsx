"use client";

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRightLeft,
  Gauge,
  Layers,
  Maximize2,
  Minimize2,
  Package,
  RefreshCw,
} from "lucide-react";

import {
  selectMaxPartitionImbalance,
  useStreamingSimulationStore,
  type StreamingSimulationSnapshot,
} from "@/store/streaming";

function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            {label}
          </p>
          <p className="font-mono text-sm tabular-nums text-zinc-100">{value}</p>
          {sub ? (
            <p className="text-[10px] leading-tight text-zinc-500">{sub}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-zinc-500">{icon}</div>
      </div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "rgba(24, 24, 27, 0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.5rem",
  fontSize: "11px",
};

/** Inline panel chart height */
const CHART_PLOT_HEIGHT = 240;
/** Expanded overlay chart (fixed px so Recharts measures reliably) */
const CHART_OVERLAY_HEIGHT = 420;

type ThroughputLagChartRow = {
  tick: number;
  produced: number;
  consumed: number;
  lag: number;
};

function ThroughputLagChart({
  chartData,
  height,
}: {
  chartData: readonly ThroughputLagChartRow[];
  height: number;
}) {
  return (
    <div className="w-full min-w-0">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 2, bottom: 28 }}
        >
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="tick"
            tick={{ fill: "#71717a", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
          />
          <YAxis
            yAxisId="tp"
            tick={{ fill: "#71717a", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <YAxis
            yAxisId="lag"
            orientation="right"
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#e4e4e7" }} />
          <Legend
            wrapperStyle={{ fontSize: "10px", paddingTop: 6 }}
            formatter={(value) =>
              value === "lag"
                ? "Lag"
                : value === "produced"
                  ? "Produced / tick"
                  : "Consumed / tick"
            }
          />
          <Line
            yAxisId="tp"
            type="monotone"
            dataKey="produced"
            name="produced"
            stroke="rgba(52, 211, 153, 0.9)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={chartData.length < 80}
          />
          <Line
            yAxisId="tp"
            type="monotone"
            dataKey="consumed"
            name="consumed"
            stroke="rgba(56, 189, 248, 0.9)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={chartData.length < 80}
          />
          <Line
            yAxisId="lag"
            type="monotone"
            dataKey="lag"
            name="lag"
            stroke="rgba(251, 191, 36, 0.95)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={chartData.length < 80}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StreamingMetricsPanel() {
  const lastMetrics = useStreamingSimulationStore((s) => s.lastMetrics);
  const cumulativeProduced = useStreamingSimulationStore((s) => s.cumulativeProduced);
  const cumulativeConsumed = useStreamingSimulationStore((s) => s.cumulativeConsumed);
  const metricsSeries = useStreamingSimulationStore((s) => s.metricsSeries);

  const imbalance = useStreamingSimulationStore((s) =>
    selectMaxPartitionImbalance({ lastMetrics: s.lastMetrics } as StreamingSimulationSnapshot),
  );

  const chartData = useMemo(
    () =>
      metricsSeries.map((p) => ({
        tick: p.tickIndex,
        produced: p.produced,
        consumed: p.consumed,
        lag: p.lag,
      })),
    [metricsSeries],
  );

  const [chartMaximized, setChartMaximized] = useState(false);
  const titleId = useId();

  const closeOverlay = useCallback(() => setChartMaximized(false), []);

  useEffect(() => {
    if (!chartMaximized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOverlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chartMaximized, closeOverlay]);

  useEffect(() => {
    if (!chartMaximized) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [chartMaximized]);

  const overlay =
    chartMaximized && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
              aria-label="Close chart overlay"
              onClick={closeOverlay}
            />
            <div
              className="relative z-[1] flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-zinc-950/95 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_80px_rgba(0,0,0,0.65)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <h3
                  id={titleId}
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400"
                >
                  Throughput &amp; lag
                </h3>
                <button
                  type="button"
                  onClick={closeOverlay}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
                >
                  <Minimize2 className="size-3.5" aria-hidden />
                  Close
                </button>
              </div>
              <div className="min-h-0 px-3 pb-4 pt-2">
                {chartData.length === 0 ? (
                  <div
                    className="flex items-center justify-center text-center text-[11px] text-zinc-500"
                    style={{ height: CHART_OVERLAY_HEIGHT }}
                  >
                    Step or run the simulation to record per-tick throughput and lag.
                  </div>
                ) : (
                  <ThroughputLagChart chartData={chartData} height={CHART_OVERLAY_HEIGHT} />
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="flex min-h-0 flex-col gap-4">
      {overlay}
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <KpiCard
          label="Produced"
          value={cumulativeProduced.toLocaleString()}
          sub="Cumulative msgs"
          icon={<Package className="size-3.5" aria-hidden />}
        />
        <KpiCard
          label="Consumed"
          value={cumulativeConsumed.toLocaleString()}
          sub="Successful commits"
          icon={<ArrowRightLeft className="size-3.5" aria-hidden />}
        />
        <KpiCard
          label="Lag"
          value={lastMetrics.totalLag.toLocaleString()}
          sub="Sum across partitions"
          icon={<Gauge className="size-3.5" aria-hidden />}
        />
        <KpiCard
          label="Retries"
          value={lastMetrics.retryDepth.toLocaleString()}
          sub="In retry queues"
          icon={<RefreshCw className="size-3.5" aria-hidden />}
        />
        <KpiCard
          label="Dead letter"
          value={lastMetrics.deadLetterDepth.toLocaleString()}
          sub="Poison messages"
          icon={<AlertTriangle className="size-3.5" aria-hidden />}
        />
        <KpiCard
          label="Imbalance"
          value={imbalance.toLocaleString()}
          sub="max lag − min lag"
          icon={<Layers className="size-3.5" aria-hidden />}
        />
      </div>

      <div className="flex w-full min-w-0 shrink-0 flex-col rounded-xl border border-white/10 bg-zinc-950/50 select-none">
        <div className="flex shrink-0 items-start justify-between gap-2 px-3 pt-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Throughput &amp; lag
          </p>
          <button
            type="button"
            onClick={() => setChartMaximized(true)}
            className="-mr-1 -mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-medium text-zinc-300 transition hover:bg-white/10"
            aria-label="Maximize throughput and lag chart"
          >
            <Maximize2 className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Expand</span>
          </button>
        </div>
        {chartData.length === 0 ? (
          <div
            className="flex items-center justify-center px-3 pb-3 pt-1 text-center text-[11px] text-zinc-500"
            style={{ height: CHART_PLOT_HEIGHT }}
          >
            Step or run the simulation to record per-tick throughput and lag.
          </div>
        ) : (
          <div className="w-full min-w-0 px-1 pb-2 pt-1">
            <ThroughputLagChart chartData={chartData} height={CHART_PLOT_HEIGHT} />
          </div>
        )}
      </div>
    </div>
  );
}
