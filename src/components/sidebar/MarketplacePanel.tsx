// src/components/sidebar/MarketplacePanel.tsx
import { useState, useCallback, useMemo } from 'react';
import { SERVICE_REGISTRY } from '../../data/service-registry';
import { CategoryChips } from './CategoryChips';
import { ServiceCard } from './ServiceCard';
import { useDockerHubSearch } from '../../hooks/useDockerHubSearch';
import { useStore } from '../../store';
import type { ServiceCategory, DockerHubSearchResult } from '../../data/types';

export function MarketplacePanel() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const addServiceFromRegistry = useStore(s => s.addServiceFromRegistry);
  const addServiceFromHub = useStore(s => s.addServiceFromHub);
  const { results: hubResults, isLoading, error: hubError } = useDockerHubSearch(search);

  const localResults = useMemo(() => {
    let filtered = SERVICE_REGISTRY;
    if (category) {
      filtered = filtered.filter(s => s.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.key.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    }
    return filtered.slice(0, 20);
  }, [search, category]);

  // Merge: local first, then hub results not in local
  const displayResults = useMemo(() => {
    const localSlugs = new Set<string>();
    for (const s of localResults) {
      localSlugs.add(s.key);
      if (s.dockerHubSlug) {
        localSlugs.add(s.dockerHubSlug.replace(/^library\//, ''));
      }
    }
    const localAsHub: DockerHubSearchResult[] = localResults.map(s => ({
      name: s.image,
      slug: s.dockerHubSlug || s.key,
      description: s.description,
      starCount: 0,
      pullCount: 0,
      isOfficial: s.dockerHubSlug?.startsWith('library/') ?? false,
      registryMatch: s,
    }));
    const remoteOnly = hubResults.filter(r => !localSlugs.has(r.slug));
    return [...localAsHub, ...remoteOnly];
  }, [localResults, hubResults]);

  const handleAdd = useCallback((result: DockerHubSearchResult) => {
    if (result.registryMatch) {
      addServiceFromRegistry(result.registryMatch.key, { x: 300, y: 300 });
    } else {
      addServiceFromHub(result, { x: 300, y: 300 });
    }
  }, [addServiceFromRegistry, addServiceFromHub]);

  const handleDragStart = useCallback((e: React.DragEvent, result: DockerHubSearchResult) => {
    if (result.registryMatch) {
      e.dataTransfer.setData('application/vdc-service', result.registryMatch.key);
    } else {
      e.dataTransfer.setData('application/vdc-hub-image', JSON.stringify({
        name: result.name, slug: result.slug, description: result.description,
        starCount: result.starCount, pullCount: result.pullCount, isOfficial: result.isOfficial,
      }));
    }
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <input
          type="text"
          placeholder="Search Docker Hub..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <CategoryChips selected={category} onChange={setCategory} />
      <div className="flex-1 overflow-y-auto px-3 space-y-2">
        {hubError && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg px-3 py-2 text-xs text-blue-300">
            Docker Hub search unavailable — showing local results only
          </div>
        )}
        {isLoading && (
          <p className="text-xs text-gray-500 text-center py-2">Searching...</p>
        )}
        {displayResults.map(result => (
          <ServiceCard
            key={result.slug}
            result={result}
            onAdd={() => handleAdd(result)}
            onDragStart={e => handleDragStart(e, result)}
          />
        ))}
        {!isLoading && displayResults.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4">No services found</p>
        )}
      </div>
    </div>
  );
}
