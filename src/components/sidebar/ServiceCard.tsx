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
      className="flex items-center gap-3 p-3 bg-elevated/50 border border-subtle rounded-lg hover:border-accent/30 cursor-grab transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-text-primary truncate">{result.name}</span>
          {result.isOfficial && (
            <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">Official</span>
          )}
        </div>
        <p className="text-xs text-text-secondary truncate mt-0.5">{result.description}</p>
        {result.pullCount > 0 && (
          <span className="text-[10px] text-text-muted">{formatPulls(result.pullCount)} pulls</span>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="text-xs bg-accent/10 text-accent hover:bg-accent/20 px-2 py-1 rounded shrink-0 transition-colors"
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
