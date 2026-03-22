import { Container } from 'lucide-react';
import { motion } from 'framer-motion';

export function EmptyCanvasOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <motion.div
        className="max-w-md text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-4">
          <Container className="mx-auto h-10 w-10 text-text-muted" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-text-primary">
          Start building your compose file
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-text-secondary">
          Drag a service from the sidebar and drop it on the canvas. Connect
          services to define dependencies — YAML is generated in real time.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-text-muted">
          <span className="rounded-full border border-subtle bg-elevated px-3 py-1">
            Drag &amp; drop services
          </span>
          <span className="rounded-full border border-subtle bg-elevated px-3 py-1">
            Connect for depends_on
          </span>
          <span className="rounded-full border border-subtle bg-elevated px-3 py-1">
            Auto network config
          </span>
          <span className="rounded-full border border-subtle bg-elevated px-3 py-1">
            Copy or download YAML
          </span>
        </div>
      </motion.div>
    </div>
  );
}
