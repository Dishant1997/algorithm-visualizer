import { LabHeader } from "@/components/layout/lab-header";
import { LabShell } from "@/components/layout/lab-shell";

import type { LabModuleMeta, LabViewportSlots } from "./types";

type LabModuleFrameProps = {
  module: LabModuleMeta;
  slots: LabViewportSlots;
};

/**
 * Wraps the lab shell with a typed slot API so new modules only supply content.
 */
export function LabModuleFrame({ module, slots }: LabModuleFrameProps) {
  return (
    <LabShell
      header={<LabHeader module={module} />}
      left={slots.controls}
      center={slots.diagram}
      right={
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {slots.metrics}
          <div className="min-h-0 flex min-h-[12rem] flex-1 flex-col">
            {slots.eventLog}
          </div>
        </div>
      }
      bottom={slots.charts}
    />
  );
}
