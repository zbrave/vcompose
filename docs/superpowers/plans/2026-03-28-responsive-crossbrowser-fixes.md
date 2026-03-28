# Responsive & Cross-Browser Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix YAML panel responsive behavior, text wrapping, ServiceNode width constraint, and toggle discoverability across all screen sizes and browsers.

**Architecture:** Four independent fixes: (1) Replace hidden YAML panel with collapsible tab + overlay on narrow screens, (2) Add word-wrap to syntax highlighter, (3) Add maxWidth to service nodes, (4) Remove obsolete header toggle. Changes are UI-only — no store/lib modifications.

**Tech Stack:** React, Tailwind CSS, Framer Motion (existing), lucide-react (existing), react-syntax-highlighter (existing)

---

### Task 1: ServiceNode maxWidth Constraint

**Files:**
- Modify: `src/components/canvas/GlassServiceNode.tsx:60`

- [ ] **Step 1: Add maxWidth to GlassServiceNode inline style**

In `src/components/canvas/GlassServiceNode.tsx`, add `maxWidth: '280px'` to the style object on the root `motion.div`:

```tsx
      style={{
        backgroundColor: 'rgba(38, 34, 32, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor,
        boxShadow,
        minWidth: '160px',
        maxWidth: '280px',
        borderRadius: '10px',
        padding: '12px 14px',
        position: 'relative',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
```

- [ ] **Step 2: Verify in dev server**

Run: `npm run dev`

Open browser, add a service with a long name. Confirm the node does not exceed 280px and the service name is truncated with ellipsis.

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/GlassServiceNode.tsx
git commit -m "fix: add maxWidth to ServiceNode for cross-browser consistency"
```

---

### Task 2: YAML Text Word Wrap

**Files:**
- Modify: `src/components/output/YamlOutput.tsx:10-23,99-105`

- [ ] **Step 1: Update custom style for word wrapping**

In `src/components/output/YamlOutput.tsx`, update the `customStyle` object to add `whiteSpace: 'pre-wrap'` and `wordBreak: 'break-all'` to the code style:

```tsx
const customStyle: Record<string, React.CSSProperties> = {
  ...(atomDark as Record<string, React.CSSProperties>),
  'code[class*="language-"]': {
    ...((atomDark as Record<string, React.CSSProperties>)['code[class*="language-"]']),
    background: 'transparent',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  'pre[class*="language-"]': {
    ...((atomDark as Record<string, React.CSSProperties>)['pre[class*="language-"]']),
    background: 'transparent',
    margin: 0,
    padding: '8px 16px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
};
```

- [ ] **Step 2: Add wrapLongLines prop to SyntaxHighlighter**

In the same file, add `wrapLongLines={true}` to the `<SyntaxHighlighter>` component:

```tsx
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language="yaml"
          style={customStyle}
          wrapLongLines={true}
          customStyle={{ background: 'transparent', minHeight: '100%' }}
        >
          {yaml}
        </SyntaxHighlighter>
      </div>
```

- [ ] **Step 3: Verify in dev server**

Run: `npm run dev`

Add a service with long environment values (e.g., `DATABASE_URL=postgresql://user:very-long-password@host:5432/database-name`). Confirm long lines wrap within the 260px panel instead of overflowing or triggering horizontal scroll.

- [ ] **Step 4: Commit**

```bash
git add src/components/output/YamlOutput.tsx
git commit -m "fix: add word-wrap to YAML output panel for narrow screens"
```

---

### Task 3: Collapsible YAML Tab + Remove Header Toggle

**Files:**
- Modify: `src/components/CanvasLayout.tsx:1-117`
- Modify: `src/components/HeaderBar.tsx:1-5,15-19,24,55-56,64-72`
- Modify: `src/styles/theme.css:1-23`

- [ ] **Step 1: Add glow pulse keyframes to theme.css**

Append to `src/styles/theme.css`:

```css
@keyframes yaml-tab-glow {
  0%, 100% {
    box-shadow: 0 0 4px rgba(212, 168, 67, 0.1);
  }
  50% {
    box-shadow: 0 0 12px rgba(212, 168, 67, 0.4);
  }
}
```

- [ ] **Step 2: Remove mobile YAML toggle from HeaderBar**

In `src/components/HeaderBar.tsx`:

Remove `Code` from the lucide-react import (line 2):

```tsx
import { Undo2, Redo2, Trash2, Settings } from 'lucide-react';
```

Remove `onYamlToggle` and `showYaml` from the interface (lines 15-19):

```tsx
interface HeaderBarProps {
  onSearchClick?: () => void;
}
```

Remove them from the destructuring (line 24):

```tsx
export function HeaderBar({ onSearchClick }: HeaderBarProps) {
```

Delete the mobile YAML toggle button entirely (lines 65-72, the block with `{/* Mobile YAML toggle */}`):

```tsx
      <div className="flex items-center gap-1">
        <button
          onClick={(_e) => { undo(); }}
```

(The `<button onClick={onYamlToggle} ...>` block and its comment are removed — the undo button follows directly after the `<div>` opening tag.)

- [ ] **Step 3: Update CanvasLayout with collapsible YAML tab**

Replace the entire `src/components/CanvasLayout.tsx` with:

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store';
import { validate } from '../lib/validator';
import { HeaderBar } from './HeaderBar';
import { IconRail } from './sidebar/IconRail';
import { SidePanel } from './sidebar/SidePanel';
import { StacksPanel } from './sidebar/StacksPanel';
import { MarketplacePanel } from './sidebar/MarketplacePanel';
import { AISidebar } from './sidebar/AISidebar';
import { NetworkPanel } from './sidebar/NetworkPanel';
import { FlowCanvas } from './canvas/FlowCanvas';
import { FloatingConfigPanel } from './panel/FloatingConfigPanel';
import { YamlOutput } from './output/YamlOutput';
import { ImportModal } from './output/ImportModal';
import { CommandSearch } from './CommandSearch';
import ToastContainer from './ToastContainer';

export default function CanvasLayout() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const validationIssues = useStore((s) => s.validationIssues);
  const setValidationIssues = useStore((s) => s.setValidationIssues);
  const navigate = useNavigate();

  const [activePanel, setActivePanel] = useState<string | null>(
    window.innerWidth >= 768 ? 'stacks' : null,
  );
  const [showImport, setShowImport] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showYaml, setShowYaml] = useState(false);

  const hasErrors = validationIssues.some((i) => i.severity === 'error');
  const hasWarnings = validationIssues.some((i) => i.severity === 'warning');

  useEffect(() => {
    const issues = validate({ nodes, edges });
    setValidationIssues(issues);
  }, [nodes, edges, setValidationIssues]);

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
        <HeaderBar
          onSearchClick={() => setShowSearch(true)}
        />
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
          {/* Desktop YAML sidebar */}
          <div className="hidden md:flex">
            <YamlOutput />
          </div>

          {/* Mobile: collapsible YAML tab on right edge */}
          {!showYaml && (
            <button
              onClick={() => setShowYaml(true)}
              className="fixed right-0 top-1/2 z-40 -translate-y-1/2 md:hidden"
              title="Open YAML panel"
              style={{
                writingMode: 'vertical-rl',
                background: 'var(--bg-surface)',
                border: '1px solid rgba(212,168,67,0.3)',
                borderRight: 'none',
                borderRadius: '6px 0 0 6px',
                padding: '14px 7px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--accent)',
                letterSpacing: '1px',
                cursor: 'pointer',
                animation: 'yaml-tab-glow 2s ease-in-out infinite',
              }}
            >
              YAML {hasErrors ? '✗' : hasWarnings ? '⚠' : '✓'}
            </button>
          )}

          {/* Mobile YAML overlay */}
          <AnimatePresence>
            {showYaml && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex justify-end md:hidden"
              >
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowYaml(false)} />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="relative h-full w-[280px]"
                >
                  <YamlOutput onClose={() => setShowYaml(false)} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      <CommandSearch
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onImportClick={() => { setShowSearch(false); setShowImport(true); }}
        onToggleAI={() => { setShowSearch(false); setActivePanel('ai'); }}
        onNavigate={(path) => { setShowSearch(false); navigate(path, path === '/' ? { state: { showLanding: true } } : undefined); }}
      />
      <ToastContainer />
    </ReactFlowProvider>
  );
}
```

- [ ] **Step 4: Verify in dev server**

Run: `npm run dev`

1. Open at full desktop width (>768px) — YAML panel shows on right as before, no tab visible
2. Resize browser below 768px — YAML panel disappears, vertical "YAML ✓" tab appears on right edge with pulsing gold glow
3. Click the tab — YAML overlay slides in from right with backdrop
4. Click backdrop — overlay closes, tab reappears
5. Confirm header bar no longer has the `<Code>` icon

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css src/components/HeaderBar.tsx src/components/CanvasLayout.tsx
git commit -m "feat: add collapsible YAML tab with glow pulse for narrow screens

Replace hidden YAML panel with a discoverable vertical tab on the
right edge. Remove obsolete Code icon toggle from HeaderBar."
```

---

### Task 4: Verify Existing E2E Tests Pass

**Files:**
- No changes — verification only

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: No errors

- [ ] **Step 2: Run unit tests**

Run: `npm run test`

Expected: All 110+ unit tests pass

- [ ] **Step 3: Run E2E tests**

Run: `npm run test:e2e`

Expected: All E2E tests pass. The `yaml-output.spec.ts` tests use `page.locator('pre')`, `page.locator('[title="Warnings"]')`, and `page.locator('button[title="Copy"]')` — these selectors target elements inside `YamlOutput` which is still rendered on desktop viewport (Playwright default is 1280x720), so they should pass without changes.

- [ ] **Step 4: Commit any test fixes if needed**

If any tests fail due to the changes, fix the selectors and commit:

```bash
git add -A
git commit -m "fix: update E2E selectors for responsive layout changes"
```
