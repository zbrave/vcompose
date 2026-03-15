// src/data/types.ts
import type { PortMapping, VolumeMapping, HealthcheckConfig, PresetImageKey } from '../store/types';

export type ServiceCategory =
  | 'database' | 'cache' | 'web-server' | 'runtime'
  | 'monitoring' | 'logging' | 'messaging' | 'storage'
  | 'security' | 'media' | 'iot' | 'ai' | 'devops'
  | 'productivity' | 'other';

export interface ServiceDefinition {
  key: string;
  name: string;
  description: string;
  image: string;
  preset: PresetImageKey;
  category: ServiceCategory;
  ports: PortMapping[];
  volumes?: VolumeMapping[];
  environment?: Record<string, string>;
  healthcheck?: HealthcheckConfig;
  dockerHubSlug?: string;
}

export interface StackDefinition {
  key: string;
  name: string;
  icon: string;
  description: string;
  tags: string[];
  services: StackServiceRef[];
  edges: StackEdgeRef[];
}

export interface StackServiceRef {
  serviceKey: string;
  overrides?: Partial<Pick<ServiceDefinition, 'ports' | 'volumes' | 'environment' | 'healthcheck' | 'image'>>;
  gridPosition: { col: number; row: number };
}

export interface StackEdgeRef {
  source: string;
  target: string;
}

export interface CategoryDef {
  key: ServiceCategory;
  label: string;
  icon: string;
}

export interface DockerHubSearchResult {
  name: string;
  slug: string;
  description: string;
  starCount: number;
  pullCount: number;
  isOfficial: boolean;
  registryMatch?: ServiceDefinition;
}
