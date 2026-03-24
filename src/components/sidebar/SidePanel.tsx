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
        <>
          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ width: 0 }}
            animate={{ width: 280 }}
            exit={{ width: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="h-full overflow-hidden border-r border-subtle bg-surface fixed left-12 top-10 bottom-0 z-40 md:relative md:left-auto md:top-auto md:bottom-auto md:z-auto"
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
        </>
      )}
    </AnimatePresence>
  );
}
