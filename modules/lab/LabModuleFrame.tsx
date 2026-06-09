import type { ReactNode } from "react";

import { LabHeader } from "@/components/layout/lab-header";
import { LabShell } from "@/components/layout/lab-shell";

import type { LabModuleMeta, LabViewportSlots } from "./types";

type LabModuleFrameProps = {
  module: LabModuleMeta;
  slots: LabViewportSlots;
  headerActions?: ReactNode;
};

/**
 * Wraps the lab shell with a typed slot API so new modules only supply content.
 */
export function LabModuleFrame({ module, slots, headerActions }: LabModuleFrameProps) {
  return (
    <LabShell
      header={<LabHeader module={module} actions={headerActions} />}
      left={slots.controls}
      center={slots.diagram}
      right={
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {slots.metrics}
          </div>
          {/* Cap log height so Live metrics + throughput chart keep more vertical space */}
          <div className="flex min-h-0 min-w-0 max-h-[min(32vh,13.5rem)] shrink-0 flex-col overflow-hidden">
            {slots.eventLog}
          </div>
        </div>
      }
      bottom={slots.charts}
    />
  );
}
