import type { ReactNode } from "react";

type LabShellProps = {
  header: ReactNode;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  bottom: ReactNode;
};

/**
 * Primary desktop-first grid for interactive labs.
 * Regions are slots so modules can swap implementations without changing the shell.
 */
export function LabShell({ header, left, center, right, bottom }: LabShellProps) {
  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-background text-foreground">
      {header}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Controls */}
        <aside className="flex w-full shrink-0 flex-col border-border lg:w-[min(20rem,28vw)] lg:border-r">
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{left}</div>
        </aside>

        {/* Main column: diagram + charts */}
        <div className="flex min-w-0 min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_min(22rem,32vw)]">
            <main className="min-h-[42vh] min-w-0 border-border xl:min-h-0 xl:border-r">
              {center}
            </main>
            <aside className="flex min-h-0 flex-col gap-3 border-border p-4 xl:max-h-none">
              {right}
            </aside>
          </div>

          {/* Charts dock */}
          <div className="shrink-0 border-t border-border bg-zinc-950/60 p-4 backdrop-blur-sm">
            {bottom}
          </div>
        </div>
      </div>
    </div>
  );
}
