import type { ReactNode } from "react";

import type { LabModuleMeta } from "@/modules/lab/types";

type LabHeaderProps = {
  productTitle?: string;
  productTagline?: string;
  module: LabModuleMeta;
  actions?: ReactNode;
};

export function LabHeader({
  productTitle = "Distributed Systems Visual Lab",
  productTagline = "Simulation-driven explanations for real system behavior",
  module,
  actions,
}: LabHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-zinc-950/80 px-5 py-3.5 backdrop-blur-md">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-[13px] font-semibold tracking-tight text-zinc-100">
          {productTitle}
        </p>
        <p className="truncate text-xs text-zinc-500">{productTagline}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {actions}
        <span className="hidden text-right text-[11px] text-zinc-500 sm:block">
          {module.subtitle}
        </span>
        <span className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-200">
          {module.label}
        </span>
      </div>
    </header>
  );
}
