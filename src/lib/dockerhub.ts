export interface DockerHubResult {
  name: string;
  description: string;
  starCount: number;
  isOfficial: boolean;
}

interface DockerHubApiResponse {
  results: {
    repo_name: string;
    short_description: string;
    star_count: number;
    is_official: boolean;
  }[];
}

export async function searchImages(
  query: string,
  signal?: AbortSignal,
): Promise<DockerHubResult[]> {
  try {
    const url = `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}&page_size=10`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data: DockerHubApiResponse = await res.json();
    return (data.results ?? []).map((r) => ({
      name: r.is_official ? r.repo_name.replace(/^library\//, '') : r.repo_name,
      description: r.short_description ?? '',
      starCount: r.star_count ?? 0,
      isOfficial: r.is_official ?? false,
    }));
  } catch {
    return [];
  }
}
