import type { StackDefinition } from '../data/types';

export interface LayoutConfig {
  startX: number;
  startY: number;
  nodeWidth: number;
  nodeHeight: number;
  gapX: number;
  gapY: number;
}

export interface LayoutResult {
  nodes: Array<{
    serviceKey: string;
    position: { x: number; y: number };
  }>;
}

export function calculateStackLayout(
  stack: StackDefinition,
  config: LayoutConfig
): LayoutResult {
  const nodes = stack.services.map(svc => ({
    serviceKey: svc.serviceKey,
    position: {
      x: config.startX + svc.gridPosition.col * config.gapX,
      y: config.startY + svc.gridPosition.row * config.gapY,
    },
  }));
  return { nodes };
}
