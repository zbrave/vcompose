import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useReactFlow,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { generateId } from '../../lib/generate-id';
import { useStore } from '../../store';
import { GlassServiceNode } from './GlassServiceNode';
import { NeonWireEdge } from './NeonWireEdge';

import { EmptyCanvasOverlay } from './EmptyCanvasOverlay';
import type { PresetImageKey } from '../../store/types';

export function FlowCanvas() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const addNode = useStore((s) => s.addNode);
  const addEdge = useStore((s) => s.addEdge);
  const removeNode = useStore((s) => s.removeNode);
  const removeEdge = useStore((s) => s.removeEdge);
  const selectNode = useStore((s) => s.selectNode);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const addStack = useStore((s) => s.addStack);
  const addServiceFromRegistry = useStore((s) => s.addServiceFromRegistry);
  const addServiceFromHub = useStore((s) => s.addServiceFromHub);
  const { screenToFlowPosition, fitView } = useReactFlow();

  // Cast to React Flow types, inject selected state
  const rfNodes = useMemo(
    () => nodes.map((n) => ({ ...n, selected: n.id === selectedNodeId })) as unknown as Node[],
    [nodes, selectedNodeId],
  );
  const rfEdges = edges as unknown as Edge[];

  const nodeTypes: NodeTypes = useMemo(
    () => ({ serviceNode: GlassServiceNode as unknown as NodeTypes['serviceNode'] }),
    [],
  );

  const edgeTypes: EdgeTypes = useMemo(
    () => ({ dependencyEdge: NeonWireEdge as unknown as EdgeTypes['dependencyEdge'] }),
    [],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'remove') {
          removeNode(change.id);
        } else if (change.type === 'position' && change.position) {
          if (change.dragging) {
            // Pause temporal during drag to avoid per-pixel undo entries
            useStore.temporal.getState().pause();
            useStore.setState((state) => ({
              nodes: state.nodes.map((n) =>
                n.id === change.id ? { ...n, position: change.position! } : n,
              ),
            }));
          } else {
            // Drag ended — resume temporal and commit final position
            useStore.temporal.getState().resume();
            useStore.setState((state) => ({
              nodes: state.nodes.map((n) =>
                n.id === change.id ? { ...n, position: change.position! } : n,
              ),
            }));
          }
        } else if (change.type === 'select') {
          if (change.selected) {
            selectNode(change.id);
          }
        }
      }
    },
    [removeNode, selectNode],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === 'remove') {
          removeEdge(change.id);
        }
      }
    },
    [removeEdge],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      if (params.source === params.target) return;
      const exists = edges.some((e) => e.source === params.source && e.target === params.target);
      if (exists) return;

      addEdge({
        id: generateId(),
        source: params.source,
        target: params.target,
        type: 'dependencyEdge',
      });
    },
    [edges, addEdge],
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const position = { x: flowPos.x - 80, y: flowPos.y - 40 };

      // Legacy preset (backward compat)
      const preset = e.dataTransfer.getData('application/vdc-preset');
      if (preset) {
        addNode(preset as PresetImageKey, position);
        return;
      }

      // Stack
      const stackKey = e.dataTransfer.getData('application/vdc-stack');
      if (stackKey) {
        addStack(stackKey, position);
        return;
      }

      // Registry service
      const serviceKey = e.dataTransfer.getData('application/vdc-service');
      if (serviceKey) {
        addServiceFromRegistry(serviceKey, position);
        return;
      }

      // Docker Hub image
      const hubData = e.dataTransfer.getData('application/vdc-hub-image');
      if (hubData) {
        try {
          const hubResult = JSON.parse(hubData);
          addServiceFromHub(hubResult, position);
        } catch { /* ignore invalid data */ }
      }
    },
    [addNode, addStack, addServiceFromRegistry, addServiceFromHub, screenToFlowPosition],
  );

  // Animated fitView when nodes are added
  const prevNodeCountRef = useRef(nodes.length);
  useEffect(() => {
    const prev = prevNodeCountRef.current;
    prevNodeCountRef.current = nodes.length;
    if (nodes.length > prev) {
      const timer = setTimeout(() => {
        fitView({ duration: 500, padding: 0.15 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        useStore.temporal.getState().undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        useStore.temporal.getState().redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative h-full w-full">
    {nodes.length === 0 && <EmptyCanvasOverlay />}
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onPaneClick={onPaneClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      snapToGrid
      snapGrid={[16, 16]}
      fitView
      deleteKeyCode={['Backspace', 'Delete']}
      className="!bg-base"
    >
      <Background color="#3d3530" gap={16} />
      <Controls className="!bg-elevated !border-subtle [&>button]:!bg-elevated [&>button]:!border-subtle [&>button]:!text-text-secondary" />
    </ReactFlow>
    </div>
  );
}
