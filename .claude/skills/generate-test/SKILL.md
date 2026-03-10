---
name: generate-test
description: Generate Vitest tests for a lib function. Use when creating or updating tests for pure functions in src/lib/.
allowed-tools: Read, Write, Glob, Grep
---

# Generate Test

Generate Vitest tests for `$ARGUMENTS`:

1. Read `src/lib/$ARGUMENTS.ts` to understand the function signature and logic
2. Read `docs/specs/$ARGUMENTS.md` (if exists) for edge cases and expected behavior
3. Read `docs/TYPES.md` for type definitions
4. Create or update `src/lib/__tests__/$ARGUMENTS.test.ts`
5. Cover:
   - Happy path for each main scenario
   - Edge cases documented in the spec
   - Error/warning conditions
   - Empty/null input handling

Test structure:
```typescript
import { describe, it, expect } from 'vitest';
import { functionName } from '../$ARGUMENTS';

describe('functionName', () => {
  it('should handle basic case', () => { ... });
  it('should handle edge case from spec', () => { ... });
});
```
