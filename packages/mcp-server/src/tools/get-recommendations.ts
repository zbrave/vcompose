import { getRecommendations } from '../../../../src/lib/recommendation-engine';
import graph from '../../../../src/data/recommendation-graph.json';
import type { RecommendationGraph } from '../../../../src/lib/recommendation-types';
import type { ServiceNodeData } from '../../../../src/store/types';

const recGraph = graph as RecommendationGraph;

export interface GetRecommendationsInput {
  service: string;
  existing?: string[];
}

export interface GetRecommendationsOutput {
  recommendations: Array<{ name: string; image: string; reason: string }>;
}

export async function handleGetRecommendations(
  input: GetRecommendationsInput,
): Promise<GetRecommendationsOutput> {
  const { service, existing = [] } = input;

  const nodeData: ServiceNodeData = {
    serviceName: service,
    image: service,
    preset: 'custom',
    ports: [],
    volumes: [],
    environment: {},
    networks: [],
  };

  const presetKeys = ['nginx', 'postgres', 'redis', 'node'];
  if (presetKeys.includes(service)) {
    nodeData.preset = service as ServiceNodeData['preset'];
  }

  const existingNodes = existing.map((name) => ({
    preset: presetKeys.includes(name) ? name : 'custom',
    image: name,
    serviceName: name,
  }));

  const recs = getRecommendations(nodeData, existingNodes, recGraph);

  return {
    recommendations: recs
      .filter((r) => !r.alreadyExists)
      .map((r) => ({
        name: r.key,
        image: r.image,
        reason: r.reason,
      })),
  };
}
