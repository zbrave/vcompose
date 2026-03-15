// Canonical type definitions — kept in sync with docs/TYPES.md
import type { DockerHubSearchResult } from '../data/types';

export interface PortMapping {
  host: string;
  container: string;
}

export interface VolumeMapping {
  source: string;
  target: string;
}

export interface HealthcheckConfig {
  test: string;
  interval: string;
  timeout: string;
  retries: number;
}

export type PresetImageKey = 'nginx' | 'postgres' | 'redis' | 'node' | 'custom';

export interface ServiceNodeData {
  serviceName: string;
  image: string;
  preset: PresetImageKey;
  ports: PortMapping[];
  volumes: VolumeMapping[];
  environment: Record<string, string>;
  healthcheck?: HealthcheckConfig;
  networks: string[];
}

export interface ServiceNode {
  id: string;
  type: 'serviceNode';
  position: { x: number; y: number };
  data: ServiceNodeData;
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  type: 'dependencyEdge';
}

export interface NetworkConfig {
  name: string;
  driver: 'bridge' | 'overlay' | 'host' | 'none';
}

export interface NamedVolume {
  name: string;
  driver?: string;
}

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  nodeId?: string;
  field?: string;
  message: string;
}

export interface ParseResult {
  success: boolean;
  nodes: ServiceNode[];
  edges: DependencyEdge[];
  networks: NetworkConfig[];
  namedVolumes: NamedVolume[];
  errors: string[];
}

export interface AppStore {
  // State
  nodes: ServiceNode[];
  edges: DependencyEdge[];
  networks: NetworkConfig[];
  namedVolumes: NamedVolume[];
  selectedNodeId: string | null;
  validationIssues: ValidationIssue[];

  // Node actions
  addNode: (preset: PresetImageKey, position: { x: number; y: number }) => void;
  updateNode: (id: string, data: Partial<ServiceNodeData>) => void;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;

  // Edge actions
  addEdge: (edge: DependencyEdge) => void;
  removeEdge: (id: string) => void;

  // Network actions
  addNetwork: (network: NetworkConfig) => void;
  updateNetwork: (oldName: string, network: NetworkConfig) => void;
  removeNetwork: (name: string) => void;

  // Named volume actions
  addNamedVolume: (volume: NamedVolume) => void;
  removeNamedVolume: (name: string) => void;

  // Validation
  setValidationIssues: (issues: ValidationIssue[]) => void;

  // Import
  importCompose: (result: ParseResult) => void;

  // Recommendations
  addRecommendedNode: (key: string, sourceNodeId: string, position: { x: number; y: number }) => void;

  // Stack & Marketplace actions
  addStack: (stackKey: string, dropPosition: { x: number; y: number }) => void;
  addServiceFromRegistry: (serviceKey: string, position: { x: number; y: number }) => void;
  addServiceFromHub: (hubResult: DockerHubSearchResult, position: { x: number; y: number }) => void;
}

export const PRESET_DEFAULTS: Record<PresetImageKey, Partial<ServiceNodeData>> = {
  nginx: {
    image: 'nginx:alpine',
    ports: [{ host: '80', container: '80' }],
  },
  postgres: {
    image: 'postgres:16-alpine',
    ports: [{ host: '5432', container: '5432' }],
    environment: {
      POSTGRES_USER: 'user',
      POSTGRES_PASSWORD: 'password',
      POSTGRES_DB: 'db',
    },
  },
  redis: {
    image: 'redis:7-alpine',
    ports: [{ host: '6379', container: '6379' }],
  },
  node: {
    image: 'node:20-alpine',
    ports: [{ host: '3000', container: '3000' }],
  },
  custom: {
    image: '',
    ports: [],
  },
};
