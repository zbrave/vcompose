---
paths:
  - "src/store/**"
---

# Zustand Store Rules

- Single store, no Context API, no Redux
- `src/store/types.ts` must always match `docs/TYPES.md` — update both together
- Middleware order: `persist(temporal(...))`  — persist wraps temporal
- `partialize` in persist: only save `nodes`, `edges`, `networks`, `namedVolumes`
- `selectedNodeId` and `validationIssues` are transient — never persisted
- localStorage key: `vdc-store`, version: 1
