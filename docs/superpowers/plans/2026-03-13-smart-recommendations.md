# Smart Recommendations (Phase 6) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a service is selected on the canvas, show related service recommendations in the ConfigPanel and allow one-click addition with auto-wired edges.

**Architecture:** Static recommendation graph (JSON) + pure engine function + position calculator + store action + UI component. No new dependencies. Follows existing patterns: pure functions in `src/lib/`, data in `src/data/`, UI in `src/components/panel/`.

**Tech Stack:** React, TypeScript, Zustand, Vitest, Playwright, Tailwind CSS

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/lib/recommendation-types.ts` | Create | Type definitions for recommendation system |
| `src/data/recommendation-graph.json` | Create | Static service relationship graph |
| `src/data/recommendation-defaults.ts` | Create | Default configs for non-preset recommended images |
| `src/lib/recommendation-engine.ts` | Create | Pure function: compute recommendations from graph |
| `src/lib/position-calculator.ts` | Create | Pure function: find non-overlapping node position |
| `src/lib/__tests__/recommendation-engine.test.ts` | Create | Unit tests for recommendation engine |
| `src/lib/__tests__/position-calculator.test.ts` | Create | Unit tests for position calculator |
| `src/store/types.ts` | Modify | Add `addRecommendedNode` to AppStore interface |
| `src/store/index.ts` | Modify | Implement `addRecommendedNode` action |
| `src/components/panel/RecommendationList.tsx` | Create | UI: recommendation list with add buttons |
| `src/components/panel/ConfigPanel.tsx` | Modify | Integrate RecommendationList at bottom |
| `tests/e2e/recommendations.spec.ts` | Create | E2E tests for recommendation flow |
| `docs/TYPES.md` | Modify | Add `addRecommendedNode` signature |

---

## Chunk 1: Data Layer + Types

### Task 1: Create recommendation types

**Files:**
- Create: `src/lib/recommendation-types.ts`

- [ ] **Step 1: Create types file**

```typescript
// src/lib/recommendation-types.ts
import type { PortMapping, VolumeMapping } from '../store/types';

export interface RecommendationDefault {
  image: string;
  ports?: PortMapping[];
  volumes?: VolumeMapping[];
  environment?: Record<string, string>;
}

export interface Recommendation {
  key: string;
  image: string;
  reason: string;
  alreadyExists: boolean;
}

export interface RecommendationGraphEntry {
  recommends: string[];
  reasons: Record<string, string>;
}

export type RecommendationGraph = Record<string, RecommendationGraphEntry>;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to recommendation-types.ts

- [ ] **Step 3: Commit**

```bash
git add src/lib/recommendation-types.ts
git commit -m "feat(phase6): add recommendation type definitions"
```

---

### Task 2: Create recommendation graph data

**Files:**
- Create: `src/data/recommendation-graph.json`

- [ ] **Step 1: Create the data directory and graph file**

```json
{
  "postgres": {
    "recommends": ["pgadmin", "redis", "node", "adminer"],
    "reasons": {
      "pgadmin": "Database yonetim arayuzu",
      "redis": "Cache katmani",
      "node": "Backend uygulama sunucusu",
      "adminer": "Hafif database yonetim araci"
    }
  },
  "nginx": {
    "recommends": ["node", "postgres", "certbot"],
    "reasons": {
      "node": "Reverse proxy arkasinda uygulama sunucusu",
      "postgres": "Veritabani katmani",
      "certbot": "SSL sertifika otomasyonu"
    }
  },
  "redis": {
    "recommends": ["node", "postgres", "redis-commander"],
    "reasons": {
      "node": "Cache kullanan uygulama sunucusu",
      "postgres": "Kalici veri katmani",
      "redis-commander": "Redis yonetim arayuzu"
    }
  },
  "node": {
    "recommends": ["postgres", "redis", "nginx", "mongo"],
    "reasons": {
      "postgres": "Iliskisel veritabani",
      "redis": "Cache ve session store",
      "nginx": "Reverse proxy / load balancer",
      "mongo": "NoSQL veritabani"
    }
  },
  "custom": {
    "recommends": [],
    "reasons": {}
  },
  "mongo": {
    "recommends": ["mongo-express", "node", "redis"],
    "reasons": {
      "mongo-express": "MongoDB yonetim arayuzu",
      "node": "Backend uygulama sunucusu",
      "redis": "Cache katmani"
    }
  },
  "rabbitmq": {
    "recommends": ["node", "postgres", "redis"],
    "reasons": {
      "node": "Message consumer uygulama",
      "postgres": "Kalici veri katmani",
      "redis": "Cache katmani"
    }
  },
  "elasticsearch": {
    "recommends": ["kibana", "logstash", "node"],
    "reasons": {
      "kibana": "Elasticsearch gorsellesstirme arayuzu",
      "logstash": "Log toplama ve issleme",
      "node": "Arama entegrasyonlu uygulama"
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/recommendation-graph.json
git commit -m "feat(phase6): add recommendation relationship graph"
```

---

### Task 3: Create recommendation defaults

**Files:**
- Create: `src/data/recommendation-defaults.ts`

- [ ] **Step 1: Create defaults file**

```typescript
// src/data/recommendation-defaults.ts
import type { RecommendationDefault } from '../lib/recommendation-types';

export const RECOMMENDATION_DEFAULTS: Record<string, RecommendationDefault> = {
  pgadmin: {
    image: 'dpage/pgadmin4',
    ports: [{ host: '5050', container: '80' }],
    environment: {
      PGADMIN_DEFAULT_EMAIL: 'admin@admin.com',
      PGADMIN_DEFAULT_PASSWORD: 'admin',
    },
  },
  adminer: {
    image: 'adminer',
    ports: [{ host: '8080', container: '8080' }],
  },
  certbot: {
    image: 'certbot/certbot',
    volumes: [
      { source: './certbot/conf', target: '/etc/letsencrypt' },
      { source: './certbot/www', target: '/var/www/certbot' },
    ],
  },
  mongo: {
    image: 'mongo:7',
    ports: [{ host: '27017', container: '27017' }],
    environment: {
      MONGO_INITDB_ROOT_USERNAME: 'root',
      MONGO_INITDB_ROOT_PASSWORD: 'password',
    },
  },
  'mongo-express': {
    image: 'mongo-express',
    ports: [{ host: '8081', container: '8081' }],
    environment: {
      ME_CONFIG_MONGODB_ADMINUSERNAME: 'root',
      ME_CONFIG_MONGODB_ADMINPASSWORD: 'password',
    },
  },
  'redis-commander': {
    image: 'rediscommander/redis-commander',
    ports: [{ host: '8082', container: '8081' }],
  },
  rabbitmq: {
    image: 'rabbitmq:3-management',
    ports: [
      { host: '5672', container: '5672' },
      { host: '15672', container: '15672' },
    ],
  },
  elasticsearch: {
    image: 'elasticsearch:8.12.0',
    ports: [{ host: '9200', container: '9200' }],
    environment: {
      'discovery.type': 'single-node',
      'xpack.security.enabled': 'false',
    },
  },
  kibana: {
    image: 'kibana:8.12.0',
    ports: [{ host: '5601', container: '5601' }],
  },
  logstash: {
    image: 'logstash:8.12.0',
    ports: [{ host: '5044', container: '5044' }],
  },
};
```

> Note: `redis-commander` host port changed to `8082` to avoid conflict with `mongo-express` (both had `8081`).

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/data/recommendation-defaults.ts
git commit -m "feat(phase6): add recommendation default configurations"
```

---

## Chunk 2: Recommendation Engine (TDD)

### Task 4: Write recommendation engine tests

**Files:**
- Create: `src/lib/__tests__/recommendation-engine.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/__tests__/recommendation-engine.test.ts
import { describe, it, expect } from 'vitest';
import { getRecommendations } from '../recommendation-engine';
import type { ServiceNodeData } from '../../store/types';
import type { RecommendationGraph } from '../recommendation-types';

const testGraph: RecommendationGraph = {
  postgres: {
    recommends: ['pgadmin', 'redis', 'node'],
    reasons: {
      pgadmin: 'DB admin UI',
      redis: 'Cache layer',
      node: 'App server',
    },
  },
  node: {
    recommends: ['postgres', 'redis'],
    reasons: {
      postgres: 'Database',
      redis: 'Cache',
    },
  },
  custom: {
    recommends: [],
    reasons: {},
  },
};

function makeNodeData(overrides: Partial<ServiceNodeData>): ServiceNodeData {
  return {
    serviceName: 'test',
    image: 'test:latest',
    preset: 'custom',
    ports: [],
    volumes: [],
    environment: {},
    networks: [],
    ...overrides,
  };
}

describe('getRecommendations', () => {
  it('returns recommendations for a known preset', () => {
    const data = makeNodeData({ preset: 'postgres', image: 'postgres:16-alpine' });
    const result = getRecommendations(data, [], testGraph as RecommendationGraph);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      key: 'pgadmin',
      image: 'dpage/pgadmin4',
      reason: 'DB admin UI',
      alreadyExists: false,
    });
  });

  it('matches by image base name when preset is custom', () => {
    const data = makeNodeData({ preset: 'custom', image: 'postgres:16-alpine' });
    const result = getRecommendations(data, [], testGraph as RecommendationGraph);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].key).toBe('pgadmin');
  });

  it('marks existing services as alreadyExists', () => {
    const data = makeNodeData({ preset: 'postgres', image: 'postgres:16-alpine' });
    const result = getRecommendations(data, [{ preset: 'redis', image: 'redis:7-alpine' }], testGraph);
    const redis = result.find((r) => r.key === 'redis');
    expect(redis?.alreadyExists).toBe(true);
    const pgadmin = result.find((r) => r.key === 'pgadmin');
    expect(pgadmin?.alreadyExists).toBe(false);
  });

  it('returns empty array for unknown service', () => {
    const data = makeNodeData({ preset: 'custom', image: 'unknown:latest' });
    const result = getRecommendations(data, [], testGraph as RecommendationGraph);
    expect(result).toEqual([]);
  });

  it('returns empty array for custom preset with no graph entry', () => {
    const data = makeNodeData({ preset: 'custom', image: '' });
    const result = getRecommendations(data, [], testGraph as RecommendationGraph);
    expect(result).toEqual([]);
  });

  it('limits results to max 5', () => {
    const bigGraph: RecommendationGraph = {
      postgres: {
        recommends: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        reasons: { a: 'r', b: 'r', c: 'r', d: 'r', e: 'r', f: 'r', g: 'r' },
      },
    };
    const data = makeNodeData({ preset: 'postgres' });
    const result = getRecommendations(data, [], bigGraph as RecommendationGraph);
    expect(result).toHaveLength(5);
  });

  it('uses PRESET_DEFAULTS image for known preset keys', () => {
    const data = makeNodeData({ preset: 'postgres', image: 'postgres:16-alpine' });
    const result = getRecommendations(data, [], testGraph as RecommendationGraph);
    const nodeRec = result.find((r) => r.key === 'node');
    expect(nodeRec?.image).toBe('node:20-alpine');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npx vitest run src/lib/__tests__/recommendation-engine.test.ts`
Expected: FAIL — module `../recommendation-engine` not found

---

### Task 5: Implement recommendation engine

**Files:**
- Create: `src/lib/recommendation-engine.ts`

- [ ] **Step 1: Implement the engine**

```typescript
// src/lib/recommendation-engine.ts
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
 * e.g., "postgres:16-alpine" → "postgres", "dpage/pgadmin4" → "pgadmin4"
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
```

- [ ] **Step 2: Run tests — verify they pass**

Run: `npx vitest run src/lib/__tests__/recommendation-engine.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/recommendation-engine.ts src/lib/__tests__/recommendation-engine.test.ts
git commit -m "feat(phase6): add recommendation engine with tests"
```

---

## Chunk 3: Position Calculator (TDD)

### Task 6: Write position calculator tests

**Files:**
- Create: `src/lib/__tests__/position-calculator.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/__tests__/position-calculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculateRecommendedPosition } from '../position-calculator';

describe('calculateRecommendedPosition', () => {
  it('returns base offset position when no existing nodes', () => {
    const pos = calculateRecommendedPosition({ x: 100, y: 200 }, [], 0);
    expect(pos).toEqual({ x: 350, y: 200 });
  });

  it('offsets vertically for subsequent recommendations', () => {
    const pos = calculateRecommendedPosition({ x: 100, y: 200 }, [], 2);
    expect(pos).toEqual({ x: 350, y: 500 });
  });

  it('shifts down when overlapping an existing node', () => {
    const existing = [{ x: 350, y: 200 }];
    const pos = calculateRecommendedPosition({ x: 100, y: 200 }, existing, 0);
    // Should shift Y by +150 to avoid the overlap
    expect(pos.x).toBe(350);
    expect(pos.y).toBeGreaterThan(200);
  });

  it('handles multiple overlaps by shifting repeatedly', () => {
    const existing = [
      { x: 350, y: 200 },
      { x: 350, y: 350 },
    ];
    const pos = calculateRecommendedPosition({ x: 100, y: 200 }, existing, 0);
    expect(pos.x).toBe(350);
    expect(pos.y).toBeGreaterThanOrEqual(500);
  });

  it('stops after max iterations and returns best position', () => {
    // 10+ stacked nodes — should not infinite loop
    const existing = Array.from({ length: 15 }, (_, i) => ({ x: 350, y: i * 150 }));
    const pos = calculateRecommendedPosition({ x: 100, y: 0 }, existing, 0);
    expect(pos.x).toBe(350);
    expect(typeof pos.y).toBe('number');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npx vitest run src/lib/__tests__/position-calculator.test.ts`
Expected: FAIL — module not found

---

### Task 7: Implement position calculator

**Files:**
- Create: `src/lib/position-calculator.ts`

- [ ] **Step 1: Implement the function**

```typescript
// src/lib/position-calculator.ts

const X_OFFSET = 250;
const Y_SPACING = 150;
const BBOX_WIDTH = 200;
const BBOX_HEIGHT = 100;
const MAX_ITERATIONS = 10;

function hasOverlap(
  pos: { x: number; y: number },
  existing: { x: number; y: number }[],
): boolean {
  return existing.some(
    (e) =>
      Math.abs(pos.x - e.x) < BBOX_WIDTH && Math.abs(pos.y - e.y) < BBOX_HEIGHT,
  );
}

export function calculateRecommendedPosition(
  sourcePosition: { x: number; y: number },
  existingPositions: { x: number; y: number }[],
  index: number,
): { x: number; y: number } {
  const candidate = {
    x: sourcePosition.x + X_OFFSET,
    y: sourcePosition.y + index * Y_SPACING,
  };

  let iterations = 0;
  while (hasOverlap(candidate, existingPositions) && iterations < MAX_ITERATIONS) {
    candidate.y += Y_SPACING;
    iterations++;
  }

  return { x: candidate.x, y: candidate.y };
}
```

- [ ] **Step 2: Run tests — verify they pass**

Run: `npx vitest run src/lib/__tests__/position-calculator.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/position-calculator.ts src/lib/__tests__/position-calculator.test.ts
git commit -m "feat(phase6): add position calculator with tests"
```

---

## Chunk 4: Store Action + UI Integration

### Task 8: Add store action

**Files:**
- Modify: `src/store/types.ts:75-108` — add `addRecommendedNode` to AppStore
- Modify: `src/store/index.ts` — implement action
- Modify: `docs/TYPES.md` — add signature

- [ ] **Step 1: Add action to AppStore interface in `src/store/types.ts`**

After line 107 (`importCompose: (result: ParseResult) => void;`), add:

```typescript
  // Recommendations
  addRecommendedNode: (key: string, sourceNodeId: string, position: { x: number; y: number }) => void;
```

- [ ] **Step 2: Add the same line to `docs/TYPES.md`**

In the AppStore section, after `importCompose`, add the same signature.

- [ ] **Step 3: Implement action in `src/store/index.ts`**

Add imports at top of file:

```typescript
import { PRESET_DEFAULTS } from './types';
import type { PresetImageKey } from './types';
import { RECOMMENDATION_DEFAULTS } from '../data/recommendation-defaults';
```

Note: `PRESET_DEFAULTS` import already exists. Only add `RECOMMENDATION_DEFAULTS`.

After the `importCompose` action (after line 155), add:

```typescript
      // Recommendations
      addRecommendedNode: (key: string, sourceNodeId: string, position: { x: number; y: number }) => {
        const presetKeys = ['nginx', 'postgres', 'redis', 'node', 'custom'] as const;
        const isPreset = presetKeys.includes(key as PresetImageKey);
        const preset: PresetImageKey = isPreset ? (key as PresetImageKey) : 'custom';
        const defaults = isPreset ? PRESET_DEFAULTS[key as PresetImageKey] : RECOMMENDATION_DEFAULTS[key];

        const id = generateId();
        const node = {
          id,
          type: 'serviceNode' as const,
          position,
          data: {
            serviceName: `${key}-${id.slice(0, 4)}`,
            image: defaults?.image ?? key,
            preset,
            ports: defaults?.ports ? [...defaults.ports] : [],
            volumes: defaults?.volumes ? [...defaults.volumes] : [],
            environment: defaults?.environment ? { ...defaults.environment } : {},
            networks: [],
          } satisfies ServiceNodeData,
        };

        set((state) => {
          const newNodes = [...state.nodes, node];

          // Auto-create default network if needed
          let newNetworks = state.networks;
          if (!state.networks.some((n) => n.name === 'default')) {
            newNetworks = [...state.networks, { name: 'default', driver: 'bridge' }];
          }

          // Add both source and new node to default network
          const updatedNodes = newNodes.map((n) => {
            if ((n.id === sourceNodeId || n.id === id) && !n.data.networks.includes('default')) {
              return { ...n, data: { ...n.data, networks: [...n.data.networks, 'default'] } };
            }
            return n;
          });

          const edgeId = generateId();
          const newEdge: DependencyEdge = {
            id: edgeId,
            source: sourceNodeId,
            target: id,
            type: 'dependencyEdge',
          };

          return {
            nodes: updatedNodes,
            edges: [...state.edges, newEdge],
            networks: newNetworks,
          };
        });
      },
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/store/types.ts src/store/index.ts docs/TYPES.md
git commit -m "feat(phase6): add addRecommendedNode store action"
```

---

### Task 9: Create RecommendationList component

**Files:**
- Create: `src/components/panel/RecommendationList.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/panel/RecommendationList.tsx
import { useStore } from '../../store';
import { getRecommendations } from '../../lib/recommendation-engine';
import { calculateRecommendedPosition } from '../../lib/position-calculator';
import graph from '../../data/recommendation-graph.json';
import type { RecommendationGraph } from '../../lib/recommendation-types';

export function RecommendationList() {
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const nodes = useStore((s) => s.nodes);
  const addRecommendedNode = useStore((s) => s.addRecommendedNode);

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const existingNodes = nodes.map((n) => ({ preset: n.data.preset, image: n.data.image }));
  const recommendations = getRecommendations(
    node.data,
    existingNodes,
    graph as RecommendationGraph,
  );

  if (recommendations.length === 0) return null;

  const handleAdd = (key: string, index: number) => {
    const existingPositions = nodes.map((n) => n.position);
    const position = calculateRecommendedPosition(node.position, existingPositions, index);
    addRecommendedNode(key, node.id, position);
  };

  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
        Recommended Services
      </h4>
      <div className="space-y-2">
        {recommendations.map((rec, idx) => (
          <div
            key={rec.key}
            className="flex items-center justify-between rounded border border-gray-700 bg-gray-800/50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm text-gray-200">{rec.image}</span>
              <span className="text-xs text-gray-500">{rec.reason}</span>
            </div>
            <button
              disabled={rec.alreadyExists}
              onClick={() => handleAdd(rec.key, idx)}
              className={`ml-2 shrink-0 rounded px-2 py-1 text-xs transition-colors ${
                rec.alreadyExists
                  ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {rec.alreadyExists ? 'Added' : '+ Add'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/panel/RecommendationList.tsx
git commit -m "feat(phase6): add RecommendationList UI component"
```

---

### Task 10: Integrate RecommendationList into ConfigPanel

**Files:**
- Modify: `src/components/panel/ConfigPanel.tsx:200` — add import + component

- [ ] **Step 1: Add import at top of ConfigPanel.tsx**

After existing imports, add:

```typescript
import { RecommendationList } from './RecommendationList';
```

- [ ] **Step 2: Add RecommendationList before closing `</div>`**

Before the final `</div>` (line 200), add:

```tsx
      {/* Recommendations */}
      <RecommendationList />
```

- [ ] **Step 3: Verify app builds**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/panel/ConfigPanel.tsx
git commit -m "feat(phase6): integrate recommendations into ConfigPanel"
```

---

## Chunk 5: E2E Tests + Final Verification

### Task 11: Write E2E tests

**Files:**
- Create: `tests/e2e/recommendations.spec.ts`

- [ ] **Step 1: Write E2E tests**

```typescript
// tests/e2e/recommendations.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Smart Recommendations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear any persisted state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('shows recommendations when a postgres node is selected', async ({ page }) => {
    // Drag postgres preset to canvas
    const preset = page.locator('[data-preset="postgres"]');
    const canvas = page.locator('.react-flow');
    await preset.dragTo(canvas);

    // Click the node to select it
    const node = page.locator('.react-flow__node').first();
    await node.click();

    // Recommendations section should appear
    await expect(page.locator('text=Recommended Services')).toBeVisible();
    await expect(page.locator('text=dpage/pgadmin4')).toBeVisible();
  });

  test('adds recommended service and creates edge', async ({ page }) => {
    // Add postgres node
    const preset = page.locator('[data-preset="postgres"]');
    const canvas = page.locator('.react-flow');
    await preset.dragTo(canvas);

    // Select it
    const node = page.locator('.react-flow__node').first();
    await node.click();

    // Click add on pgadmin recommendation
    const addBtn = page.locator('button:has-text("+ Add")').first();
    await addBtn.click();

    // Should now have 2 nodes and 1 edge
    const nodes = page.locator('.react-flow__node');
    await expect(nodes).toHaveCount(2);

    const edges = page.locator('.react-flow__edge');
    await expect(edges).toHaveCount(1);
  });

  test('shows "Added" for already-existing services', async ({ page }) => {
    // Add postgres node
    const preset = page.locator('[data-preset="postgres"]');
    const canvas = page.locator('.react-flow');
    await preset.dragTo(canvas);

    // Select it and add pgadmin
    const node = page.locator('.react-flow__node').first();
    await node.click();

    const addBtn = page.locator('button:has-text("+ Add")').first();
    await addBtn.click();

    // Re-select postgres node
    await node.click();

    // pgadmin should now show "Added"
    await expect(page.locator('button:has-text("Added")')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `npx playwright test tests/e2e/recommendations.spec.ts`
Expected: All 3 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/recommendations.spec.ts
git commit -m "test(phase6): add E2E tests for smart recommendations"
```

---

### Task 12: Run full test suite and update STATUS.md

**Files:**
- Modify: `docs/STATUS.md`

- [ ] **Step 1: Run all unit tests**

Run: `npm run test`
Expected: All tests pass (existing 49 + new ~12 = ~61)

- [ ] **Step 2: Run all E2E tests**

Run: `npm run test:e2e`
Expected: All tests pass (existing 14 + new 3 = ~17)

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Update STATUS.md**

Add Phase 6 to Post-MVP Progress table:

```markdown
| Smart Recommendations (Phase 6) | ✅ Done | recommendation-engine, position-calculator, RecommendationList, addRecommendedNode |
```

Update session notes and totals.

- [ ] **Step 5: Final commit**

```bash
git add docs/STATUS.md
git commit -m "docs: update STATUS.md for Phase 6 completion"
```
