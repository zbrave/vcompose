# MCP Server (Phase 7) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone MCP server that exposes docker-compose generation, validation, parsing, and recommendations as tools for AI assistants.

**Architecture:** Monorepo package (`packages/mcp-server/`) using `@modelcontextprotocol/sdk` with stdio transport. Reuses existing pure functions from `src/lib/` via relative imports, bundled with `tsup` for publishing. 4 tools: generate-compose, validate-compose, parse-compose, get-recommendations.

**Tech Stack:** TypeScript, @modelcontextprotocol/sdk, zod v4, tsup, Vitest

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `package.json` (root) | Modify | Add `workspaces` field |
| `packages/mcp-server/package.json` | Create | MCP server package config |
| `packages/mcp-server/tsconfig.json` | Create | TypeScript config with path aliases |
| `packages/mcp-server/tsup.config.ts` | Create | Bundle config |
| `packages/mcp-server/bin/mcp-server.js` | Create | CLI entry point |
| `packages/mcp-server/src/index.ts` | Create | MCP server: transport + tool registration |
| `packages/mcp-server/src/tools/generate-compose.ts` | Create | generate-compose tool handler |
| `packages/mcp-server/src/tools/validate-compose.ts` | Create | validate-compose tool handler |
| `packages/mcp-server/src/tools/parse-compose.ts` | Create | parse-compose tool handler |
| `packages/mcp-server/src/tools/get-recommendations.ts` | Create | get-recommendations tool handler |
| `packages/mcp-server/__tests__/generate-compose.test.ts` | Create | Unit tests for generate-compose |
| `packages/mcp-server/__tests__/validate-compose.test.ts` | Create | Unit tests for validate-compose |

---

## Chunk 1: Package Scaffold

### Task 1: Create package structure and configs

**Files:**
- Modify: `package.json` (root)
- Create: `packages/mcp-server/package.json`
- Create: `packages/mcp-server/tsconfig.json`
- Create: `packages/mcp-server/tsup.config.ts`
- Create: `packages/mcp-server/bin/mcp-server.js`

- [ ] **Step 1: Add workspaces to root package.json**

Add `"workspaces"` field to root `package.json`:

```json
"workspaces": ["packages/*"]
```

- [ ] **Step 2: Create packages/mcp-server/package.json**

```json
{
  "name": "docker-compose-mcp",
  "version": "1.0.0",
  "type": "module",
  "description": "MCP server for docker-compose.yml generation and analysis",
  "bin": {
    "docker-compose-mcp": "./bin/mcp-server.js"
  },
  "main": "dist/index.js",
  "files": ["dist", "bin"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "dev": "node bin/mcp-server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "yaml": "^2.7.1",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "vitest": "^3.2.0",
    "typescript": "^5.8.0"
  }
}
```

- [ ] **Step 3: Create packages/mcp-server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true,
    "paths": {
      "@vdc/lib/*": ["../../src/lib/*"],
      "@vdc/store/*": ["../../src/store/*"],
      "@vdc/data/*": ["../../src/data/*"]
    }
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 4: Create packages/mcp-server/tsup.config.ts**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['@modelcontextprotocol/sdk', 'yaml', 'zod'],
  alias: {
    '@vdc/lib': '../../src/lib',
    '@vdc/store': '../../src/store',
    '@vdc/data': '../../src/data',
  },
});
```

- [ ] **Step 5: Create packages/mcp-server/bin/mcp-server.js**

```javascript
#!/usr/bin/env node
import '../dist/index.js';
```

- [ ] **Step 6: Install dependencies**

Run: `cd packages/mcp-server && npm install`
Expected: Dependencies install successfully

- [ ] **Step 7: Commit**

```bash
git add package.json packages/mcp-server/package.json packages/mcp-server/tsconfig.json packages/mcp-server/tsup.config.ts packages/mcp-server/bin/mcp-server.js
git commit -m "feat(phase7): scaffold MCP server package"
```

---

## Chunk 2: Tool Handlers (TDD)

### Task 2: Write generate-compose tests

**Files:**
- Create: `packages/mcp-server/__tests__/generate-compose.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/mcp-server/__tests__/generate-compose.test.ts
import { describe, it, expect } from 'vitest';
import { handleGenerateCompose } from '../src/tools/generate-compose';

describe('handleGenerateCompose', () => {
  it('generates YAML for known presets', async () => {
    const result = await handleGenerateCompose({ services: ['postgres', 'redis'] });
    expect(result.yaml).toContain('postgres:');
    expect(result.yaml).toContain('redis:');
    expect(result.yaml).toContain('image: postgres:16-alpine');
    expect(result.yaml).toContain('image: redis:7-alpine');
  });

  it('generates YAML for unknown services with fallback', async () => {
    const result = await handleGenerateCompose({ services: ['myapp'] });
    expect(result.yaml).toContain('myapp:');
    expect(result.yaml).toContain('image: myapp');
  });

  it('auto-detects edges from recommendation graph', async () => {
    const result = await handleGenerateCompose({ services: ['node', 'postgres', 'redis'] });
    // node recommends postgres and redis, so node should depend on them
    expect(result.yaml).toContain('depends_on:');
  });

  it('creates default network when edges exist', async () => {
    const result = await handleGenerateCompose({ services: ['node', 'postgres'] });
    expect(result.yaml).toContain('networks:');
    expect(result.yaml).toContain('default:');
  });

  it('returns validation issues alongside YAML', async () => {
    const result = await handleGenerateCompose({ services: ['postgres', 'redis'] });
    expect(Array.isArray(result.validation)).toBe(true);
  });

  it('returns error for empty services list', async () => {
    const result = await handleGenerateCompose({ services: [] });
    expect(result.yaml).toBe('');
    expect(result.validation.length).toBeGreaterThan(0);
    expect(result.validation[0].severity).toBe('error');
    expect(result.validation[0].message).toContain('service');
  });

  it('generates YAML for recommendation-defaults services', async () => {
    const result = await handleGenerateCompose({ services: ['mongo', 'pgadmin'] });
    expect(result.yaml).toContain('image: mongo:7');
    expect(result.yaml).toContain('image: dpage/pgadmin4');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd packages/mcp-server && npx vitest run __tests__/generate-compose.test.ts`
Expected: FAIL — module not found

---

### Task 3: Implement generate-compose handler

**Files:**
- Create: `packages/mcp-server/src/tools/generate-compose.ts`

- [ ] **Step 1: Create the handler**

```typescript
// packages/mcp-server/src/tools/generate-compose.ts
import { buildYaml } from '../../src/lib/yaml-builder';
import { validate } from '../../src/lib/validator';
import { PRESET_DEFAULTS } from '../../src/store/types';
import type { PresetImageKey, ServiceNode, DependencyEdge, NetworkConfig, ServiceNodeData } from '../../src/store/types';
import { RECOMMENDATION_DEFAULTS } from '../../src/data/recommendation-defaults';
import graph from '../../src/data/recommendation-graph.json';
import type { RecommendationGraph } from '../../src/lib/recommendation-types';

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
        // serviceName recommends `recommended`, meaning serviceName depends on recommended
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

  // Deduplicate: same source-target pair
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
  const { services, version = '3.8' } = input;

  if (services.length === 0) {
    return {
      yaml: '',
      validation: [{ severity: 'error', message: 'At least one service is required' }],
    };
  }

  // Build nodes
  const nodes: ServiceNode[] = [];
  const nodeMap = new Map<string, string>(); // serviceName → nodeId

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

  // Auto-detect edges
  const edges = autoDetectEdges(services, nodeMap);

  // Add default network if edges exist
  const networks: NetworkConfig[] = [];
  if (edges.length > 0) {
    networks.push({ name: 'default', driver: 'bridge' });
    // Add both endpoints to default network
    for (const edge of edges) {
      for (const node of nodes) {
        if ((node.id === edge.source || node.id === edge.target) && !node.data.networks.includes('default')) {
          node.data.networks.push('default');
        }
      }
    }
  }

  // Generate YAML
  const yaml = buildYaml({ nodes, edges, networks, namedVolumes: [] });

  // Validate
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
```

- [ ] **Step 2: Create vitest config for mcp-server**

Create `packages/mcp-server/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@vdc/lib': path.resolve(__dirname, '../../src/lib'),
      '@vdc/store': path.resolve(__dirname, '../../src/store'),
      '@vdc/data': path.resolve(__dirname, '../../src/data'),
    },
  },
  test: {
    root: '.',
  },
});
```

Note: The tool handler imports use relative paths (`../../src/lib/...`) which work directly for both vitest and tsup. The path aliases are optional ergonomic sugar — relative paths are the primary approach.

- [ ] **Step 3: Run tests — verify they pass**

Run: `cd packages/mcp-server && npx vitest run __tests__/generate-compose.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 4: Commit**

```bash
git add packages/mcp-server/src/tools/generate-compose.ts packages/mcp-server/__tests__/generate-compose.test.ts packages/mcp-server/vitest.config.ts
git commit -m "feat(phase7): add generate-compose tool handler with tests"
```

---

### Task 4: Write validate-compose tests and implement

**Files:**
- Create: `packages/mcp-server/__tests__/validate-compose.test.ts`
- Create: `packages/mcp-server/src/tools/validate-compose.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/mcp-server/__tests__/validate-compose.test.ts
import { describe, it, expect } from 'vitest';
import { handleValidateCompose } from '../src/tools/validate-compose';

describe('handleValidateCompose', () => {
  it('validates correct YAML', async () => {
    const yaml = `
version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
`;
    const result = await handleValidateCompose({ yaml });
    expect(result.valid).toBe(true);
    expect(result.services).toContain('postgres');
  });

  it('returns parse errors for invalid YAML', async () => {
    const result = await handleValidateCompose({ yaml: '{{invalid yaml' });
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('detects semantic errors', async () => {
    const yaml = `
version: "3.8"
services:
  myapp:
    image: ""
`;
    const result = await handleValidateCompose({ yaml });
    // Empty image should produce a warning
    expect(result.issues.some((i) => i.severity === 'warning')).toBe(true);
  });

  it('lists service names', async () => {
    const yaml = `
version: "3.8"
services:
  web:
    image: nginx
  db:
    image: postgres
`;
    const result = await handleValidateCompose({ yaml });
    expect(result.services).toContain('web');
    expect(result.services).toContain('db');
  });
});
```

- [ ] **Step 2: Implement handler**

```typescript
// packages/mcp-server/src/tools/validate-compose.ts
import { parseYaml } from '../../src/lib/yaml-parser';
import { validate } from '../../src/lib/validator';

export interface ValidateComposeInput {
  yaml: string;
}

export interface ValidateComposeOutput {
  valid: boolean;
  issues: Array<{ severity: string; message: string; field?: string }>;
  services: string[];
}

export async function handleValidateCompose(
  input: ValidateComposeInput,
): Promise<ValidateComposeOutput> {
  const { yaml } = input;

  const parseResult = parseYaml(yaml);

  if (!parseResult.success) {
    return {
      valid: false,
      issues: parseResult.errors.map((e) => ({ severity: 'error', message: e })),
      services: [],
    };
  }

  const validationIssues = validate({
    nodes: parseResult.nodes,
    edges: parseResult.edges,
  });

  const hasErrors = validationIssues.some((i) => i.severity === 'error');
  const services = parseResult.nodes.map((n) => n.data.serviceName);

  return {
    valid: !hasErrors,
    issues: validationIssues.map((i) => ({
      severity: i.severity,
      message: i.message,
      ...(i.field && { field: i.field }),
    })),
    services,
  };
}
```

- [ ] **Step 3: Run tests — verify they pass**

Run: `cd packages/mcp-server && npx vitest run __tests__/validate-compose.test.ts`
Expected: All 4 tests PASS

- [ ] **Step 4: Commit**

```bash
git add packages/mcp-server/src/tools/validate-compose.ts packages/mcp-server/__tests__/validate-compose.test.ts
git commit -m "feat(phase7): add validate-compose tool handler with tests"
```

---

### Task 5: Implement parse-compose and get-recommendations handlers

**Files:**
- Create: `packages/mcp-server/src/tools/parse-compose.ts`
- Create: `packages/mcp-server/src/tools/get-recommendations.ts`

- [ ] **Step 1: Create parse-compose handler**

```typescript
// packages/mcp-server/src/tools/parse-compose.ts
import { parseYaml } from '../../src/lib/yaml-parser';

export interface ParseComposeInput {
  yaml: string;
}

export interface ParsedService {
  name: string;
  image: string;
  ports: string[];
  environment: Record<string, string>;
  dependsOn: string[];
  networks: string[];
}

export interface ParseComposeOutput {
  success: boolean;
  services: ParsedService[];
  networks: Array<{ name: string; driver: string }>;
  volumes: Array<{ name: string }>;
  errors: string[];
}

export async function handleParseCompose(
  input: ParseComposeInput,
): Promise<ParseComposeOutput> {
  const { yaml } = input;
  const result = parseYaml(yaml);

  if (!result.success) {
    return {
      success: false,
      services: [],
      networks: [],
      volumes: [],
      errors: result.errors,
    };
  }

  const services: ParsedService[] = result.nodes.map((node) => {
    const deps = result.edges
      .filter((e) => e.target === node.id)
      .map((e) => {
        const src = result.nodes.find((n) => n.id === e.source);
        return src?.data.serviceName ?? '';
      })
      .filter(Boolean);

    return {
      name: node.data.serviceName,
      image: node.data.image,
      ports: node.data.ports.map((p) => `${p.host}:${p.container}`),
      environment: { ...node.data.environment },
      dependsOn: deps,
      networks: [...node.data.networks],
    };
  });

  return {
    success: true,
    services,
    networks: result.networks.map((n) => ({ name: n.name, driver: n.driver })),
    volumes: result.namedVolumes.map((v) => ({ name: v.name })),
    errors: [],
  };
}
```

- [ ] **Step 2: Create get-recommendations handler**

```typescript
// packages/mcp-server/src/tools/get-recommendations.ts
import { getRecommendations } from '../../src/lib/recommendation-engine';
import graph from '../../src/data/recommendation-graph.json';
import type { RecommendationGraph } from '../../src/lib/recommendation-types';
import type { ServiceNodeData } from '../../src/store/types';

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

  // Build a minimal ServiceNodeData for the engine
  const nodeData: ServiceNodeData = {
    serviceName: service,
    image: service,
    preset: 'custom',
    ports: [],
    volumes: [],
    environment: {},
    networks: [],
  };

  // Check if service matches a known preset
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
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd packages/mcp-server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/mcp-server/src/tools/parse-compose.ts packages/mcp-server/src/tools/get-recommendations.ts
git commit -m "feat(phase7): add parse-compose and get-recommendations handlers"
```

---

## Chunk 3: MCP Server Entry Point + Build

### Task 6: Create MCP server index.ts

**Files:**
- Create: `packages/mcp-server/src/index.ts`

- [ ] **Step 1: Create the server entry point**

```typescript
// packages/mcp-server/src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { handleGenerateCompose } from './tools/generate-compose.js';
import { handleValidateCompose } from './tools/validate-compose.js';
import { handleParseCompose } from './tools/parse-compose.js';
import { handleGetRecommendations } from './tools/get-recommendations.js';

const server = new McpServer({
  name: 'docker-compose-mcp',
  version: '1.0.0',
});

// Tool 1: generate-compose
server.registerTool(
  'generate-compose',
  {
    title: 'Generate Docker Compose',
    description: 'Generate a docker-compose.yml from a list of service names. Automatically configures images, ports, environment variables, dependencies, and networks.',
    inputSchema: z.object({
      services: z.array(z.string()).describe('Service names (e.g., ["postgres", "redis", "node"])'),
      version: z.string().optional().describe('docker-compose version (default: 3.8)'),
    }),
  },
  async ({ services, version }) => {
    const result = await handleGenerateCompose({ services, version });
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  },
);

// Tool 2: validate-compose
server.registerTool(
  'validate-compose',
  {
    title: 'Validate Docker Compose',
    description: 'Validate a docker-compose.yml file. Returns semantic errors and warnings.',
    inputSchema: z.object({
      yaml: z.string().describe('docker-compose.yml content'),
    }),
  },
  async ({ yaml }) => {
    const result = await handleValidateCompose({ yaml });
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  },
);

// Tool 3: parse-compose
server.registerTool(
  'parse-compose',
  {
    title: 'Parse Docker Compose',
    description: 'Parse a docker-compose.yml into structured data. Returns services, networks, volumes, and dependencies.',
    inputSchema: z.object({
      yaml: z.string().describe('docker-compose.yml content'),
    }),
  },
  async ({ yaml }) => {
    const result = await handleParseCompose({ yaml });
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  },
);

// Tool 4: get-recommendations
server.registerTool(
  'get-recommendations',
  {
    title: 'Get Service Recommendations',
    description: 'Get recommended companion services for a given service. E.g., "postgres" recommends pgadmin, redis, node.',
    inputSchema: z.object({
      service: z.string().describe('Service name (e.g., "postgres")'),
      existing: z.array(z.string()).optional().describe('Already-used services to exclude'),
    }),
  },
  async ({ service, existing }) => {
    const result = await handleGetRecommendations({ service, existing });
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  },
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('docker-compose-mcp server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

- [ ] **Step 2: Build with tsup**

Run: `cd packages/mcp-server && npx tsup`
Expected: Build succeeds, `dist/index.js` created

- [ ] **Step 3: Test binary runs**

Run: `echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node packages/mcp-server/bin/mcp-server.js`
Expected: JSON-RPC response with server capabilities (may need to adjust based on actual protocol)

- [ ] **Step 4: Commit**

```bash
git add packages/mcp-server/src/index.ts
git commit -m "feat(phase7): add MCP server entry point with 4 tools"
```

---

## Chunk 4: Full Test Suite + Build Verification

### Task 7: Run all tests and verify build

**Files:**
- Modify: `docs/STATUS.md`

- [ ] **Step 1: Run MCP server unit tests**

Run: `cd packages/mcp-server && npx vitest run`
Expected: All tests pass (7 generate + 4 validate = 11)

- [ ] **Step 2: Run main project unit tests (not broken)**

Run: `npm run test` (from root)
Expected: All 61 existing tests still pass

- [ ] **Step 3: Build MCP server**

Run: `cd packages/mcp-server && npx tsup`
Expected: Build succeeds

- [ ] **Step 4: Build main project (not broken)**

Run: `npm run build` (from root)
Expected: Build succeeds

- [ ] **Step 5: Update STATUS.md**

Add Phase 7 to Post-MVP Progress table:

```markdown
| MCP Server (Phase 7) | ✅ Done | 4 tools: generate-compose, validate-compose, parse-compose, get-recommendations |
```

Update session notes and totals.

- [ ] **Step 6: Final commit**

```bash
git add docs/STATUS.md
git commit -m "docs: update STATUS.md for Phase 7 completion"
```
