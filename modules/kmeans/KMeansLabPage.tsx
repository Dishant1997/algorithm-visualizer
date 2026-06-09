import type { ReactNode } from "react";

import { LabCanvasFrame } from "@/components/layout/lab-canvas-frame";
import { LabPanel } from "@/components/layout/lab-panel";
import { LabModuleFrame } from "@/modules/lab/LabModuleFrame";

import { KMeansCanvas } from "./KMeansCanvas";
import { KMeansControlPanel } from "./KMeansControlPanel";
import { KMeansIterationLog } from "./KMeansIterationLog";
import { KMeansMetricsPanel } from "./KMeansMetricsPanel";
import { kmeansModuleMeta } from "./module-meta";

export function KMeansLabPage({ headerActions }: { headerActions?: ReactNode }) {
  return (
    <LabModuleFrame
      module={kmeansModuleMeta}
      headerActions={headerActions}
      slots={{
        controls: (
          <LabPanel
            title="Controls"
            description="Dataset, K, speed, and playback. Expand Why it works for the math."
            className="h-fit"
            bodyClassName="space-y-1"
          >
            <KMeansControlPanel />
          </LabPanel>
        ),
        diagram: (
          <LabPanel
            title="Clustering visualization"
            description="Points colored by cluster assignment. Rings are centroids — watch them converge."
            className="flex h-full min-h-0 flex-col"
            bodyClassName="flex min-h-0 flex-1 flex-col"
          >
            <LabCanvasFrame className="min-h-[min(52vh,28rem)] flex-1">
              <KMeansCanvas />
            </LabCanvasFrame>
          </LabPanel>
        ),
        metrics: (
          <LabPanel
            title="Live metrics"
            description="Inertia (WCSS) and cluster size distribution per iteration."
            className="flex min-h-0 min-w-0 flex-1 flex-col"
            bodyClassName="flex min-h-0 flex-1 flex-col"
          >
            <KMeansMetricsPanel />
          </LabPanel>
        ),
        eventLog: (
          <LabPanel
            title="Iteration log"
            description="Inertia and delta per step — newest first."
            className="flex min-h-0 flex-1 flex-col"
            bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
          >
            <KMeansIterationLog />
          </LabPanel>
        ),
        charts: (
          <LabPanel
            title="About K-Means"
            bodyClassName="py-2 text-[11px] leading-relaxed text-zinc-500"
          >
            Expectation–Maximisation over Euclidean distance. Converges to a{" "}
            <em>local</em> minimum — run Shuffle multiple times to find a better
            partition. Moons and rings demonstrate why non-convex data needs
            DBSCAN or spectral clustering instead.
          </LabPanel>
        ),
      }}
    />
  );
}
