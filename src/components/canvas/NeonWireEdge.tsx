import { getBezierPath, type EdgeProps } from '@xyflow/react';
import { useState } from 'react';

export function NeonWireEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const filterId = `neon-glow-${id}`;

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <defs>
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Invisible wider path for hover target */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
      />

      {/* Visible glowing path */}
      <path
        d={edgePath}
        fill="none"
        stroke="#d4a843"
        strokeWidth={hovered ? 2.5 : 1.5}
        filter={`url(#${filterId})`}
        style={{ transition: 'stroke-width 0.2s' }}
        markerEnd={markerEnd}
      />

      {/* Flow particle */}
      <circle r="3" fill="#d4a843" opacity={0.8}>
        <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
      </circle>

      {/* Hover label */}
      {hovered && (
        <foreignObject
          x={labelX - 40}
          y={labelY - 12}
          width={80}
          height={24}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              fontSize: '10px',
              color: '#d4a843',
              textAlign: 'center',
              backgroundColor: 'rgba(38, 34, 32, 0.9)',
              borderRadius: '4px',
              padding: '2px 6px',
              border: '1px solid rgba(212, 168, 67, 0.3)',
            }}
          >
            depends_on
          </div>
        </foreignObject>
      )}
    </g>
  );
}
