# MCP Documentation Page & App Routing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add React Router to the app, create an MCP documentation page, and enable navigation between landing page, canvas, and MCP docs from anywhere in the app.

**Architecture:** Replace the current state-based view switching (`showLanding` + sessionStorage) with React Router's `BrowserRouter`. Extract canvas JSX from `App.tsx` into a dedicated route component. Create `McpDocsPage` as a new route. Add `NavDropdown` to HeaderBar for canvas-to-anywhere navigation.

**Tech Stack:** React Router v7, react-syntax-highlighter (existing), lucide-react (existing), framer-motion (existing), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-23-mcp-docs-and-routing-design.md`

---

### Task 1: Install react-router-dom and update PROJECT_SPEC.md

**Files:**
- Modify: `package.json`
- Modify: `PROJECT_SPEC.md`

- [ ] **Step 1: Install react-router-dom**

Run: `npm install react-router-dom`

- [ ] **Step 2: Add react-router-dom to PROJECT_SPEC.md Section 2 tech stack table**

Add a new row after the existing `Draggable Panel` row:

```
| Routing | react-router-dom | Client-side routing for multi-page SPA |
```

- [ ] **Step 3: Add Phase 11 to PROJECT_SPEC.md Section 8 roadmap table**

Add a new row at the end of the roadmap:

```
| 8 | Phase 11 | MCP Docs & Routing | `docs/superpowers/specs/2026-03-23-mcp-docs-and-routing-design.md` |
```

- [ ] **Step 4: Verify install succeeded**

Run: `npm ls react-router-dom`
Expected: `react-router-dom@7.x.x`

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json PROJECT_SPEC.md
git commit -m "feat: add react-router-dom dependency for multi-page routing (Phase 11)"
```

---

### Task 2: Refactor App.tsx — Extract CanvasLayout, add BrowserRouter + Routes

This is the core routing task. Replace state-based view switching with React Router.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Wrap App in BrowserRouter in main.tsx**

Replace `src/main.tsx`:

```tsx
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

- [ ] **Step 2: Rewrite App.tsx with Routes**

Replace `src/App.tsx` entirely. Key changes:
- Remove `showLanding` state, `handleEnter` function
- Remove `LandingPage` import (it handles its own navigation now)
- Add `<Routes>` with 3 routes: `/`, `/app`, `/mcp`
- The `/` route uses a `LandingRedirect` component that handles the auto-redirect logic
- The `/app` route renders the existing canvas layout (inline, not extracted to a separate file)
- The `/mcp` route renders `McpDocsPage` (placeholder for now)
- Keep validation `useEffect` and `⌘K` shortcut inside the `/app` route section

```tsx
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { useStore } from './store';
import { validate } from './lib/validator';
import { HeaderBar } from './components/HeaderBar';
import { IconRail } from './components/sidebar/IconRail';
import { SidePanel } from './components/sidebar/SidePanel';
import { StacksPanel } from './components/sidebar/StacksPanel';
import { MarketplacePanel } from './components/sidebar/MarketplacePanel';
import { AISidebar } from './components/sidebar/AISidebar';
import { NetworkPanel } from './components/sidebar/NetworkPanel';
import { FlowCanvas } from './components/canvas/FlowCanvas';
import { FloatingConfigPanel } from './components/panel/FloatingConfigPanel';
import { YamlOutput } from './components/output/YamlOutput';
import { ImportModal } from './components/output/ImportModal';
import { CommandSearch } from './components/CommandSearch';
import { LandingPage } from './components/LandingPage';
import { McpDocsPage } from './components/McpDocsPage';

function LandingRedirect() {
  // If user has existing work or has entered before, redirect to /app
  const stored = localStorage.getItem('vdc-store');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.nodes?.length > 0) {
        return <Navigate to="/app" replace />;
      }
    } catch {
      // ignore
    }
  }
  if (sessionStorage.getItem('vdc-entered')) {
    return <Navigate to="/app" replace />;
  }
  return <LandingPage />;
}

function CanvasLayout() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const setValidationIssues = useStore((s) => s.setValidationIssues);

  const [activePanel, setActivePanel] = useState<string | null>('stacks');
  const [showImport, setShowImport] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const navigate = useNavigate();

  // Validation as derived state
  useEffect(() => {
    const issues = validate({ nodes, edges });
    setValidationIssues(issues);
  }, [nodes, edges, setValidationIssues]);

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col bg-base text-text-primary">
        <HeaderBar onSearchClick={() => setShowSearch(true)} />
        <div className="flex flex-1 overflow-hidden">
          <IconRail
            activePanel={activePanel}
            onPanelChange={setActivePanel}
            onImportClick={() => setShowImport(true)}
          />
          <SidePanel
            isOpen={activePanel !== null}
            onClose={() => setActivePanel(null)}
          >
            {activePanel === 'stacks' && <StacksPanel />}
            {activePanel === 'marketplace' && <MarketplacePanel />}
            {activePanel === 'ai' && <AISidebar />}
            {activePanel === 'networks' && <NetworkPanel />}
          </SidePanel>
          <div className="relative flex-1">
            <FlowCanvas />
            <FloatingConfigPanel />
          </div>
          <YamlOutput />
        </div>
      </div>
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      <CommandSearch
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onImportClick={() => { setShowSearch(false); setShowImport(true); }}
        onToggleAI={() => { setShowSearch(false); setActivePanel('ai'); }}
        onNavigate={(path) => { setShowSearch(false); navigate(path); }}
      />
    </ReactFlowProvider>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRedirect />} />
      <Route path="/app" element={<CanvasLayout />} />
      <Route path="/mcp" element={<McpDocsPage />} />
    </Routes>
  );
}

export default App;
```

- [ ] **Step 3: Verify the app compiles**

Run: `npm run build`
Expected: Build succeeds (will have minor TS errors for McpDocsPage and CommandSearch prop changes — those are resolved in later tasks)

Note: If build fails due to missing `McpDocsPage`, create a minimal placeholder first:

```tsx
// src/components/McpDocsPage.tsx
export function McpDocsPage() {
  return <div>MCP Docs — placeholder</div>;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx src/components/McpDocsPage.tsx
git commit -m "refactor: replace state-based view switching with React Router"
```

---

### Task 3: Update LandingPage — remove onEnter prop, add useNavigate, MCP navbar link, feature card

**Files:**
- Modify: `src/components/LandingPage.tsx`

- [ ] **Step 1: Replace LandingPage implementation**

Key changes:
- Remove `LandingPageProps` interface and `onEnter` prop
- Import `useNavigate` and `Link` from `react-router-dom`
- Replace all `onEnter` calls with `navigate('/app', { replace: true })` + `sessionStorage.setItem('vdc-entered', '1')`
- Add `Plug` import from lucide-react
- Add "MCP Docs" link to navbar (before GitHub button)
- Replace the "Validation" (Shield) feature card with "MCP Integration" (Plug) card — add `onClick` and `link` property
- The MCP feature card needs a click handler using `navigate('/mcp')`

In the imports:
- Add: `import { useNavigate, Link } from 'react-router-dom';`
- Add `Plug` to existing lucide-react imports
- Remove `Shield` from lucide-react imports (no longer used after card replacement)

```tsx
import { useNavigate, Link } from 'react-router-dom';
// In the existing lucide import line, add Plug and remove Shield
```

Remove:
```tsx
interface LandingPageProps {
  onEnter: () => void;
}
```

Change function signature from:
```tsx
export function LandingPage({ onEnter }: LandingPageProps) {
```
to:
```tsx
export function LandingPage() {
```

Inside the component, add:
```tsx
const navigate = useNavigate();

const handleEnter = () => {
  sessionStorage.setItem('vdc-entered', '1');
  navigate('/app', { replace: true });
};
```

Replace all `onEnter` references with `handleEnter`.

In the navbar, before the GitHub `<a>` tag, add:
```tsx
<Link
  to="/mcp"
  className="rounded-lg px-4 py-2 text-sm transition-all duration-200"
  style={{
    border: '1px solid rgba(212, 168, 67, 0.15)',
    background: 'rgba(26, 23, 20, 0.6)',
    backdropFilter: 'blur(8px)',
    color: '#a89880',
  }}
  onMouseEnter={(e) => {
    const el = e.currentTarget;
    el.style.borderColor = 'rgba(212,168,67,0.4)';
    el.style.color = '#e8dcc8';
  }}
  onMouseLeave={(e) => {
    const el = e.currentTarget;
    el.style.borderColor = 'rgba(212,168,67,0.15)';
    el.style.color = '#a89880';
  }}
>
  MCP Docs
</Link>
```

In the `features` array, replace the Validation card (index 5, `Shield` icon):
```tsx
{
  icon: Shield,
  title: 'Validation',
  desc: 'Built-in validation catches errors before deployment',
},
```
with:
```tsx
{
  icon: Plug,
  title: 'MCP Integration',
  desc: 'Connect your IDE to VCompose via Model Context Protocol',
  link: '/mcp',
},
```

Update the feature card rendering to handle the `link` property. Change the `features.map` section to wrap MCP card in a clickable container:
```tsx
{features.map((f, i) => (
  <motion.div
    key={i}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: i * 0.07, duration: 0.4 }}
    onClick={'link' in f ? () => navigate((f as { link: string }).link) : undefined}
    style={'link' in f ? { cursor: 'pointer' } : undefined}
  >
    <GlassFeatureCard
      icon={f.icon}
      title={f.title}
      description={f.desc}
    />
  </motion.div>
))}
```

- [ ] **Step 2: Verify the app works**

Run: `npm run dev`
Open browser to `http://localhost:5173`
- Landing page should show
- "Start Building" should navigate to `/app`
- "MCP Docs" navbar link should navigate to `/mcp`
- MCP Integration feature card should be clickable and navigate to `/mcp`

- [ ] **Step 3: Commit**

```bash
git add src/components/LandingPage.tsx
git commit -m "feat: update LandingPage with useNavigate, MCP navbar link, and MCP feature card"
```

---

### Task 4: Create NavDropdown component

**Files:**
- Create: `src/components/NavDropdown.tsx`

- [ ] **Step 1: Create NavDropdown component**

Create `src/components/NavDropdown.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Home, BookOpen, Star } from 'lucide-react';

export function NavDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleHome = () => {
    sessionStorage.removeItem('vdc-entered');
    navigate('/');
    setOpen(false);
  };

  const handleMcpDocs = () => {
    navigate('/mcp');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-elevated"
      >
        <img src="/logo.svg" alt="" width="20" height="20" />
        <span
          className="text-sm text-accent"
          style={{ fontWeight: 800, letterSpacing: '-0.5px' }}
        >
          VCompose
        </span>
        <span className="rounded-full border border-accent/30 px-2 py-0.5 text-xs text-accent">
          BETA
        </span>
        <ChevronDown
          size={12}
          className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-subtle shadow-xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(30, 27, 24, 0.95)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="p-1">
            <button
              onClick={handleHome}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
            >
              <Home size={14} />
              Home
            </button>
            <button
              onClick={handleMcpDocs}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
            >
              <BookOpen size={14} />
              MCP Docs
            </button>
          </div>
          <div className="border-t border-subtle p-1">
            <a
              href="https://github.com/zbrave/vcompose"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-text-muted hover:bg-elevated hover:text-text-secondary transition-colors"
            >
              <Star size={14} />
              Star on GitHub
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NavDropdown.tsx
git commit -m "feat: add NavDropdown component for logo-based navigation menu"
```

---

### Task 5: Update HeaderBar — replace static logo with NavDropdown

**Files:**
- Modify: `src/components/HeaderBar.tsx`

- [ ] **Step 1: Replace logo section with NavDropdown**

In `src/components/HeaderBar.tsx`:

Replace the imports to add NavDropdown:
```tsx
import { NavDropdown } from './NavDropdown';
```

Replace the entire logo `<div>` block (lines 44-55):
```tsx
{/* Left: Logo + BETA badge */}
<div className="flex items-center gap-2">
  <img src="/logo.svg" alt="" width="20" height="20" />
  <span
    className="text-sm text-accent"
    style={{ fontWeight: 800, letterSpacing: '-0.5px' }}
  >
    VCompose
  </span>
  <span className="rounded-full border border-accent/30 px-2 py-0.5 text-xs text-accent">
    BETA
  </span>
</div>
```

with:
```tsx
{/* Left: Logo + Nav Dropdown */}
<NavDropdown />
```

- [ ] **Step 2: Verify dropdown works**

Run: `npm run dev`, navigate to `/app`
- Click the VCompose logo area — dropdown should appear
- "Home" should navigate to `/` (landing)
- "MCP Docs" should navigate to `/mcp`
- "Star on GitHub" should open external link
- Click outside dropdown — should close
- Press Escape — should close

- [ ] **Step 3: Commit**

```bash
git add src/components/HeaderBar.tsx
git commit -m "feat: replace static logo with NavDropdown in HeaderBar"
```

---

### Task 6: Update CommandSearch — add navigation actions

**Files:**
- Modify: `src/components/CommandSearch.tsx`

- [ ] **Step 1: Add onNavigate prop and navigation actions**

Add `onNavigate` to the props interface:
```tsx
interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
  onImportClick: () => void;
  onToggleAI: () => void;
  onNavigate: (path: string) => void;
}
```

Update the destructured props:
```tsx
export function CommandSearch({ open, onClose, onImportClick, onToggleAI, onNavigate }: CommandSearchProps) {
```

Add navigation handler functions:
```tsx
const handleGoHome = () => {
  sessionStorage.removeItem('vdc-entered');
  onNavigate('/');
};

const handleGoMcpDocs = () => {
  onNavigate('/mcp');
};
```

Add `Home` and `BookOpen` to the lucide-react imports:
```tsx
import { Search, FileInput, Trash2, Download, Bot, Home, BookOpen } from 'lucide-react';
```

Add two new `<Command.Item>`s in the Actions group, after the Toggle AI item:

```tsx
<Command.Item
  value="go home landing page"
  onSelect={handleGoHome}
  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-text-primary data-[selected=true]:bg-[var(--accent)]/10 data-[selected=true]:text-accent outline-none"
>
  <Home size={15} className="text-text-muted flex-shrink-0" />
  <div className="flex flex-col">
    <span>Go to Home</span>
    <span className="text-xs text-text-muted">Return to landing page</span>
  </div>
</Command.Item>

<Command.Item
  value="go mcp docs documentation"
  onSelect={handleGoMcpDocs}
  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-text-primary data-[selected=true]:bg-[var(--accent)]/10 data-[selected=true]:text-accent outline-none"
>
  <BookOpen size={15} className="text-text-muted flex-shrink-0" />
  <div className="flex flex-col">
    <span>MCP Docs</span>
    <span className="text-xs text-text-muted">View MCP integration guide</span>
  </div>
</Command.Item>
```

- [ ] **Step 2: Verify build succeeds**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/CommandSearch.tsx
git commit -m "feat: add Go to Home and MCP Docs actions to command palette"
```

---

### Task 7: Create McpDocsPage — full MCP documentation

This is the largest task. The page contains: hero, "What is MCP?" intro, setup guide with tabs, 5 tool reference cards, and usage examples.

**Files:**
- Create: `src/components/McpDocsPage.tsx` (replace placeholder)

- [ ] **Step 1: Write the full McpDocsPage component**

Create `src/components/McpDocsPage.tsx` with the following structure:

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plug, Copy, Check, ArrowRight, Terminal, Cpu, Search, Sparkles, FileCode } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
```

**Hero Section:**
- Same dark background as landing (`#0a0806`)
- Navbar identical to landing (logo + "MCP Docs" active + "Start Building" + GitHub)
- Title: "MCP Integration"
- Subtitle from spec
- "Open Builder →" CTA button linking to `/app`

**Section 1 — What is MCP:**
- 3-4 paragraph explanation
- Supported IDEs with icons/badges: Claude Code, Cursor, VS Code (Cline/Continue), Windsurf

**Section 2 — Setup Guide:**
- Tab component with 4 tabs: Claude Code, Cursor, VS Code, Generic
- Each tab shows:
  - Step-by-step instructions
  - Copy-pasteable config JSON block with syntax highlighting
  - A "Copy" button that copies the config to clipboard

Tab content:
- **Claude Code tab:**
  ```bash
  # Option 1: CLI command
  claude mcp add docker-compose-mcp -- npx docker-compose-mcp

  # Option 2: Manual config (~/.claude/claude_desktop_config.json)
  ```
  ```json
  {
    "mcpServers": {
      "docker-compose-mcp": {
        "command": "npx",
        "args": ["docker-compose-mcp"]
      }
    }
  }
  ```

- **Cursor tab:**
  ```json
  // .cursor/mcp.json
  {
    "mcpServers": {
      "docker-compose-mcp": {
        "command": "npx",
        "args": ["docker-compose-mcp"]
      }
    }
  }
  ```

- **VS Code tab:**
  ```json
  // .vscode/settings.json → mcp section
  {
    "mcp": {
      "servers": {
        "docker-compose-mcp": {
          "command": "npx",
          "args": ["docker-compose-mcp"]
        }
      }
    }
  }
  ```

- **Generic tab:**
  ```
  Transport: stdio
  Command: npx docker-compose-mcp
  ```

**Section 3 — Tools Reference:**
5 glass-morphism cards, each with:
- Tool name, description
- Input params table
- Example prompt → example output (collapsible)

Tool details from spec Section 5.4 and MCP server source:
1. `generate-compose` — `services: string[], version?: string`
2. `validate-compose` — `yaml: string`
3. `parse-compose` — `yaml: string`
4. `get-recommendations` — `service: string, existing?: string[]`
5. `ai-generate-compose` — `prompt, provider, apiKey, model?, baseUrl?, mode?, yaml?`

**Section 4 — Usage Examples:**
3 example scenarios from spec Section 5.5, each with:
- User prompt in a chat bubble style
- Tool response in a code block

**Footer:** Same as landing page

The full component should be ~400-500 lines. Use the same color palette as landing:
- Background: `#0a0806`
- Gold accent: `#d4a843`
- Text primary: `#e8dcc8`
- Text secondary: `#a89880`
- Text muted: `#6b6055`
- Glass: `rgba(26, 23, 20, 0.6)` with `backdrop-filter: blur(12px)`
- Border: `rgba(212, 168, 67, 0.15)`

Use a local `CopyButton` component:
```tsx
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="..." title="Copy to clipboard">
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
```

- [ ] **Step 2: Verify page renders correctly**

Run: `npm run dev`, navigate to `http://localhost:5173/mcp`
- Hero with title and CTA should render
- All 4 setup tabs should work
- 5 tool cards should display
- 3 example scenarios should render
- Copy buttons should work
- "Open Builder" should navigate to `/app`

- [ ] **Step 3: Commit**

```bash
git add src/components/McpDocsPage.tsx
git commit -m "feat: create full MCP documentation page with setup guide and API reference"
```

---

### Task 8: Update E2E tests — fix navigation paths

All 9 existing E2E tests use `page.goto('/')` + `sessionStorage.setItem('vdc-entered', '1')` + `page.reload()` to reach the canvas. With routing, they should navigate directly to `/app`.

**Files:**
- Modify: `e2e/flows/add-node.spec.ts`
- Modify: `e2e/flows/configure-node.spec.ts`
- Modify: `e2e/flows/marketplace.spec.ts`
- Modify: `e2e/flows/network-management.spec.ts`
- Modify: `e2e/flows/persistence.spec.ts`
- Modify: `e2e/flows/recommendations.spec.ts`
- Modify: `e2e/flows/stacks.spec.ts`
- Modify: `e2e/flows/yaml-import.spec.ts`
- Modify: `e2e/flows/yaml-output.spec.ts`

- [ ] **Step 1: Update all 9 E2E test files**

In each file, replace the `beforeEach` block. The current pattern:

```ts
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.setItem('vdc-entered', '1');
  });
  await page.reload();
  await page.waitForSelector('.react-flow');
```

Replace with:

```ts
test.beforeEach(async ({ page }) => {
  await page.goto('/app');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await page.waitForSelector('.react-flow');
```

Key change: `page.goto('/app')` directly instead of `page.goto('/')` + sessionStorage trick. Remove the `sessionStorage.setItem('vdc-entered', '1')` line since it's no longer needed when going directly to `/app`.

Apply this change to all 9 files. Some files (like `persistence.spec.ts`) may have different `beforeEach` logic — read each file carefully before editing. The persistence test may need special handling since it tests localStorage-based navigation.

- [ ] **Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: All 23 existing E2E tests pass

- [ ] **Step 3: Commit**

```bash
git add e2e/flows/*.spec.ts
git commit -m "fix: update E2E tests to use /app route directly"
```

---

### Task 9: Add new E2E tests for routing and navigation

**Files:**
- Create: `e2e/flows/routing.spec.ts`

- [ ] **Step 1: Write routing E2E tests**

Create `e2e/flows/routing.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('Routing & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('first visit shows landing page at /', async ({ page }) => {
    await page.reload();
    await expect(page.locator('text=Visual Docker Compose')).toBeVisible();
    await expect(page.locator('text=Start Building')).toBeVisible();
  });

  test('Start Building navigates to /app', async ({ page }) => {
    await page.reload();
    await page.click('text=Start Building');
    await expect(page).toHaveURL(/\/app$/);
    await page.waitForSelector('.react-flow');
  });

  test('returning visitor auto-redirects from / to /app', async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem('vdc-entered', '1');
    });
    await page.reload();
    await expect(page).toHaveURL(/\/app$/);
  });

  test('/mcp shows MCP documentation page', async ({ page }) => {
    await page.goto('/mcp');
    await expect(page.locator('text=MCP Integration')).toBeVisible();
  });

  test('landing page MCP Docs link navigates to /mcp', async ({ page }) => {
    await page.goto('/');
    await page.click('text=MCP Docs');
    await expect(page).toHaveURL(/\/mcp$/);
  });

  test('logo dropdown Home navigates from /app to /', async ({ page }) => {
    await page.goto('/app');
    await page.waitForSelector('.react-flow');
    // Click the NavDropdown trigger (logo area)
    await page.click('text=VCompose');
    await page.click('text=Home');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('text=Visual Docker Compose')).toBeVisible();
  });

  test('logo dropdown MCP Docs navigates from /app to /mcp', async ({ page }) => {
    await page.goto('/app');
    await page.waitForSelector('.react-flow');
    await page.click('text=VCompose');
    await page.click('text=MCP Docs');
    await expect(page).toHaveURL(/\/mcp$/);
  });
});
```

- [ ] **Step 2: Run new E2E tests**

Run: `npx playwright test e2e/flows/routing.spec.ts`
Expected: All 7 tests pass

- [ ] **Step 3: Run full test suite**

Run: `npm run test && npm run test:e2e`
Expected: All unit tests (99) + MCP tests (14) + E2E tests (23 + 7 new = 30) pass

- [ ] **Step 4: Commit**

```bash
git add e2e/flows/routing.spec.ts
git commit -m "test: add E2E tests for routing and navigation"
```

---

### Task 10: Update docs — STATUS.md, e2e-tests.md, persistence.md

**Files:**
- Modify: `docs/STATUS.md`
- Modify: `docs/specs/e2e-tests.md`
- Modify: `docs/specs/persistence.md`

- [ ] **Step 1: Update docs/STATUS.md**

Add Phase 11 as completed with updated test counts.

- [ ] **Step 2: Update docs/specs/e2e-tests.md**

Add the new routing E2E test scenarios.

- [ ] **Step 3: Update docs/specs/persistence.md**

Update the sessionStorage section to reflect that `vdc-entered` redirect logic is now route-level in `LandingRedirect` component, not in `App.tsx` state initialization.

- [ ] **Step 4: Commit**

```bash
git add docs/STATUS.md docs/specs/e2e-tests.md docs/specs/persistence.md
git commit -m "docs: update STATUS, E2E spec, and persistence spec for Phase 11"
```

---

### Task 11: Final verification

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Clean build, no errors

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Run all tests**

Run: `npm run test`
Expected: All 99 unit + 14 MCP tests pass

- [ ] **Step 4: Run all E2E tests**

Run: `npm run test:e2e`
Expected: All ~30 E2E tests pass

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev` and verify:
1. Fresh visit to `/` → landing page
2. Click "MCP Docs" in navbar → `/mcp` page
3. Click "Open Builder" on MCP page → `/app`
4. In canvas, click VCompose logo → dropdown appears
5. Click "Home" → returns to landing (`/`)
6. Click "Start Building" → goes to `/app`
7. Press ⌘K, type "mcp" → "MCP Docs" action appears, selecting it navigates to `/mcp`
8. Press ⌘K, type "home" → "Go to Home" action appears, selecting it navigates to `/`
9. MCP page: all 4 setup tabs work, copy buttons copy to clipboard
10. Browser back/forward buttons work correctly between pages
