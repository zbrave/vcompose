import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchImages, searchLocal, searchRemote } from '../dockerhub';

const mockResponse = {
  results: [
    {
      repo_name: 'library/nginx',
      short_description: 'Official build of Nginx.',
      star_count: 18000,
      is_official: true,
    },
    {
      repo_name: 'bitnami/nginx',
      short_description: 'Bitnami nginx',
      star_count: 200,
      is_official: false,
    },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('searchLocal', () => {
  it('finds images by name', () => {
    const results = searchLocal('nginx');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('nginx');
  });

  it('finds images by description', () => {
    const results = searchLocal('database');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns max 10 results', () => {
    const results = searchLocal('a');
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('returns empty for no match', () => {
    const results = searchLocal('zzzznonexistent');
    expect(results).toEqual([]);
  });
});

describe('searchRemote', () => {
  it('parses response and strips library/ prefix for official images', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const results = await searchRemote('nginx');
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      name: 'nginx',
      description: 'Official build of Nginx.',
      starCount: 18000,
      isOfficial: true,
    });
    expect(results[1].name).toBe('bitnami/nginx');
  });

  it('returns empty array on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const results = await searchRemote('nginx');
    expect(results).toEqual([]);
  });

  it('returns empty array on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const results = await searchRemote('nginx');
    expect(results).toEqual([]);
  });
});

describe('searchImages', () => {
  it('returns remote results when available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const results = await searchImages('nginx');
    expect(results).toHaveLength(2);
    expect(results[0].description).toBe('Official build of Nginx.');
  });

  it('falls back to local results on CORS/network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('CORS')));
    const results = await searchImages('nginx');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('nginx');
  });

  it('passes abort signal to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const controller = new AbortController();
    await searchImages('test', controller.signal);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('query=test'),
      { signal: controller.signal },
    );
  });
});
