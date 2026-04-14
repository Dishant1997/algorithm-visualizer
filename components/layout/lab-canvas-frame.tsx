import type { ReactNode } from "react";

type LabCanvasFrameProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Center viewport wrapper: keeps a consistent diagram aspect and grid backdrop.
 */
export function LabCanvasFrame({ children, className = "" }: LabCanvasFrameProps) {
  return (
    <div
      className={`relative flex h-full min-h-[20rem] flex-col overflow-hidden rounded-2xl border border-border bg-diagram-grid shadow-inner ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950/20 to-zinc-950/80" />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
