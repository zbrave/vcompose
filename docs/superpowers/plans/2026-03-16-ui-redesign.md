# Phase 10: UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete visual overhaul of the Visual Docker Compose Builder using Component Shell Swap strategy — replace only UI/render layer while keeping store/lib/hooks untouched.

**Architecture:** Anthracite/charcoal + amber/gold dark theme via CSS custom properties + Tailwind extend. VS Code-style icon rail sidebar, glassmorphism canvas nodes, neon wire edges, floating config panel, cmdk command palette, Framer Motion animations. All 21st.dev Magic MCP components must be checked before building custom UI.

**Tech Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Zustand + @xyflow/react v12 + Framer Motion + cmdk + @ark-ui/react + lucide-react + react-syntax-highlighter

**Spec:** `docs/superpowers/specs/2026-03-16-ui-redesign-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/styles/theme.css` | CSS custom properties (`:root` variables for entire theme) |
| `src/lib/yaml-download.ts` | Pure function: generate and trigger YAML file download |
| `src/components/sidebar/IconRail.tsx` | 48px vertical icon bar with lucide icons, active indicator, tooltips |
| `src/components/sidebar/SidePanel.tsx` | 280px collapsible panel wrapper with spring animation |
| `src/components/canvas/GlassServiceNode.tsx` | Glassmorphism service node with 3D tilt and amber glow |
| `src/components/canvas/NeonWireEdge.tsx` | Custom edge with SVG glow filter and flow particles |
| `src/components/panel/FloatingConfigPanel.tsx` | Draggable floating config panel in React portal |
| `src/components/CommandSearch.tsx` | ⌘K command palette using cmdk |
| `src/components/ui/ShimmerButton.tsx` | 21st.dev shimmer button adapted to gold theme |
| `src/components/ui/AnimatedGroup.tsx` | 21st.dev animated group for stagger reveals |

### Modified Files

| File | What Changes |
|------|-------------|
| `tailwind.config.js` | Add `extend.colors` and `extend.borderColor` mappings |
| `src/index.css` | Add `@import './styles/theme.css'` before Tailwind directives |
| `package.json` | Add 5 new dependencies |
| `PROJECT_SPEC.md` | Add deps to Section 2, Phase 10 to Section 8 |
| `src/App.tsx` | New layout: icon rail + side panel + canvas + YAML panel (no stacked config) |
| `src/components/HeaderBar.tsx` | Add ⌘K trigger, undo/redo/clear buttons, gold theme |
| `src/components/LandingPage.tsx` | Full visual overhaul with Framer Motion animations |
| `src/components/sidebar/StacksPanel.tsx` | Remove NetworkPanel, gold theme |
| `src/components/sidebar/MarketplacePanel.tsx` | Gold theme |
| `src/components/sidebar/AISidebar.tsx` | Gold theme |
| `src/components/sidebar/StackCard.tsx` | Glassmorphism, hover tilt |
| `src/components/sidebar/ServiceCard.tsx` | Glassmorphism, hover effects |
| `src/components/sidebar/CategoryChips.tsx` | Amber selected state, spring animation |
| `src/components/sidebar/NetworkPanel.tsx` | Gold theme (standalone in icon rail) |
| `src/components/canvas/FlowCanvas.tsx` | Gold grid dots, register `edgeTypes` for NeonWireEdge |
| `src/components/canvas/EmptyCanvasOverlay.tsx` | Gold theme, lucide icons |
| `src/components/panel/ImageSearchInput.tsx` | Gold theme |
| `src/components/panel/RecommendationList.tsx` | Gold theme, spring animations |
| `src/components/output/YamlOutput.tsx` | Syntax highlighting, remove import button, use yaml-download |
| `src/components/output/ImportModal.tsx` | Gold theme |
| `e2e/flows/*.spec.ts` | Selector updates for new component structure |

### Deleted Files

| File | Reason |
|------|--------|
| `src/components/sidebar/SidebarTabs.tsx` | Replaced by IconRail + SidePanel |
| `src/components/canvas/UndoRedoToolbar.tsx` | Moved into HeaderBar |
| `src/components/panel/ConfigPanel.tsx` | Replaced by FloatingConfigPanel |
| `src/components/canvas/ServiceNodeComponent.tsx` | Replaced by GlassServiceNode |

---

## Chunk 1: Foundation

### Task 1: Install dependencies and update PROJECT_SPEC.md

**Files:**
- Modify: `package.json`
- Modify: `PROJECT_SPEC.md` (Section 2 and Section 8)

- [ ] **Step 1: Install new dependencies**

Run:
```bash
npm install framer-motion @ark-ui/react lucide-react react-syntax-highlighter cmdk
npm install -D @types/react-syntax-highlighter
```

- [ ] **Step 2: Update PROJECT_SPEC.md Section 2 — add new deps to Technology Stack table**

Add these rows to the table in Section 2:

```markdown
| Animation | Framer Motion | Spring physics, layoutId, AnimatePresence |
| Icons | lucide-react | SVG icon set for UI chrome |
| UI Primitives | @ark-ui/react | Floating panel headless component |
| Syntax Highlight | react-syntax-highlighter | PrismLight for YAML display |
| Command Palette | cmdk | ⌘K search component |
```

- [ ] **Step 3: Update PROJECT_SPEC.md Section 8 — add Phase 10 to roadmap**

Add row to the Post-MVP table:

```markdown
| 7 | Phase 10 | UI Redesign | `docs/superpowers/specs/2026-03-16-ui-redesign-design.md` |
```

- [ ] **Step 4: Verify installation**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json PROJECT_SPEC.md
git commit -m "chore: add Phase 10 dependencies (framer-motion, lucide-react, @ark-ui/react, react-syntax-highlighter, cmdk)"
```

---

### Task 2: Create theme system

**Files:**
- Create: `src/styles/theme.css`
- Modify: `src/index.css`
- Modify: `tailwind.config.js`

- [ ] **Step 1: Create `src/styles/` directory and `theme.css`**

```css
/* src/styles/theme.css */
:root {
  --bg-base:       #141210;
  --bg-surface:    #1e1b18;
  --bg-elevated:   #262220;
  --bg-glass:      rgba(38, 34, 32, 0.7);

  --border:        #3d3530;
  --border-subtle: #2d2a25;
  --border-glow:   rgba(212, 168, 67, 0.15);

  --accent:        #d4a843;
  --accent-dim:    #a88a35;
  --accent-glow:   rgba(212, 168, 67, 0.15);

  --text-primary:   #e8dcc8;
  --text-secondary: #a89880;
  --text-muted:     #6b6055;

  --success: #4ade80;
  --warning: #f59e0b;
  --error:   #ef4444;
}
```

- [ ] **Step 2: Update `src/index.css` — import theme before Tailwind**

Add `@import './styles/theme.css';` as the very first line, before `@tailwind base;`.

Current first lines:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

New first lines:
```css
@import './styles/theme.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

Also replace the existing body/root styles. The current file uses `@apply bg-gray-950 text-gray-100;` on `body` and `@apply h-screen w-screen` on `#root`. Remove these `@apply` lines entirely and replace with raw CSS:
```css
html {
  color-scheme: dark;
}

body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: system-ui, -apple-system, sans-serif;
}

#root {
  height: 100%;
  width: 100%;
}
```

- [ ] **Step 3: Update `tailwind.config.js` — add theme extend mappings**

Replace entire file content (the current file has a `/** @type {import('tailwindcss').Config} */` JSDoc annotation — drop it, the ESM export is sufficient):

```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        accent: 'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        glass: 'var(--bg-glass)',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
        subtle: 'var(--border-subtle)',
        glow: 'var(--border-glow)',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds. Theme variables are available.

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css src/index.css tailwind.config.js
git commit -m "feat: add anthracite/gold theme system with CSS custom properties and Tailwind extend"
```

---

### Task 3: Create yaml-download utility (TDD)

**Files:**
- Create: `src/lib/yaml-download.ts`
- Create: `src/lib/__tests__/yaml-download.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/__tests__/yaml-download.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadYaml, copyYaml } from '../yaml-download';

describe('yaml-download', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('downloadYaml', () => {
    it('creates a blob URL and triggers download', () => {
      const createObjectURL = vi.fn(() => 'blob:test');
      const revokeObjectURL = vi.fn();
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      const link = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(link as unknown as HTMLAnchorElement);

      downloadYaml('version: "3.8"');

      expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(link.download).toBe('docker-compose.yml');
      expect(link.click).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    it('uses custom filename when provided', () => {
      const createObjectURL = vi.fn(() => 'blob:test');
      const revokeObjectURL = vi.fn();
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      const link = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(link as unknown as HTMLAnchorElement);

      downloadYaml('version: "3.8"', 'my-compose.yml');
      expect(link.download).toBe('my-compose.yml');
    });
  });

  describe('copyYaml', () => {
    it('copies text to clipboard', async () => {
      const writeText = vi.fn(() => Promise.resolve());
      Object.assign(navigator, { clipboard: { writeText } });

      await copyYaml('version: "3.8"');
      expect(writeText).toHaveBeenCalledWith('version: "3.8"');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/yaml-download.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/yaml-download.ts
export function downloadYaml(
  yamlContent: string,
  filename = 'docker-compose.yml',
): void {
  const blob = new Blob([yamlContent], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyYaml(yamlContent: string): Promise<void> {
  await navigator.clipboard.writeText(yamlContent);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/yaml-download.test.ts`
Expected: PASS — 3 tests pass.

- [ ] **Step 5: Run full test suite**

Run: `npm run test`
Expected: All existing 96 unit tests still pass + 3 new tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/yaml-download.ts src/lib/__tests__/yaml-download.test.ts
git commit -m "feat: extract yaml-download utility with TDD (downloadYaml + copyYaml)"
```

---

## Chunk 2: Canvas Components

### Task 4: Create GlassServiceNode component

**Files:**
- Create: `src/components/canvas/GlassServiceNode.tsx`

**Before writing code:** Check 21st.dev Magic MCP for `glass-card` and `3d-image-card` components for glassmorphism patterns and 3D tilt effects. Adapt to the amber/gold theme.

- [ ] **Step 1: Fetch 21st.dev component for glass-card**

Use 21st.dev Magic MCP `21st_magic_component_builder` to get a glass card component. Adapt the result for React Flow node context.

- [ ] **Step 2: Create `GlassServiceNode.tsx`**

This component replaces `ServiceNodeComponent.tsx`. It must:
- Accept the same props: `NodeProps & { data: ServiceNodeData }` from `@xyflow/react`
- Use `Handle` from `@xyflow/react` with `Position.Top` and `Position.Bottom`
- Read `validationIssues` and `removeNode` from store (same as current)
- **New visual treatment:**
  - Background: `bg-glass` with `backdrop-blur-[10px]`
  - Border: `border border-glow` (amber glow on hover/select)
  - Emoji icon in styled container (`bg-elevated` rounded)
  - Service name + image text
  - Gradient divider line (amber)
  - Port badges below divider
  - Validation dots: red top-right for errors, amber for warnings
  - Delete button visible on hover (not just selected)
- **Framer Motion:**
  - Wrap in `motion.div` with `whileHover={{ scale: 1.02 }}` spring
  - 3D tilt effect using `useMotionValue` + `useTransform` for `rotateX`/`rotateY` based on mouse position — **disabled during React Flow drag** (check `isDragging` via React Flow's `useNodeId` or a local ref tracking `mousedown`)
  - Selected state: amber border `rgba(212,168,67,0.4)`, box-shadow glow ring
  - `AnimatePresence` for delete button fade

Key constraints:
- Must use `@xyflow/react` imports (`Handle`, `Position`, `NodeProps`), NOT `reactflow`.
- Preserve any `data-testid` attributes from `ServiceNodeComponent.tsx`. Currently it has none explicitly, but the React Flow class `.react-flow__node` is used by E2E tests — this is automatic from React Flow and will be preserved.

- [ ] **Step 3: Swap GlassServiceNode into FlowCanvas (permanent)**

In `FlowCanvas.tsx`, replace `ServiceNodeComponent` with `GlassServiceNode` in the `nodeTypes` object. This is the permanent swap — not temporary. Update the import:
```typescript
// Remove: import { ServiceNodeComponent } from './ServiceNodeComponent';
// Add:    import { GlassServiceNode } from './GlassServiceNode';
const nodeTypes: NodeTypes = { serviceNode: GlassServiceNode };
```

Start dev server (`npm run dev`), add a node, verify:
- Glassmorphism background renders
- Ports show as badges
- Hover scale works
- Selection shows amber border
- Delete button works

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/GlassServiceNode.tsx
git commit -m "feat: GlassServiceNode with glassmorphism, 3D tilt, amber glow"
```

---

### Task 5: Create NeonWireEdge component

**Files:**
- Create: `src/components/canvas/NeonWireEdge.tsx`

- [ ] **Step 1: Create `NeonWireEdge.tsx`**

This is a new custom React Flow edge. It receives `EdgeProps` from `@xyflow/react` with `sourceX`, `sourceY`, `targetX`, `targetY`, `sourcePosition`, `targetPosition`, `style`, `markerEnd`.

The component must:
- Use `getBezierPath` from `@xyflow/react` to compute the SVG path
- Render an SVG `<g>` group containing:
  - **Glow filter**: `<defs><filter id="neon-glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`
  - **Base path**: `<path d={edgePath} stroke="#d4a843" strokeWidth="1.5" fill="none" filter="url(#neon-glow)" />`
  - **Flow particle**: `<circle r="3" fill="#d4a843"><animateMotion dur="3s" repeatCount="indefinite" path={edgePath} /></circle>`
  - **Connection dots**: pulsing circles at source/target points with CSS animation
- **Hover state**: thicker stroke (2.5px), show "depends_on" label at midpoint
- Use a unique filter ID per edge (e.g., `neon-glow-${id}`) to avoid SVG filter conflicts

Key constraint: Use `@xyflow/react` imports (`getBezierPath`, `EdgeProps`, `BaseEdge`).

- [ ] **Step 2: Register edge type in FlowCanvas**

In `src/components/canvas/FlowCanvas.tsx`:
- Import `NeonWireEdge`
- Add `edgeTypes` object: `const edgeTypes = { dependencyEdge: NeonWireEdge };`
- Pass `edgeTypes={edgeTypes}` to `<ReactFlow>` component
- Remove the `animated` and `style.strokeDasharray` properties from `defaultEdgeOptions`. If it becomes empty, remove the `defaultEdgeOptions` const entirely and remove the `defaultEdgeOptions` prop from `<ReactFlow>`. The neon edge handles all its own styling.

- [ ] **Step 3: Update FlowCanvas grid dots to gold**

In `FlowCanvas.tsx`, update the `<Background>` component:
- Change color from current gray to `"#3d3530"` (border color)
- Or use `var(--border)` if Background accepts CSS variables

- [ ] **Step 4: Verify**

Run: `npm run dev`
Add two nodes, connect them. Verify:
- Amber glowing edge appears
- Flow particle animates along the path
- Hover shows "depends_on" label
- Grid dots are gold-tinted

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas/NeonWireEdge.tsx src/components/canvas/FlowCanvas.tsx
git commit -m "feat: NeonWireEdge with SVG glow filter and flow particles"
```

---

### Task 6: Update EmptyCanvasOverlay

**Files:**
- Modify: `src/components/canvas/EmptyCanvasOverlay.tsx`

- [ ] **Step 1: Rewrite EmptyCanvasOverlay with gold theme**

Replace whale emoji (🐳) with a lucide-react `Container` or `Ship` icon. Update all colors from gray to theme colors:
- Heading: `text-text-primary`
- Description: `text-text-secondary`
- Feature pills: `bg-elevated text-text-secondary border border-subtle`
- Add Framer Motion `motion.div` wrapper with `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` for fade-in on mount

- [ ] **Step 2: Verify**

Run: `npm run dev` — clear all nodes, verify overlay shows with gold theme.

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/EmptyCanvasOverlay.tsx
git commit -m "style: EmptyCanvasOverlay gold theme with lucide icons and fade-in"
```

---

## Chunk 3: App Layout & Header

### Task 7: Rewrite HeaderBar

**Files:**
- Modify: `src/components/HeaderBar.tsx`

**Before writing code:** Check 21st.dev Magic MCP for `tooltip` component (Radix-based) for the icon button tooltips.

- [ ] **Step 1: Rewrite HeaderBar**

The new HeaderBar must contain (left to right):
1. **Logo**: `◆ VCompose` — gold (`text-accent`), font-weight 800, letter-spacing -0.5px
2. **BETA badge**: `border border-accent text-accent text-xs px-2 py-0.5 rounded-full`
3. **Spacer** (`flex-1`)
4. **⌘K Search trigger**: Button showing "Search... ⌘K" in muted text, `bg-elevated border border-subtle rounded-md px-3 py-1 text-sm`. Clicking opens CommandSearch (via a callback prop `onSearchClick` — for now, just render the button; CommandSearch integration comes in Task 16).
5. **Spacer** (`flex-1`)
6. **Undo button**: lucide `Undo2` icon, disabled when no past states
7. **Redo button**: lucide `Redo2` icon, disabled when no future states
8. **Clear All button**: lucide `Trash2` icon with confirmation popover
9. **Settings gear**: lucide `Settings` icon, disabled (no-op in Phase 10)

For Undo/Redo, copy the temporal store hook pattern from current `UndoRedoToolbar.tsx`:
```typescript
import { useStoreWithEqualityFn } from 'zustand/traditional';
import type { TemporalState } from 'zundo';
```

For Clear All popover: use a simple state-toggled div positioned below the trash icon. Show "Clear all services?" with Cancel/Confirm buttons. On confirm, call `useStore.setState({ nodes: [], edges: [], networks: [], namedVolumes: [], selectedNodeId: null })`.

Background: `bg-surface border-b border-subtle`
Height: `h-10`

- [ ] **Step 2: Remove GitHub link**

The existing GitHub link in HeaderBar is removed. It stays only in `LandingPage.tsx` nav.

- [ ] **Step 3: Verify**

Run: `npm run dev` — verify header shows with gold theme, undo/redo buttons work, clear all popover appears.

- [ ] **Step 4: Commit**

```bash
git add src/components/HeaderBar.tsx
git commit -m "feat: HeaderBar with undo/redo, clear all popover, ⌘K trigger, gold theme"
```

---

### Task 8: Create IconRail component

**Files:**
- Create: `src/components/sidebar/IconRail.tsx`

**Before writing code:** Check 21st.dev Magic MCP for `sidebar` component (framer motion collapsible). Use the collapse/expand pattern. Also check `tooltip` for icon hover labels.

- [ ] **Step 1: Create `IconRail.tsx`**

The icon rail is a 48px wide vertical bar. It manages which panel is active.

Props:
```typescript
interface IconRailProps {
  activePanel: string | null;
  onPanelChange: (panel: string | null) => void;
  onImportClick: () => void;
}
```

Icons (top section, use lucide-react):
- `Layers` → 'stacks'
- `Store` (or `Package`) → 'marketplace'
- `Bot` → 'ai'

Separator: `<div className="mx-3 my-2 h-px bg-border-subtle" />`

Icons (bottom section):
- `Network` → 'networks'
- `Import` → calls `onImportClick()` directly (no panel)

Each icon button:
- `w-10 h-10 mx-auto rounded-lg flex items-center justify-center`
- Active: `bg-accent/10` + left amber bar (3px `absolute left-0 bg-accent rounded-r`)
- Hover: Framer Motion `whileHover={{ scale: 1.05 }}` spring + tooltip showing label
- Tooltip: Use Radix Tooltip or a simple `title` attribute initially

Background: `bg-surface border-r border-subtle`
Layout: `flex flex-col h-full w-12 py-2`

- [ ] **Step 2: Verify in isolation**

Temporarily render `IconRail` in `App.tsx` alongside existing sidebar. Verify icons render, click toggles active state, import icon is distinct.

- [ ] **Step 3: Commit**

```bash
git add src/components/sidebar/IconRail.tsx
git commit -m "feat: IconRail with lucide icons, active indicator, tooltip"
```

---

### Task 9: Create SidePanel component

**Files:**
- Create: `src/components/sidebar/SidePanel.tsx`

- [ ] **Step 1: Create `SidePanel.tsx`**

The side panel is a 280px collapsible wrapper. It wraps whatever panel content is active.

Props:
```typescript
interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
```

Implementation:
- Use Framer Motion `motion.div` with `animate={{ width: isOpen ? 280 : 0 }}`
- Spring transition: `{ type: "spring", stiffness: 300, damping: 25 }`
- `overflow: hidden` during animation
- When open: `border-r border-subtle bg-surface`
- Contains `children` (the active panel component)
- Collapse button (lucide `PanelLeftClose`) in top-right corner

- [ ] **Step 2: Verify**

Temporarily render `SidePanel` alongside `IconRail` in `App.tsx` (or in a test harness). Verify:
- Panel expands to 280px with spring animation
- Panel collapses to 0px
- Content is hidden during collapse (overflow hidden)

- [ ] **Step 3: Commit**

```bash
git add src/components/sidebar/SidePanel.tsx
git commit -m "feat: SidePanel with spring collapse/expand animation"
```

---

### Task 10: Rewrite App.tsx layout

**Files:**
- Modify: `src/App.tsx`

This is the critical layout change. The new structure:
```
HeaderBar
├── IconRail (48px)
├── SidePanel (280px, collapsible)
├── FlowCanvas (flex-1) ← contains FloatingConfigPanel in portal
└── YamlOutput (260px)
```

- [ ] **Step 1: Update imports**

Remove:
```typescript
import { SidebarTabs } from './components/sidebar/SidebarTabs';
import { ConfigPanel } from './components/panel/ConfigPanel';
```

Add:
```typescript
import { IconRail } from './components/sidebar/IconRail';
import { SidePanel } from './components/sidebar/SidePanel';
import { StacksPanel } from './components/sidebar/StacksPanel';
import { MarketplacePanel } from './components/sidebar/MarketplacePanel';
import { AISidebar } from './components/sidebar/AISidebar';
import { NetworkPanel } from './components/sidebar/NetworkPanel';
import { FloatingConfigPanel } from './components/panel/FloatingConfigPanel';
import { ImportModal } from './components/output/ImportModal';
```

**Important:** `FloatingConfigPanel` doesn't exist yet (created in Task 14). Create a minimal placeholder file now so the build doesn't break:

```typescript
// src/components/panel/FloatingConfigPanel.tsx (placeholder — replaced in Task 14)
export function FloatingConfigPanel() {
  return null; // Placeholder until Task 14
}
```

- [ ] **Step 2: Rewrite layout JSX (builder view only)**

**Keep the existing `showLanding` / `handleEnter` logic and `LandingPage` conditional at the top of the component unchanged.** Only replace the builder layout portion (the JSX returned when `showLanding` is false).

The existing App.tsx has these pieces to KEEP:
- `showLanding` state based on localStorage/sessionStorage
- `handleEnter` callback that sets `showLanding = false`
- Validation `useEffect` — unchanged
- `if (showLanding) return <LandingPage onEnter={handleEnter} />;`

Add new state and replace only the builder return block:

```tsx
// NEW state (add alongside existing state)
const [activePanel, setActivePanel] = useState<string | null>('stacks');
const [showImport, setShowImport] = useState(false);

// Keep existing: if (showLanding) return <LandingPage onEnter={handleEnter} />;

// NEW builder layout (replaces the old three-column return):
return (
  <ReactFlowProvider>
    <div className="flex h-screen flex-col bg-base text-text-primary">
      <HeaderBar />
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
  </ReactFlowProvider>
);
```

Note: `CommandSearch` integration is added later in Task 16.

- [ ] **Step 3: Remove old `bg-gray-950` from App and body**

Ensure no hardcoded gray colors remain. The body now uses `var(--bg-base)` from theme.css, and App uses `bg-base` Tailwind class.

- [ ] **Step 4: Verify layout**

Run: `npm run dev` — verify:
- Icon rail shows on left
- Side panel expands/collapses on icon click
- Canvas fills remaining space
- YAML panel on right
- Header at top with gold theme

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: new app layout with icon rail + collapsible side panel"
```

---

## Chunk 4: Sidebar Content Panels

### Task 11: Update StacksPanel (remove NetworkPanel, gold theme)

**Files:**
- Modify: `src/components/sidebar/StacksPanel.tsx`

- [ ] **Step 1: Remove NetworkPanel import and render**

Remove:
```typescript
import { NetworkPanel } from './NetworkPanel';
```
Remove the `<NetworkPanel />` render at the bottom of StacksPanel.

- [ ] **Step 2: Apply gold theme**

Update all Tailwind classes:
- Search input: `bg-elevated border border-subtle text-text-primary placeholder-text-muted focus:border-accent`
- Section headers: `text-text-secondary`
- Background: `bg-surface`

- [ ] **Step 3: Commit**

```bash
git add src/components/sidebar/StacksPanel.tsx
git commit -m "style: StacksPanel gold theme, extract NetworkPanel to standalone"
```

---

### Task 12: Update StackCard, ServiceCard, CategoryChips with gold theme

**Files:**
- Modify: `src/components/sidebar/StackCard.tsx`
- Modify: `src/components/sidebar/ServiceCard.tsx`
- Modify: `src/components/sidebar/CategoryChips.tsx`

**Before writing code:** Check 21st.dev Magic MCP for `selector-chips` component. Adapt for CategoryChips.

- [ ] **Step 1: Update StackCard**

- Background: `bg-elevated/50 border border-subtle hover:border-accent/30`
- Icon container: `bg-surface rounded-lg` with emoji inside
- Service count badge: `bg-accent/10 text-accent text-xs`
- "Add Stack" button: `bg-accent/10 text-accent hover:bg-accent/20`
- Framer Motion: wrap in `motion.div` with `whileHover={{ y: -2 }}` spring

- [ ] **Step 2: Update ServiceCard**

- Background: `bg-elevated/50 border border-subtle hover:border-accent/30`
- Official badge: `bg-accent/10 text-accent`
- "Add" button: `bg-accent/10 text-accent hover:bg-accent/20`
- Star count: `text-text-muted`

- [ ] **Step 3: Update CategoryChips**

- Selected chip: `bg-accent/20 text-accent border-accent/30`
- Unselected chip: `bg-elevated text-text-secondary border-subtle hover:border-accent/20`
- Add Framer Motion `motion.button` with `whileHover={{ scale: 1.05 }}` and `layoutId` for smooth selection transition

- [ ] **Step 4: Commit**

```bash
git add src/components/sidebar/StackCard.tsx src/components/sidebar/ServiceCard.tsx src/components/sidebar/CategoryChips.tsx
git commit -m "style: StackCard, ServiceCard, CategoryChips gold theme with spring animations"
```

---

### Task 13: Update MarketplacePanel, AISidebar, NetworkPanel with gold theme

**Files:**
- Modify: `src/components/sidebar/MarketplacePanel.tsx`
- Modify: `src/components/sidebar/AISidebar.tsx`
- Modify: `src/components/sidebar/NetworkPanel.tsx`

- [ ] **Step 1: Update MarketplacePanel**

- Search input: `bg-elevated border border-subtle text-text-primary placeholder-text-muted focus:border-accent`
- Section headers: `text-text-secondary`
- Error message: `text-[var(--error)]`
- Docker Hub link: `text-accent`

- [ ] **Step 2: Update AISidebar**

- Provider selector buttons: active `bg-accent/20 text-accent border-accent/30`, inactive `bg-elevated text-text-secondary`
- API key input: `bg-elevated border border-subtle text-text-primary`
- Model select: `bg-elevated border border-subtle text-text-primary`
- Prompt textarea: `bg-elevated border border-subtle text-text-primary`
- Generate/Optimize buttons: `bg-accent text-base hover:bg-accent-dim` (primary), `bg-elevated text-text-secondary border border-subtle` (secondary)
- Loading spinner: `border-accent`
- Error: `text-[var(--error)] bg-[var(--error)]/10`

- [ ] **Step 3: Update NetworkPanel**

- Network name input: `bg-elevated border border-subtle text-text-primary placeholder-text-muted focus:border-accent`
- Driver select: `bg-elevated border border-subtle text-text-primary`
- Add button: `bg-accent/10 text-accent`
- Network list items: `bg-elevated border border-subtle`
- Delete button: `text-text-muted hover:text-[var(--error)]`

- [ ] **Step 4: Verify all panels**

Run: `npm run dev` — click through each icon rail panel and verify gold theme applies consistently.

- [ ] **Step 5: Commit**

```bash
git add src/components/sidebar/MarketplacePanel.tsx src/components/sidebar/AISidebar.tsx src/components/sidebar/NetworkPanel.tsx
git commit -m "style: MarketplacePanel, AISidebar, NetworkPanel gold theme"
```

---

## Chunk 5: Config & Output Panels

### Task 14: Create FloatingConfigPanel

**Files:**
- Create: `src/components/panel/FloatingConfigPanel.tsx`

**Before writing code:** Check 21st.dev Magic MCP for `floating-panel` component (@ark-ui/react based). Use the drag/close patterns.

- [ ] **Step 1: Create `FloatingConfigPanel.tsx`**

This replaces `ConfigPanel.tsx` and the placeholder created in Task 10. It must:
- Read `selectedNodeId` from store — if null, render nothing
- Render via `ReactDOM.createPortal` into `document.body`. The `<FloatingConfigPanel />` in App.tsx (Task 10) is just a mount point — the actual panel DOM is portaled outside the React Flow tree so mouse events don't propagate to the canvas.
- Position: calculate from `useReactFlow().getNodesBounds([selectedNodeId])` + `flowToScreenPosition`
  - Offset: 20px right, 0px below the node bounding box
  - Viewport-aware: if right placement overflows, flip to left
- **Dimensions**: `w-80 max-h-[70vh] overflow-y-auto`
- **z-index**: `z-50`
- **Draggable**: Framer Motion `drag` prop with `dragConstraints` (screen bounds)
- **Closeable**: ✕ button, Escape key, click outside (but NOT on other nodes — clicking another node switches selection)
- **Styling**: `bg-glass backdrop-blur-[20px] border border-glow rounded-xl shadow-2xl`
- **AnimatePresence** wrapper for mount/unmount animation
- **Content**: Same fields as current `ConfigPanel.tsx`:
  - Service name, image (ImageSearchInput), ports, volumes, environment, networks, healthcheck
  - RecommendationList at bottom
  - Copy the field rendering logic from `ConfigPanel.tsx` lines 20-207, adapting all colors to gold theme

- [ ] **Step 2: Update all form field colors**

All inputs/selects/textareas: `bg-elevated border border-subtle text-text-primary placeholder-text-muted focus:border-accent`
Labels: `text-text-secondary text-xs`
Add/Remove buttons: `text-accent` / `text-text-muted hover:text-[var(--error)]`
Section headers: `text-text-secondary font-medium`

- [ ] **Step 3: Update ImageSearchInput gold theme**

Modify `src/components/panel/ImageSearchInput.tsx`:
- Dropdown: `bg-elevated border border-subtle`
- Results: `hover:bg-accent/10`
- Official badge: `bg-accent/10 text-accent`
- Loading text: `text-text-muted`

- [ ] **Step 4: Update RecommendationList gold theme**

Modify `src/components/panel/RecommendationList.tsx`:
- Section header: `text-text-secondary`
- Recommendation items: `bg-elevated border border-subtle`
- Add button: `text-accent hover:bg-accent/10`
- Already added: `text-text-muted`
- Add Framer Motion `motion.button` with spring hover

- [ ] **Step 5: Remove old ConfigPanel**

Delete `src/components/panel/ConfigPanel.tsx`.

- [ ] **Step 6: Verify**

Run: `npm run dev` — add a node, click it, verify:
- Floating panel appears near the node
- Panel is draggable
- Close via ✕, Escape, click canvas background
- All fields work (edit service name, add port, etc.)
- Recommendations show at bottom

- [ ] **Step 7: Commit**

```bash
git add src/components/panel/FloatingConfigPanel.tsx src/components/panel/ImageSearchInput.tsx src/components/panel/RecommendationList.tsx
git rm src/components/panel/ConfigPanel.tsx
git commit -m "feat: FloatingConfigPanel with glassmorphism, drag, portal, gold theme"
```

---

### Task 15: Rewrite YamlOutput with syntax highlighting

**Files:**
- Modify: `src/components/output/YamlOutput.tsx`

**Before writing code:** Check 21st.dev Magic MCP for `code-block` component (prism-based). Use the syntax highlighting pattern.

- [ ] **Step 1: Update YamlOutput**

Changes:
1. **Remove Import button** — it moved to IconRail
2. **Remove ImportModal import and state** — it's now managed in App.tsx
3. **Add syntax highlighting**: Use `PrismLight` from `react-syntax-highlighter/dist/esm/prism-light` and register only YAML language:
   ```typescript
   import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
   import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
   import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
   PrismLight.registerLanguage('yaml', yaml);
   ```
4. **Custom theme**: Override `atomDark` to use gold for keys, green for values
5. **Use `downloadYaml` and `copyYaml`** from `src/lib/yaml-download.ts` instead of inline logic
6. **Width**: `w-[260px]` (was shared `w-80`)
7. **Always visible**: Not conditional on `selectedNodeId`
8. **Gold theme**:
   - Background: `bg-surface border-l border-subtle`
   - Header: `text-text-secondary` with validation badge
   - Copy/Download buttons: lucide `Copy`, `Download` icons with `text-text-muted hover:text-accent`
   - Validation badge: `text-[var(--success)]` / `text-accent` / `text-[var(--error)]`

- [ ] **Step 2: Verify**

Run: `npm run dev` — verify YAML panel shows with syntax highlighting, copy/download work.

- [ ] **Step 3: Commit**

```bash
git add src/components/output/YamlOutput.tsx
git commit -m "feat: YamlOutput with syntax highlighting and gold theme"
```

---

## Chunk 6: Command Palette & Import Modal

### Task 16: Create CommandSearch component

**Files:**
- Create: `src/components/CommandSearch.tsx`

**Before writing code:** Check 21st.dev Magic MCP for `command-palette` component. Use the keyboard navigation and category grouping patterns.

- [ ] **Step 1: Create `CommandSearch.tsx`**

Uses `cmdk` package. The component:

```typescript
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { SERVICE_REGISTRY } from '../data/service-registry';
import { STACK_CATALOG } from '../data/stack-catalog';
import { useStore } from '../store';
import { downloadYaml } from '../lib/yaml-download';
import { buildYaml } from '../lib/yaml-builder';
```

Props:
```typescript
interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
  onImportClick: () => void;
  onToggleAI: () => void;
}
```

Structure:
- Modal overlay: `fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm`
- Dialog: `mx-auto mt-[20vh] max-w-lg bg-glass backdrop-blur-[20px] border border-glow rounded-xl`
- `<Command>` root with categories:
  - **Services**: Map `SERVICE_REGISTRY` to `<Command.Item>` with `onSelect` calling `addServiceFromRegistry`
  - **Stacks**: Map `STACK_CATALOG` to `<Command.Item>` with `onSelect` calling `addStack`
  - **Actions**: Static items — Import YAML, Clear Canvas, Export YAML, Toggle AI
- Keyboard: Escape closes
- AnimatePresence for open/close animation: `scale(0.95→1)` + `opacity(0→1)`
- Empty state: "No results found" in `<Command.Empty>`

Action execution:
- Service: `addServiceFromRegistry(key, viewportCenter)` — calculate center from `useReactFlow().getViewport()` + container dimensions
- Stack: `addStack(key, viewportCenter)`
- Import YAML: close palette, call `onImportClick()`
- Clear Canvas: close palette, then show a styled centered confirmation modal (NOT `window.confirm` — use a state-toggled gold-themed modal with "Clear all services?" text, Cancel and Confirm buttons). On confirm, call `useStore.setState({ nodes: [], edges: [], networks: [], namedVolumes: [], selectedNodeId: null })`
- Export YAML: call `downloadYaml(buildYaml(store))`
- Toggle AI: close palette, call `onToggleAI()`

- [ ] **Step 2: Integrate with HeaderBar**

In `App.tsx`:
- Add `const [showCommandSearch, setShowCommandSearch] = useState(false);`
- Pass `onSearchClick={() => setShowCommandSearch(true)}` to `HeaderBar`
- Render `<CommandSearch open={showCommandSearch} onClose={() => setShowCommandSearch(false)} ... />`
- Add global keyboard listener for `Ctrl+K` / `⌘K` to toggle command search

Update `HeaderBar.tsx`:
- Accept `onSearchClick` prop
- Wire search trigger button to call it

- [ ] **Step 3: Verify**

Run: `npm run dev` — verify:
- ⌘K opens command palette
- Search filters services, stacks, actions
- Selecting a service adds it to canvas
- All actions work
- Escape closes

- [ ] **Step 4: Commit**

```bash
git add src/components/CommandSearch.tsx src/App.tsx src/components/HeaderBar.tsx
git commit -m "feat: CommandSearch (⌘K) with cmdk, service/stack/action search"
```

---

### Task 17: Update ImportModal with gold theme

**Files:**
- Modify: `src/components/output/ImportModal.tsx`

- [ ] **Step 1: Update ImportModal**

- Overlay backdrop: `bg-black/60 backdrop-blur-sm`
- Modal: `bg-surface border border-subtle rounded-xl shadow-2xl`
- Title: `text-text-primary`
- Textarea: `bg-elevated border border-subtle text-text-primary placeholder-text-muted focus:border-accent font-mono`
- Error messages: `text-[var(--error)] bg-[var(--error)]/10`
- Buttons: Import `bg-accent text-base hover:bg-accent-dim`, Cancel `bg-elevated text-text-secondary border border-subtle`
- Confirmation dialog: same gold theme

- [ ] **Step 2: Verify**

Run: `npm run dev` — trigger import (via icon rail Import icon), verify modal renders with gold theme, textarea works, error state displays correctly.

- [ ] **Step 3: Commit**

```bash
git add src/components/output/ImportModal.tsx
git commit -m "style: ImportModal gold theme"
```

---

## Chunk 7: Landing Page

### Task 18: Rewrite LandingPage with Framer Motion

**Files:**
- Modify: `src/components/LandingPage.tsx`

**Before writing code:** Check 21st.dev Magic MCP for:
1. `shimmer-button` — for CTA buttons
2. `animated-group` — for staggered reveals
3. `feature-section-with-hover-effects` — for feature cards

This is the largest single component rewrite. The existing LandingPage is 389 lines.

- [ ] **Step 1: Fetch 21st.dev components**

Use 21st.dev Magic MCP to get:
- `ShimmerButton` component → save to `src/components/ui/ShimmerButton.tsx`
- `AnimatedGroup` component → save to `src/components/ui/AnimatedGroup.tsx`
- Feature card hover effect pattern → inline in LandingPage

Create `src/components/ui/` directory for these reusable 21st.dev components. Adapt all to the anthracite/gold theme.

- [ ] **Step 2: Rewrite LandingPage**

The structure stays the same (Nav, Hero, YAML Preview, Features, CTA, Footer). All visual treatment changes:

**Nav**:
- `bg-base/80 backdrop-blur-md border-b border-subtle`
- Logo: `◆ VCompose` gold
- GitHub link stays here

**Hero**:
- Gradient orbs: amber CSS animations (8-12s ease-in-out infinite)
- Grid overlay: `bg-[linear-gradient(...)]` with subtle gold lines
- Badge: pulse dot + `bg-accent/10 text-accent border border-accent/20`
- Title: gradient text `bg-gradient-to-r from-text-primary to-accent bg-clip-text text-transparent`
- Subtitle: `text-text-secondary`
- CTA buttons: `ShimmerButton` (primary, gold shimmer), `bg-elevated border border-subtle` (secondary)
- Use `AnimatedGroup` for staggered reveal of badge → title → subtitle → buttons

**YAML Preview**:
- Window frame: `bg-elevated border border-subtle rounded-xl`
- Window dots: red/yellow/green
- Code: use the theme colors (gold keys, green values)
- Framer Motion: `scale(0.95→1)` spring, staggered line reveal

**Features Grid**:
- 9 cards in 3×3 grid
- Each card: `bg-surface border border-subtle hover:border-accent/30`
- Left bar indicator: `bg-text-muted h-6` → hover `bg-accent h-8`
- Icon: amber background circle
- Title: `text-text-primary`
- Description: `text-text-secondary`
- Hover: `translateY(-4px)` + shadow
- `AnimatedGroup` for scroll-triggered stagger reveal

**CTA Section**:
- Same gold theme
- `ShimmerButton` for primary CTA

**Footer**:
- `text-text-muted`
- GitHub link here (moved from HeaderBar)

- [ ] **Step 3: Remove old inline styles**

Remove the inline `style={{ animationDelay: ... }}` patterns. Replace with Framer Motion variants and stagger.

- [ ] **Step 4: Verify**

Run: `npm run dev` — verify landing page shows with:
- Gold gradient orbs
- Animated hero text
- YAML preview with typing effect
- Feature cards with hover effects
- ShimmerButton CTA

- [ ] **Step 5: Commit**

```bash
git add src/components/LandingPage.tsx
git commit -m "feat: LandingPage visual overhaul with Framer Motion, shimmer buttons, gold theme"
```

---

## Chunk 8: Cleanup & E2E Migration

### Task 19: Delete replaced files and clean up imports

**Files:**
- Delete: `src/components/sidebar/SidebarTabs.tsx`
- Delete: `src/components/canvas/UndoRedoToolbar.tsx`
- Modify: `src/components/canvas/FlowCanvas.tsx` (remove UndoRedoToolbar import/render)

- [ ] **Step 1: Remove UndoRedoToolbar from FlowCanvas**

In `FlowCanvas.tsx`:
- Remove `import { UndoRedoToolbar }`
- Remove `<UndoRedoToolbar />` render
- The undo/redo keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`) stay in FlowCanvas (they are in a `useEffect` there)

- [ ] **Step 2: Delete replaced files**

```bash
git rm src/components/sidebar/SidebarTabs.tsx
git rm src/components/canvas/UndoRedoToolbar.tsx
git rm src/components/canvas/ServiceNodeComponent.tsx
git rm src/components/panel/ConfigPanel.tsx  # if not already deleted in Task 14
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No import errors, clean build.

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "chore: remove SidebarTabs, UndoRedoToolbar, ConfigPanel (replaced by new components)"
```

---

### Task 20: E2E test selector migration

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

Key selector changes needed:

- [ ] **Step 1: Tab buttons → Icon rail buttons**

**stacks.spec.ts**: `button:text("Stacks")` → click the Stacks icon in the rail. Use `[data-testid="rail-stacks"]` (add this data-testid to IconRail).

**marketplace.spec.ts**: `button:text("Marketplace")` → `[data-testid="rail-marketplace"]`

Add `data-testid` attributes to `IconRail.tsx` icon buttons:
- `data-testid="rail-stacks"`
- `data-testid="rail-marketplace"`
- `data-testid="rail-ai"`
- `data-testid="rail-networks"`
- `data-testid="rail-import"`

- [ ] **Step 2: Import button location**

**yaml-import.spec.ts**: `[data-testid="import-btn"]` currently in YamlOutput → now in IconRail.
Add `data-testid="import-btn"` to the Import icon in IconRail.

- [ ] **Step 3: Config panel selectors**

**configure-node.spec.ts**: `text=Configure` → Update to match FloatingConfigPanel header text. If the header says "Configure" keep it; if different, update selector.

**network-management.spec.ts**: `label:has-text("backend")` → verify this still works in FloatingConfigPanel's network checkboxes.

- [ ] **Step 4: YAML output `<pre>` tag**

**yaml-output.spec.ts**, **configure-node.spec.ts**, **network-management.spec.ts**: `pre` selector → `react-syntax-highlighter` renders a `<pre><code>` structure. The `pre` selector should still work, but verify. If not, use `[data-testid="yaml-output"]` (add this to YamlOutput wrapper).

- [ ] **Step 5: Sidebar service text selectors**

**add-node.spec.ts**: `text=Nginx` — this text now appears inside StacksPanel or MarketplacePanel. Since these panels now render inside SidePanel, the text may need the panel to be expanded first. Add a step: click rail icon → verify panel open → then find text.

**persistence.spec.ts**: `text=PostgreSQL` — same issue.

- [ ] **Step 6: Run E2E tests**

Run: `npm run test:e2e`
Expected: All 17 E2E tests pass.

If any fail, read the error, identify the broken selector, fix it, and re-run.

- [ ] **Step 7: Commit**

```bash
git add e2e/ src/components/sidebar/IconRail.tsx src/components/output/YamlOutput.tsx
git commit -m "test: E2E selector migration for Phase 10 UI redesign"
```

---

### Task 21: Final verification and STATUS.md update

**Files:**
- Modify: `docs/STATUS.md`

- [ ] **Step 1: Run full unit test suite**

Run: `npm run test`
Expected: All ~99 unit tests pass (96 existing + 3 new yaml-download).

- [ ] **Step 2: Run full E2E test suite**

Run: `npm run test:e2e`
Expected: All 17 E2E tests pass.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Clean build, no errors.

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: No lint errors.

- [ ] **Step 5: Visual smoke test**

Run: `npm run dev` and manually verify:
- [ ] Landing page loads with gold theme, animations work
- [ ] Click "Start Building" → app layout loads
- [ ] Icon rail shows 5 icons
- [ ] Click Stacks → panel expands with gold-themed stacks
- [ ] Click Marketplace → panel shows services with gold theme
- [ ] Drag a service to canvas → glassmorphism node appears
- [ ] Click node → floating config panel appears near it
- [ ] Edit service name → YAML updates in real-time with syntax highlighting
- [ ] Draw edge between nodes → neon wire with glow appears
- [ ] ⌘K opens command palette, search works
- [ ] Undo/redo buttons in header work
- [ ] Clear all with confirmation works
- [ ] Copy/Download YAML works
- [ ] Import YAML works (via icon rail)
- [ ] Network management works (via icon rail)
- [ ] AI generation works (via icon rail)

- [ ] **Step 6: Update `docs/STATUS.md`**

Add Phase 10 section:

```markdown
## Phase 10: UI Redesign
- [x] Theme system (CSS custom properties + Tailwind extend)
- [x] GlassServiceNode (glassmorphism, 3D tilt, amber glow)
- [x] NeonWireEdge (SVG glow, flow particles)
- [x] IconRail + SidePanel (VS Code style navigation)
- [x] HeaderBar (⌘K trigger, undo/redo, clear all)
- [x] FloatingConfigPanel (draggable, portal, glassmorphism)
- [x] YamlOutput (syntax highlighting, 260px standalone)
- [x] CommandSearch (cmdk, service/stack/action search)
- [x] LandingPage (Framer Motion, shimmer buttons, parallax)
- [x] Gold theme applied to all sidebar panels
- [x] yaml-download.ts utility
- [x] E2E test selector migration
```

Update session log and test counts.

- [ ] **Step 7: Commit**

```bash
git add docs/STATUS.md
git commit -m "docs: Phase 10 UI Redesign complete — update STATUS.md"
```
