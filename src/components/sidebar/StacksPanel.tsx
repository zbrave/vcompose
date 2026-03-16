// src/components/sidebar/StacksPanel.tsx
import { useState, useCallback } from 'react';
import { STACK_CATALOG } from '../../data/stack-catalog';
import { StackCard } from './StackCard';
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
    <div className="flex flex-col h-full bg-surface">
      <div className="p-3">
        <input
          type="text"
          placeholder="Search stacks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-elevated border border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
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
          <p className="text-xs text-text-muted text-center py-4">No stacks found</p>
        )}
      </div>
    </div>
  );
}
