// src/components/sidebar/StackCard.tsx
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { StackDefinition } from '../../data/types';

interface StackCardProps {
  stack: StackDefinition;
  onAdd: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export function StackCard({ stack, onAdd, onDragStart }: StackCardProps) {
  return (
    <motion.div
      draggable
      onDragStartCapture={onDragStart}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="p-3 bg-elevated/50 border border-subtle rounded-lg hover:border-accent/30 cursor-grab transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{stack.icon}</span>
        <span className="font-medium text-sm text-text-primary flex-1">{stack.name}</span>
        <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">
          {stack.services.length} services
        </span>
      </div>
      <p className="text-xs text-text-secondary mb-2">{stack.description}</p>
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="w-full text-xs bg-accent text-base hover:bg-accent-dim py-1.5 rounded-md font-semibold inline-flex items-center justify-center gap-1 transition-colors"
      >
        <Plus size={14} strokeWidth={2.5} />
        Add Stack
      </button>
    </motion.div>
  );
}
