import type { StackDefinition } from '../data/types';

export interface LayoutConfig {
  startX: number;
  startY: number;
  gapX: number;
  gapY: number;
}

export interface LayoutResult {
  nodes: Array<{
    serviceKey: string;
    position: { x: number; y: number };
  }>;
}

export interface ExistingNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Default node dimensions (matches GlassServiceNode approximate size)
const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const PADDING = 40;

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function stackOverlapsExisting(
  stackNodes: Array<{ x: number; y: number }>,
  existing: ExistingNode[],
): boolean {
  for (const sn of stackNodes) {
    for (const en of existing) {
      if (rectsOverlap(
        sn.x - PADDING, sn.y - PADDING, NODE_WIDTH + PADDING * 2, NODE_HEIGHT + PADDING * 2,
        en.x, en.y, en.width, en.height,
      )) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Find a non-overlapping position for a single node.
 * Shifts right, then wraps down — same strategy as stack layout.
 */
export function findNonOverlappingPosition(
  candidate: { x: number; y: number },
  existingNodes: ExistingNode[],
): { x: number; y: number } {
  if (existingNodes.length === 0) return candidate;

  let { x, y } = candidate;
  const startX = x;
  const shiftX = NODE_WIDTH + PADDING * 2;
  const shiftY = NODE_HEIGHT + PADDING * 2;
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const overlaps = existingNodes.some((en) =>
      rectsOverlap(
        x - PADDING, y - PADDING, NODE_WIDTH + PADDING * 2, NODE_HEIGHT + PADDING * 2,
        en.x, en.y, en.width, en.height,
      ),
    );
    if (!overlaps) return { x, y };
    x += shiftX;
    if (attempt > 0 && attempt % 4 === 0) {
      x = startX;
      y += shiftY;
    }
  }

  return { x, y };
}

export function calculateStackLayout(
  stack: StackDefinition,
  config: LayoutConfig,
  existingNodes?: ExistingNode[],
): LayoutResult {
  const basePositions = stack.services.map(svc => ({
    serviceKey: svc.serviceKey,
    offsetX: svc.gridPosition.col * config.gapX,
    offsetY: svc.gridPosition.row * config.gapY,
  }));

  let startX = config.startX;
  let startY = config.startY;

  // If existing nodes provided, shift stack to avoid overlap
  if (existingNodes && existingNodes.length > 0) {
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const positions = basePositions.map(bp => ({
        x: startX + bp.offsetX,
        y: startY + bp.offsetY,
      }));
      if (!stackOverlapsExisting(positions, existingNodes)) break;
      // Shift right, then wrap down
      startX += config.gapX;
      if (attempt > 0 && attempt % 4 === 0) {
        startX = config.startX;
        startY += config.gapY;
      }
    }
  }

  const nodes = basePositions.map(bp => ({
    serviceKey: bp.serviceKey,
    position: {
      x: startX + bp.offsetX,
      y: startY + bp.offsetY,
    },
  }));
  return { nodes };
}
