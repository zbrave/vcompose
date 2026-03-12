import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { ServiceNodeData } from '../../store/types';
import { useStore } from '../../store';

type ServiceNodeProps = NodeProps & { data: ServiceNodeData };

export function ServiceNodeComponent({ id, data, selected }: ServiceNodeProps) {
  const validationIssues = useStore((s) => s.validationIssues);
  const removeNode = useStore((s) => s.removeNode);
  const nodeIssues = validationIssues.filter((i) => i.nodeId === id);
  const hasError = nodeIssues.some((i) => i.severity === 'error');
  const hasWarning = nodeIssues.some((i) => i.severity === 'warning');

  return (
    <div
      className={`relative min-w-[160px] rounded-lg border bg-gray-800 px-4 py-3 shadow-lg transition-colors ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : hasError
            ? 'border-red-500'
            : hasWarning
              ? 'border-yellow-500'
              : 'border-gray-600'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-400" />

      {selected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeNode(id);
          }}
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow hover:bg-red-400"
        >
          ✕
        </button>
      )}

      <div className="flex items-center gap-2">
        {hasError && <span className="h-2 w-2 rounded-full bg-red-500" />}
        {!hasError && hasWarning && <span className="h-2 w-2 rounded-full bg-yellow-500" />}
        <div className="flex-1 truncate text-sm font-semibold text-gray-100">
          {data.serviceName}
        </div>
      </div>
      <div className="mt-1 truncate text-xs text-gray-400">{data.image || 'no image'}</div>
      {data.ports.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          {data.ports.map((p) => `${p.host}:${p.container}`).join(', ')}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-blue-400" />
    </div>
  );
}
