import { LabCanvasFrame } from "@/components/layout/lab-canvas-frame";
import { LabPanel } from "@/components/layout/lab-panel";
import { LabModuleFrame } from "@/modules/lab/LabModuleFrame";

import { streamingModuleMeta } from "./module-meta";
import { StreamingControlPanel } from "./StreamingControlPanel";
import { StreamingEventLog } from "./StreamingEventLog";
import { StreamingMetricsPanel } from "./StreamingMetricsPanel";
import { SystemDiagram } from "./SystemDiagram";

/**
 * Streaming lab: wires the shared lab frame to streaming-specific panels.
 */
export function StreamingLabPage() {
  return (
    <LabModuleFrame
      module={streamingModuleMeta}
      slots={{
        controls: (
          <LabPanel
            title="Simulation controls"
            description="Playback, topology, rates, and failure policies for this run."
            className="h-fit"
            bodyClassName="space-y-5"
          >
            <StreamingControlPanel />
          </LabPanel>
        ),
        diagram: (
          <LabPanel
            title="System diagram"
            description="Producers, topic partitions, consumer group assignments."
            className="flex h-full min-h-0 flex-col"
            bodyClassName="flex min-h-0 flex-1 flex-col"
          >
            <LabCanvasFrame className="min-h-[min(52vh,28rem)] flex-1">
              <SystemDiagram />
            </LabCanvasFrame>
          </LabPanel>
        ),
        metrics: (
          <LabPanel
            title="Live metrics"
            description="Cumulative totals, backlog signals, and per-tick series."
            className="flex min-h-0 min-w-0 flex-1 flex-col"
            bodyClassName="flex min-h-0 flex-1 flex-col"
          >
            <StreamingMetricsPanel />
          </LabPanel>
        ),
        eventLog: (
          <LabPanel
            title="Event log"
            description="Recent engine events with simulation timestamps."
            className="flex min-h-0 flex-1 flex-col"
            bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
          >
            <StreamingEventLog />
          </LabPanel>
        ),
        charts: (
          <LabPanel
            title="Session"
            description="Primary throughput and lag chart lives in Live metrics."
            bodyClassName="py-2 text-[11px] leading-relaxed text-zinc-500"
          >
            Use Run or Step in controls to drive ticks—KPIs and the line chart update from
            the same simulation state.
          </LabPanel>
        ),
      }}
    />
  );
}
