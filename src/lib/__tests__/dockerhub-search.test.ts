import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { filterRegistry, mergeAndDedupe, searchDockerHub } from '../dockerhub';
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

describe('searchDockerHub', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    vi.stubEnv('VITE_DOCKERHUB_PROXY_URL', 'https://test-proxy.example.com');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('returns mapped results on success', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            repo_name: 'library/redis',
            short_description: 'Redis cache',
            star_count: 1000,
            pull_count: 5000000,
            is_official: true,
          },
        ],
      }),
    });
    const results = await searchDockerHub('redis');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('redis');
    expect(results[0].isOfficial).toBe(true);
    expect(results[0].starCount).toBe(1000);
  });

  it('returns empty array on fetch failure', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
    const results = await searchDockerHub('redis');
    expect(results).toEqual([]);
  });

  it('returns empty array on non-ok response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    const results = await searchDockerHub('redis');
    expect(results).toEqual([]);
  });

  it('attaches registryMatch for known images', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            repo_name: 'library/redis',
            short_description: 'Redis',
            star_count: 100,
            pull_count: 100,
            is_official: true,
          },
        ],
      }),
    });
    const results = await searchDockerHub('redis');
    expect(results[0].registryMatch).toBeDefined();
    expect(results[0].registryMatch?.key).toBe('redis');
  });
});
