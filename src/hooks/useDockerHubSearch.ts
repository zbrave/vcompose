import { useEffect, useRef, useState } from 'react';
import { searchDockerHub } from '../lib/dockerhub';
import type { DockerHubSearchResult } from '../data/types';

export function useDockerHubSearch(query: string) {
  const [results, setResults] = useState<DockerHubSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setError(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(false);
      try {
        const res = await searchDockerHub(query, controller.signal);
        if (!controller.signal.aborted) {
          setResults(res);
          setIsLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setError(true);
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  return { results, isLoading, error };
}
