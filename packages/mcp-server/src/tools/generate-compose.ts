import { buildYaml } from '../../../../src/lib/yaml-builder';
import { validate } from '../../../../src/lib/validator';
import { PRESET_DEFAULTS } from '../../../../src/store/types';
import type { PresetImageKey, ServiceNode, DependencyEdge, NetworkConfig, ServiceNodeData } from '../../../../src/store/types';
import { RECOMMENDATION_DEFAULTS } from '../../../../src/data/recommendation-defaults';
import graph from '../../../../src/data/recommendation-graph.json';
import type { RecommendationGraph } from '../../../../src/lib/recommendation-types';

const recGraph = graph as RecommendationGraph;

function generateNodeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function resolveServiceConfig(name: string): { preset: PresetImageKey; data: Partial<ServiceNodeData> } {
  const presetKeys: PresetImageKey[] = ['nginx', 'postgres', 'redis', 'node', 'custom'];
  if (presetKeys.includes(name as PresetImageKey) && name !== 'custom') {
    return { preset: name as PresetImageKey, data: PRESET_DEFAULTS[name as PresetImageKey] };
  }
  if (RECOMMENDATION_DEFAULTS[name]) {
    return { preset: 'custom', data: RECOMMENDATION_DEFAULTS[name] };
  }
  return { preset: 'custom', data: { image: name, ports: [] } };
}

function autoDetectEdges(
  serviceNames: string[],
  nodeMap: Map<string, string>,
): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  const nameSet = new Set(serviceNames);

  for (const serviceName of serviceNames) {
    const entry = recGraph[serviceName];
    if (!entry) continue;
    for (const recommended of entry.recommends) {
      if (nameSet.has(recommended)) {
        const sourceId = nodeMap.get(recommended);
        const targetId = nodeMap.get(serviceName);
        if (sourceId && targetId) {
          edges.push({
            id: generateNodeId(),
            source: sourceId,
            target: targetId,
            type: 'dependencyEdge',
          });
        }
      }
    }
  }

  const seen = new Set<string>();
  return edges.filter((e) => {
    const key = `${e.source}-${e.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface GenerateComposeInput {
  services: string[];
  version?: string;
}

export interface GenerateComposeOutput {
  yaml: string;
  validation: Array<{ severity: string; message: string; field?: string }>;
}

export async function handleGenerateCompose(
  input: GenerateComposeInput,
): Promise<GenerateComposeOutput> {
  const { services } = input;

  if (services.length === 0) {
    return {
      yaml: '',
      validation: [{ severity: 'error', message: 'At least one service is required' }],
    };
  }

  const nodes: ServiceNode[] = [];
  const nodeMap = new Map<string, string>();

  let xPos = 0;
  for (const name of services) {
    const id = generateNodeId();
    const { preset, data } = resolveServiceConfig(name);
    nodeMap.set(name, id);

    nodes.push({
      id,
      type: 'serviceNode',
      position: { x: xPos, y: 0 },
      data: {
        serviceName: name,
        image: data.image ?? name,
        preset,
        ports: data.ports ? [...data.ports] : [],
        volumes: data.volumes ? [...data.volumes] : [],
        environment: data.environment ? { ...data.environment } : {},
        networks: [],
      },
    });
    xPos += 300;
  }

  const edges = autoDetectEdges(services, nodeMap);

  const networks: NetworkConfig[] = [];
  if (edges.length > 0) {
    networks.push({ name: 'default', driver: 'bridge' });
    for (const edge of edges) {
      for (const node of nodes) {
        if ((node.id === edge.source || node.id === edge.target) && !node.data.networks.includes('default')) {
          node.data.networks.push('default');
        }
      }
    }
  }

  const yaml = buildYaml({ nodes, edges, networks, namedVolumes: [] });
  const issues = validate({ nodes, edges });

  return {
    yaml,
    validation: issues.map((i) => ({
      severity: i.severity,
      message: i.message,
      ...(i.field && { field: i.field }),
    })),
  };
}
