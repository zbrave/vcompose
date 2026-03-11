import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchImages } from '../dockerhub';

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

describe('searchImages', () => {
  it('parses response and strips library/ prefix for official images', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const results = await searchImages('nginx');
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      name: 'nginx',
      description: 'Official build of Nginx.',
      starCount: 18000,
      isOfficial: true,
    });
    expect(results[1].name).toBe('bitnami/nginx');
    expect(results[1].isOfficial).toBe(false);
  });

  it('returns empty array on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const results = await searchImages('nginx');
    expect(results).toEqual([]);
  });

  it('returns empty array on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const results = await searchImages('nginx');
    expect(results).toEqual([]);
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
