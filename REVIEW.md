# Code Review Guidelines

## Focus Areas

### Security
- No innerHTML or dangerouslySetInnerHTML
- No eval or dynamic code execution
- Sanitize any user input displayed in YAML output

### Architecture
- Business logic in `src/lib/` (pure functions) or `src/store/` (actions) only
- React components handle only rendering and store calls
- Zustand is the single source of truth — no local state for YAML-affecting data

### Type Safety
- TypeScript strict mode enforced
- No `any` types — use proper interfaces from `src/store/types.ts`
- `src/store/types.ts` and `docs/TYPES.md` must always be in sync

### Spec Compliance
- Every feature must match its `docs/specs/*.md` specification
- Edge cases documented in specs must be handled in code
- Validation rules must match `docs/specs/validator.md` exactly

### Testing
- All `src/lib/` functions require Vitest tests
- Tests must cover edge cases from specs
- E2E tests for critical happy paths only
