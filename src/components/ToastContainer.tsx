import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, X } from 'lucide-react';
import { useToastStore } from '../store/toast-store';
import type { ToastVariant } from '../store/toast-store';

const variantConfig: Record<ToastVariant, { icon: typeof AlertTriangle; bg: string; border: string; text: string }> = {
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-950/90',
    border: 'border-amber-600/50',
    text: 'text-amber-200',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-950/90',
    border: 'border-red-600/50',
    text: 'text-red-200',
  },
  success: {
    icon: AlertTriangle,
    bg: 'bg-emerald-950/90',
    border: 'border-emerald-600/50',
    text: 'text-emerald-200',
  },
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = variantConfig[toast.variant];
          const Icon = config.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${config.bg} ${config.border} max-w-sm`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${config.text}`} />
              <span className={`text-sm font-medium ${config.text}`}>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-auto rounded-full p-1 hover:bg-white/10 transition-colors"
              >
                <X className="h-3 w-3 text-white/60" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
