import { partitionKey } from "@/engine/streaming/keys";
import type {
  StreamingSimulationConfig,
  StreamingRuntimeState,
} from "@/engine/streaming/types";
import type { MetricsSnapshot } from "@/domain";
import { MarkerType, type Edge, type Node } from "reactflow";

import type {
  ConsumerGroupNodeData,
  DlqNodeData,
  PartitionNodeData,
  ProducerNodeData,
  TopicNodeData,
} from "./nodes";

const CENTER_X = 420;
const PROD_W = 148;
const PROD_GAP = 20;
const PART_W = 92;
const PART_GAP = 14;

function rowStartX(count: number, cell: number, gap: number): number {
  const total = count * cell + Math.max(0, count - 1) * gap;
  return CENTER_X - total / 2;
}

export function buildStreamingDiagramGraph(input: {
  readonly config: StreamingSimulationConfig;
  readonly runtime: StreamingRuntimeState;
  readonly lastMetrics: MetricsSnapshot;
}): { nodes: Node[]; edges: Edge[] } {
  const { config, runtime, lastMetrics } = input;

  const topic = config.topics[0];
  const group = config.consumerGroups[0];
  const producers = topic
    ? config.producers.filter((p) => p.topicId === topic.id)
    : config.producers;

  const lagByPartition = new Map<number, number>();
  for (const row of lastMetrics.perPartition) {
    if (topic && row.topicId === topic.id) {
      lagByPartition.set(row.partitionIndex, row.lag);
    }
  }

  const partitionCount = topic?.partitionCount ?? 1;
  const dlqKey = topic ? String(topic.id) : "";
  const dlqDepth = (runtime.deadLetterEntriesByTopic[dlqKey] ?? []).length;

  const nodes: Node[] = [];

  const prodXs = rowStartX(producers.length, PROD_W, PROD_GAP);
  producers.forEach((p, i) => {
    nodes.push({
      id: `producer-${i}`,
      type: "producer",
      position: { x: prodXs + i * (PROD_W + PROD_GAP), y: 0 },
      data: {
        label: String(p.id),
        rateLabel: `${p.rate.messagesPerTick} msg/tick`,
      } satisfies ProducerNodeData,
    });
  });

  nodes.push({
    id: "topic",
    type: "topic",
    position: { x: CENTER_X - 110, y: 125 },
    data: { name: topic?.name ?? "topic" } satisfies TopicNodeData,
  });

  const partXs = rowStartX(partitionCount, PART_W, PART_GAP);
  for (let i = 0; i < partitionCount; i++) {
    const lag = lagByPartition.get(i) ?? 0;
    nodes.push({
      id: `partition-${i}`,
      type: "partition",
      position: { x: partXs + i * (PART_W + PART_GAP), y: 268 },
      data: { index: i, lag } satisfies PartitionNodeData,
    });
  }

  const members = group ? group.memberIds.length : 0;
  const consumerRate = config.consumers[0]?.maxMessagesPerTick ?? 0;

  nodes.push({
    id: "consumer-group",
    type: "consumerGroup",
    position: { x: CENTER_X - 120, y: 410 },
    data: {
      label: group ? String(group.id) : "group",
      members,
      rateLabel: `${consumerRate} msg/tick each`,
    } satisfies ConsumerGroupNodeData,
  });

  nodes.push({
    id: "dlq",
    type: "dlq",
    position: { x: CENTER_X + 200, y: 410 },
    data: { depth: dlqDepth } satisfies DlqNodeData,
  });

  const edges: Edge[] = [];

  const strokeMain = "rgba(52, 211, 153, 0.55)";
  const strokeDlq = "rgba(251, 191, 36, 0.55)";
  const flow = Math.min(
    3,
    1 + (lastMetrics.producerThroughput.messagesPerTick ?? 0) / 8,
  );

  producers.forEach((_, i) => {
    edges.push({
      id: `e-prod${i}-topic`,
      source: `producer-${i}`,
      target: "topic",
      animated: true,
      style: { stroke: strokeMain, strokeWidth: flow },
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: strokeMain },
    });
  });

  if (topic) {
    for (let i = 0; i < partitionCount; i++) {
      const pk = partitionKey(topic.id, i);
      const depth = (runtime.partitionLogs[pk] ?? []).length;
      const edgeFlow = Math.min(2.5, 1 + Math.min(depth, 40) / 25);
      edges.push({
        id: `e-topic-part${i}`,
        source: "topic",
        target: `partition-${i}`,
        animated: true,
        style: { stroke: strokeMain, strokeWidth: edgeFlow },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: strokeMain,
        },
      });
    }
  }

  for (let i = 0; i < partitionCount; i++) {
    edges.push({
      id: `e-part${i}-cg`,
      source: `partition-${i}`,
      target: "consumer-group",
      animated: true,
      style: {
        stroke: strokeMain,
        strokeWidth: Math.min(2.5, 1 + (lagByPartition.get(i) ?? 0) / 20),
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: strokeMain,
      },
    });
  }

  edges.push({
    id: "e-cg-dlq",
    source: "consumer-group",
    sourceHandle: "dlq",
    target: "dlq",
    animated: dlqDepth > 0 || lastMetrics.deadLetterDepth > 0,
    style: {
      stroke: strokeDlq,
      strokeWidth: dlqDepth > 0 ? 2.2 : 1.2,
      opacity: dlqDepth > 0 ? 1 : 0.45,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: strokeDlq,
    },
  });

  return { nodes, edges };
}
