import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose } from 'lucide-react';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function SidePanel({ isOpen, onClose, children }: SidePanelProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.aside
          initial={{ width: 0 }}
          animate={{ width: 280 }}
          exit={{ width: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative h-full overflow-hidden border-r border-subtle bg-surface"
        >
          <div className="flex h-full w-[280px] flex-col">
            <button
              onClick={onClose}
              className="absolute right-2 top-2 z-10 rounded p-1 text-text-muted hover:text-text-primary transition-colors"
              title="Close panel"
            >
              <PanelLeftClose size={16} />
            </button>
            {children}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
