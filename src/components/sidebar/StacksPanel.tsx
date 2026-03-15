// src/components/sidebar/StacksPanel.tsx
import { useState, useCallback } from 'react';
import { STACK_CATALOG } from '../../data/stack-catalog';
import { StackCard } from './StackCard';
import { NetworkPanel } from './NetworkPanel';
import { useStore } from '../../store';

export function StacksPanel() {
  const [search, setSearch] = useState('');
  const addStack = useStore(s => s.addStack);

  const filtered = STACK_CATALOG.filter(stack => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      stack.name.toLowerCase().includes(q) ||
      stack.description.toLowerCase().includes(q) ||
      stack.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  const handleAddStack = useCallback((stackKey: string) => {
    addStack(stackKey, { x: 200, y: 200 });
  }, [addStack]);

  const handleDragStart = useCallback((e: React.DragEvent, stackKey: string) => {
    e.dataTransfer.setData('application/vdc-stack', stackKey);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <input
          type="text"
          placeholder="Search stacks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-3 space-y-2">
        {filtered.map(stack => (
          <StackCard
            key={stack.key}
            stack={stack}
            onAdd={() => handleAddStack(stack.key)}
            onDragStart={e => handleDragStart(e, stack.key)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4">No stacks found</p>
        )}
      </div>
      <div className="border-t border-gray-700 mt-2">
        <NetworkPanel />
      </div>
    </div>
  );
}
