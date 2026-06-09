"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useKMeansStore } from "@/store/kmeans";

import { CLUSTER_COLORS } from "./KMeansCanvas";

const tooltipStyle = {
  backgroundColor: "rgba(24,24,27,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.5rem",
  fontSize: "11px",
};

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p
        className={`font-mono text-sm tabular-nums ${accent ? "text-emerald-300" : "text-zinc-100"}`}
      >
        {value}
      </p>
      {sub ? <p className="text-[10px] leading-tight text-zinc-500">{sub}</p> : null}
    </div>
  );
}

export function KMeansMetricsPanel() {
  const state = useKMeansStore((s) => s.state);
  const inertiaHistory = useKMeansStore((s) => s.inertiaHistory);

  const { iteration, inertia, phase, assignments, centroids, points } = state;

  const clusterCounts = useMemo(() => {
    const counts = new Array(centroids.length).fill(0);
    assignments.forEach((ci) => {
      if (ci >= 0) counts[ci]++;
    });
    return counts;
  }, [assignments, centroids.length]);

  const chartData = useMemo(
    () =>
      inertiaHistory.map((p) => ({
        iter: p.iteration,
        inertia: Math.round(p.inertia * 10000) / 10000,
      })),
    [inertiaHistory],
  );

  const phaseLabel =
    phase === "converged" ? "Converged" : phase === "init" ? "Ready" : "Running";

  return (
    <div className="flex min-h-0 flex-col gap-4">
      {/* KPI grid */}
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <KpiCard label="Iteration" value={iteration.toString()} />
        <KpiCard label="Phase" value={phaseLabel} accent={phase === "converged"} />
        <KpiCard
          label="Inertia (WCSS)"
          value={inertia === Infinity ? "—" : inertia.toFixed(4)}
          sub="lower = tighter clusters"
        />
        <KpiCard label="K" value={centroids.length.toString()} sub="active clusters" />
      </div>

      {/* Cluster size bars */}
      {phase !== "init" && (
        <div className="shrink-0 space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Cluster sizes
          </p>
          {clusterCounts.map((count, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}
              />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800/60">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(count / points.length) * 100}%`,
                    background: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="w-7 text-right font-mono text-[10px] tabular-nums text-zinc-400">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Inertia chart */}
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-white/10 bg-zinc-950/50">
        <p className="shrink-0 px-3 pt-2.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Inertia per iteration
        </p>
        {chartData.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-3 pb-3 text-center text-[11px] text-zinc-500">
            Step or run to watch inertia converge.
          </div>
        ) : (
          <div className="min-h-0 flex-1 px-1 pb-2 pt-1" style={{ minHeight: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 6, right: 12, left: 2, bottom: 6 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="iter"
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  label={{ value: "iteration", position: "insideBottom", offset: -2, fill: "#52525b", fontSize: 9 }}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "#e4e4e7" }}
                  formatter={(v) => [typeof v === "number" ? v.toFixed(4) : v, "inertia"]}
                />
                <Line
                  type="monotone"
                  dataKey="inertia"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#34d399", strokeWidth: 0 }}
                  isAnimationActive={chartData.length < 40}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
