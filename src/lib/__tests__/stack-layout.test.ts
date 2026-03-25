import { describe, it, expect } from 'vitest';
import { calculateStackLayout, findNonOverlappingPosition } from '../stack-layout';
import type { StackDefinition } from '../../data/types';
import type { ExistingNode } from '../stack-layout';

const mockStack: StackDefinition = {
  key: 'test',
  name: 'Test',
  icon: '🧪',
  description: 'Test stack',
  tags: ['test'],
  services: [
    { serviceKey: 'a', gridPosition: { col: 0, row: 0 } },
    { serviceKey: 'b', gridPosition: { col: 1, row: 0 } },
    { serviceKey: 'c', gridPosition: { col: 0, row: 1 } },
  ],
  edges: [],
};

const defaultConfig = {
  startX: 100,
  startY: 100,
  gapX: 220,
  gapY: 150,
};

describe('calculateStackLayout', () => {
  it('positions first node at startX, startY', () => {
    const result = calculateStackLayout(mockStack, defaultConfig);
    const nodeA = result.nodes.find(n => n.serviceKey === 'a');
    expect(nodeA?.position).toEqual({ x: 100, y: 100 });
  });

  it('offsets columns by gapX', () => {
    const result = calculateStackLayout(mockStack, defaultConfig);
    const nodeB = result.nodes.find(n => n.serviceKey === 'b');
    expect(nodeB?.position).toEqual({ x: 320, y: 100 });
  });

  it('offsets rows by gapY', () => {
    const result = calculateStackLayout(mockStack, defaultConfig);
    const nodeC = result.nodes.find(n => n.serviceKey === 'c');
    expect(nodeC?.position).toEqual({ x: 100, y: 250 });
  });

  it('returns all services', () => {
    const result = calculateStackLayout(mockStack, defaultConfig);
    expect(result.nodes.length).toBe(3);
  });

  it('handles empty services', () => {
    const empty = { ...mockStack, services: [] };
    const result = calculateStackLayout(empty, defaultConfig);
    expect(result.nodes).toEqual([]);
  });

  // Collision detection tests
  it('shifts stack when drop position overlaps existing node', () => {
    const existing: ExistingNode[] = [{ x: 100, y: 100, width: 180, height: 80 }];
    const result = calculateStackLayout(mockStack, defaultConfig, existing);
    const nodeA = result.nodes.find(n => n.serviceKey === 'a')!;
    // Should have shifted away from (100, 100)
    expect(nodeA.position.x !== 100 || nodeA.position.y !== 100).toBe(true);
  });

  it('does not shift when no overlap with existing nodes', () => {
    const existing: ExistingNode[] = [{ x: 800, y: 800, width: 180, height: 80 }];
    const result = calculateStackLayout(mockStack, defaultConfig, existing);
    const nodeA = result.nodes.find(n => n.serviceKey === 'a')!;
    expect(nodeA.position).toEqual({ x: 100, y: 100 });
  });

  it('preserves relative layout after shifting', () => {
    const existing: ExistingNode[] = [{ x: 100, y: 100, width: 180, height: 80 }];
    const result = calculateStackLayout(mockStack, defaultConfig, existing);
    const nodeA = result.nodes.find(n => n.serviceKey === 'a')!;
    const nodeB = result.nodes.find(n => n.serviceKey === 'b')!;
    const nodeC = result.nodes.find(n => n.serviceKey === 'c')!;
    // B should be gapX right of A
    expect(nodeB.position.x - nodeA.position.x).toBe(defaultConfig.gapX);
    expect(nodeB.position.y).toBe(nodeA.position.y);
    // C should be gapY below A
    expect(nodeC.position.x).toBe(nodeA.position.x);
    expect(nodeC.position.y - nodeA.position.y).toBe(defaultConfig.gapY);
  });

  it('works fine with empty existing nodes array', () => {
    const result = calculateStackLayout(mockStack, defaultConfig, []);
    const nodeA = result.nodes.find(n => n.serviceKey === 'a')!;
    expect(nodeA.position).toEqual({ x: 100, y: 100 });
  });
});

describe('findNonOverlappingPosition', () => {
  it('returns candidate when no existing nodes', () => {
    const pos = findNonOverlappingPosition({ x: 100, y: 100 }, []);
    expect(pos).toEqual({ x: 100, y: 100 });
  });

  it('returns candidate when no overlap', () => {
    const existing: ExistingNode[] = [{ x: 800, y: 800, width: 180, height: 80 }];
    const pos = findNonOverlappingPosition({ x: 100, y: 100 }, existing);
    expect(pos).toEqual({ x: 100, y: 100 });
  });

  it('shifts position when overlapping an existing node', () => {
    const existing: ExistingNode[] = [{ x: 100, y: 100, width: 180, height: 80 }];
    const pos = findNonOverlappingPosition({ x: 100, y: 100 }, existing);
    expect(pos.x !== 100 || pos.y !== 100).toBe(true);
  });

  it('shifts past multiple overlapping nodes', () => {
    const existing: ExistingNode[] = [
      { x: 100, y: 100, width: 180, height: 80 },
      { x: 360, y: 100, width: 180, height: 80 },
    ];
    const pos = findNonOverlappingPosition({ x: 100, y: 100 }, existing);
    // Should not overlap either node
    expect(pos.x).toBeGreaterThan(360 + 180 - 1);
  });
});
