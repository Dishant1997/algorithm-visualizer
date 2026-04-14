import type { ReactNode } from "react";

type LabPanelProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/**
 * Shared surface for sidebars and stacked regions: quiet border, soft elevation.
 */
export function LabPanel({
  title,
  description,
  actions,
  children,
  className = "",
  bodyClassName = "",
}: LabPanelProps) {
  return (
    <section
      className={`flex min-h-0 flex-col rounded-2xl border border-border bg-surface/90 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-md ${className}`}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 space-y-0.5">
          <h2 className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {title}
          </h2>
          {description ? (
            <p className="text-[11px] leading-snug text-zinc-500">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </header>
      <div className={`min-h-0 flex-1 px-4 py-3 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
