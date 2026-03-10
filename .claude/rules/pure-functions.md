---
paths:
  - "src/lib/**"
---

# Pure Function Rules

- All functions in `src/lib/` must be pure: no side effects, no store access, no DOM
- Every function must have a corresponding Vitest test in `src/lib/__tests__/`
- `buildYaml(store)` and `validate(store)` are never called from inside the store
- Input types come from `src/store/types.ts` — use `Pick<AppStore, ...>` for minimal surface
- Edge cases must be documented in the corresponding `docs/specs/*.md` file
