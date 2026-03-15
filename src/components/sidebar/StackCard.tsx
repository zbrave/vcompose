// src/components/sidebar/StackCard.tsx
import type { StackDefinition } from '../../data/types';

interface StackCardProps {
  stack: StackDefinition;
  onAdd: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export function StackCard({ stack, onAdd, onDragStart }: StackCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-purple-500 cursor-grab transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{stack.icon}</span>
        <span className="font-medium text-sm text-gray-200 flex-1">{stack.name}</span>
        <span className="text-[10px] bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded">
          {stack.services.length} services
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{stack.description}</p>
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="w-full text-xs bg-purple-600 hover:bg-purple-500 text-white py-1.5 rounded"
      >
        + Add Stack
      </button>
    </div>
  );
}
