"use client";

import { useMemo, type ReactNode } from "react";
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

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
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

      <div className="min-h-[168px] w-full flex-1 rounded-xl border border-white/10 bg-zinc-950/50 px-1 pb-1 pt-2">
        <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Throughput & lag
        </p>
        {chartData.length === 0 ? (
          <div className="flex h-[140px] items-center justify-center px-3 text-center text-[11px] text-zinc-500">
            Step or run the simulation to record per-tick throughput and lag.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={148}>
            <ComposedChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
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
                width={28}
              />
              <YAxis
                yAxisId="lag"
                orientation="right"
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#e4e4e7" }}
              />
              <Legend
                wrapperStyle={{ fontSize: "10px", paddingTop: 4 }}
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
        )}
      </div>
    </div>
  );
}
