import { describe, it, expect } from 'vitest';
import { filterRegistry, mergeAndDedupe } from '../dockerhub';
import type { ServiceDefinition, DockerHubSearchResult } from '../../data/types';

const mockRegistry: ServiceDefinition[] = [
  {
    key: 'redis', name: 'Redis', description: 'In-memory cache',
    image: 'redis:7-alpine', preset: 'redis', category: 'cache',
    ports: [{ host: '6379', container: '6379' }],
    dockerHubSlug: 'library/redis',
  },
  {
    key: 'postgres', name: 'PostgreSQL', description: 'Relational database',
    image: 'postgres:16-alpine', preset: 'postgres', category: 'database',
    ports: [{ host: '5432', container: '5432' }],
    dockerHubSlug: 'library/postgres',
  },
];

describe('filterRegistry', () => {
  it('matches by name (case-insensitive)', () => {
    const results = filterRegistry('red', mockRegistry);
    expect(results.length).toBe(1);
    expect(results[0].key).toBe('redis');
  });

  it('matches by description', () => {
    const results = filterRegistry('cache', mockRegistry);
    expect(results.length).toBe(1);
    expect(results[0].key).toBe('redis');
  });

  it('returns empty for no match', () => {
    const results = filterRegistry('mongodb', mockRegistry);
    expect(results.length).toBe(0);
  });

  it('matches by key', () => {
    const results = filterRegistry('postgres', mockRegistry);
    expect(results.length).toBe(1);
  });
});

describe('mergeAndDedupe', () => {
  it('local results come first', () => {
    const local: DockerHubSearchResult[] = [{
      name: 'redis', slug: 'redis', description: 'cache',
      starCount: 10000, pullCount: 1000000, isOfficial: true,
      registryMatch: mockRegistry[0],
    }];
    const remote: DockerHubSearchResult[] = [{
      name: 'redis', slug: 'redis', description: 'cache',
      starCount: 10000, pullCount: 1000000, isOfficial: true,
    }];
    const merged = mergeAndDedupe(local, remote);
    expect(merged.length).toBe(1);
    expect(merged[0].registryMatch).toBeDefined();
  });

  it('remote results are added if not in local', () => {
    const local: DockerHubSearchResult[] = [];
    const remote: DockerHubSearchResult[] = [{
      name: 'unknown-image', slug: 'unknown-image', description: 'test',
      starCount: 5, pullCount: 100, isOfficial: false,
    }];
    const merged = mergeAndDedupe(local, remote);
    expect(merged.length).toBe(1);
    expect(merged[0].registryMatch).toBeUndefined();
  });

  it('deduplicates by slug', () => {
    const local: DockerHubSearchResult[] = [{
      name: 'redis', slug: 'redis', description: 'cache',
      starCount: 10000, pullCount: 1000000, isOfficial: true,
      registryMatch: mockRegistry[0],
    }];
    const remote: DockerHubSearchResult[] = [{
      name: 'redis', slug: 'redis', description: 'Redis in-memory store',
      starCount: 12000, pullCount: 2000000, isOfficial: true,
    }];
    const merged = mergeAndDedupe(local, remote);
    expect(merged.length).toBe(1);
  });
});
