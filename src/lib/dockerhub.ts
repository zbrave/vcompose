import type { ServiceDefinition, DockerHubSearchResult } from '../data/types';
import { SERVICE_REGISTRY } from '../data/service-registry';

/**
 * Filter local service registry by query string (case-insensitive).
 * Matches on key, name, or description.
 */
export function filterRegistry(
  query: string,
  registry: ServiceDefinition[] = SERVICE_REGISTRY,
): ServiceDefinition[] {
  const q = query.toLowerCase();
  return registry.filter(
    (s) =>
      s.key.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q),
  );
}

/**
 * Merge local and remote results, deduplicating by slug.
 * Local results take priority (they have registryMatch set).
 */
export function mergeAndDedupe(
  local: DockerHubSearchResult[],
  remote: DockerHubSearchResult[],
): DockerHubSearchResult[] {
  const seen = new Set(local.map((r) => r.slug));
  const remoteOnly = remote.filter((r) => !seen.has(r.slug));
  return [...local, ...remoteOnly];
}

/**
 * Search Docker Hub via CORS proxy. Returns empty array on any error.
 * Uses AbortSignal.timeout(5000) for 5s hard timeout.
 */
export async function searchDockerHub(
  query: string,
  signal?: AbortSignal,
): Promise<DockerHubSearchResult[]> {
  const proxyUrl = import.meta.env.VITE_DOCKERHUB_PROXY_URL || '';
  if (!proxyUrl) return [];

  try {
    const url = `${proxyUrl}/search?q=${encodeURIComponent(query)}&page_size=10`;
    const timeoutSignal = AbortSignal.timeout(5000);
    const combinedSignal = signal
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;

    const res = await fetch(url, { signal: combinedSignal });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.results ?? []).map(
      (r: { repo_name?: string; repo_owner?: string; name?: string; short_description?: string; star_count?: number; pull_count?: number; is_official?: boolean }) => ({
        name: r.is_official ? (r.repo_name ?? r.name ?? '').replace(/^library\//, '') : (r.repo_name ?? r.name ?? ''),
        slug: (r.repo_name ?? r.name ?? '').replace(/^library\//, ''),
        description: r.short_description ?? '',
        starCount: r.star_count ?? 0,
        pullCount: r.pull_count ?? 0,
        isOfficial: r.is_official ?? false,
        registryMatch: SERVICE_REGISTRY.find(
          (s) => s.dockerHubSlug === (r.repo_name ?? r.name) || s.key === (r.repo_name ?? r.name ?? '').replace(/^library\//, ''),
        ),
      }),
    );
  } catch {
    return [];
  }
}
