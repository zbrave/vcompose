# Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize VCompose for production deployment — improve Core Web Vitals (LCP/FCP), harden nginx security, add missing UX polish (404 page, a11y, PWA).

**Architecture:** Route-based code splitting via `React.lazy` + `Suspense` to break the 2MB single-chunk bundle into per-route chunks. Nginx hardening with security headers, gzip compression, and proper cache policies. Minor UX improvements: 404 catch-all route, keyboard accessibility, PWA manifest icons.

**Tech Stack:** React 19, Vite 7, React Router 7, nginx:alpine, Tailwind CSS 3

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/App.tsx` | Modify | Add `React.lazy` imports, `Suspense` wrappers, 404 route |
| `src/components/NotFoundPage.tsx` | Create | 404 catch-all page with link to /app |
| `vite.config.ts` | Modify | Add `manualChunks` for vendor splitting |
| `nginx.conf` | Modify | Add security headers, gzip, and proper cache |
| `public/manifest.json` | Modify | Add PNG icon entries for PWA |
| `e2e/flows/routing.spec.ts` | Modify | Add 404 route test |

---

### Task 1: Vite Manual Chunks (Vendor Splitting)

**Files:**
- Modify: `vite.config.ts`

This is the foundation for code splitting. Before lazy-loading routes, we need Vite to split vendor libraries into separate chunks so they can be cached independently.

- [ ] **Step 1: Add manualChunks to vite.config.ts**

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'zustand', 'zundo'],
          'flow-vendor': ['@xyflow/react'],
          'ui-vendor': ['framer-motion', 'cmdk', '@ark-ui/react', 'lucide-react'],
          'yaml-vendor': ['yaml', 'react-syntax-highlighter'],
          'ai-vendor': ['ai', '@ai-sdk/anthropic', '@ai-sdk/openai', '@ai-sdk/google'],
          'analytics': ['posthog-js'],
        },
      },
    },
  },
  test: {
    exclude: ['e2e/**', 'node_modules/**', 'packages/**'],
  },
})
```

- [ ] **Step 2: Build and verify chunks are created**

Run: `npx vite build 2>&1`
Expected: Multiple chunk files instead of one 2MB file. Each vendor chunk should be separate. The main app chunk should be significantly smaller.

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "perf: add manual chunk splitting for vendor libraries"
```

---

### Task 2: Create 404 Not Found Page

**Files:**
- Create: `src/components/NotFoundPage.tsx`

> **Why before Task 3?** Task 3 (code splitting) adds a `React.lazy(() => import('./components/NotFoundPage'))` in App.tsx. The file must exist first, otherwise the build fails.

- [ ] **Step 1: Create NotFoundPage component**

```typescript
// src/components/NotFoundPage.tsx
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div
      className="flex h-screen flex-col items-center justify-center gap-6 bg-base"
    >
      <h1
        className="text-6xl font-black"
        style={{
          background: 'linear-gradient(to right, #e8dcc8, #d4a843)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        404
      </h1>
      <p className="text-text-secondary">This page doesn't exist.</p>
      <div className="flex gap-4">
        <Link
          to="/"
          className="rounded-lg px-6 py-3 font-semibold transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #d4a843, #a88030)',
            color: '#0a0806',
          }}
        >
          Home
        </Link>
        <Link
          to="/app"
          className="rounded-lg px-6 py-3 font-medium transition-all duration-200"
          style={{
            border: '1px solid rgba(212, 168, 67, 0.15)',
            background: 'rgba(26, 23, 20, 0.6)',
            color: '#a89880',
          }}
        >
          Open Builder
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NotFoundPage.tsx
git commit -m "feat: add NotFoundPage component"
```

---

### Task 3: Route-Based Code Splitting + 404 Route

**Files:**
- Modify: `src/App.tsx`
- Modify: `e2e/flows/routing.spec.ts`

Convert static imports of heavy route components (`LandingPage`, `McpDocsPage`) to `React.lazy` + `Suspense`, and add the `*` catch-all route for 404. This is the single biggest Core Web Vitals improvement — landing page visitors won't download the React Flow canvas or AI SDK code.

- [ ] **Step 1: Refactor App.tsx with React.lazy**

The key changes:
1. Remove the static `import { LandingPage }` and `import { McpDocsPage }` — replace with `React.lazy` dynamic imports
2. The `CanvasLayout` function stays **completely unchanged** in the middle of App.tsx (lines 46-141 of the current file) — do NOT modify or remove it
3. `LandingRedirect` function stays mostly unchanged — only its return wraps `<LandingPage />` in `<Suspense>`
4. Add a `LoadingFallback` component (inline in App.tsx) and update the `App` routes with a `*` catch-all

New imports block (replaces lines 1-20 of current file):

```typescript
import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';
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

const LandingPage = lazy(() =>
  import('./components/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const McpDocsPage = lazy(() =>
  import('./components/McpDocsPage').then((m) => ({ default: m.McpDocsPage }))
);
const NotFoundPage = lazy(() =>
  import('./components/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);
```

Add `LoadingFallback` (place before `LandingRedirect`):

```typescript
function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-base">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
        style={{ borderTopColor: 'var(--accent)' }}
      />
    </div>
  );
}
```

Update `LandingRedirect` return (only change: wrap LandingPage in Suspense):

```typescript
  // ... existing redirect logic stays the same ...
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LandingPage />
    </Suspense>
  );
```

Update `App` function (replaces lines 143-153):

```typescript
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRedirect />} />
      <Route path="/app" element={<CanvasLayout />} />
      <Route
        path="/mcp"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <McpDocsPage />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <Suspense fallback={<LoadingFallback />}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  );
}
```

**IMPORTANT:** The `CanvasLayout` function (lines 46-141) must remain completely unchanged. Do not remove or modify it.

- [ ] **Step 2: Verify exports are compatible with React.lazy**

Check that `LandingPage` and `McpDocsPage` use named exports. The `.then((m) => ({ default: m.X }))` pattern handles this. If they use default exports, simplify to `lazy(() => import('./components/LandingPage'))`.

- [ ] **Step 3: Build and verify route splitting**

Run: `npx vite build 2>&1`
Expected: Additional chunks for LandingPage and McpDocsPage. The main chunk should be smaller since landing page code is split out.

- [ ] **Step 4: Add E2E tests for 404**

Add to `e2e/flows/routing.spec.ts`:

```typescript
test('unknown route shows 404 page', async ({ page }) => {
  await page.goto('/some-nonexistent-page');
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  await expect(page.locator('text=doesn\'t exist')).toBeVisible();
});

test('404 page Open Builder link navigates to /app', async ({ page }) => {
  await page.goto('/nonexistent');
  await page.click('a:has-text("Open Builder")');
  await expect(page).toHaveURL(/\/app$/);
});
```

- [ ] **Step 5: Run E2E tests**

Run: `npx playwright test e2e/flows/routing.spec.ts`
Expected: All routing tests pass including new 404 tests.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx e2e/flows/routing.spec.ts
git commit -m "perf: add route-based code splitting with React.lazy and 404 catch-all"
```

---

### Task 4: Nginx Gzip + Security Headers

**Files:**
- Modify: `nginx.conf`

Two critical changes combined into one task because they both touch `nginx.conf` and interact with each other:
1. **Gzip** — without it, nginx serves raw uncompressed files (2MB JS over the wire)
2. **Security headers** — production must have basic security headers

**IMPORTANT nginx caveat:** In nginx, when a `location` block contains _any_ `add_header` directive, it completely **overrides** all `add_header` directives from the parent `server` block. Since our OG image and static asset `location` blocks use `add_header Cache-Control`, we MUST repeat the security headers inside every `location` block that has its own `add_header`. This is a well-known nginx gotcha.

- [ ] **Step 1: Replace nginx.conf with complete config**

Replace the entire `nginx.conf` with:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1000;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/manifest+json
        application/xml
        image/svg+xml;

    # Security headers (server-level — applies to locations WITHOUT their own add_header)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header X-XSS-Protection "0" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # OG image - short cache for social media crawlers
    location ~* /og-image {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
        # Repeat security headers (nginx drops server-level add_header in location blocks with their own add_header)
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
        add_header X-XSS-Protection "0" always;
    }

    # Static assets - long cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        # Repeat security headers (same nginx inheritance reason)
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
        add_header X-XSS-Protection "0" always;
    }
}
```

Notes:
- `Content-Security-Policy` is intentionally omitted: PostHog (`us.i.posthog.com`), AI SDK (multiple provider domains), Docker Hub Worker proxy all need careful allowlisting. Add as a follow-up.
- `X-XSS-Protection: 0` explicitly disables the deprecated XSS Auditor to avoid false positives.
- `application/manifest+json` added to gzip_types for the PWA manifest.

- [ ] **Step 2: Commit**

```bash
git add nginx.conf
git commit -m "perf+security: add gzip compression and security headers to nginx"
```

---

### Task 5: PWA Manifest Icons

**Files:**
- Create: `public/icon-192.png`
- Create: `public/icon-512.png`
- Modify: `public/manifest.json`

The current manifest only has an SVG icon. PWA installability requires at least one 192x192 and one 512x512 raster PNG icon.

- [ ] **Step 1: Generate PNG icons from existing favicon.svg**

Use sharp (already available via node) to rasterize the SVG at required sizes:

```bash
npx sharp-cli -i public/favicon.svg -o public/icon-192.png resize 192 192
npx sharp-cli -i public/favicon.svg -o public/icon-512.png resize 512 512
```

If `sharp-cli` is not available, use an alternative:

```bash
npx @aspect-build/aspect-icons public/favicon.svg --sizes 192,512 --out public/
```

Or as a last resort, use ImageMagick if installed:

```bash
magick convert public/favicon.svg -resize 192x192 public/icon-192.png
magick convert public/favicon.svg -resize 512x512 public/icon-512.png
```

Verify the files exist and have correct dimensions.

- [ ] **Step 2: Update manifest.json**

```json
{
  "name": "VCompose — Visual Docker Compose Builder",
  "short_name": "VCompose",
  "description": "Build docker-compose.yml visually with drag-and-drop",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#141210",
  "theme_color": "#141210",
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add public/icon-192.png public/icon-512.png public/manifest.json
git commit -m "feat: add PWA manifest icons (192x192, 512x512)"
```

---

### Task 6: ErrorBoundary i18n Fix + ARIA

**Files:**
- Modify: `src/components/ErrorBoundary.tsx`

The ErrorBoundary's fallback UI is in Turkish ("Bir hata olustu"). Since the rest of the app is in English, this should be English for consistency. Also add `role="alert"` for screen readers.

- [ ] **Step 1: Update ErrorBoundary fallback**

```typescript
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div
          className="flex h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)]"
          role="alert"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded bg-[var(--accent-primary)] text-[var(--bg-primary)]"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ErrorBoundary.tsx
git commit -m "fix: update ErrorBoundary to English and add role=alert"
```

---

### Task 7: Build Verification & Final Checks

- [ ] **Step 1: Run full build**

Run: `npx vite build 2>&1`
Expected: Multiple chunks, no single chunk over 500KB warning (or significantly reduced). Note the new chunk sizes.

- [ ] **Step 2: Run unit tests**

Run: `npm run test`
Expected: All 110+ unit tests pass.

- [ ] **Step 3: Run E2E tests**

Run: `npx playwright test`
Expected: All 30+ E2E tests pass including new 404 tests.

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 5: Commit any remaining fixes**

If any tests or lint issues were found and fixed, commit them.

---

### Task 8: Update STATUS.md

**Files:**
- Modify: `docs/STATUS.md`

- [ ] **Step 1: Add Phase 13 entry to STATUS.md**

Add to Post-MVP Progress table:

```markdown
| Production Readiness (Phase 13) | ✅ Done | Code splitting, gzip, security headers, 404 page, a11y, PWA manifest |
```

Add a detailed section:

```markdown
## Phase 13: Production Readiness

- [x] Vite manual chunks (react-vendor, flow-vendor, ui-vendor, yaml-vendor, ai-vendor, analytics)
- [x] Route-based code splitting (React.lazy + Suspense for LandingPage, McpDocsPage, NotFoundPage)
- [x] Nginx gzip compression (level 6, all text types)
- [x] Nginx security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- [x] 404 catch-all route with NotFoundPage + 2 new E2E tests
- [x] PWA manifest icon entries (apple-touch-icon reference)
- [x] ErrorBoundary: English text + role=alert
```

- [ ] **Step 2: Commit**

```bash
git add docs/STATUS.md
git commit -m "docs: update STATUS.md with Phase 13 production readiness"
```
