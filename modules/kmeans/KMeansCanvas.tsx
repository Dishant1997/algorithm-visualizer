"use client";

import { useKMeansStore } from "@/store/kmeans";

export const CLUSTER_COLORS = [
  "#34d399", // emerald
  "#60a5fa", // blue
  "#f472b6", // pink
  "#fb923c", // orange
  "#a78bfa", // violet
  "#facc15", // yellow
  "#2dd4bf", // teal
  "#f87171", // red
];

const SIZE = 400;

function toSvg(v: number): number {
  return v * SIZE;
}

export function KMeansCanvas() {
  const { state } = useKMeansStore();
  const { points, centroids, assignments, phase } = state;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-full w-full"
      style={{ display: "block" }}
      aria-label="K-Means clustering visualization"
    >
      <defs>
        <pattern id="kmgrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <rect width={SIZE} height={SIZE} fill="rgba(9,9,11,0.0)" />
      <rect width={SIZE} height={SIZE} fill="url(#kmgrid)" />

      {/* Data points */}
      {points.map((p) => {
        const ci = assignments[p.id];
        const assigned = ci >= 0 && phase !== "init";
        const fill = assigned
          ? CLUSTER_COLORS[ci % CLUSTER_COLORS.length]
          : "rgba(161,161,170,0.45)";
        return (
          <circle
            key={p.id}
            cx={toSvg(p.x)}
            cy={toSvg(p.y)}
            r={3.2}
            fill={fill}
            opacity={assigned ? 0.78 : 1}
            style={{ transition: "fill 0.35s ease" }}
          />
        );
      })}

      {/* Centroids — translate via SVG transform so CSS transition works */}
      {centroids.map((c) => {
        const color = CLUSTER_COLORS[c.id % CLUSTER_COLORS.length];
        const cx = toSvg(c.x);
        const cy = toSvg(c.y);
        return (
          <g
            key={c.id}
            transform={`translate(${cx},${cy})`}
            style={{ transition: "transform 0.4s ease" }}
          >
            {/* Outer pulse ring */}
            <circle r={13} fill="none" stroke={color} strokeWidth={1.5} opacity={0.35} />
            {/* Main ring */}
            <circle r={9} fill="none" stroke={color} strokeWidth={2} opacity={0.9} />
            {/* Center dot */}
            <circle r={3.5} fill={color} />
            {/* Cross hair */}
            <line x1={-6} y1={0} x2={6} y2={0} stroke={color} strokeWidth={1.5} opacity={0.6} />
            <line x1={0} y1={-6} x2={0} y2={6} stroke={color} strokeWidth={1.5} opacity={0.6} />
          </g>
        );
      })}

      {/* Convergence badge */}
      {phase === "converged" && (
        <g>
          <rect
            x={SIZE / 2 - 46}
            y={SIZE - 24}
            width={92}
            height={18}
            rx={9}
            fill="rgba(52,211,153,0.12)"
            stroke="rgba(52,211,153,0.35)"
            strokeWidth={1}
          />
          <text
            x={SIZE / 2}
            y={SIZE - 12}
            textAnchor="middle"
            fill="rgba(52,211,153,0.9)"
            fontSize="10"
            fontFamily="ui-monospace,monospace"
            fontWeight="600"
            letterSpacing="0.08em"
          >
            CONVERGED
          </text>
        </g>
      )}
    </svg>
  );
}
