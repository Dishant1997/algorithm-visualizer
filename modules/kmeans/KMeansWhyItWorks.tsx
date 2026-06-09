"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function KMeansWhyItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-white/10 pt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-[11px] font-medium uppercase tracking-wide text-zinc-500 transition hover:text-zinc-300"
      >
        Why it works
        {open ? (
          <ChevronUp className="size-3.5" aria-hidden />
        ) : (
          <ChevronDown className="size-3.5" aria-hidden />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-[11px] leading-relaxed text-zinc-400">
          <p>
            <span className="font-semibold text-zinc-200">Goal: </span>
            Partition N points into K clusters minimising within-cluster variance
            (inertia = WCSS).
          </p>
          <p>
            <span className="font-semibold text-zinc-200">E-step (assign): </span>
            Each point goes to its nearest centroid by Euclidean distance. With
            centroids fixed, this is the optimal assignment.
          </p>
          <p>
            <span className="font-semibold text-zinc-200">M-step (move): </span>
            Each centroid relocates to the arithmetic mean of its cluster. With
            assignments fixed, the mean minimises squared distance.
          </p>
          <p>
            <span className="font-semibold text-zinc-200">Why converge? </span>
            Each step decreases or maintains inertia. There are finitely many
            assignment configurations, so the loop must terminate.
          </p>
          <p>
            <span className="font-semibold text-zinc-200">Inertia (WCSS): </span>
            Σ ‖xᵢ − μ<sub>c(i)</sub>‖² Watch the chart — each iteration drops
            it toward a local minimum.
          </p>
          <p>
            <span className="font-semibold text-zinc-200">Moons &amp; rings: </span>
            K-Means assumes convex, roughly spherical clusters. Non-convex shapes
            show its core limitation — it converges, but to a suboptimal split.
          </p>
        </div>
      )}
    </div>
  );
}
