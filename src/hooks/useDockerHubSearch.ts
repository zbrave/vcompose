import { useEffect, useRef, useState } from 'react';
import { searchImages, type DockerHubResult } from '../lib/dockerhub';

export function useDockerHubSearch(query: string) {
  const [results, setResults] = useState<DockerHubResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      const res = await searchImages(query, controller.signal);
      if (!controller.signal.aborted) {
        setResults(res);
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  return { results, isLoading };
}
