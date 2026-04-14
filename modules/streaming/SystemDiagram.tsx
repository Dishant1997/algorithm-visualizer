"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type ReactFlowInstance,
} from "reactflow";

import { useStreamingSimulationStore } from "@/store/streaming";

import { buildStreamingDiagramGraph } from "./diagram/build-graph";
import { diagramNodeTypes } from "./diagram/nodes";

import "reactflow/dist/style.css";

function FitViewOnStructureChange({
  structureKey,
}: {
  structureKey: string;
}) {
  const { fitView } = useReactFlow();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    if (prev.current === null) {
      prev.current = structureKey;
      return;
    }
    if (prev.current === structureKey) return;
    prev.current = structureKey;
    const id = requestAnimationFrame(() => {
      fitView({ padding: 0.18, duration: 220 });
    });
    return () => cancelAnimationFrame(id);
  }, [structureKey, fitView]);

  return null;
}

function onFlowInit(instance: ReactFlowInstance) {
  requestAnimationFrame(() => {
    instance.fitView({ padding: 0.18 });
  });
}

function SystemDiagramInner() {
  const config = useStreamingSimulationStore((s) => s.config);
  const runtime = useStreamingSimulationStore((s) => s.runtime);
  const lastMetrics = useStreamingSimulationStore((s) => s.lastMetrics);

  const graph = useMemo(
    () => buildStreamingDiagramGraph({ config, runtime, lastMetrics }),
    [config, runtime, lastMetrics],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  const topic = config.topics[0];
  const group = config.consumerGroups[0];
  const producerCount = topic
    ? config.producers.filter((p) => p.topicId === topic.id).length
    : config.producers.length;
  const structureKey = `${producerCount}-${topic?.partitionCount ?? 0}-${group?.memberIds.length ?? 0}`;

  return (
    <>
      <FitViewOnStructureChange structureKey={structureKey} />
      <ReactFlow
        onInit={onFlowInit}
        nodes={nodes}
        edges={edges}
        nodeTypes={diagramNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        minZoom={0.4}
        maxZoom={1.35}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          animated: true,
        }}
        className="!bg-transparent [&_.react-flow__edge-path]:stroke-linecap-round"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="rgba(255,255,255,0.06)"
        />
        <Controls
          className="!m-2 !overflow-hidden !rounded-xl !border !border-white/10 !bg-zinc-900/90 !shadow-lg [&_button]:!rounded-lg [&_button]:!border-white/10 [&_button]:!bg-zinc-800/90 [&_button]:!text-zinc-200 [&_button:hover]:!bg-zinc-700/90"
          showInteractive={false}
        />
      </ReactFlow>
    </>
  );
}

export function SystemDiagram() {
  return (
    <div className="relative h-full min-h-[min(52vh,28rem)] w-full">
      <ReactFlowProvider>
        <SystemDiagramInner />
      </ReactFlowProvider>
    </div>
  );
}
