import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ServiceNodeData } from '../../store/types';
import { useStore } from '../../store';

type ServiceNodeProps = NodeProps & { data: ServiceNodeData };

const PRESET_ICONS: Record<string, string> = {
  nginx: '🌐',
  postgres: '🐘',
  redis: '⚡',
  node: '📦',
  custom: '🔧',
};

function getPresetIcon(preset: string): string {
  return PRESET_ICONS[preset] ?? '🔧';
}

export function GlassServiceNode({ id, data, selected }: ServiceNodeProps) {
  const validationIssues = useStore((s) => s.validationIssues);
  const removeNode = useStore((s) => s.removeNode);
  const nodeIssues = validationIssues.filter((i) => i.nodeId === id);
  const hasError = nodeIssues.some((i) => i.severity === 'error');
  const hasWarning = nodeIssues.some((i) => i.severity === 'warning');

  const [isHovered, setIsHovered] = useState(false);

  const borderColor = selected
    ? 'rgba(212,168,67,0.6)'
    : hasError
      ? 'rgba(239,68,68,0.6)'
      : hasWarning
        ? 'rgba(245,158,11,0.5)'
        : isHovered
          ? 'rgba(212,168,67,0.3)'
          : 'rgba(45,42,37,0.8)';

  const boxShadow = selected
    ? '0 0 15px rgba(212,168,67,0.15), 0 0 0 1px rgba(212,168,67,0.4)'
    : isHovered
      ? '0 4px 20px rgba(0,0,0,0.4)'
      : '0 2px 12px rgba(0,0,0,0.3)';

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        backgroundColor: 'rgba(38, 34, 32, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor,
        boxShadow,
        minWidth: '160px',
        borderRadius: '10px',
        padding: '12px 14px',
        position: 'relative',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'var(--accent)', borderColor: 'var(--bg-elevated)' }}
      />

      {/* Validation dots */}
      {hasError && (
        <span
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'rgb(239,68,68)',
            display: 'block',
          }}
        />
      )}
      {!hasError && hasWarning && (
        <span
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'rgb(245,158,11)',
            display: 'block',
          }}
        />
      )}

      {/* Delete button (hover only) */}
      <AnimatePresence>
        {(isHovered || selected) && (
          <motion.button
            key="delete-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              e.stopPropagation();
              removeNode(id);
            }}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'rgb(239,68,68)',
              color: 'white',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              zIndex: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          >
            ✕
          </motion.button>
        )}
      </AnimatePresence>

      {/* Service name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '16px', lineHeight: 1 }}>{getPresetIcon(data.preset)}</span>
        <span
          style={{
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}
        >
          {data.serviceName}
        </span>
      </div>

      {/* Image text */}
      <div
        style={{
          color: 'var(--text-secondary)',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: '8px',
        }}
      >
        {data.image || 'no image'}
      </div>

      {/* Gradient divider */}
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent, rgba(212,168,67,0.5), transparent)',
          marginBottom: '8px',
        }}
      />

      {/* Port badges */}
      {data.ports.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {data.ports.map((p, i) => (
            <span
              key={i}
              style={{
                backgroundColor: 'rgba(212,168,67,0.12)',
                color: 'var(--text-muted)',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(212,168,67,0.2)',
                fontFamily: 'monospace',
              }}
            >
              {p.host}:{p.container}
            </span>
          ))}
        </div>
      )}

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'var(--accent)', borderColor: 'var(--bg-elevated)' }}
      />
    </motion.div>
  );
}
