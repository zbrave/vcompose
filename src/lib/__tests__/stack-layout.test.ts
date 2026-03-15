import { describe, it, expect } from 'vitest';
import { calculateStackLayout } from '../stack-layout';
import type { StackDefinition } from '../../data/types';

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
  nodeWidth: 180,
  nodeHeight: 80,
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
});
