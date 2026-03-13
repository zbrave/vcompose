import { describe, it, expect } from 'vitest';
import { getRecommendations } from '../recommendation-engine';
import type { ServiceNodeData } from '../../store/types';
import type { RecommendationGraph } from '../recommendation-types';

const testGraph: RecommendationGraph = {
  postgres: {
    recommends: ['pgadmin', 'redis', 'node'],
    reasons: {
      pgadmin: 'DB admin UI',
      redis: 'Cache layer',
      node: 'App server',
    },
  },
  node: {
    recommends: ['postgres', 'redis'],
    reasons: {
      postgres: 'Database',
      redis: 'Cache',
    },
  },
  custom: {
    recommends: [],
    reasons: {},
  },
};

function makeNodeData(overrides: Partial<ServiceNodeData>): ServiceNodeData {
  return {
    serviceName: 'test',
    image: 'test:latest',
    preset: 'custom',
    ports: [],
    volumes: [],
    environment: {},
    networks: [],
    ...overrides,
  };
}

describe('getRecommendations', () => {
  it('returns recommendations for a known preset', () => {
    const data = makeNodeData({ preset: 'postgres', image: 'postgres:16-alpine' });
    const result = getRecommendations(data, [], testGraph);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      key: 'pgadmin',
      image: 'dpage/pgadmin4',
      reason: 'DB admin UI',
      alreadyExists: false,
    });
  });

  it('matches by image base name when preset is custom', () => {
    const data = makeNodeData({ preset: 'custom', image: 'postgres:16-alpine' });
    const result = getRecommendations(data, [], testGraph);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].key).toBe('pgadmin');
  });

  it('marks existing services as alreadyExists', () => {
    const data = makeNodeData({ preset: 'postgres', image: 'postgres:16-alpine' });
    const result = getRecommendations(data, [{ preset: 'redis', image: 'redis:7-alpine' }], testGraph);
    const redis = result.find((r) => r.key === 'redis');
    expect(redis?.alreadyExists).toBe(true);
    const pgadmin = result.find((r) => r.key === 'pgadmin');
    expect(pgadmin?.alreadyExists).toBe(false);
  });

  it('returns empty array for unknown service', () => {
    const data = makeNodeData({ preset: 'custom', image: 'unknown:latest' });
    const result = getRecommendations(data, [], testGraph);
    expect(result).toEqual([]);
  });

  it('returns empty array for custom preset with no graph entry', () => {
    const data = makeNodeData({ preset: 'custom', image: '' });
    const result = getRecommendations(data, [], testGraph);
    expect(result).toEqual([]);
  });

  it('limits results to max 5', () => {
    const bigGraph: RecommendationGraph = {
      postgres: {
        recommends: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        reasons: { a: 'r', b: 'r', c: 'r', d: 'r', e: 'r', f: 'r', g: 'r' },
      },
    };
    const data = makeNodeData({ preset: 'postgres' });
    const result = getRecommendations(data, [], bigGraph);
    expect(result).toHaveLength(5);
  });

  it('uses PRESET_DEFAULTS image for known preset keys', () => {
    const data = makeNodeData({ preset: 'postgres', image: 'postgres:16-alpine' });
    const result = getRecommendations(data, [], testGraph);
    const nodeRec = result.find((r) => r.key === 'node');
    expect(nodeRec?.image).toBe('node:20-alpine');
  });
});
