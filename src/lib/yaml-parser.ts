import { parse } from 'yaml';
import { generateId } from './generate-id';
import type {
  DependencyEdge,
  NamedVolume,
  NetworkConfig,
  ParseResult,
  PortMapping,
  PresetImageKey,
  ServiceNode,
  ServiceNodeData,
  VolumeMapping,
} from '../store/types';

const PRESET_IMAGE_MAP: Record<string, PresetImageKey> = {
  nginx: 'nginx',
  postgres: 'postgres',
  postgresql: 'postgres',
  redis: 'redis',
  node: 'node',
};

function detectPreset(image: string): PresetImageKey {
  const lower = image.toLowerCase();
  for (const [key, preset] of Object.entries(PRESET_IMAGE_MAP)) {
    if (lower.startsWith(key)) return preset;
  }
  return 'custom';
}

function parsePorts(ports: unknown): PortMapping[] {
  if (!Array.isArray(ports)) return [];
  const result: PortMapping[] = [];
  for (const p of ports) {
    const str = String(p).replace(/\/\w+$/, ''); // strip protocol like /tcp
    const parts = str.split(':');
    if (parts.length === 2) {
      result.push({ host: parts[0], container: parts[1] });
    } else if (parts.length === 1) {
      result.push({ host: parts[0], container: parts[0] });
    }
  }
  return result;
}

function parseVolumes(volumes: unknown): VolumeMapping[] {
  if (!Array.isArray(volumes)) return [];
  const result: VolumeMapping[] = [];
  for (const v of volumes) {
    if (typeof v === 'string') {
      const parts = v.split(':');
      if (parts.length >= 2) {
        result.push({ source: parts[0], target: parts[1] });
      }
    } else if (v && typeof v === 'object') {
      const obj = v as Record<string, string>;
      if (obj.source && obj.target) {
        result.push({ source: obj.source, target: obj.target });
      }
    }
  }
  return result;
}

function parseEnvironment(env: unknown): Record<string, string> {
  if (!env) return {};
  if (Array.isArray(env)) {
    const result: Record<string, string> = {};
    for (const item of env) {
      const str = String(item);
      const idx = str.indexOf('=');
      if (idx > 0) {
        result[str.slice(0, idx)] = str.slice(idx + 1);
      }
    }
    return result;
  }
  if (typeof env === 'object') {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(env as Record<string, unknown>)) {
      result[k] = String(v ?? '');
    }
    return result;
  }
  return {};
}

function parseHealthcheck(hc: unknown): ServiceNodeData['healthcheck'] {
  if (!hc || typeof hc !== 'object') return undefined;
  const obj = hc as Record<string, unknown>;
  let test = '';
  if (Array.isArray(obj.test)) {
    test = obj.test.join(' ');
  } else if (typeof obj.test === 'string') {
    test = obj.test;
  }
  if (!test) return undefined;
  return {
    test,
    interval: String(obj.interval ?? '30s'),
    timeout: String(obj.timeout ?? '10s'),
    retries: Number(obj.retries ?? 3),
  };
}

export function parseYaml(yamlString: string): ParseResult {
  const empty: ParseResult = {
    success: false,
    nodes: [],
    edges: [],
    networks: [],
    namedVolumes: [],
    errors: [],
  };

  let doc: Record<string, unknown>;
  try {
    doc = parse(yamlString) as Record<string, unknown>;
  } catch (e) {
    return { ...empty, errors: [`Invalid YAML syntax: ${(e as Error).message}`] };
  }

  if (!doc || typeof doc !== 'object') {
    return { ...empty, errors: ['Invalid YAML: not an object'] };
  }

  const services = doc.services as Record<string, Record<string, unknown>> | undefined;
  if (!services || typeof services !== 'object') {
    return { ...empty, errors: ['No services found'] };
  }

  const serviceNames = Object.keys(services);
  const nodes: ServiceNode[] = [];
  const edges: DependencyEdge[] = [];
  const nameToId = new Map<string, string>();

  // Create nodes
  for (let i = 0; i < serviceNames.length; i++) {
    const name = serviceNames[i];
    const svc = services[name];
    const id = generateId();
    nameToId.set(name, id);

    const col = i % 3;
    const row = Math.floor(i / 3);

    const image = String(svc.image ?? '');
    const data: ServiceNodeData = {
      serviceName: name,
      image,
      preset: detectPreset(image),
      ports: parsePorts(svc.ports),
      volumes: parseVolumes(svc.volumes),
      environment: parseEnvironment(svc.environment),
      healthcheck: parseHealthcheck(svc.healthcheck),
      networks: Array.isArray(svc.networks) ? svc.networks.map(String) : [],
    };

    nodes.push({
      id,
      type: 'serviceNode',
      position: { x: 50 + col * 250, y: 50 + row * 150 },
      data,
    });
  }

  // Create edges from depends_on
  for (const name of serviceNames) {
    const svc = services[name];
    const targetId = nameToId.get(name)!;
    let deps: string[] = [];

    if (Array.isArray(svc.depends_on)) {
      deps = svc.depends_on.map(String);
    } else if (svc.depends_on && typeof svc.depends_on === 'object') {
      deps = Object.keys(svc.depends_on as object);
    }

    for (const dep of deps) {
      const sourceId = nameToId.get(dep);
      if (sourceId) {
        edges.push({
          id: generateId(),
          source: sourceId,
          target: targetId,
          type: 'dependencyEdge',
        });
      }
    }
  }

  // Parse top-level networks
  const networks: NetworkConfig[] = [];
  const docNetworks = doc.networks as Record<string, Record<string, unknown>> | undefined;
  if (docNetworks && typeof docNetworks === 'object') {
    for (const [name, cfg] of Object.entries(docNetworks)) {
      const driver = (cfg?.driver as string) ?? 'bridge';
      networks.push({
        name,
        driver: driver as NetworkConfig['driver'],
      });
    }
  }

  // Parse top-level volumes
  const namedVolumes: NamedVolume[] = [];
  const docVolumes = doc.volumes as Record<string, Record<string, unknown>> | undefined;
  if (docVolumes && typeof docVolumes === 'object') {
    for (const [name, cfg] of Object.entries(docVolumes)) {
      namedVolumes.push({
        name,
        driver: (cfg?.driver as string) ?? 'local',
      });
    }
  }

  return {
    success: true,
    nodes,
    edges,
    networks,
    namedVolumes,
    errors: [],
  };
}
