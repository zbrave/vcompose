import { describe, it, expect } from 'vitest';
import { calculateRecommendedPosition } from '../position-calculator';

describe('calculateRecommendedPosition', () => {
  it('returns base offset position when no existing nodes', () => {
    const pos = calculateRecommendedPosition({ x: 100, y: 200 }, [], 0);
    expect(pos).toEqual({ x: 350, y: 200 });
  });

  it('offsets vertically for subsequent recommendations', () => {
    const pos = calculateRecommendedPosition({ x: 100, y: 200 }, [], 2);
    expect(pos).toEqual({ x: 350, y: 500 });
  });

  it('shifts down when overlapping an existing node', () => {
    const existing = [{ x: 350, y: 200 }];
    const pos = calculateRecommendedPosition({ x: 100, y: 200 }, existing, 0);
    expect(pos.x).toBe(350);
    expect(pos.y).toBeGreaterThan(200);
  });

  it('handles multiple overlaps by shifting repeatedly', () => {
    const existing = [
      { x: 350, y: 200 },
      { x: 350, y: 350 },
    ];
    const pos = calculateRecommendedPosition({ x: 100, y: 200 }, existing, 0);
    expect(pos.x).toBe(350);
    expect(pos.y).toBeGreaterThanOrEqual(500);
  });

  it('stops after max iterations and returns best position', () => {
    const existing = Array.from({ length: 15 }, (_, i) => ({ x: 350, y: i * 150 }));
    const pos = calculateRecommendedPosition({ x: 100, y: 0 }, existing, 0);
    expect(pos.x).toBe(350);
    expect(typeof pos.y).toBe('number');
  });
});
