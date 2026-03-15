# Type Definitions — Canonical Reference

> Bu dosya `src/store/types.ts` ile her zaman senkron olmalıdır.
> Tip değişikliği önce burada yapılır, sonra koda yansıtılır.
> Hiçbir interface başka dosyada yeniden tanımlanmaz.

---

## Port & Volume

```typescript
export interface PortMapping {
  host: string;        // "8080"
  container: string;   // "80"
}

export interface VolumeMapping {
  source: string;      // host path veya named volume adı
  target: string;      // container path
}
```

---

## Healthcheck

```typescript
export interface HealthcheckConfig {
  test: string;        // "CMD curl -f http://localhost"
  interval: string;    // "30s"
  timeout: string;     // "10s"
  retries: number;     // 3
}
```

---

## Service Node

```typescript
export type PresetImageKey = 'nginx' | 'postgres' | 'redis' | 'node' | 'custom';

export interface ServiceNodeData {
  serviceName: string;
  image: string;
  preset: PresetImageKey;
  ports: PortMapping[];
  volumes: VolumeMapping[];
  environment: Record<string, string>;
  healthcheck?: HealthcheckConfig;
  networks: string[];           // ait olduğu network adları
}

export interface ServiceNode {
  id: string;                   // React Flow node id (uuid)
  type: 'serviceNode';
  position: { x: number; y: number };
  data: ServiceNodeData;
}
```

---

## Edge

```typescript
export interface DependencyEdge {
  id: string;
  source: string;               // bağımlılık (örn. postgres)
  target: string;               // bağımlı servis (örn. api)
  type: 'dependencyEdge';
}
```

> `source → target` yönü: target, source'a `depends_on` ile bağlanır.

---

## Network & Named Volume

```typescript
export interface NetworkConfig {
  name: string;
  driver: 'bridge' | 'overlay' | 'host' | 'none';
}

export interface NamedVolume {
  name: string;
  driver?: string;              // default: 'local'
}
```

---

## Validation

```typescript
export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  nodeId?: string;              // belirli bir node'a bağlıysa
  field?: string;               // belirli bir alana bağlıysa
  message: string;
}
```

---

## Parse Result

```typescript
export interface ParseResult {
  success: boolean;
  nodes: ServiceNode[];
  edges: DependencyEdge[];
  networks: NetworkConfig[];
  namedVolumes: NamedVolume[];
  errors: string[];
}
```

---

## Data Layer Types

> Bu type'lar `src/data/types.ts`'de tanımlanır.

```typescript
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
  source: string;  // depended upon
  target: string;  // dependent
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
```

---

## AI Types

```typescript
export type AIProviderKey = 'anthropic' | 'openai' | 'gemini' | 'glm';

export interface AIConfig {
  provider: AIProviderKey;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface AIGenerateResult {
  success: boolean;
  yaml: string;
  error?: string;
}

export interface AIStore {
  config: AIConfig;
  isLoading: boolean;
  error: string | null;
  setProvider: (provider: AIProviderKey) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setBaseUrl: (url: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
```

---

## Zustand Store

```typescript
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

  // Validation (derived, store'a yazılır)
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
```

---

## Preset Defaults

Claude Code, node oluştururken aşağıdaki default değerleri kullanır:

```typescript
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
```
