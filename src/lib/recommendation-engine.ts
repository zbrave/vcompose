import type { ServiceNodeData, PresetImageKey } from '../store/types';
import { PRESET_DEFAULTS } from '../store/types';
import type { Recommendation, RecommendationGraph } from './recommendation-types';
import { RECOMMENDATION_DEFAULTS } from '../data/recommendation-defaults';

const PRESET_KEYS: Set<string> = new Set(['nginx', 'postgres', 'redis', 'node', 'custom']);
const MAX_RECOMMENDATIONS = 5;

function resolveGraphKey(data: ServiceNodeData, graph: RecommendationGraph): string | null {
  // Priority 1: preset key match
  if (data.preset !== 'custom' && graph[data.preset]) {
    return data.preset;
  }
  // Priority 2: image base name match
  if (data.image) {
    const baseName = data.image.split(':')[0].split('/').pop() ?? '';
    if (graph[baseName]) {
      return baseName;
    }
  }
  return null;
}

function resolveImage(key: string): string {
  if (PRESET_KEYS.has(key) && PRESET_DEFAULTS[key as PresetImageKey]?.image) {
    return PRESET_DEFAULTS[key as PresetImageKey].image ?? '';
  }
  return RECOMMENDATION_DEFAULTS[key]?.image ?? key;
}

/**
 * Extracts the base image name (without tag/registry) for matching.
 * e.g., "postgres:16-alpine" -> "postgres", "dpage/pgadmin4" -> "pgadmin4"
 */
function imageBaseName(image: string): string {
  return (image.split(':')[0].split('/').pop() ?? '').toLowerCase();
}

export function getRecommendations(
  selectedNodeData: ServiceNodeData,
  existingNodes: Array<{ preset: string; image: string }>,
  graph: RecommendationGraph,
): Recommendation[] {
  const graphKey = resolveGraphKey(selectedNodeData, graph);
  if (!graphKey) return [];

  const entry = graph[graphKey];
  if (!entry || entry.recommends.length === 0) return [];

  // Build a set of existing keys: preset names + image base names
  const existingKeys = new Set<string>();
  for (const n of existingNodes) {
    if (n.preset !== 'custom') existingKeys.add(n.preset.toLowerCase());
    if (n.image) existingKeys.add(imageBaseName(n.image));
  }

  return entry.recommends.slice(0, MAX_RECOMMENDATIONS).map((key) => ({
    key,
    image: resolveImage(key),
    reason: entry.reasons[key] ?? '',
    alreadyExists: existingKeys.has(key.toLowerCase()),
  }));
}
