"use client";

import { ChevronDown } from "lucide-react";

export type ModuleId = "kmeans" | "streaming";

const MODULES: { id: ModuleId; label: string }[] = [
  { id: "kmeans", label: "K-Means Clustering" },
  { id: "streaming", label: "Kafka Streaming" },
];

export function ModuleSelector({
  activeModule,
  onChange,
}: {
  activeModule: ModuleId;
  onChange: (id: ModuleId) => void;
}) {
  return (
    <div className="relative">
      <select
        value={activeModule}
        onChange={(e) => onChange(e.target.value as ModuleId)}
        className="cursor-pointer appearance-none rounded-lg border border-white/10 bg-zinc-900/80 py-1.5 pl-3 pr-7 text-xs font-medium text-zinc-200 outline-none ring-emerald-400/30 focus:ring-2"
        aria-label="Switch module"
      >
        {MODULES.map(({ id, label }) => (
          <option key={id} value={id} className="bg-zinc-900 text-zinc-200">
            {label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-zinc-500"
        aria-hidden
      />
    </div>
  );
}
