"use client";

import { memo, type ReactNode } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { AlertTriangle, Layers, Radio, Users } from "lucide-react";

export type ProducerNodeData = { label: string; rateLabel: string };
export type TopicNodeData = { name: string };
export type PartitionNodeData = {
  index: number;
  lag: number;
};
export type ConsumerGroupNodeData = {
  label: string;
  members: number;
  rateLabel: string;
};
export type DlqNodeData = { depth: number };

function CardShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/12 bg-zinc-900/90 px-3 py-2.5 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export const ProducerNode = memo(function ProducerNode({
  data,
}: NodeProps<ProducerNodeData>) {
  return (
    <div className="w-[148px]">
      <Handle
        type="target"
        position={Position.Top}
        className="!size-2 !border-0 !bg-emerald-400/50 opacity-0"
      />
      <CardShell>
        <div className="flex items-center gap-2">
          <Radio className="size-3.5 shrink-0 text-emerald-400/90" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Producer
            </p>
            <p className="truncate text-xs font-medium text-zinc-100">{data.label}</p>
            <p className="text-[10px] text-zinc-500">{data.rateLabel}</p>
          </div>
        </div>
      </CardShell>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-2 !border-0 !bg-emerald-400/80"
      />
    </div>
  );
});

export const TopicNode = memo(function TopicNode({ data }: NodeProps<TopicNodeData>) {
  return (
    <div className="w-[220px]">
      <Handle
        type="target"
        position={Position.Top}
        className="!size-2 !border-0 !bg-emerald-400/80"
      />
      <CardShell className="border-emerald-500/25 bg-emerald-950/35">
        <div className="flex items-center gap-2">
          <Layers className="size-4 shrink-0 text-emerald-300/90" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-200/80">
              Topic
            </p>
            <p className="truncate font-mono text-sm text-zinc-50">{data.name}</p>
          </div>
        </div>
      </CardShell>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-2 !border-0 !bg-emerald-400/80"
      />
    </div>
  );
});

export const PartitionNode = memo(function PartitionNode({
  data,
}: NodeProps<PartitionNodeData>) {
  return (
    <div className="w-[92px]">
      <Handle
        type="target"
        position={Position.Top}
        className="!size-2 !border-0 !bg-emerald-400/80"
      />
      <CardShell className="px-2 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          P{data.index}
        </p>
        <p className="font-mono text-[11px] text-zinc-300">lag {data.lag}</p>
      </CardShell>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-2 !border-0 !bg-emerald-400/80"
      />
    </div>
  );
});

export const ConsumerGroupNode = memo(function ConsumerGroupNode({
  data,
}: NodeProps<ConsumerGroupNodeData>) {
  return (
    <div className="w-[240px]">
      <Handle
        type="target"
        position={Position.Top}
        className="!size-2 !border-0 !bg-emerald-400/80"
      />
      <CardShell>
        <div className="flex items-center gap-2">
          <Users className="size-4 shrink-0 text-sky-300/90" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Consumer group
            </p>
            <p className="truncate text-xs font-medium text-zinc-100">{data.label}</p>
            <p className="text-[10px] text-zinc-500">
              {data.members} consumer{data.members === 1 ? "" : "s"} · {data.rateLabel}
            </p>
          </div>
        </div>
      </CardShell>
      <Handle
        type="source"
        position={Position.Right}
        id="dlq"
        className="!size-2 !border-0 !bg-amber-400/70"
      />
    </div>
  );
});

export const DlqNode = memo(function DlqNode({ data }: NodeProps<DlqNodeData>) {
  return (
    <div className="w-[148px]">
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border-0 !bg-amber-400/80"
      />
      <CardShell className="border-amber-500/30 bg-amber-950/40">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-3.5 shrink-0 text-amber-300/90" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/80">
              Dead letter
            </p>
            <p className="font-mono text-xs text-zinc-100">{data.depth} msgs</p>
          </div>
        </div>
      </CardShell>
    </div>
  );
});

export const diagramNodeTypes = {
  producer: ProducerNode,
  topic: TopicNode,
  partition: PartitionNode,
  consumerGroup: ConsumerGroupNode,
  dlq: DlqNode,
};
