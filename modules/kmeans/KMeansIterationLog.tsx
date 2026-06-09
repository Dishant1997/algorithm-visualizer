"use client";

import { useKMeansStore } from "@/store/kmeans";

export function KMeansIterationLog() {
  const inertiaHistory = useKMeansStore((s) => s.inertiaHistory);
  const phase = useKMeansStore((s) => s.state.phase);

  const reversed = [...inertiaHistory].reverse();

  if (reversed.length === 0) {
    return (
      <p className="p-4 text-[11px] text-zinc-500">
        Step or run to see per-iteration log.
      </p>
    );
  }

  return (
    <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto font-mono text-[11px]">
      {reversed.map((p, idx) => {
        const delta =
          idx < reversed.length - 1
            ? p.inertia - reversed[idx + 1].inertia
            : null;
        const isLast = idx === 0;
        return (
          <li
            key={p.iteration}
            className={`flex items-center justify-between gap-3 px-4 py-2 ${
              isLast && phase !== "converged" ? "bg-white/[0.03]" : ""
            }`}
          >
            <span className="text-zinc-500">iter {p.iteration}</span>
            <span className="tabular-nums text-zinc-200">
              {p.inertia.toFixed(5)}
            </span>
            {delta !== null ? (
              <span
                className={`tabular-nums text-[10px] ${
                  delta < 0 ? "text-emerald-400" : "text-zinc-600"
                }`}
              >
                {delta < 0 ? "↓" : "→"} {Math.abs(delta).toFixed(5)}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-600">—</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
