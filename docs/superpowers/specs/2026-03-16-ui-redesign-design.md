# UI Redesign — Design Spec

> Phase 10: Complete visual overhaul. Component Shell Swap strategy — store/lib/hooks unchanged, only UI layer replaced.

---

## 1. Design Decisions Summary

| Decision | Choice |
|----------|--------|
| Sidebar navigation | VS Code style icon rail (48px) + collapsible panel (280px) |
| Landing page | Modernize existing (animations, glassmorphism, parallax) |
| Animation level | Expressive & playful (spring physics, 3D tilt, particles) |
| Config panel | Floating panel on canvas (draggable, closeable) |
| YAML output | Right panel, always visible |
| Color palette | Anthracite/charcoal base + amber/gold accents |
| Canvas nodes | Glassmorphism (semi-transparent, blur, gradient dividers) |
| Edges | Neon wire (amber pulse, flow particles) |
| Animation lib | Framer Motion |
| Component source | 21st.dev Magic MCP + custom adaptations |

---

## 2. Theme System

CSS Custom Properties on `:root` (dark-only):

```css
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

Theme variables go into `src/styles/theme.css`, which is `@import`'ed at the top of `src/index.css` (before Tailwind directives). Tailwind config `extend.colors`:

```js
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
}
```

Framer Motion default spring: `{ type: "spring", stiffness: 300, damping: 25 }`.

---

## 3. App Layout

### 3.1 Structure

```
┌──────────────────────────────────────────────────────────┐
│  HeaderBar (h-10): Logo + ⌘K Search + Undo/Redo + ⚙️     │
├────┬──────────┬──────────────────────┬───────────────────┤
│Rail│ SidePanel │      Canvas          │   YAML Panel      │
│48px│  280px    │    (flex-1)          │     (260px)       │
│    │ collapse  │                      │                   │
│ 🗂 │  able     │  [Glassmorphism      │  version: '3.8'   │
│ 📦 │           │   Nodes]             │  services:        │
│ 🤖 │           │                      │    nginx:         │
│    │           │  [Neon Wire Edges]   │      image: ...   │
│ ── │           │                      │                   │
│ 🌐 │           │  [Floating Config]   │                   │
│ 📥 │           │                      │                   │
└────┴──────────┴──────────────────────┴───────────────────┘
```

### 3.2 HeaderBar

- **Logo**: `◆ VCompose` (gold, font-weight 800, letter-spacing -0.5px)
- **BETA badge**: amber border pill
- **⌘K Search**: Command palette trigger in center — `cmdk` or custom, fuzzy search across services/stacks/actions
- **Undo/Redo + Clear All**: Moved from canvas overlay (`UndoRedoToolbar`) to header as icon buttons. Includes undo, redo, and clear all (trash icon). Clear All shows a confirmation popover (anchored to trash icon) on click: "Clear all services?" with Cancel/Confirm buttons. On confirm, uses the same inline `useStore.setState()` pattern as current `UndoRedoToolbar` (no new store action needed). **Note**: current `UndoRedoToolbar` has no confirmation — the popover is a new UX behavior (UI-layer only).
- **Settings gear**: Right end — placeholder for future settings (no-op in Phase 10, visually present as a disabled icon). Existing GitHub link is removed from HeaderBar (it remains in the Landing Page nav).

### 3.3 Icon Rail (48px)

Inspired by 21st.dev `sidebar` component (framer motion collapsible).

**Top icons** (with amber active indicator):
- 🗂 Stacks → StacksPanel
- 📦 Marketplace → MarketplacePanel
- 🤖 AI → AISidebar

**Separator line**

**Bottom icons**:
- 🌐 Networks → NetworkPanel (expands side panel like top icons)
- 📥 Import → **Exception**: does NOT expand side panel. Directly opens `ImportModal` overlay. No active indicator state — momentary click action only.

**Behavior** (for panel-linked icons: Stacks, Marketplace, AI, Networks):
- Click icon → expand panel (280px, spring animation)
- Click same icon again → collapse panel
- Active icon: left amber bar (3px) + bg glow
- Hover: Radix Tooltip with label + scale(1.05) spring
- All emoji icons replaced with `lucide-react` SVG icons

### 3.4 Side Panel (280px, collapsible)

- Spring animation expand/collapse (`framer-motion` `animate` with `width`)
- Content determined by active rail icon
- Each panel (StacksPanel, MarketplacePanel, AISidebar, NetworkPanel) retains same props/hooks
- **NetworkPanel extraction**: NetworkPanel currently lives at the bottom of StacksPanel (Phase 9). In Phase 10, it is extracted from StacksPanel and becomes a standalone panel in the icon rail. Remove the NetworkPanel render from StacksPanel.
- **SidePanel provides the wrapper** (border, scroll area, collapse button). Each panel content renders inside SidePanel and provides its own header title. Existing panel headers are kept as-is inside the SidePanel wrapper.
- Collapse state: only icon rail visible, canvas gets extra space

### 3.5 CommandSearch (⌘K Command Palette)

New component: `CommandSearch.tsx`. Inspired by 21st.dev `command-palette`.

**Trigger**: `Ctrl+K` / `⌘K` keyboard shortcut, or click the search trigger in HeaderBar.

**Behavior**:
- Modal overlay with glassmorphism backdrop (`bg-glass`, backdrop-blur)
- Input field with auto-focus, placeholder: "Search services, stacks, actions..."
- Search uses `cmdk`'s built-in filtering (which scores by substring match). No additional fuzzy lib needed.
- Results grouped by category:
  - **Services**: Search across `service-registry.ts` entries by name/description
  - **Stacks**: Search across `stack-catalog.ts` entries by name/description/tags
  - **Actions**: Static list — "Import YAML", "Clear Canvas", "Export YAML", "Toggle AI Panel"
- Keyboard navigation: `↑`/`↓` to move selection, `Enter` to execute, `Escape` to close
- Selected item highlight with amber accent
- Spring animation for open/close (`scale(0.95 → 1)` + `opacity(0 → 1)`)
- Max 8 results shown, scrollable if more
- Empty state: "No results found" message when search yields zero matches

**Action execution**:
- **Service selected**: calls `addServiceFromRegistry(serviceKey, viewportCenter)` where `viewportCenter` is calculated from React Flow's `getViewport()` + canvas dimensions
- **Stack selected**: calls `addStack(stackKey, viewportCenter)`
- **"Import YAML"**: opens `ImportModal` (same as icon rail Import click)
- **"Clear Canvas"**: closes command palette first, then shows a centered confirmation modal (not the HeaderBar popover — there is no anchor element). Modal: "Clear all services?" with Cancel/Confirm. On confirm, uses the same inline `useStore.setState()` pattern as `UndoRedoToolbar` (no store action added).
- **"Export YAML"**: triggers YAML download (same as YAML panel Download button)
- **"Toggle AI Panel"**: activates/deactivates the AI icon in the Icon Rail (opens AISidebar panel)

**Scope note**: This is a UI-only search over existing data (service-registry, stack-catalog). It does not add new store actions — it reuses `addServiceFromRegistry`, `addStack`, and existing UI triggers. Justified as a navigation/UX improvement within Phase 10 visual overhaul.

### 3.6 Floating Config Panel

Inspired by 21st.dev `floating-panel` (@ark-ui/react).

**Dimensions**: width 320px, max-height 70vh, scrollable overflow. Min-height auto (content-driven).

**Positioning**:
- Triggered by clicking a node on canvas (uses `selectNode` store action)
- Initial position: 20px right and 0px below the clicked node's bounding box (screen coordinates obtained from React Flow's `getNodesBounds` + `flowToScreenPosition`)
- **Viewport-aware**: if placing right/below would overflow the canvas viewport, flip to left/above
- **z-index**: 50 (above nodes at z-10, below modals at z-100)

**Interaction**:
- **Draggable** within canvas bounds (via Framer Motion `drag` with `dragConstraints` set to canvas container ref)
- **Closeable** via ✕ button, clicking canvas background, or pressing `Escape`
- When associated node is **dragged**: panel does NOT follow (stays at last position). User can drag panel independently.
- When associated node is **deleted**: panel closes immediately (watches `selectedNodeId` — if null, panel unmounts)
- React Flow pan/zoom is **not blocked** — panel renders in a React portal div layered above the canvas. Since the portal is outside React Flow's DOM tree, mouse events on the panel naturally do not propagate to React Flow.

**Styling**:
- Glassmorphism background (`bg-glass`, backdrop-blur-20px)
- Same fields as current ConfigPanel (service_name, image, ports, volumes, env, networks, healthcheck)
- RecommendationList remains at bottom
- Framer Motion `AnimatePresence` for mount/unmount animation (`opacity 0→1`, `scale 0.95→1`, spring)

**Note**: The `layoutId` transition from node to panel is a stretch goal. If React Flow's DOM structure (foreignObject / internal layers) prevents cross-tree `layoutId` in Framer Motion, fall back to a simple spring open animation without shared layout.

### 3.7 YAML Panel (260px, fixed right)

The right panel previously contained both ConfigPanel and YamlOutput stacked vertically (sharing `w-80`/320px). In the new layout, ConfigPanel moves to FloatingConfigPanel on canvas (Section 3.6), and the right panel contains **only** the YAML output at a narrower 260px.

- Always visible (not conditional on node selection)
- Syntax highlighting via `react-syntax-highlighter` (use `PrismLight` build, register only YAML language; `atomDark` theme customized to gold/green)
- Validation badge: `✓ Valid` (green), `⚠ Warnings` (amber), `✗ Errors` (red)
- Copy + Download buttons in header
- Import button removed from here (moved to icon rail)
- YAML download logic: extract from current inline code in `YamlOutput.tsx` to a shared utility (`src/lib/yaml-download.ts`) so both YamlOutput and CommandSearch can invoke it

---

## 4. Canvas Components

### 4.1 Glassmorphism Service Node

Inspired by 21st.dev `glass-card` + `3d-image-card`.

```
┌─────────────────────────┐  ← border: rgba(212,168,67,0.15)
│  🌐  nginx              │  ← bg: rgba(38,34,32,0.7)
│      nginx:alpine       │     backdrop-filter: blur(10px)
│─────────────────────────│  ← gradient divider (amber)
│  ⚡ 80:80               │  ← port badges
└─────────────────────────┘
```

**Hover effects** (Framer Motion):
- `scale(1.02)` spring
- Border glow intensifies (`rgba(212,168,67,0.25)`)
- Subtle 3D tilt following mouse position (perspective transform, **disabled during drag** — only active on `mouseMove` when not dragging to avoid conflict with React Flow pan/drag)
- Shadow deepens

**Selected state**:
- Amber border (`rgba(212,168,67,0.4)`)
- Outer glow ring
- Opens floating config panel

**Validation indicators**:
- Error: red dot top-right + red border tint
- Warning: amber dot top-right

### 4.2 Neon Wire Edges

Custom React Flow edge component:

- Thin line (1.5px) with amber color (`#d4a843`)
- SVG `feGaussianBlur` glow filter
- Animated flow particle: small circle moving along the bezier path (`animateMotion`, 3s loop)
- Connection point dots with pulse animation (`opacity: 0.4 → 1 → 0.4`, 2s cycle)
- Hover: line thickens (2.5px), glow intensifies, shows "depends_on" label

### 4.3 Empty Canvas Overlay

- Modernized with gold/charcoal theme
- Whale emoji → Docker whale lucide icon
- Instruction pills with amber accent
- Framer Motion fade-in on mount

---

## 5. Landing Page

### 5.1 Structure (existing, modernized)

1. **Nav**: Logo + GitHub/Docs links
2. **Hero**: Gradient orbs (amber), grid overlay, gradient text, CTA buttons
3. **YAML Preview**: Window chrome, staggered typing animation
4. **Features Grid**: 9 cards (3×3), hover effects
5. **CTA Section**: Final call-to-action
6. **Footer**: Copyright + credits

### 5.2 Animations (Framer Motion)

**Hero**:
- `AnimatedGroup` from 21st.dev — staggered spring reveal (badge → title → subtitle → buttons)
- Floating gradient orbs: CSS `@keyframes` (8-12s ease-in-out infinite)
- Grid pattern: subtle parallax on scroll
- Badge pulse dot

**YAML Preview**:
- Window frame: `scale(0.95 → 1)` + `opacity(0 → 1)` spring, scroll-triggered
- Lines: staggered `fadeSlideIn` (0.3s intervals)
- Cursor: CSS blink animation

**Feature Cards** (21st.dev `feature-section-with-hover-effects` adapted):
- Scroll-triggered stagger reveal (`AnimatedGroup preset="blur-slide"`)
- Hover: `translateY(-4px)` + amber border glow + shadow
- Left bar indicator: `h-6 → h-8` on hover, color change to amber
- 3D tilt: mouse position tracking via Framer Motion `useMotionValue`

**CTA Buttons**:
- Primary: `ShimmerButton` from 21st.dev with gold shimmer
- Secondary: hover border glow + bg fill
- Click: spring `scale(0.97)` bounce

---

## 6. 21st.dev Component Integration Map

### Direct Use (adapted to theme)

| 21st.dev Component | Target Component | Adaptation |
|---------------------|-----------------|------------|
| `shimmer-button` | `ShimmerButton` | Gold shimmer color, charcoal bg |
| `animated-group` | Landing hero + features | Stagger timing adjusted |
| `tooltip` (radix) | `IconRailTooltip` | Dark theme, amber accent |
| `selector-chips` | `CategoryChips` | Gold selected state, spring animation |
| `floating-panel` (@ark-ui) | `FloatingConfigPanel` | Glassmorphism bg, amber header |
| `code-block` (prism) | `YamlOutput` | Custom `atomDark` theme with gold keys |

### Inspiration (custom implementation)

| 21st.dev Component | Inspired Component | What We Take |
|---------------------|-------------------|--------------|
| `sidebar` (framer motion) | `IconRail` + `SidePanel` | Collapse/expand variants, mouseEnter/Leave pattern |
| `command-palette` | `CommandSearch` | Fuzzy search, keyboard nav, category sections |
| `glass-card` | `GlassServiceNode` | Backdrop-blur, inner shadow, border glow |
| `3d-image-card` | Node hover effect | Perspective 3D tilt, mouse tracking |
| `feature-section-with-hover-effects` | Landing features | Gradient hover bg, left bar indicator |
| `tags-selector` | Network checkboxes | LayoutId smooth transition pattern |

### New Dependencies

| Package | Purpose | Size Impact |
|---------|---------|-------------|
| `framer-motion` | All animations, layoutId, spring physics | ~30KB gzipped |
| `@ark-ui/react` | Floating panel primitive only | Tree-shakeable |
| `lucide-react` | Icon set (replaces emoji icons) | Tree-shakeable |
| `react-syntax-highlighter` | YAML syntax highlighting (use `PrismLight` build + YAML lang only) | ~20-30KB gzipped |
| `cmdk` | Command palette (⌘K search) | ~5KB gzipped |

---

## 7. Component Shell Swap Map

These existing components get replaced. **Store and hooks/ remain untouched. Existing lib/ files remain untouched** (one new utility `yaml-download.ts` is added to `src/lib/`).

### 7.1 File Paths for New/Renamed Components

| New Component | Directory | Notes |
|---------------|-----------|-------|
| `IconRail.tsx` | `src/components/sidebar/` | Replaces `SidebarTabs.tsx` |
| `SidePanel.tsx` | `src/components/sidebar/` | Replaces `SidebarTabs.tsx` |
| `GlassServiceNode.tsx` | `src/components/canvas/` | Replaces `ServiceNodeComponent.tsx` |
| `FloatingConfigPanel.tsx` | `src/components/panel/` | Replaces `ConfigPanel.tsx` |
| `NeonWireEdge.tsx` | `src/components/canvas/` | New custom React Flow edge component |
| `CommandSearch.tsx` | `src/components/` | New root-level component |
| `yaml-download.ts` | `src/lib/` | Extracted YAML download utility |
| `theme.css` | `src/styles/` | New directory (`src/styles/` does not exist yet — create it) |

All other components retain their existing directory paths.

### 7.2 Swap Table

| Old Component | New Component | What Changes |
|---------------|--------------|--------------|
| `App.tsx` | `App.tsx` | Layout structure (rail + panel + canvas + yaml) |
| `HeaderBar.tsx` | `HeaderBar.tsx` | Add ⌘K search, undo/redo, gold theme |
| `LandingPage.tsx` | `LandingPage.tsx` | Full visual overhaul, Framer Motion |
| `SidebarTabs.tsx` | `IconRail.tsx` + `SidePanel.tsx` | Tabs → icon rail + collapsible panel |
| `StacksPanel.tsx` | `StacksPanel.tsx` | Gold theme, animated cards |
| `StackCard.tsx` | `StackCard.tsx` | Glassmorphism, hover tilt |
| `MarketplacePanel.tsx` | `MarketplacePanel.tsx` | Gold theme, animated cards |
| `ServiceCard.tsx` | `ServiceCard.tsx` | Glassmorphism, hover effects |
| `CategoryChips.tsx` | `CategoryChips.tsx` | SelectorChips pattern, spring animation |
| `AISidebar.tsx` | `AISidebar.tsx` | Gold theme, improved form styling |
| `NetworkPanel.tsx` | `NetworkPanel.tsx` | Gold theme (now in icon rail bottom) |
| `FlowCanvas.tsx` | `FlowCanvas.tsx` | Gold grid dots, updated drop handler, register `edgeTypes: { dependencyEdge: NeonWireEdge }` |
| `ServiceNodeComponent.tsx` | `GlassServiceNode.tsx` | Glassmorphism, 3D tilt, amber glow |
| `EmptyCanvasOverlay.tsx` | `EmptyCanvasOverlay.tsx` | Gold theme, lucide icons |
| `UndoRedoToolbar.tsx` | *(removed from canvas)* | Moved to HeaderBar |
| `ConfigPanel.tsx` | `FloatingConfigPanel.tsx` | Floating, draggable, glassmorphism |
| `ImageSearchInput.tsx` | `ImageSearchInput.tsx` | Gold theme styling |
| `RecommendationList.tsx` | `RecommendationList.tsx` | Gold theme, spring animations |
| `YamlOutput.tsx` | `YamlOutput.tsx` | Syntax highlighting, always visible |
| `ImportModal.tsx` | `ImportModal.tsx` | Gold theme, improved backdrop |
| *(new)* | `NeonWireEdge.tsx` | Custom edge with glow + flow particles (Section 4.2) |
| *(new)* | `CommandSearch.tsx` | ⌘K command palette (uses `cmdk`) |
| *(new)* | `yaml-download.ts` | Extracted YAML download utility |
| *(new)* | `src/styles/theme.css` | CSS custom properties |

### 7.3 Icon Mapping

Existing service/stack data uses emoji strings for `icon` fields (e.g., `🐘` for postgres). The new `GlassServiceNode` and sidebar cards will:
- **Keep emoji icons as-is** in data layer (`service-registry.ts`, `stack-catalog.ts` — these are not changed)
- Render emojis inside a styled icon container (rounded, `bg-elevated`, border)
- **lucide-react icons** are used only for UI chrome: icon rail buttons, header buttons, YAML panel buttons, navigation — NOT for service/stack data icons

---

## 8. Prerequisites (before implementation)

1. **Update PROJECT_SPEC.md Section 2** to add new dependencies:
   - `framer-motion` — animation library (spring physics, layoutId, AnimatePresence)
   - `lucide-react` — SVG icon set for UI chrome (replaces inline emoji in navigation/buttons)
   - `@ark-ui/react` — headless floating panel primitive
   - `react-syntax-highlighter` — YAML syntax highlighting with PrismLight
   - `cmdk` — command palette component
2. **Update PROJECT_SPEC.md Section 8** to add Phase 10 (UI Redesign) to the roadmap.

## 9. Constraints

- **No store changes**: All Zustand store actions, state shape, and persist middleware remain identical.
- **No existing lib changes**: `yaml-builder.ts`, `validator.ts`, `yaml-parser.ts`, `recommendation-engine.ts`, `position-calculator.ts` untouched. One new file added: `yaml-download.ts` (extracted from YamlOutput inline code).
- **No hook changes**: `useDockerHubSearch.ts` and other hooks keep same API.
- **No data changes**: `service-registry.ts`, `stack-catalog.ts`, `categories.ts` untouched.
- **E2E tests**: Will need selector updates. Strategy: preserve existing `data-testid` attributes on new components where possible; update Playwright selectors in a dedicated migration step after all UI components are swapped. The 17 existing E2E tests must pass after migration. Key known selector changes:
  - `data-testid="import-btn"` moves from YamlOutput to IconRail (affects `yaml-import.spec.ts`)
  - Tab buttons ("Stacks", "Marketplace") become icon rail buttons (affects `stacks.spec.ts`, `marketplace.spec.ts`)
  - ConfigPanel selectors change to FloatingConfigPanel context
  - `<pre>` tag may change to react-syntax-highlighter wrapper
- **Unit tests**: No changes needed (only test lib/ functions).
- **React Flow version**: Current project uses `@xyflow/react` (v12). All canvas-related code (custom nodes, edges, handles) must use `@xyflow/react` imports, not `react-flow-renderer` or `reactflow`.

---

## 10. Out of Scope

- Light mode / theme toggle
- Responsive / mobile layout
- New features or store actions
- Refactoring lib/ or store/ code
- New E2E test scenarios (only update selectors)
