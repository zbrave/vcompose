# Phase 8: AI-Powered Generation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI-powered docker-compose generation and optimization using Vercel AI SDK with 4 LLM providers (Anthropic, OpenAI, Gemini, GLM), accessible via Web UI sidebar tab and MCP server tool.

**Architecture:** Pure functions in `src/lib/ai/` handle provider creation, prompt building, and YAML extraction. Separate Zustand store (`ai-store.ts`) manages AI config with localStorage persistence. Web UI adds sidebar tab with provider/key/prompt inputs. MCP server gets new `ai-generate-compose` tool reusing the same pure functions.

**Tech Stack:** Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`), TypeScript, Zustand, React, Vitest

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `package.json` (root) | Modify | Add AI SDK dependencies |
| `src/lib/ai/ai-types.ts` | Create | Type definitions: AIProviderKey, AIConfig, AIGenerateResult, DEFAULT_MODELS |
| `src/lib/ai/yaml-extractor.ts` | Create | Extract YAML from LLM response text |
| `src/lib/ai/prompt-templates.ts` | Create | System/user prompt builders for generate and optimize |
| `src/lib/ai/ai-provider.ts` | Create | Provider factory, generateCompose(), optimizeCompose() |
| `src/lib/__tests__/yaml-extractor.test.ts` | Create | Unit tests for YAML extraction |
| `src/lib/__tests__/ai-provider.test.ts` | Create | Unit tests with mocked generateText |
| `src/store/ai-store.ts` | Create | Zustand store for AI config, persist middleware |
| `src/components/sidebar/AISidebar.tsx` | Create | AI tab UI: provider, key, model, prompt, buttons |
| `src/components/sidebar/SidebarTabs.tsx` | Create | Tab switcher: Services / AI |
| `src/App.tsx` | Modify | Replace inline sidebar with SidebarTabs |
| `packages/mcp-server/src/tools/ai-generate-compose.ts` | Create | MCP tool handler |
| `packages/mcp-server/__tests__/ai-generate-compose.test.ts` | Create | MCP tool tests |
| `packages/mcp-server/src/index.ts` | Modify | Register ai-generate-compose tool |
| `docs/TYPES.md` | Modify | Add AI type definitions |
| `docs/STATUS.md` | Modify | Add Phase 8 completion |

---

## Chunk 1: Dependencies + Pure Functions

### Task 1: Install AI SDK dependencies

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Install dependencies**

Run: `npm install ai @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/google`
Expected: Dependencies install successfully

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(phase8): add Vercel AI SDK dependencies"
```

---

### Task 2: Create AI types and YAML extractor with tests (TDD)

**Files:**
- Create: `src/lib/ai/ai-types.ts`
- Create: `src/lib/ai/yaml-extractor.ts`
- Create: `src/lib/__tests__/yaml-extractor.test.ts`

- [ ] **Step 1: Create ai-types.ts**

```typescript
// src/lib/ai/ai-types.ts
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

export const DEFAULT_MODELS: Record<AIProviderKey, string> = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4.1',
  gemini: 'gemini-2.5-flash',
  glm: 'glm-4.7',
};

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4.1',
};
```

- [ ] **Step 2: Write yaml-extractor failing tests**

```typescript
// src/lib/__tests__/yaml-extractor.test.ts
import { describe, it, expect } from 'vitest';
import { extractYaml } from '../ai/yaml-extractor';

describe('extractYaml', () => {
  it('extracts YAML from ```yaml code block', () => {
    const response = 'Here is the compose:\n```yaml\nversion: "3.8"\nservices:\n  web:\n    image: nginx\n```\nDone!';
    expect(extractYaml(response)).toBe('version: "3.8"\nservices:\n  web:\n    image: nginx');
  });

  it('extracts YAML from ``` code block without language', () => {
    const response = 'Result:\n```\nversion: "3.8"\nservices:\n  db:\n    image: postgres\n```';
    expect(extractYaml(response)).toBe('version: "3.8"\nservices:\n  db:\n    image: postgres');
  });

  it('returns full text when no code block found', () => {
    const response = 'version: "3.8"\nservices:\n  web:\n    image: nginx';
    expect(extractYaml(response)).toBe(response);
  });

  it('returns empty string for empty input', () => {
    expect(extractYaml('')).toBe('');
  });

  it('extracts first code block when multiple exist', () => {
    const response = '```yaml\nfirst: true\n```\n```yaml\nsecond: true\n```';
    expect(extractYaml(response)).toBe('first: true');
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

Run: `npx vitest run src/lib/__tests__/yaml-extractor.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement yaml-extractor.ts**

```typescript
// src/lib/ai/yaml-extractor.ts
export function extractYaml(response: string): string {
  if (!response) return '';

  // Try ```yaml ... ``` first
  const yamlMatch = response.match(/```yaml\n([\s\S]*?)```/);
  if (yamlMatch) return yamlMatch[1].trim();

  // Try ``` ... ``` without language
  const codeMatch = response.match(/```\n([\s\S]*?)```/);
  if (codeMatch) return codeMatch[1].trim();

  // Return full text as fallback
  return response;
}
```

- [ ] **Step 5: Run tests — verify they pass**

Run: `npx vitest run src/lib/__tests__/yaml-extractor.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/ai-types.ts src/lib/ai/yaml-extractor.ts src/lib/__tests__/yaml-extractor.test.ts
git commit -m "feat(phase8): add AI types and YAML extractor with tests"
```

---

### Task 3: Create prompt templates and AI provider with tests (TDD)

**Files:**
- Create: `src/lib/ai/prompt-templates.ts`
- Create: `src/lib/ai/ai-provider.ts`
- Create: `src/lib/__tests__/ai-provider.test.ts`

- [ ] **Step 1: Create prompt-templates.ts**

```typescript
// src/lib/ai/prompt-templates.ts
export const GENERATE_SYSTEM_PROMPT = `You are a Docker Compose expert. Generate valid docker-compose.yml files.
Rules:
- Use version "3.8"
- Use specific image tags (not :latest)
- Add appropriate environment variables
- Set up depends_on relationships
- Return ONLY the YAML inside a \`\`\`yaml code block, no explanations.`;

export const OPTIMIZE_SYSTEM_PROMPT = `You are a Docker Compose expert. Optimize docker-compose.yml files.
Rules:
- Apply Docker best practices
- Add healthchecks where appropriate
- Optimize resource usage
- Fix any issues
- Return ONLY the optimized YAML inside a \`\`\`yaml code block, no explanations.`;

export function buildGeneratePrompt(userPrompt: string): string {
  return userPrompt;
}

export function buildOptimizePrompt(existingYaml: string, userPrompt: string): string {
  return `Current docker-compose.yml:\n${existingYaml}\n\nOptimization request: ${userPrompt}`;
}
```

- [ ] **Step 2: Write ai-provider failing tests**

```typescript
// src/lib/__tests__/ai-provider.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCompose, optimizeCompose } from '../ai/ai-provider';
import type { AIConfig } from '../ai/ai-types';

// Mock the 'ai' module
vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

// Mock provider SDKs
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn(() => 'mock-model')),
}));
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => vi.fn(() => 'mock-model')),
}));
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => 'mock-model')),
}));

const baseConfig: AIConfig = {
  provider: 'openai',
  apiKey: 'test-key',
  model: 'gpt-4.1',
};

describe('generateCompose', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns YAML on successful generation', async () => {
    const { generateText } = await import('ai');
    vi.mocked(generateText).mockResolvedValueOnce({
      text: '```yaml\nversion: "3.8"\nservices:\n  web:\n    image: nginx\n```',
    } as never);

    const result = await generateCompose('web server with nginx', baseConfig);
    expect(result.success).toBe(true);
    expect(result.yaml).toContain('nginx');
  });

  it('returns error on API failure', async () => {
    const { generateText } = await import('ai');
    vi.mocked(generateText).mockRejectedValueOnce(new Error('Invalid API key'));

    const result = await generateCompose('test', baseConfig);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid API key');
  });

  it('detects CORS-like errors', async () => {
    const { generateText } = await import('ai');
    const corsError = new TypeError('Failed to fetch');
    vi.mocked(generateText).mockRejectedValueOnce(corsError);

    const result = await generateCompose('test', baseConfig);
    expect(result.success).toBe(false);
    expect(result.error).toContain('browser');
  });

  it('handles timeout errors', async () => {
    const { generateText } = await import('ai');
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    vi.mocked(generateText).mockRejectedValueOnce(abortError);

    const result = await generateCompose('test', baseConfig);
    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });
});

describe('optimizeCompose', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes existing YAML in the prompt', async () => {
    const { generateText } = await import('ai');
    vi.mocked(generateText).mockResolvedValueOnce({
      text: '```yaml\nversion: "3.8"\nservices:\n  web:\n    image: nginx:alpine\n```',
    } as never);

    const result = await optimizeCompose('version: "3.8"\nservices:\n  web:\n    image: nginx', 'optimize', baseConfig);
    expect(result.success).toBe(true);
    expect(result.yaml).toContain('nginx');

    // Verify generateText was called with existing YAML in the prompt
    expect(vi.mocked(generateText)).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('version: "3.8"'),
      }),
    );
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

Run: `npx vitest run src/lib/__tests__/ai-provider.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement ai-provider.ts**

```typescript
// src/lib/ai/ai-provider.ts
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { AIConfig, AIGenerateResult } from './ai-types';
import { extractYaml } from './yaml-extractor';
import {
  GENERATE_SYSTEM_PROMPT,
  OPTIMIZE_SYSTEM_PROMPT,
  buildGeneratePrompt,
  buildOptimizePrompt,
} from './prompt-templates';

function createProviderModel(config: AIConfig) {
  switch (config.provider) {
    case 'anthropic': {
      const anthropic = createAnthropic({
        apiKey: config.apiKey,
      });
      return anthropic(config.model);
    }
    case 'openai': {
      const openai = createOpenAI({
        apiKey: config.apiKey,
        ...(config.baseUrl && { baseURL: config.baseUrl }),
        compatibility: 'strict',
      });
      return openai(config.model);
    }
    case 'gemini': {
      const google = createGoogleGenerativeAI({
        apiKey: config.apiKey,
      });
      return google(config.model);
    }
    case 'glm': {
      const glm = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl ?? 'https://open.bigmodel.cn/api/paas/v4/',
        compatibility: 'compatible',
      });
      return glm(config.model);
    }
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

function isCorsError(error: unknown): boolean {
  return error instanceof TypeError && String(error.message).toLowerCase().includes('fetch');
}

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  config: AIConfig,
): Promise<AIGenerateResult> {
  try {
    const model = createProviderModel(config);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const { text } = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        abortSignal: controller.signal,
      });

      const yaml = extractYaml(text);
      return { success: true, yaml };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: unknown) {
    if (isCorsError(error)) {
      return {
        success: false,
        yaml: '',
        error: 'This provider may not work directly from the browser. Try using it via the MCP server instead.',
      };
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, yaml: '', error: 'Request timed out after 60 seconds.' };
    }
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, yaml: '', error: message };
  }
}

export async function generateCompose(
  prompt: string,
  config: AIConfig,
): Promise<AIGenerateResult> {
  return callLLM(GENERATE_SYSTEM_PROMPT, buildGeneratePrompt(prompt), config);
}

export async function optimizeCompose(
  existingYaml: string,
  prompt: string,
  config: AIConfig,
): Promise<AIGenerateResult> {
  return callLLM(OPTIMIZE_SYSTEM_PROMPT, buildOptimizePrompt(existingYaml, prompt), config);
}
```

- [ ] **Step 5: Run tests — verify they pass**

Run: `npx vitest run src/lib/__tests__/ai-provider.test.ts`
Expected: All 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/prompt-templates.ts src/lib/ai/ai-provider.ts src/lib/__tests__/ai-provider.test.ts
git commit -m "feat(phase8): add AI provider with prompt templates and tests"
```

---

## Chunk 2: Store + Web UI

### Task 4: Create AI Zustand store

**Files:**
- Create: `src/store/ai-store.ts`

- [ ] **Step 1: Create ai-store.ts**

```typescript
// src/store/ai-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIConfig, AIProviderKey } from '../lib/ai/ai-types';
import { DEFAULT_AI_CONFIG, DEFAULT_MODELS } from '../lib/ai/ai-types';

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

export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      config: { ...DEFAULT_AI_CONFIG },
      isLoading: false,
      error: null,

      setProvider: (provider) =>
        set((state) => ({
          config: {
            ...state.config,
            provider,
            model: DEFAULT_MODELS[provider],
          },
        })),

      setApiKey: (apiKey) =>
        set((state) => ({
          config: { ...state.config, apiKey },
        })),

      setModel: (model) =>
        set((state) => ({
          config: { ...state.config, model },
        })),

      setBaseUrl: (baseUrl) =>
        set((state) => ({
          config: { ...state.config, baseUrl },
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'vdc-ai-config',
      partialize: (state) => ({ config: state.config }),
    },
  ),
);
```

- [ ] **Step 2: Commit**

```bash
git add src/store/ai-store.ts
git commit -m "feat(phase8): add AI Zustand store with localStorage persistence"
```

---

### Task 5: Create SidebarTabs and AISidebar components

**Files:**
- Create: `src/components/sidebar/SidebarTabs.tsx`
- Create: `src/components/sidebar/AISidebar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create SidebarTabs.tsx**

```tsx
// src/components/sidebar/SidebarTabs.tsx
import { useState } from 'react';
import { NodePalette } from './NodePalette';
import { NetworkPanel } from './NetworkPanel';
import { AISidebar } from './AISidebar';

export function SidebarTabs() {
  const [activeTab, setActiveTab] = useState<'services' | 'ai'>('services');

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex border-b border-gray-700">
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'services'
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('services')}
        >
          Services
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'ai'
              ? 'border-b-2 border-purple-500 text-purple-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('ai')}
        >
          AI
        </button>
      </div>

      {activeTab === 'services' ? (
        <>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Services
          </h2>
          <NodePalette />
          <div className="mt-6 border-t border-gray-800 pt-4">
            <NetworkPanel />
          </div>
        </>
      ) : (
        <AISidebar />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create AISidebar.tsx**

```tsx
// src/components/sidebar/AISidebar.tsx
import { useState } from 'react';
import { useAIStore } from '../../store/ai-store';
import { useStore } from '../../store';
import { generateCompose, optimizeCompose } from '../../lib/ai/ai-provider';
import { parseYaml } from '../../lib/yaml-parser';
import { buildYaml } from '../../lib/yaml-builder';
import type { AIProviderKey } from '../../lib/ai/ai-types';
import { DEFAULT_MODELS } from '../../lib/ai/ai-types';

const PROVIDERS: { key: AIProviderKey; label: string }[] = [
  { key: 'openai', label: 'OpenAI' },
  { key: 'anthropic', label: 'Anthropic' },
  { key: 'gemini', label: 'Gemini' },
  { key: 'glm', label: 'GLM (z.ai)' },
];

export function AISidebar() {
  const { config, isLoading, error, setProvider, setApiKey, setModel, setBaseUrl, setLoading, setError } = useAIStore();
  const { nodes, edges, networks, namedVolumes, importCompose } = useStore();
  const [prompt, setPrompt] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [customModel, setCustomModel] = useState(false);

  const canOptimize = nodes.length > 0;

  async function handleGenerate() {
    if (!config.apiKey) {
      setError('Please enter an API key');
      return;
    }
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await generateCompose(prompt, config);

    if (result.success) {
      const parseResult = parseYaml(result.yaml);
      if (parseResult.success) {
        importCompose(parseResult);
      } else {
        setError('AI returned invalid YAML: ' + parseResult.errors[0]);
      }
    } else {
      setError(result.error ?? 'Unknown error');
    }

    setLoading(false);
  }

  async function handleOptimize() {
    if (!config.apiKey) {
      setError('Please enter an API key');
      return;
    }
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);

    const currentYaml = buildYaml({ nodes, edges, networks, namedVolumes });
    const result = await optimizeCompose(currentYaml, prompt, config);

    if (result.success) {
      const parseResult = parseYaml(result.yaml);
      if (parseResult.success) {
        importCompose(parseResult);
      } else {
        setError('AI returned invalid YAML: ' + parseResult.errors[0]);
      }
    } else {
      setError(result.error ?? 'Unknown error');
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
        AI Generation
      </h2>

      {/* Provider */}
      <div>
        <label className="mb-1 block text-xs text-gray-400">Provider</label>
        <select
          value={config.provider}
          onChange={(e) => setProvider(e.target.value as AIProviderKey)}
          className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          disabled={isLoading}
        >
          {PROVIDERS.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* API Key */}
      <div>
        <label className="mb-1 block text-xs text-gray-400">API Key</label>
        <div className="flex gap-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={config.apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="min-w-0 flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="shrink-0 rounded border border-gray-700 px-2 py-1.5 text-xs text-gray-400 hover:text-white"
            type="button"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* Model */}
      <div>
        <label className="mb-1 block text-xs text-gray-400">Model</label>
        {customModel ? (
          <div className="flex gap-1">
            <input
              type="text"
              value={config.model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="model-name"
              className="min-w-0 flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              onClick={() => { setCustomModel(false); setModel(DEFAULT_MODELS[config.provider]); }}
              className="shrink-0 rounded border border-gray-700 px-2 py-1.5 text-xs text-gray-400 hover:text-white"
              type="button"
            >
              Default
            </button>
          </div>
        ) : (
          <div className="flex gap-1">
            <span className="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white">
              {DEFAULT_MODELS[config.provider]}
            </span>
            <button
              onClick={() => setCustomModel(true)}
              className="shrink-0 rounded border border-gray-700 px-2 py-1.5 text-xs text-gray-400 hover:text-white"
              type="button"
            >
              Custom
            </button>
          </div>
        )}
      </div>

      {/* Base URL (for GLM or custom model) */}
      {(config.provider === 'glm' || customModel) && (
        <div>
          <label className="mb-1 block text-xs text-gray-400">Base URL</label>
          <input
            type="text"
            value={config.baseUrl ?? ''}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://open.bigmodel.cn/api/paas/v4/"
            className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500"
            disabled={isLoading}
          />
        </div>
      )}

      {/* Prompt */}
      <div>
        <label className="mb-1 block text-xs text-gray-400">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your docker-compose setup..."
          rows={4}
          className="w-full resize-y rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white placeholder-gray-500"
          disabled={isLoading}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex-1 rounded bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
        <button
          onClick={handleOptimize}
          disabled={isLoading || !canOptimize}
          className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          title={!canOptimize ? 'Add services to canvas first' : ''}
        >
          {isLoading ? 'Optimizing...' : 'Optimize'}
        </button>
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <span className="ml-2 text-xs text-gray-400">AI is working...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded border border-red-800 bg-red-900/30 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Modify App.tsx — replace inline sidebar with SidebarTabs**

In `src/App.tsx`, replace the sidebar content. Change the import:
```typescript
// Remove these imports:
// import { NodePalette } from './components/sidebar/NodePalette';
// import { NetworkPanel } from './components/sidebar/NetworkPanel';
// Add this import:
import { SidebarTabs } from './components/sidebar/SidebarTabs';
```

Replace the aside content (the `<h2>Services</h2>`, `<NodePalette />`, `<NetworkPanel />` section) with:
```tsx
<SidebarTabs />
```

Keep the `<aside>` wrapper and its styling unchanged.

- [ ] **Step 4: Verify app builds**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/components/sidebar/SidebarTabs.tsx src/components/sidebar/AISidebar.tsx src/App.tsx
git commit -m "feat(phase8): add AI sidebar tab with provider/key/prompt UI"
```

---

## Chunk 3: MCP Server Tool

### Task 6: Add ai-generate-compose MCP tool with tests (TDD)

**Files:**
- Create: `packages/mcp-server/__tests__/ai-generate-compose.test.ts`
- Create: `packages/mcp-server/src/tools/ai-generate-compose.ts`
- Modify: `packages/mcp-server/src/index.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/mcp-server/__tests__/ai-generate-compose.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAIGenerateCompose } from '../src/tools/ai-generate-compose';

// Mock AI provider
vi.mock('../../../../src/lib/ai/ai-provider', () => ({
  generateCompose: vi.fn(),
  optimizeCompose: vi.fn(),
}));

// Mock parseYaml and validate (imported by handler)
vi.mock('../../../../src/lib/yaml-parser', () => ({
  parseYaml: vi.fn(() => ({
    success: true,
    nodes: [{ id: '1', type: 'serviceNode', position: { x: 0, y: 0 }, data: { serviceName: 'web', image: 'nginx', preset: 'nginx', ports: [], volumes: [], environment: {}, networks: [] } }],
    edges: [],
    networks: [],
    namedVolumes: [],
    errors: [],
  })),
}));

vi.mock('../../../../src/lib/validator', () => ({
  validate: vi.fn(() => []),
}));

describe('handleAIGenerateCompose', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls generateCompose in generate mode and returns validation', async () => {
    const { generateCompose } = await import('../../../../src/lib/ai/ai-provider');
    vi.mocked(generateCompose).mockResolvedValueOnce({
      success: true,
      yaml: 'version: "3.8"\nservices:\n  web:\n    image: nginx',
    });

    const result = await handleAIGenerateCompose({
      prompt: 'web server',
      provider: 'openai',
      apiKey: 'test-key',
      mode: 'generate',
    });

    expect(result.yaml).toContain('nginx');
    expect(Array.isArray(result.validation)).toBe(true);
    expect(generateCompose).toHaveBeenCalled();
  });

  it('calls optimizeCompose in optimize mode', async () => {
    const { optimizeCompose } = await import('../../../../src/lib/ai/ai-provider');
    vi.mocked(optimizeCompose).mockResolvedValueOnce({
      success: true,
      yaml: 'version: "3.8"\nservices:\n  web:\n    image: nginx:alpine',
    });

    const result = await handleAIGenerateCompose({
      prompt: 'optimize',
      provider: 'openai',
      apiKey: 'test-key',
      mode: 'optimize',
      yaml: 'version: "3.8"\nservices:\n  web:\n    image: nginx',
    });

    expect(result.yaml).toContain('nginx:alpine');
    expect(Array.isArray(result.validation)).toBe(true);
    expect(optimizeCompose).toHaveBeenCalled();
  });

  it('returns error when AI fails', async () => {
    const { generateCompose } = await import('../../../../src/lib/ai/ai-provider');
    vi.mocked(generateCompose).mockResolvedValueOnce({
      success: false,
      yaml: '',
      error: 'API error',
    });

    const result = await handleAIGenerateCompose({
      prompt: 'test',
      provider: 'openai',
      apiKey: 'test-key',
    });

    expect(result.error).toBe('API error');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd packages/mcp-server && npx vitest run __tests__/ai-generate-compose.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ai-generate-compose.ts**

```typescript
// packages/mcp-server/src/tools/ai-generate-compose.ts
import { generateCompose, optimizeCompose } from '../../../../src/lib/ai/ai-provider';
import { validate } from '../../../../src/lib/validator';
import { parseYaml } from '../../../../src/lib/yaml-parser';
import type { AIConfig, AIProviderKey } from '../../../../src/lib/ai/ai-types';
import { DEFAULT_MODELS } from '../../../../src/lib/ai/ai-types';

export interface AIGenerateComposeInput {
  prompt: string;
  provider: AIProviderKey;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  mode?: 'generate' | 'optimize';
  yaml?: string;
}

export interface AIGenerateComposeOutput {
  yaml: string;
  validation: Array<{ severity: string; message: string; field?: string }>;
  error?: string;
}

export async function handleAIGenerateCompose(
  input: AIGenerateComposeInput,
): Promise<AIGenerateComposeOutput> {
  const { prompt, provider, apiKey, model, baseUrl, mode = 'generate', yaml } = input;

  const config: AIConfig = {
    provider,
    apiKey,
    model: model ?? DEFAULT_MODELS[provider],
    baseUrl,
  };

  const result = mode === 'optimize' && yaml
    ? await optimizeCompose(yaml, prompt, config)
    : await generateCompose(prompt, config);

  if (!result.success) {
    return { yaml: '', validation: [], error: result.error };
  }

  // Validate generated YAML
  const parseResult = parseYaml(result.yaml);
  if (!parseResult.success) {
    return {
      yaml: result.yaml,
      validation: [{ severity: 'warning', message: 'Generated YAML could not be parsed for validation' }],
    };
  }

  const issues = validate({ nodes: parseResult.nodes, edges: parseResult.edges });

  return {
    yaml: result.yaml,
    validation: issues.map((i) => ({
      severity: i.severity,
      message: i.message,
      ...(i.field && { field: i.field }),
    })),
  };
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `cd packages/mcp-server && npx vitest run __tests__/ai-generate-compose.test.ts`
Expected: All 3 tests PASS

- [ ] **Step 5: Register tool in MCP server index.ts**

Add to `packages/mcp-server/src/index.ts`:

After the existing import statements, add:
```typescript
import { handleAIGenerateCompose } from './tools/ai-generate-compose.js';
```

Before the `main()` function, add:
```typescript
// Tool 5: ai-generate-compose
server.registerTool(
  'ai-generate-compose',
  {
    title: 'AI Generate Docker Compose',
    description: 'Use AI (LLM) to generate or optimize a docker-compose.yml. Requires user API key for the chosen provider.',
    inputSchema: {
      prompt: z.string().describe('Natural language description'),
      provider: z.enum(['anthropic', 'openai', 'gemini', 'glm']).describe('LLM provider'),
      apiKey: z.string().describe('API key for the provider'),
      model: z.string().optional().describe('Model name (uses provider default if omitted)'),
      baseUrl: z.string().optional().describe('Custom base URL (required for GLM)'),
      mode: z.enum(['generate', 'optimize']).optional().describe('generate (default) or optimize existing YAML'),
      yaml: z.string().optional().describe('Existing YAML to optimize (required for optimize mode)'),
    },
  },
  async ({ prompt, provider, apiKey, model, baseUrl, mode, yaml }) => {
    const result = await handleAIGenerateCompose({ prompt, provider, apiKey, model, baseUrl, mode, yaml });
    if (result.error) {
      return {
        content: [{ type: 'text' as const, text: result.error }],
        isError: true,
      };
    }
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);
```

- [ ] **Step 6: Build MCP server**

Run: `cd packages/mcp-server && npx tsup`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add packages/mcp-server/src/tools/ai-generate-compose.ts packages/mcp-server/__tests__/ai-generate-compose.test.ts packages/mcp-server/src/index.ts
git commit -m "feat(phase8): add ai-generate-compose MCP tool with tests"
```

---

## Chunk 4: Verification + Documentation

### Task 7: Run all tests and verify builds

**Files:**
- Modify: `docs/TYPES.md`
- Modify: `docs/STATUS.md`

- [ ] **Step 1: Run main project unit tests**

Run: `npm run test`
Expected: All existing tests + new yaml-extractor (5) + ai-provider (4) tests pass

- [ ] **Step 2: Run MCP server unit tests**

Run: `cd packages/mcp-server && npx vitest run`
Expected: All tests pass (11 existing + 3 new = 14)

- [ ] **Step 3: Build main project**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Build MCP server**

Run: `cd packages/mcp-server && npx tsup`
Expected: Build succeeds

- [ ] **Step 5: Update docs/TYPES.md**

Add AI types section after the Parse Result section:

```markdown
## AI Types

\`\`\`typescript
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
\`\`\`
```

- [ ] **Step 6: Update PROJECT_SPEC.md**

Add to Section 8 Post-MVP table:
```markdown
| 5 | Phase 8 | AI-Powered Generation | `docs/specs/ai-generation.md` |
```

Add to Section 2 Technology Stack table:
```markdown
| AI SDK | Vercel AI SDK (`ai`) | 4 provider: Anthropic, OpenAI, Gemini, GLM |
```

- [ ] **Step 7: Update docs/STATUS.md**

Add to Post-MVP Progress table:
```markdown
| AI-Powered Generation (Phase 8) | ✅ Done | Vercel AI SDK, 4 providers, sidebar AI tab, MCP ai-generate-compose tool |
```

Update session notes and test totals.

- [ ] **Step 8: Final commit**

```bash
git add docs/TYPES.md docs/STATUS.md PROJECT_SPEC.md
git commit -m "docs: update TYPES.md, STATUS.md, PROJECT_SPEC.md for Phase 8 completion"
```
