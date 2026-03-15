// src/components/sidebar/ServiceCard.tsx
import type { DockerHubSearchResult } from '../../data/types';

interface ServiceCardProps {
  result: DockerHubSearchResult;
  onAdd: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export function ServiceCard({ result, onAdd, onDragStart }: ServiceCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 cursor-grab transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-200 truncate">{result.name}</span>
          {result.isOfficial && (
            <span className="text-[10px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">Official</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{result.description}</p>
        {result.pullCount > 0 && (
          <span className="text-[10px] text-gray-600">{formatPulls(result.pullCount)} pulls</span>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded shrink-0"
      >
        + Add
      </button>
    </div>
  );
}

function formatPulls(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(0)}B+`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K+`;
  return String(n);
}
