# Enhanced Sidebar (Stacks + Marketplace) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 5 static presets sidebar with a 3-tab professional sidebar: Stacks (16 combined presets), Marketplace (Docker Hub live search + 100+ local services), AI (existing).

**Architecture:** Modular Registry pattern — services defined once in `src/data/service-registry.ts`, stacks reference service keys. Cloudflare Worker proxies Docker Hub API to bypass CORS. Layout engine auto-positions stack services on canvas.

**Tech Stack:** React 18, TypeScript strict, Zustand 5, React Flow 12, Tailwind CSS, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-03-15-enhanced-sidebar-design.md`

---

## File Structure

### New Files
| Path | Responsibility |
|------|---------------|
| `src/data/types.ts` | Data-layer interfaces: ServiceDefinition, StackDefinition, etc. |
| `src/data/service-registry.ts` | ~100-150 service definitions with ports, env, healthcheck |
| `src/data/stack-catalog.ts` | 16 stack definitions referencing service keys |
| `src/data/categories.ts` | Marketplace category definitions |
| `src/lib/stack-layout.ts` | Pure function: stack → pixel positions |
| `src/components/sidebar/StacksPanel.tsx` | Stacks tab UI |
| `src/components/sidebar/StackCard.tsx` | Individual stack card |
| `src/components/sidebar/MarketplacePanel.tsx` | Marketplace tab UI |
| `src/components/sidebar/ServiceCard.tsx` | Individual service card |
| `src/components/sidebar/CategoryChips.tsx` | Category filter chips |
| `src/lib/__tests__/stack-layout.test.ts` | Layout engine tests |
| `src/lib/__tests__/service-registry.test.ts` | Registry validation tests |
| `src/lib/__tests__/stack-catalog.test.ts` | Stack catalog validation tests |
| `src/lib/__tests__/dockerhub-search.test.ts` | Search merge/dedupe tests |
| `worker/src/index.ts` | Cloudflare Worker proxy |
| `worker/package.json` | Worker dependencies |
| `worker/wrangler.toml` | Worker config |

### Modified Files
| Path | Changes |
|------|---------|
| `src/store/types.ts` | Add `addStack`, `addServiceFromRegistry`, `addServiceFromHub` to AppStore |
| `src/store/index.ts` | Implement 3 new store actions |
| `src/lib/dockerhub.ts` | Refactor: registry + proxy search |
| `src/hooks/useDockerHubSearch.ts` | Update to new API |
| `src/components/sidebar/SidebarTabs.tsx` | 3 tabs: Stacks, Marketplace, AI |
| `src/components/canvas/FlowCanvas.tsx` | Handle 3 new MIME types in onDrop |
| `src/components/panel/ImageSearchInput.tsx` | Use new DockerHubSearchResult type |
| `src/lib/recommendation-engine.ts` | Read from service-registry |
| `src/data/recommendation-defaults.ts` | Remove (merged into registry) |
| `docs/TYPES.md` | Add Data Layer Types section |
| `docs/STATUS.md` | Update with Phase 9 |
| `PROJECT_SPEC.md` | Add Phase 9 to roadmap, `src/data/` to folder structure |

### Removed Files
| Path | Reason |
|------|--------|
| `src/components/sidebar/NodePalette.tsx` | Replaced by Stacks + Marketplace tabs |
| `src/data/recommendation-defaults.ts` | Merged into service-registry |

---

## Chunk 1: Data Layer Foundation

### Task 1: Data Layer Types

**Files:**
- Create: `src/data/types.ts`

- [ ] **Step 1: Create data types file**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "feat(phase9): add data layer types for service registry and stack catalog"
```

---

### Task 2: Service Registry (Core Services)

**Files:**
- Create: `src/data/service-registry.ts`
- Create: `src/lib/__tests__/service-registry.test.ts`

- [ ] **Step 1: Write registry validation test**

```typescript
// src/lib/__tests__/service-registry.test.ts
import { describe, it, expect } from 'vitest';
import { SERVICE_REGISTRY } from '../../data/service-registry';

describe('service-registry', () => {
  it('has no duplicate keys', () => {
    const keys = SERVICE_REGISTRY.map(s => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every service has required fields', () => {
    for (const svc of SERVICE_REGISTRY) {
      expect(svc.key).toBeTruthy();
      expect(svc.name).toBeTruthy();
      expect(svc.image).toBeTruthy();
      expect(svc.category).toBeTruthy();
      expect(svc.preset).toBeTruthy();
      expect(Array.isArray(svc.ports)).toBe(true);
    }
  });

  it('preset services map to their own preset key', () => {
    const presetKeys = ['nginx', 'postgres', 'redis', 'node', 'custom'];
    for (const key of presetKeys) {
      const svc = SERVICE_REGISTRY.find(s => s.key === key);
      expect(svc).toBeDefined();
      expect(svc!.preset).toBe(key);
    }
  });

  it('non-preset services have preset "custom"', () => {
    const presetKeys = new Set(['nginx', 'postgres', 'redis', 'node', 'custom']);
    const nonPresets = SERVICE_REGISTRY.filter(s => !presetKeys.has(s.key));
    for (const svc of nonPresets) {
      expect(svc.preset).toBe('custom');
    }
  });

  it('ports have valid host and container strings', () => {
    for (const svc of SERVICE_REGISTRY) {
      for (const port of svc.ports) {
        expect(port.host).toMatch(/^\d+$/);
        expect(port.container).toMatch(/^\d+$/);
      }
    }
  });

  it('has at least 50 services', () => {
    expect(SERVICE_REGISTRY.length).toBeGreaterThanOrEqual(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/lib/__tests__/service-registry.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Create service registry with 100+ services**

Create `src/data/service-registry.ts`. This is a large data file. Key organization:
- Start with the 5 original presets (migrated from PRESET_DEFAULTS)
- Then recommendation defaults (migrated from recommendation-defaults.ts)
- Then additional services grouped by category

The file exports `SERVICE_REGISTRY: ServiceDefinition[]`. Each entry must have:
- `key`: unique lowercase slug
- `name`: display name
- `description`: one-line description
- `image`: specific tag (not :latest), prefer -alpine/-slim
- `preset`: one of PresetImageKey ('custom' for non-presets)
- `category`: ServiceCategory
- `ports`: PortMapping[]
- Optional: `volumes`, `environment`, `healthcheck`, `dockerHubSlug`

Include at minimum these services (grouped by category):

**Database:** postgres, mysql, mariadb, mongodb, clickhouse, influxdb, cassandra, cockroachdb, timescaledb, neo4j, couchdb
**Cache:** redis, memcached, keydb, dragonfly
**Web Server:** nginx, apache, caddy, traefik, nginx-proxy-manager, haproxy
**Runtime:** node, python, php-fpm, ruby, golang, java, dotnet
**Monitoring:** prometheus, grafana, alertmanager, cadvisor, node-exporter, uptime-kuma, beszel, victoriametrics
**Logging:** elasticsearch, logstash, kibana, loki, promtail, fluentd, graylog
**Messaging:** rabbitmq, mosquitto, nats, kafka, emqx
**Storage:** minio, nextcloud, seafile, filebrowser, syncthing
**Security:** authentik, authelia, keycloak, vaultwarden, wg-easy, adguard-home, pihole
**Media:** jellyfin, plex, sonarr, radarr, prowlarr, lidarr, bazarr, qbittorrent, transmission, immich
**IoT:** home-assistant, zigbee2mqtt, node-red, telegraf, esphome
**AI:** ollama, open-webui, qdrant, n8n, anythingllm
**DevOps:** gitea, drone-ci, gitlab-ce, docker-registry, portainer, dockge, jenkins, harbor
**Productivity:** wordpress, ghost, bookstack, outline, wiki-js, paperless-ngx, onlyoffice, homer, homepage, dashy, homarr, mealie, tandoor
**Other:** coolify, soketi, pgadmin, adminer, mongo-express, redis-commander, phpmyadmin, certbot, watchtower

Each service should have realistic defaults (real ports, real env vars, real volume paths).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/lib/__tests__/service-registry.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/service-registry.ts src/lib/__tests__/service-registry.test.ts
git commit -m "feat(phase9): add service registry with 100+ service definitions"
```

---

### Task 3: Stack Catalog

**Files:**
- Create: `src/data/stack-catalog.ts`
- Create: `src/lib/__tests__/stack-catalog.test.ts`

- [ ] **Step 1: Write stack catalog validation test**

```typescript
// src/lib/__tests__/stack-catalog.test.ts
import { describe, it, expect } from 'vitest';
import { STACK_CATALOG } from '../../data/stack-catalog';
import { SERVICE_REGISTRY } from '../../data/service-registry';

describe('stack-catalog', () => {
  const registryKeys = new Set(SERVICE_REGISTRY.map(s => s.key));

  it('has 16 stacks', () => {
    expect(STACK_CATALOG.length).toBe(16);
  });

  it('has no duplicate keys', () => {
    const keys = STACK_CATALOG.map(s => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('all service refs point to existing registry keys', () => {
    for (const stack of STACK_CATALOG) {
      for (const svcRef of stack.services) {
        expect(registryKeys.has(svcRef.serviceKey),
          `Stack "${stack.key}" references unknown service "${svcRef.serviceKey}"`
        ).toBe(true);
      }
    }
  });

  it('all edge refs point to services within the stack', () => {
    for (const stack of STACK_CATALOG) {
      const stackServiceKeys = new Set(stack.services.map(s => s.serviceKey));
      for (const edge of stack.edges) {
        expect(stackServiceKeys.has(edge.source),
          `Stack "${stack.key}" edge source "${edge.source}" not in stack services`
        ).toBe(true);
        expect(stackServiceKeys.has(edge.target),
          `Stack "${stack.key}" edge target "${edge.target}" not in stack services`
        ).toBe(true);
      }
    }
  });

  it('every stack has at least 2 services', () => {
    for (const stack of STACK_CATALOG) {
      expect(stack.services.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('no duplicate gridPositions within a stack', () => {
    for (const stack of STACK_CATALOG) {
      const positions = stack.services.map(s => `${s.gridPosition.col},${s.gridPosition.row}`);
      expect(new Set(positions).size).toBe(positions.length);
    }
  });

  it('every stack has required fields', () => {
    for (const stack of STACK_CATALOG) {
      expect(stack.key).toBeTruthy();
      expect(stack.name).toBeTruthy();
      expect(stack.icon).toBeTruthy();
      expect(stack.description).toBeTruthy();
      expect(stack.tags.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/lib/__tests__/stack-catalog.test.ts`
Expected: FAIL

- [ ] **Step 3: Create stack catalog with 16 stacks**

Create `src/data/stack-catalog.ts` exporting `STACK_CATALOG: StackDefinition[]`.

Each of the 16 stacks from the spec:
1. `smart-home` — home-assistant, mosquitto, zigbee2mqtt, node-red, influxdb, grafana
2. `iot-ming` — mosquitto, influxdb, node-red, grafana, telegraf
3. `media-arr` — jellyfin, sonarr, radarr, prowlarr, lidarr, bazarr, qbittorrent
4. `monitoring` — prometheus, grafana, alertmanager, cadvisor, node-exporter
5. `elk` — elasticsearch, logstash, kibana
6. `loki` — grafana, loki, promtail
7. `ai-llm` — ollama, open-webui, qdrant, n8n
8. `lemp` — nginx, php-fpm, mysql, redis
9. `mern` — mongodb, node, mongo-express, redis
10. `wordpress` — wordpress, mysql, redis, phpmyadmin
11. `nextcloud` — nextcloud, postgres, redis, onlyoffice
12. `gitops` — gitea, drone-ci, docker-registry, portainer
13. `security` — nginx-proxy-manager, authentik, wg-easy, adguard-home
14. `photo-docs` — immich, postgres, redis, paperless-ngx
15. `dashboard` — homepage, uptime-kuma, vaultwarden
16. `coolify` — coolify, postgres, redis, soketi, traefik

Each stack must include:
- `services` with `gridPosition` (col/row for layout engine)
- `edges` with `source/target` matching DependencyEdge semantics
- `tags` for search

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/lib/__tests__/stack-catalog.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/stack-catalog.ts src/lib/__tests__/stack-catalog.test.ts
git commit -m "feat(phase9): add stack catalog with 16 stack definitions"
```

---

### Task 4: Categories

**Files:**
- Create: `src/data/categories.ts`

- [ ] **Step 1: Create categories file**

```typescript
// src/data/categories.ts
import type { CategoryDef } from './types';

export const CATEGORIES: CategoryDef[] = [
  { key: 'database', label: 'Database', icon: '🗄️' },
  { key: 'cache', label: 'Cache', icon: '⚡' },
  { key: 'web-server', label: 'Web Server', icon: '🌐' },
  { key: 'runtime', label: 'Runtime', icon: '🔧' },
  { key: 'monitoring', label: 'Monitoring', icon: '📊' },
  { key: 'logging', label: 'Logging', icon: '📋' },
  { key: 'messaging', label: 'Messaging', icon: '📨' },
  { key: 'storage', label: 'Storage', icon: '💾' },
  { key: 'security', label: 'Security', icon: '🔒' },
  { key: 'media', label: 'Media', icon: '🎬' },
  { key: 'iot', label: 'IoT', icon: '📡' },
  { key: 'ai', label: 'AI', icon: '🤖' },
  { key: 'devops', label: 'DevOps', icon: '🔧' },
  { key: 'productivity', label: 'Productivity', icon: '📝' },
  { key: 'other', label: 'Other', icon: '📦' },
];
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/data/categories.ts
git commit -m "feat(phase9): add marketplace category definitions"
```

---

## Chunk 2: Business Logic

### Task 5: Stack Layout Engine

**Files:**
- Create: `src/lib/stack-layout.ts`
- Create: `src/lib/__tests__/stack-layout.test.ts`

- [ ] **Step 1: Write layout engine tests**

```typescript
// src/lib/__tests__/stack-layout.test.ts
import { describe, it, expect } from 'vitest';
import { calculateStackLayout } from '../stack-layout';
import type { StackDefinition } from '../../data/types';

const mockStack: StackDefinition = {
  key: 'test',
  name: 'Test',
  icon: '🧪',
  description: 'Test stack',
  tags: ['test'],
  services: [
    { serviceKey: 'a', gridPosition: { col: 0, row: 0 } },
    { serviceKey: 'b', gridPosition: { col: 1, row: 0 } },
    { serviceKey: 'c', gridPosition: { col: 0, row: 1 } },
  ],
  edges: [],
};

const defaultConfig = {
  startX: 100,
  startY: 100,
  nodeWidth: 180,
  nodeHeight: 80,
  gapX: 220,
  gapY: 150,
};

describe('calculateStackLayout', () => {
  it('positions first node at startX, startY', () => {
    const result = calculateStackLayout(mockStack, defaultConfig);
    const nodeA = result.nodes.find(n => n.serviceKey === 'a');
    expect(nodeA?.position).toEqual({ x: 100, y: 100 });
  });

  it('offsets columns by gapX', () => {
    const result = calculateStackLayout(mockStack, defaultConfig);
    const nodeB = result.nodes.find(n => n.serviceKey === 'b');
    expect(nodeB?.position).toEqual({ x: 320, y: 100 });
  });

  it('offsets rows by gapY', () => {
    const result = calculateStackLayout(mockStack, defaultConfig);
    const nodeC = result.nodes.find(n => n.serviceKey === 'c');
    expect(nodeC?.position).toEqual({ x: 100, y: 250 });
  });

  it('returns all services', () => {
    const result = calculateStackLayout(mockStack, defaultConfig);
    expect(result.nodes.length).toBe(3);
  });

  it('handles empty services', () => {
    const empty = { ...mockStack, services: [] };
    const result = calculateStackLayout(empty, defaultConfig);
    expect(result.nodes).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/lib/__tests__/stack-layout.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement layout engine**

```typescript
// src/lib/stack-layout.ts
import type { StackDefinition } from '../data/types';

export interface LayoutConfig {
  startX: number;
  startY: number;
  nodeWidth: number;
  nodeHeight: number;
  gapX: number;
  gapY: number;
}

export interface LayoutResult {
  nodes: Array<{
    serviceKey: string;
    position: { x: number; y: number };
  }>;
}

export function calculateStackLayout(
  stack: StackDefinition,
  config: LayoutConfig
): LayoutResult {
  const nodes = stack.services.map(svc => ({
    serviceKey: svc.serviceKey,
    position: {
      x: config.startX + svc.gridPosition.col * config.gapX,
      y: config.startY + svc.gridPosition.row * config.gapY,
    },
  }));
  return { nodes };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/lib/__tests__/stack-layout.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/stack-layout.ts src/lib/__tests__/stack-layout.test.ts
git commit -m "feat(phase9): add stack layout engine"
```

---

### Task 6: Docker Hub Search Refactor

**Files:**
- Modify: `src/lib/dockerhub.ts`
- Create: `src/lib/__tests__/dockerhub-search.test.ts`

- [ ] **Step 1: Write new search tests**

```typescript
// src/lib/__tests__/dockerhub-search.test.ts
import { describe, it, expect, vi } from 'vitest';
import { filterRegistry, mergeAndDedupe } from '../dockerhub';
import type { ServiceDefinition, DockerHubSearchResult } from '../../data/types';

const mockRegistry: ServiceDefinition[] = [
  {
    key: 'redis', name: 'Redis', description: 'In-memory cache',
    image: 'redis:7-alpine', preset: 'redis', category: 'cache',
    ports: [{ host: '6379', container: '6379' }],
    dockerHubSlug: 'library/redis',
  },
  {
    key: 'postgres', name: 'PostgreSQL', description: 'Relational database',
    image: 'postgres:16-alpine', preset: 'postgres', category: 'database',
    ports: [{ host: '5432', container: '5432' }],
    dockerHubSlug: 'library/postgres',
  },
];

describe('filterRegistry', () => {
  it('matches by name (case-insensitive)', () => {
    const results = filterRegistry('red', mockRegistry);
    expect(results.length).toBe(1);
    expect(results[0].key).toBe('redis');
  });

  it('matches by description', () => {
    const results = filterRegistry('cache', mockRegistry);
    expect(results.length).toBe(1);
    expect(results[0].key).toBe('redis');
  });

  it('returns empty for no match', () => {
    const results = filterRegistry('mongodb', mockRegistry);
    expect(results.length).toBe(0);
  });

  it('matches by key', () => {
    const results = filterRegistry('postgres', mockRegistry);
    expect(results.length).toBe(1);
  });
});

describe('mergeAndDedupe', () => {
  it('local results come first', () => {
    const local: DockerHubSearchResult[] = [{
      name: 'redis', slug: 'redis', description: 'cache',
      starCount: 10000, pullCount: 1000000, isOfficial: true,
      registryMatch: mockRegistry[0],
    }];
    const remote: DockerHubSearchResult[] = [{
      name: 'redis', slug: 'redis', description: 'cache',
      starCount: 10000, pullCount: 1000000, isOfficial: true,
    }];
    const merged = mergeAndDedupe(local, remote);
    expect(merged.length).toBe(1);
    expect(merged[0].registryMatch).toBeDefined();
  });

  it('remote results are added if not in local', () => {
    const local: DockerHubSearchResult[] = [];
    const remote: DockerHubSearchResult[] = [{
      name: 'unknown-image', slug: 'unknown-image', description: 'test',
      starCount: 5, pullCount: 100, isOfficial: false,
    }];
    const merged = mergeAndDedupe(local, remote);
    expect(merged.length).toBe(1);
    expect(merged[0].registryMatch).toBeUndefined();
  });

  it('deduplicates by slug', () => {
    const local: DockerHubSearchResult[] = [{
      name: 'redis', slug: 'redis', description: 'cache',
      starCount: 10000, pullCount: 1000000, isOfficial: true,
      registryMatch: mockRegistry[0],
    }];
    const remote: DockerHubSearchResult[] = [{
      name: 'redis', slug: 'redis', description: 'Redis in-memory store',
      starCount: 12000, pullCount: 2000000, isOfficial: true,
    }];
    const merged = mergeAndDedupe(local, remote);
    expect(merged.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/lib/__tests__/dockerhub-search.test.ts`
Expected: FAIL

- [ ] **Step 3: Refactor dockerhub.ts**

Rewrite `src/lib/dockerhub.ts`:
- Export `filterRegistry(query, registry)` — substring match on key, name, description (case-insensitive), returns `DockerHubSearchResult[]` with `registryMatch` set
- Export `mergeAndDedupe(local, remote)` — local first, dedupe by slug
- Export `searchDockerHub(query, signal?)` — fetch from proxy URL with `AbortSignal.timeout(5000)`, return `DockerHubSearchResult[]`, return `[]` on any error (CORS, timeout, non-200). Map Docker Hub API response to `DockerHubSearchResult`: `slug = repo_name || name`, `pullCount = pull_count`, `starCount = star_count`, `isOfficial = is_official`
- Export `searchServices(query, registry)` — combines filterRegistry + searchDockerHub
- Keep `PROXY_URL` from `import.meta.env.VITE_DOCKERHUB_PROXY_URL` or default
- Remove old `POPULAR_IMAGES`, `searchLocal`, `searchRemote`, `searchImages`
- Remove old `DockerHubResult` type — replaced by `DockerHubSearchResult` from `data/types`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/lib/__tests__/dockerhub-search.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Delete old dockerhub tests**

Remove `src/lib/__tests__/dockerhub.test.ts` — fully replaced by `dockerhub-search.test.ts`. Old tests reference removed functions (`searchLocal`, `searchRemote`, `searchImages`).

- [ ] **Step 6: Run all tests to check for regressions**

Run: `npm run test`
Expected: All unit tests pass

- [ ] **Step 7: Commit**

```bash
git add src/lib/dockerhub.ts src/lib/__tests__/dockerhub-search.test.ts src/lib/__tests__/dockerhub.test.ts
git commit -m "feat(phase9): refactor Docker Hub search with registry merge and proxy support"
```

---

### Task 7: Update useDockerHubSearch Hook

**Files:**
- Modify: `src/hooks/useDockerHubSearch.ts`
- Modify: `src/components/panel/ImageSearchInput.tsx`

- [ ] **Step 1: Update hook to use new API**

Modify `src/hooks/useDockerHubSearch.ts`:
- Import `searchDockerHub` from `../lib/dockerhub` (remote search only)
- Return `{ results: DockerHubSearchResult[], isLoading: boolean, error: boolean }`
- Hook only handles remote Docker Hub search with debounce
- Local registry filtering is done by MarketplacePanel (avoids dual-merge)
- Add `error: boolean` state — set `true` when `searchDockerHub` returns empty due to failure
- Keep 300ms debounce and AbortController pattern

- [ ] **Step 2: Update ImageSearchInput component**

Modify `src/components/panel/ImageSearchInput.tsx`:
- Use `DockerHubSearchResult` type
- Access `result.slug` or `result.name` for display
- Show `pullCount` if available
- Show `registryMatch` indicator

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useDockerHubSearch.ts src/components/panel/ImageSearchInput.tsx
git commit -m "refactor(phase9): update Docker Hub search hook and ImageSearchInput to new API"
```

---

## Chunk 3: Store Actions

### Task 8: Add New Store Actions

**Files:**
- Modify: `src/store/types.ts`
- Modify: `src/store/index.ts`

- [ ] **Step 1: Add action types to AppStore interface**

In `src/store/types.ts`, add to `AppStore` interface (after existing actions):

```typescript
// Stack & Marketplace actions
addStack: (stackKey: string, dropPosition: { x: number; y: number }) => void;
addServiceFromRegistry: (serviceKey: string, position: { x: number; y: number }) => void;
addServiceFromHub: (hubResult: DockerHubSearchResult, position: { x: number; y: number }) => void;
```

Add import for `DockerHubSearchResult` from `../data/types`.

- [ ] **Step 2: Add required imports to store/index.ts**

Add these imports to `src/store/index.ts`:
```typescript
import { SERVICE_REGISTRY } from '../data/service-registry';
import { STACK_CATALOG } from '../data/stack-catalog';
import { calculateStackLayout } from '../lib/stack-layout';
import type { DockerHubSearchResult } from '../data/types';
```

- [ ] **Step 3: Implement addServiceFromRegistry**

In `src/store/index.ts`, add `addServiceFromRegistry` action. Also add a helper `getServiceFromRegistry(key)` that finds a service by key. Logic:
1. Find service in `SERVICE_REGISTRY` by key
2. If not found, return
3. Generate id with `generateId()`
4. Create `ServiceNode` with registry defaults (image, ports, volumes, env, healthcheck)
5. Set `serviceName: ${serviceKey}-${id.slice(0, 4)}`
6. Set `preset: serviceDef.preset`
7. Set `networks: []`
8. Append to `state.nodes`

- [ ] **Step 3: Implement addServiceFromHub**

In `src/store/index.ts`, add `addServiceFromHub` action. Logic:
1. If `hubResult.registryMatch` exists → use it as source (like addServiceFromRegistry)
2. If no match → create minimal node: `preset: 'custom'`, `image: hubResult.name`, empty ports/volumes/env
3. Set `serviceName: ${slug}-${id.slice(0, 4)}`
4. Append to `state.nodes`

- [ ] **Step 4: Implement addStack**

In `src/store/index.ts`, add `addStack` action. This is the most complex action. Logic:
1. Find stack in `STACK_CATALOG` by key
2. If not found, return
3. Call `calculateStackLayout(stack, { startX: dropPosition.x, startY: dropPosition.y, ... })`
4. Build all new nodes, edges, and network changes in local variables
5. For each `StackServiceRef`:
   - Find `ServiceDefinition` from `SERVICE_REGISTRY`
   - Apply overrides if present
   - Generate unique id and serviceName
   - Create `ServiceNode`
   - Map serviceKey → generated id (for edge creation)
6. For each `StackEdgeRef`:
   - Map source/target serviceKeys to generated node ids
   - Create `DependencyEdge`
7. Ensure `default` network exists
8. Add all new nodes to `default` network
9. Collect named volumes
10. Write everything in a single `set()` call

- [ ] **Step 5: Refactor addRecommendedNode to use SERVICE_REGISTRY**

In `src/store/index.ts`, update the existing `addRecommendedNode` action:
- Remove import of `RECOMMENDATION_DEFAULTS` from `../data/recommendation-defaults`
- Use `SERVICE_REGISTRY.find(s => s.key === key)` instead of `RECOMMENDATION_DEFAULTS[key]`
- Fall back to `PRESET_DEFAULTS[key]` for preset keys (backward compat)
- For non-preset, non-registry keys: use `{ image: key, ports: [] }` as last resort

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add src/store/types.ts src/store/index.ts
git commit -m "feat(phase9): add addStack, addServiceFromRegistry, addServiceFromHub store actions"
```

---

### Task 9: Store Action Unit Tests

**Files:**
- Create: `src/lib/__tests__/store-actions.test.ts`

- [ ] **Step 1: Write store action tests**

```typescript
// src/lib/__tests__/store-actions.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../store';

describe('store actions (Phase 9)', () => {
  beforeEach(() => {
    // Reset store
    useStore.setState({
      nodes: [], edges: [], networks: [],
      namedVolumes: [], selectedNodeId: null, validationIssues: [],
    });
  });

  describe('addServiceFromRegistry', () => {
    it('adds a node with registry defaults', () => {
      useStore.getState().addServiceFromRegistry('redis', { x: 100, y: 100 });
      const nodes = useStore.getState().nodes;
      expect(nodes.length).toBe(1);
      expect(nodes[0].data.image).toBe('redis:7-alpine');
      expect(nodes[0].data.preset).toBe('redis');
      expect(nodes[0].data.ports.length).toBeGreaterThan(0);
    });

    it('ignores unknown service key', () => {
      useStore.getState().addServiceFromRegistry('nonexistent', { x: 0, y: 0 });
      expect(useStore.getState().nodes.length).toBe(0);
    });
  });

  describe('addServiceFromHub', () => {
    it('creates minimal node for Hub-only result', () => {
      useStore.getState().addServiceFromHub(
        { name: 'someuser/myimage', slug: 'myimage', description: 'test',
          starCount: 5, pullCount: 100, isOfficial: false },
        { x: 100, y: 100 }
      );
      const nodes = useStore.getState().nodes;
      expect(nodes.length).toBe(1);
      expect(nodes[0].data.preset).toBe('custom');
      expect(nodes[0].data.image).toBe('someuser/myimage');
    });
  });

  describe('addStack', () => {
    it('adds all services and edges for a stack', () => {
      useStore.getState().addStack('elk', { x: 100, y: 100 });
      const { nodes, edges } = useStore.getState();
      // ELK has 3 services
      expect(nodes.length).toBe(3);
      // ELK has edges (logstash→elasticsearch, kibana→elasticsearch)
      expect(edges.length).toBeGreaterThanOrEqual(1);
    });

    it('creates default network', () => {
      useStore.getState().addStack('elk', { x: 100, y: 100 });
      const { networks, nodes } = useStore.getState();
      expect(networks.some(n => n.name === 'default')).toBe(true);
      // All nodes should be in default network
      for (const node of nodes) {
        expect(node.data.networks).toContain('default');
      }
    });

    it('ignores unknown stack key', () => {
      useStore.getState().addStack('nonexistent', { x: 0, y: 0 });
      expect(useStore.getState().nodes.length).toBe(0);
    });
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm run test -- --run src/lib/__tests__/store-actions.test.ts`
Expected: All tests PASS (store actions already implemented in Task 8)

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/store-actions.test.ts
git commit -m "test(phase9): add unit tests for addStack, addServiceFromRegistry, addServiceFromHub"
```

---

### Task 10: Migrate Recommendation Engine

**Files:**
- Modify: `src/lib/recommendation-engine.ts`
- Modify: `src/lib/__tests__/recommendation-engine.test.ts`
- Delete: `src/data/recommendation-defaults.ts`

- [ ] **Step 1: Update recommendation-engine.ts**

Modify `src/lib/recommendation-engine.ts`:
- Replace import of `RECOMMENDATION_DEFAULTS` with import of `SERVICE_REGISTRY` from `../data/service-registry`
- In `resolveImage`: look up service in `SERVICE_REGISTRY` by key instead of `RECOMMENDATION_DEFAULTS`
- Keep `PRESET_DEFAULTS` lookup as fallback for backward compat

- [ ] **Step 2: Update recommendation tests**

Verify/update `src/lib/__tests__/recommendation-engine.test.ts` to pass with new imports.

- [ ] **Step 3: Delete recommendation-defaults.ts**

Remove `src/data/recommendation-defaults.ts`. All its data is now in service-registry.

- [ ] **Step 4: Fix any remaining imports**

Search for any other files importing from `recommendation-defaults.ts` and update them. Key file to check: `src/store/index.ts` — the `addRecommendedNode` action was already refactored in Task 8 Step 5 to use `SERVICE_REGISTRY`.

- [ ] **Step 5: Run all tests**

Run: `npm run test`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(phase9): migrate recommendation engine to service registry, delete recommendation-defaults"
```

---

## Chunk 4: UI Components

### Task 11: ServiceCard and StackCard Components

**Files:**
- Create: `src/components/sidebar/ServiceCard.tsx`
- Create: `src/components/sidebar/StackCard.tsx`

- [ ] **Step 1: Create ServiceCard**

```typescript
// src/components/sidebar/ServiceCard.tsx
import type { DockerHubSearchResult } from '../../data/types';

interface ServiceCardProps {
  result: DockerHubSearchResult;
  onAdd: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export function ServiceCard({ result, onAdd, onDragStart }: ServiceCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 cursor-grab transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-200 truncate">{result.name}</span>
          {result.isOfficial && (
            <span className="text-[10px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">Official</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{result.description}</p>
        {result.pullCount > 0 && (
          <span className="text-[10px] text-gray-600">{formatPulls(result.pullCount)} pulls</span>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded shrink-0"
      >
        + Add
      </button>
    </div>
  );
}

function formatPulls(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(0)}B+`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K+`;
  return String(n);
}
```

- [ ] **Step 2: Create StackCard**

```typescript
// src/components/sidebar/StackCard.tsx
import type { StackDefinition } from '../../data/types';

interface StackCardProps {
  stack: StackDefinition;
  onAdd: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export function StackCard({ stack, onAdd, onDragStart }: StackCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-purple-500 cursor-grab transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{stack.icon}</span>
        <span className="font-medium text-sm text-gray-200 flex-1">{stack.name}</span>
        <span className="text-[10px] bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded">
          {stack.services.length} services
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{stack.description}</p>
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="w-full text-xs bg-purple-600 hover:bg-purple-500 text-white py-1.5 rounded"
      >
        + Add Stack
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/sidebar/ServiceCard.tsx src/components/sidebar/StackCard.tsx
git commit -m "feat(phase9): add ServiceCard and StackCard components"
```

---

### Task 12: CategoryChips Component

**Files:**
- Create: `src/components/sidebar/CategoryChips.tsx`

- [ ] **Step 1: Create CategoryChips**

```typescript
// src/components/sidebar/CategoryChips.tsx
import { CATEGORIES } from '../../data/categories';
import type { ServiceCategory } from '../../data/types';

interface CategoryChipsProps {
  selected: ServiceCategory | null;
  onChange: (category: ServiceCategory | null) => void;
}

export function CategoryChips({ selected, onChange }: CategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2">
      <button
        onClick={() => onChange(null)}
        className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
          selected === null
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-400 hover:text-gray-200'
        }`}
      >
        All
      </button>
      {CATEGORIES.map(cat => (
        <button
          key={cat.key}
          onClick={() => onChange(selected === cat.key ? null : cat.key)}
          className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
            selected === cat.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          {cat.icon} {cat.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sidebar/CategoryChips.tsx
git commit -m "feat(phase9): add CategoryChips component"
```

---

### Task 13: StacksPanel Component

**Files:**
- Create: `src/components/sidebar/StacksPanel.tsx`

- [ ] **Step 1: Create StacksPanel**

```typescript
// src/components/sidebar/StacksPanel.tsx
import { useState, useCallback } from 'react';
import { STACK_CATALOG } from '../../data/stack-catalog';
import { StackCard } from './StackCard';
import { NetworkPanel } from './NetworkPanel';
import { useStore } from '../../store';

export function StacksPanel() {
  const [search, setSearch] = useState('');
  const addStack = useStore(s => s.addStack);

  const filtered = STACK_CATALOG.filter(stack => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      stack.name.toLowerCase().includes(q) ||
      stack.description.toLowerCase().includes(q) ||
      stack.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  const handleAddStack = useCallback((stackKey: string) => {
    // Add at canvas center (approximate)
    addStack(stackKey, { x: 200, y: 200 });
  }, [addStack]);

  const handleDragStart = useCallback((e: React.DragEvent, stackKey: string) => {
    e.dataTransfer.setData('application/vdc-stack', stackKey);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <input
          type="text"
          placeholder="Search stacks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-3 space-y-2">
        {filtered.map(stack => (
          <StackCard
            key={stack.key}
            stack={stack}
            onAdd={() => handleAddStack(stack.key)}
            onDragStart={e => handleDragStart(e, stack.key)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4">No stacks found</p>
        )}
      </div>
      <div className="border-t border-gray-700 mt-2">
        <NetworkPanel />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sidebar/StacksPanel.tsx
git commit -m "feat(phase9): add StacksPanel component with search and NetworkPanel"
```

---

### Task 14: MarketplacePanel Component

**Files:**
- Create: `src/components/sidebar/MarketplacePanel.tsx`

- [ ] **Step 1: Create MarketplacePanel**

```typescript
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
    const localSlugs = new Set(localResults.map(s => s.key));
    const localAsHub: DockerHubSearchResult[] = localResults.map(s => ({
      name: s.image,
      slug: s.dockerHubSlug || s.key,
      description: s.description,
      starCount: 0,
      pullCount: 0,
      isOfficial: true,
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
      e.dataTransfer.setData('application/vdc-hub-image', JSON.stringify({ slug: result.slug, image: result.name }));
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sidebar/MarketplacePanel.tsx
git commit -m "feat(phase9): add MarketplacePanel component with search, categories, and Docker Hub"
```

---

### Task 15: Refactor SidebarTabs to 3 Tabs

**Files:**
- Modify: `src/components/sidebar/SidebarTabs.tsx`
- Delete: `src/components/sidebar/NodePalette.tsx`

- [ ] **Step 1: Rewrite SidebarTabs with 3 tabs**

Replace `src/components/sidebar/SidebarTabs.tsx` content:

```typescript
// src/components/sidebar/SidebarTabs.tsx
import { useState } from 'react';
import { StacksPanel } from './StacksPanel';
import { MarketplacePanel } from './MarketplacePanel';
import { AISidebar } from './AISidebar';

type TabKey = 'stacks' | 'marketplace' | 'ai';

const TAB_ACTIVE_CLASSES: Record<TabKey, string> = {
  stacks: 'text-purple-400 border-b-2 border-purple-400',
  marketplace: 'text-blue-400 border-b-2 border-blue-400',
  ai: 'text-green-400 border-b-2 border-green-400',
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'stacks', label: 'Stacks' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'ai', label: 'AI' },
];

export function SidebarTabs() {
  const [active, setActive] = useState<TabKey>('stacks');

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-700">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              active === tab.key
                ? TAB_ACTIVE_CLASSES[tab.key]
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {active === 'stacks' && <StacksPanel />}
        {active === 'marketplace' && <MarketplacePanel />}
        {active === 'ai' && <AISidebar />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete NodePalette.tsx**

Remove `src/components/sidebar/NodePalette.tsx` — fully replaced.

- [ ] **Step 3: Fix any imports referencing NodePalette**

Search for imports of `NodePalette` and remove them.

- [ ] **Step 4: Verify TypeScript compiles and dev server runs**

Run: `npx tsc --noEmit && npm run dev`
Expected: No type errors, dev server starts

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(phase9): refactor SidebarTabs to 3 tabs, remove NodePalette"
```

---

## Chunk 5: Canvas Integration

### Task 16: Update FlowCanvas Drop Handler

**Files:**
- Modify: `src/components/canvas/FlowCanvas.tsx`

- [ ] **Step 1: Extend onDrop handler**

In `src/components/canvas/FlowCanvas.tsx`, update the `onDrop` callback to handle 4 MIME types:

```typescript
const onDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
  const position = { x: flowPos.x - 80, y: flowPos.y - 40 };

  // Legacy preset (backward compat)
  const preset = e.dataTransfer.getData('application/vdc-preset');
  if (preset) {
    addNode(preset as PresetImageKey, position);
    return;
  }

  // Stack
  const stackKey = e.dataTransfer.getData('application/vdc-stack');
  if (stackKey) {
    addStack(stackKey, position);
    return;
  }

  // Registry service
  const serviceKey = e.dataTransfer.getData('application/vdc-service');
  if (serviceKey) {
    addServiceFromRegistry(serviceKey, position);
    return;
  }

  // Docker Hub image
  const hubData = e.dataTransfer.getData('application/vdc-hub-image');
  if (hubData) {
    try {
      const hubResult = JSON.parse(hubData);
      addServiceFromHub(hubResult, position);
    } catch { /* ignore invalid data */ }
  }
}, [addNode, addStack, addServiceFromRegistry, addServiceFromHub, screenToFlowPosition]);
```

Add the new store selectors:
```typescript
const addStack = useStore(s => s.addStack);
const addServiceFromRegistry = useStore(s => s.addServiceFromRegistry);
const addServiceFromHub = useStore(s => s.addServiceFromHub);
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/FlowCanvas.tsx
git commit -m "feat(phase9): extend FlowCanvas drop handler for stacks and marketplace"
```

---

## Chunk 6: Cloudflare Worker

### Task 17: Create Docker Hub Proxy Worker

**Files:**
- Create: `worker/src/index.ts`
- Create: `worker/package.json`
- Create: `worker/wrangler.toml`
- Create: `worker/tsconfig.json`

- [ ] **Step 1: Create worker directory and files**

```bash
mkdir -p worker/src
```

`worker/package.json`:
```json
{
  "name": "vdc-hub-proxy",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "devDependencies": {
    "wrangler": "^4.0.0",
    "@cloudflare/workers-types": "^4.0.0",
    "typescript": "^5.9.0"
  }
}
```

`worker/wrangler.toml`:
```toml
name = "vdc-hub-proxy"
main = "src/index.ts"
compatibility_date = "2026-03-15"
```

`worker/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "moduleResolution": "bundler"
  },
  "include": ["src"]
}
```

`worker/src/index.ts`:
```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const q = url.searchParams.get('q');
    if (!q) {
      return jsonResponse({ error: 'Missing query parameter' }, 400);
    }

    const page = url.searchParams.get('page') || '1';
    const pageSize = url.searchParams.get('page_size') || '25';

    try {
      const hubUrl = `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(q)}&page=${page}&page_size=${pageSize}`;
      const response = await fetch(hubUrl);

      if (!response.ok) {
        return jsonResponse({ error: 'Docker Hub API error' }, response.status);
      }

      const data = await response.json();
      return jsonResponse(data, 200);
    } catch {
      return jsonResponse({ error: 'Proxy fetch failed' }, 502);
    }
  },
};

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add worker/
git commit -m "feat(phase9): add Cloudflare Worker proxy for Docker Hub API"
```

---

## Chunk 7: Documentation & Cleanup

### Task 18: Update Documentation

**Files:**
- Modify: `docs/TYPES.md`
- Modify: `docs/STATUS.md`
- Modify: `PROJECT_SPEC.md`

- [ ] **Step 1: Add Data Layer Types section to TYPES.md**

Add new section after "Parse Result" in `docs/TYPES.md`:

```markdown
## Data Layer Types

> Bu type'lar `src/data/types.ts`'de tanımlanır.

### ServiceDefinition
[Include full interface]

### StackDefinition, StackServiceRef, StackEdgeRef
[Include full interfaces]

### DockerHubSearchResult
[Include full interface]

### CategoryDef
[Include interface]
```

Also add to AppStore section:
```typescript
// Stack & Marketplace actions
addStack: (stackKey: string, dropPosition: { x: number; y: number }) => void;
addServiceFromRegistry: (serviceKey: string, position: { x: number; y: number }) => void;
addServiceFromHub: (hubResult: DockerHubSearchResult, position: { x: number; y: number }) => void;
```

- [ ] **Step 2: Add Phase 9 to PROJECT_SPEC.md**

In Section 8 (Post-MVP) table, add:
```
| 6 | Phase 9 | Enhanced Sidebar (Stacks + Marketplace) | `docs/superpowers/specs/2026-03-15-enhanced-sidebar-design.md` |
```

In Section 3.3 folder structure, add `src/data/`:
```
src/
  data/           # Static data: service registry, stack catalog, categories
```

- [ ] **Step 3: Update STATUS.md**

Add Phase 9 entry with current progress.

- [ ] **Step 4: Commit**

```bash
git add docs/TYPES.md docs/STATUS.md PROJECT_SPEC.md
git commit -m "docs(phase9): update TYPES.md, STATUS.md, and PROJECT_SPEC.md for Phase 9"
```

---

### Task 19: E2E Tests

**Files:**
- Create: `e2e/flows/stacks.spec.ts`
- Create: `e2e/flows/marketplace.spec.ts`

- [ ] **Step 1: Write Stacks E2E test**

```typescript
// e2e/flows/stacks.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Stacks Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Click Stacks tab
    await page.click('button:text("Stacks")');
  });

  test('shows stack list', async ({ page }) => {
    await expect(page.locator('text=Smart Home')).toBeVisible();
    await expect(page.locator('text=LEMP Stack')).toBeVisible();
  });

  test('search filters stacks', async ({ page }) => {
    await page.fill('input[placeholder*="Search stacks"]', 'media');
    await expect(page.locator('text=Media Server')).toBeVisible();
    await expect(page.locator('text=Smart Home')).not.toBeVisible();
  });

  test('clicking Add Stack adds services to canvas', async ({ page }) => {
    // Add ELK stack (3 services, smallest)
    await page.fill('input[placeholder*="Search stacks"]', 'ELK');
    await page.click('button:text("+ Add Stack")');
    // Verify 3 nodes appear on canvas
    const nodes = page.locator('.react-flow__node');
    await expect(nodes).toHaveCount(3);
  });
});
```

- [ ] **Step 2: Write Marketplace E2E test**

```typescript
// e2e/flows/marketplace.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Marketplace Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:text("Marketplace")');
  });

  test('shows category chips', async ({ page }) => {
    await expect(page.locator('button:text("All")')).toBeVisible();
    await expect(page.locator('button:text("Database")')).toBeVisible();
  });

  test('shows services from registry', async ({ page }) => {
    // Should show popular services by default
    await expect(page.locator('text=PostgreSQL').first()).toBeVisible();
  });

  test('category filter works', async ({ page }) => {
    await page.click('button:text("Cache")');
    await expect(page.locator('text=Redis').first()).toBeVisible();
  });
});
```

- [ ] **Step 3: Run E2E tests**

Run: `npm run test:e2e -- --grep "Stacks|Marketplace"`
Expected: All E2E tests PASS

- [ ] **Step 4: Commit**

```bash
git add e2e/flows/stacks.spec.ts e2e/flows/marketplace.spec.ts
git commit -m "test(phase9): add E2E tests for Stacks and Marketplace tabs"
```

---

### Task 20: Final Verification

- [ ] **Step 1: Run all unit tests**

Run: `npm run test`
Expected: All tests pass (previous 71 + new tests)

- [ ] **Step 2: Run all E2E tests**

Run: `npm run test:e2e`
Expected: All tests pass (previous 17 + new tests)

- [ ] **Step 3: Run lint and format**

Run: `npm run lint && npm run format:check`
Expected: No errors

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Manual smoke test**

1. Open dev server (`npm run dev`)
2. Verify 3 tabs: Stacks, Marketplace, AI
3. Add a stack (Smart Home) — verify 6 nodes with edges appear
4. Search in Marketplace — verify local results appear
5. Add a service from Marketplace — verify node appears
6. Verify undo/redo works for stack addition (single step)
7. Verify NetworkPanel is visible under Stacks tab
8. Verify AI tab still works

- [ ] **Step 6: Final commit if any fixes needed**
