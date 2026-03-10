import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type Node,
  type Edge,
  type NodeTypes,
  type DefaultEdgeOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '../../store';
import { ServiceNodeComponent } from './ServiceNodeComponent';
import type { PresetImageKey } from '../../store/types';

const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
  style: { stroke: '#6366f1', strokeDasharray: '5 5' },
};

export function FlowCanvas() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const addNode = useStore((s) => s.addNode);
  const addEdge = useStore((s) => s.addEdge);
  const removeNode = useStore((s) => s.removeNode);
  const removeEdge = useStore((s) => s.removeEdge);
  const selectNode = useStore((s) => s.selectNode);

  // Cast to React Flow types (our ServiceNode has stricter data typing)
  const rfNodes = nodes as unknown as Node[];
  const rfEdges = edges as unknown as Edge[];

  const nodeTypes: NodeTypes = useMemo(
    () => ({ serviceNode: ServiceNodeComponent as unknown as NodeTypes['serviceNode'] }),
    [],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === 'remove') {
          removeNode(change.id);
        } else if (change.type === 'position' && change.position) {
          useStore.setState((state) => ({
            nodes: state.nodes.map((n) =>
              n.id === change.id ? { ...n, position: change.position! } : n,
            ),
          }));
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
        id: crypto.randomUUID(),
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
      const preset = e.dataTransfer.getData('application/vdc-preset') as PresetImageKey;
      if (!preset) return;

      const bounds = (e.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
      if (!bounds) return;

      const position = {
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      };

      addNode(preset, position);
    },
    [addNode],
  );

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onPaneClick={onPaneClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      defaultEdgeOptions={defaultEdgeOptions}
      snapToGrid
      snapGrid={[16, 16]}
      fitView
      deleteKeyCode={['Backspace', 'Delete']}
      className="bg-gray-950"
    >
      <Background color="#374151" gap={16} />
      <Controls className="!bg-gray-800 !border-gray-700 [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-gray-300" />
    </ReactFlow>
  );
}
