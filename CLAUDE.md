# Visual Docker Compose Builder

> Browser-based visual builder for `docker-compose.yml`. No backend — fully client-side.

## Quick Reference

- **Stack:** React 18 + Vite + TypeScript (strict) + Tailwind CSS + Zustand + React Flow v11+
- **Build:** `npm run build`
- **Dev:** `npm run dev` (port 5173)
- **Test:** `npm run test` (Vitest, lib/ only)
- **E2E:** `npm run test:e2e` (Playwright)
- **Lint:** `npm run lint` (ESLint)
- **Format:** `npm run format` (Prettier)

## Architecture

- **Zustand** = tek state kaynagi. Context API kullanma.
- **YAML = derived state.** `buildYaml(store)` pure function, store icinden cagrilmaz.
- **Validation = derived state.** `validate(store)` root useEffect icinden cagrilir.
- **localStorage persistence:** Zustand `persist` middleware ile otomatik.
- Business logic `src/lib/` veya `src/store/` icinde olmali — React component icine girmesin.

## File Map

| Path | Purpose |
|---|---|
| `PROJECT_SPEC.md` | Full specification (Turkish) |
| `docs/TYPES.md` | Canonical TypeScript interfaces |
| `docs/STATUS.md` | Progress tracker — update every session end |
| `docs/specs/*.md` | Feature specs — read before coding |

## Session Workflow

1. Read `docs/STATUS.md` — understand what's done/in-progress
2. Read relevant `docs/specs/<feature>.md` before coding
3. Write tests first for `lib/` functions
4. Update `docs/STATUS.md` at session end

## Key Rules

- No new dependency without checking PROJECT_SPEC.md section 2
- No feature outside MVP scope (section 5) or Post-MVP (section 8)
- `store/types.ts` and `docs/TYPES.md` must always be in sync
- Check 21st.dev MCP before building custom UI components
- Spec-driven: write/update spec before coding new features

## Imports

@PROJECT_SPEC.md
@docs/TYPES.md
