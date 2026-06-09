"use client";

import { useEffect, useRef } from "react";

import type { StreamingSimulationEvent } from "@/engine/streaming";
import { useStreamingSimulationStore } from "@/store/streaming";

const TYPE_LABEL: Record<StreamingSimulationEvent["type"], string> = {
  message_produced: "Produced",
  partition_assigned: "Partition",
  consumer_batch_processed: "Batch",
  consumer_failure: "Failure",
  retry_scheduled: "Retry",
  dead_letter: "Dead letter",
};

function typeBadgeClass(type: StreamingSimulationEvent["type"]): string {
  switch (type) {
    case "message_produced":
      return "border-emerald-500/35 bg-emerald-500/15 text-emerald-200";
    case "partition_assigned":
      return "border-teal-500/35 bg-teal-500/10 text-teal-200";
    case "consumer_batch_processed":
      return "border-sky-500/35 bg-sky-500/10 text-sky-200";
    case "consumer_failure":
      return "border-rose-500/40 bg-rose-500/15 text-rose-200";
    case "retry_scheduled":
      return "border-amber-500/40 bg-amber-500/15 text-amber-200";
    case "dead_letter":
      return "border-orange-500/40 bg-orange-500/15 text-orange-200";
  }
}

export function StreamingEventLog() {
  const eventLog = useStreamingSimulationStore((s) => s.eventLog);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [eventLog]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/25">
      <div className="shrink-0 border-b border-white/10 px-2.5 py-1.5">
        <p className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">
          Simulation log
        </p>
        <p className="text-[9px] text-zinc-600">
          Last {eventLog.length} events · simulation time
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-1.5 py-1.5">
        {eventLog.length === 0 ? (
          <p className="px-2 py-6 text-center text-[10px] text-zinc-500">
            Run or step the simulation—events appear here in real time.
          </p>
        ) : (
          eventLog.map((evt) => (
            <article
              key={evt.id}
              className="rounded-md border border-white/8 bg-zinc-900/60 px-2 py-1.5"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded border px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide ${typeBadgeClass(evt.type)}`}
                >
                  {TYPE_LABEL[evt.type]}
                </span>
                <time
                  className="font-mono text-[9px] tabular-nums text-zinc-500"
                  dateTime={`tick-${evt.tickIndex}`}
                >
                  tick {evt.tickIndex} · {evt.simTimeMs} ms
                </time>
              </div>
              <p className="mt-0.5 text-[10px] leading-snug text-zinc-200">{evt.summary}</p>
              {evt.detail ? (
                <p className="mt-0.5 text-[9px] leading-snug text-zinc-500">{evt.detail}</p>
              ) : null}
            </article>
          ))
        )}
        <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
      </div>
    </div>
  );
}
