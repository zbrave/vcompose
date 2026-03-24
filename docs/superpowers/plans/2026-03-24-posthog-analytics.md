# PostHog Analytics Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PostHog Cloud analytics (user behavior, session replay, error tracking) to the Visual Docker Compose Builder.

**Architecture:** Single dependency (`posthog-js`) initialized as a global singleton. A thin wrapper (`PostHogProvider`) handles SPA pageview tracking via React Router. An `ErrorBoundary` class component catches React render errors. Custom events are fired from store actions and UI components via a `trackEvent()` helper. When `VITE_POSTHOG_KEY` is absent, all analytics code is no-op.

**Tech Stack:** posthog-js, React 19, React Router v7, Zustand, Vite 7, Vitest

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/lib/analytics/posthog.ts` | SDK init, `isAnalyticsEnabled()` guard |
| Create | `src/lib/analytics/events.ts` | `trackEvent()` helper, event name constants |
| Create | `src/lib/analytics/__tests__/posthog.test.ts` | Guard test for `isAnalyticsEnabled()` |
| Create | `src/components/PostHogProvider.tsx` | Root wrapper, SPA pageview tracking |
| Create | `src/components/ErrorBoundary.tsx` | React error boundary + PostHog exception capture |
| Create | `.env.example` | Document required env vars |
| Modify | `src/main.tsx` | Wrap App with ErrorBoundary + PostHogProvider |
| Modify | `src/store/index.ts` | Add `trackEvent()` calls to 7 store actions |
| Modify | `src/components/output/YamlOutput.tsx` | Track copy/download events |
| Modify | `src/components/sidebar/AISidebar.tsx` | Track AI generate event |
| Modify | `src/components/CommandSearch.tsx` | Track command palette action events |
| Modify | `Dockerfile` | Add `ARG` for Vite build-time env vars |
| Modify | `PROJECT_SPEC.md` | Add `posthog-js` to Technology Stack table |

---

### Task 1: Install posthog-js

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the dependency**

```bash
npm install posthog-js
```

- [ ] **Step 2: Verify it installed**

```bash
npm ls posthog-js
```

Expected: shows `posthog-js@<version>` without errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add posthog-js dependency"
```

---

### Task 2: Analytics core — posthog.ts + guard test

**Files:**
- Create: `src/lib/analytics/posthog.ts`
- Create: `src/lib/analytics/__tests__/posthog.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/analytics/__tests__/posthog.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('isAnalyticsEnabled', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns false when VITE_POSTHOG_KEY is not set', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', '');
    // Re-import to pick up new env
    const { isAnalyticsEnabled } = await import('../posthog');
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it('returns true when VITE_POSTHOG_KEY is set', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test123');
    const { isAnalyticsEnabled } = await import('../posthog');
    expect(isAnalyticsEnabled()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/analytics/__tests__/posthog.test.ts
```

Expected: FAIL — module `../posthog` not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/analytics/posthog.ts`:

```typescript
import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://us.i.posthog.com';

export function initPostHog(): void {
  if (!POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    autocapture: true,
    capture_exceptions: true,
    session_recording: {
      maskAllInputs: true,
    },
  });

  if (import.meta.env.DEV) {
    posthog.debug();
  }
}

export function isAnalyticsEnabled(): boolean {
  return Boolean(POSTHOG_KEY);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/analytics/__tests__/posthog.test.ts
```

Expected: 2 tests PASS.

> **Note:** `vi.stubEnv` sets `import.meta.env` values. The dynamic `import()` in tests ensures each test gets its own module evaluation with the stubbed env. If the tests share cached modules, add `vi.resetModules()` in `beforeEach`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/posthog.ts src/lib/analytics/__tests__/posthog.test.ts
git commit -m "feat: add PostHog analytics core with guard test"
```

---

### Task 3: Event tracking — events.ts

**Files:**
- Create: `src/lib/analytics/events.ts`

- [ ] **Step 1: Create the events module**

Create `src/lib/analytics/events.ts`:

```typescript
import posthog from 'posthog-js';
import { isAnalyticsEnabled } from './posthog';

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled()) return;
  posthog.capture(event, properties);
}

export const EVENTS = {
  SERVICE_ADDED: 'service_added',
  STACK_ADDED: 'stack_added',
  EDGE_CREATED: 'edge_created',
  YAML_COPIED: 'yaml_copied',
  YAML_DOWNLOADED: 'yaml_downloaded',
  YAML_IMPORTED: 'yaml_imported',
  AI_GENERATE: 'ai_generate',
  COMMAND_PALETTE_USED: 'command_palette_used',
  ERROR_OCCURRED: 'error_occurred',
} as const;
```

- [ ] **Step 2: Verify build compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/analytics/events.ts
git commit -m "feat: add trackEvent helper and event constants"
```

---

### Task 4: ErrorBoundary component

**Files:**
- Create: `src/components/ErrorBoundary.tsx`

- [ ] **Step 1: Create ErrorBoundary**

Create `src/components/ErrorBoundary.tsx`:

```typescript
import { Component, type ReactNode } from 'react';
import posthog from 'posthog-js';
import { isAnalyticsEnabled } from '../lib/analytics/posthog';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (isAnalyticsEnabled()) {
      posthog.captureException(error, {
        type: 'react_error_boundary',
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Bir hata oluştu</h2>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded bg-[var(--accent-primary)] text-[var(--bg-primary)]"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Verify build compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ErrorBoundary.tsx
git commit -m "feat: add ErrorBoundary with PostHog exception capture"
```

---

### Task 5: PostHogProvider component

**Files:**
- Create: `src/components/PostHogProvider.tsx`

- [ ] **Step 1: Create PostHogProvider**

Create `src/components/PostHogProvider.tsx`:

```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';
import { initPostHog, isAnalyticsEnabled } from '../lib/analytics/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    posthog.capture('$pageview', {
      $current_url: window.location.href,
    });
  }, [location.pathname]);

  return <>{children}</>;
}
```

- [ ] **Step 2: Verify build compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PostHogProvider.tsx
git commit -m "feat: add PostHogProvider with SPA pageview tracking"
```

---

### Task 6: Wire into main.tsx

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Update main.tsx**

Current `src/main.tsx`:
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

Change to:
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PostHogProvider } from './components/PostHogProvider'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <PostHogProvider>
          <App />
        </PostHogProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
```

Wrapping order rationale:
- `ErrorBoundary` outermost (catches routing errors too)
- `BrowserRouter` next (provides `useLocation` to PostHogProvider)
- `PostHogProvider` innermost (needs Router context for pageviews)

- [ ] **Step 2: Verify build compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Verify dev server starts**

```bash
npx vite --open false &
sleep 3
kill %1
```

Expected: no errors in console.

- [ ] **Step 4: Commit**

```bash
git add src/main.tsx
git commit -m "feat: wire ErrorBoundary and PostHogProvider into app root"
```

---

### Task 7: Add trackEvent calls to store actions

**Files:**
- Modify: `src/store/index.ts`

- [ ] **Step 1: Add import**

Add this import at the top of `src/store/index.ts`:

```typescript
import { trackEvent, EVENTS } from '../lib/analytics/events';
```

- [ ] **Step 2: Add trackEvent to addNode**

After `set((state) => ({ nodes: [...state.nodes, node] }));` in the `addNode` action, add:

```typescript
trackEvent(EVENTS.SERVICE_ADDED, { preset, source: 'palette' });
```

- [ ] **Step 3: Add trackEvent to addEdge**

At the end of the `addEdge` action (after the `set()` call), add:

```typescript
trackEvent(EVENTS.EDGE_CREATED, { sourceId: edge.source, targetId: edge.target });
```

- [ ] **Step 4: Add trackEvent to importCompose**

At the end of the `importCompose` action (after the `set()` call), add:

```typescript
trackEvent(EVENTS.YAML_IMPORTED, { success: true, serviceCount: result.nodes.length });
```

- [ ] **Step 5: Add trackEvent to addRecommendedNode**

At the end of the `addRecommendedNode` action (after the `set()` call, before the closing `}`), add:

```typescript
trackEvent(EVENTS.SERVICE_ADDED, { preset: key, source: 'recommendation' });
```

- [ ] **Step 6: Add trackEvent to addServiceFromRegistry**

After `set((state) => ({ nodes: [...state.nodes, node] }));` in `addServiceFromRegistry`, add:

```typescript
trackEvent(EVENTS.SERVICE_ADDED, { preset: serviceDef.preset, source: 'registry' });
```

- [ ] **Step 7: Add trackEvent to addServiceFromHub**

After each `set()` call in `addServiceFromHub` (both the registryMatch and custom branches), add:

```typescript
trackEvent(EVENTS.SERVICE_ADDED, { preset: 'custom', source: 'dockerhub' });
```

- [ ] **Step 8: Add trackEvent to addStack**

At the end of the `addStack` action (after the `set()` call), add:

```typescript
trackEvent(EVENTS.STACK_ADDED, { stackKey, serviceCount: stack.services.length });
```

- [ ] **Step 9: Verify build compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 10: Run existing tests to ensure no regressions**

```bash
npx vitest run
```

Expected: all existing tests pass (106+ unit tests).

- [ ] **Step 11: Commit**

```bash
git add src/store/index.ts
git commit -m "feat: add analytics trackEvent calls to store actions"
```

---

### Task 8: Add trackEvent to UI components

**Files:**
- Modify: `src/components/output/YamlOutput.tsx`
- Modify: `src/components/sidebar/AISidebar.tsx`
- Modify: `src/components/CommandSearch.tsx`

- [ ] **Step 1: YamlOutput — track copy and download**

Add import at top of `src/components/output/YamlOutput.tsx`:

```typescript
import { trackEvent, EVENTS } from '../../lib/analytics/events';
```

Update the copy button's `onClick`:

```typescript
onClick={() => {
  void copyYaml(yaml);
  trackEvent(EVENTS.YAML_COPIED, { serviceCount: nodes.length });
}}
```

Update the download button's `onClick`:

```typescript
onClick={() => {
  downloadYaml(yaml);
  trackEvent(EVENTS.YAML_DOWNLOADED, { serviceCount: nodes.length });
}}
```

- [ ] **Step 2: AISidebar — track AI generate**

Add import at top of `src/components/sidebar/AISidebar.tsx`:

```typescript
import { trackEvent, EVENTS } from '../../lib/analytics/events';
```

In the `doGenerate` callback, after the `if (result.success)` block resolves (after `setLoading(false)` at the end of `doGenerate`), add:

```typescript
trackEvent(EVENTS.AI_GENERATE, { provider: config.provider, success: result.success });
```

- [ ] **Step 3: CommandSearch — track action selections**

Add import at top of `src/components/CommandSearch.tsx`:

```typescript
import { trackEvent, EVENTS } from '../lib/analytics/events';
```

Add `trackEvent` calls in these handler functions:

In `handleServiceSelect`, before `onClose()`:
```typescript
trackEvent(EVENTS.COMMAND_PALETTE_USED, { action: 'add_service', serviceKey: key });
```

In `handleStackSelect`, before `onClose()`:
```typescript
trackEvent(EVENTS.COMMAND_PALETTE_USED, { action: 'add_stack', stackKey: key });
```

In `handleImport`, before `onClose()`:
```typescript
trackEvent(EVENTS.COMMAND_PALETTE_USED, { action: 'import' });
```

In `handleExport`, before `onClose()`:
```typescript
trackEvent(EVENTS.COMMAND_PALETTE_USED, { action: 'export' });
```

In `handleToggleAI`, before `onClose()`:
```typescript
trackEvent(EVENTS.COMMAND_PALETTE_USED, { action: 'toggle_ai' });
```

- [ ] **Step 4: Verify build compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/output/YamlOutput.tsx src/components/sidebar/AISidebar.tsx src/components/CommandSearch.tsx
git commit -m "feat: add analytics tracking to UI components"
```

---

### Task 9: Environment and deployment config

**Files:**
- Create: `.env.example`
- Modify: `Dockerfile`
- Modify: `PROJECT_SPEC.md`

- [ ] **Step 1: Create .env.example**

Create `.env.example`:

```env
# PostHog Analytics (optional — leave empty to disable)
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

- [ ] **Step 2: Update Dockerfile with build args**

Current `Dockerfile` (lines 1-6):
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

Change to:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST
RUN npm run build
```

- [ ] **Step 3: Update PROJECT_SPEC.md Technology Stack**

In `PROJECT_SPEC.md` Section 2, add this row to the Technology Stack table after the `Animation` row:

```markdown
| Analytics | posthog-js | PostHog Cloud — product analytics, session replay, error tracking |
```

- [ ] **Step 4: Verify build still works**

```bash
npm run build
```

Expected: build succeeds (VITE_POSTHOG_KEY is empty, analytics will be no-op).

- [ ] **Step 5: Commit**

```bash
git add .env.example Dockerfile PROJECT_SPEC.md
git commit -m "chore: add PostHog env config, Dockerfile build args, update tech stack"
```

---

### Task 10: Run full test suite and verify

**Files:** none (verification only)

- [ ] **Step 1: Run unit tests**

```bash
npx vitest run
```

Expected: all tests pass (106+ unit + new guard tests).

- [ ] **Step 2: Run E2E tests**

```bash
npx playwright test
```

Expected: all 30 E2E tests pass. Analytics is no-op (no VITE_POSTHOG_KEY), so no interference.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: no lint errors.

- [ ] **Step 4: Run type check**

```bash
npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 5: Update docs/STATUS.md**

Add Phase 12 entry to the Post-MVP Progress table:

```markdown
| PostHog Analytics (Phase 12) | ✅ Done | posthog-js, trackEvent, ErrorBoundary, PostHogProvider, guard test |
```

Add a Phase 12 section with completion details.

- [ ] **Step 6: Commit**

```bash
git add docs/STATUS.md
git commit -m "docs: update STATUS.md with Phase 12 completion"
```
