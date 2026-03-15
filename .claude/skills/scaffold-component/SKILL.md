---
name: scaffold-component
description: Scaffold a new React component with proper structure. Use when creating new UI components.
allowed-tools: Read, Write, Bash(npx prettier *)
---

# Scaffold Component

Create a new React component named `$ARGUMENTS`:

1. Check 21st.dev Magic MCP for an existing component matching this name
2. If found, use it. If not, create from scratch
3. Create file at `src/components/<category>/$ARGUMENTS.tsx`
4. Use TypeScript with proper Props interface
5. Use Tailwind CSS, dark mode default
6. No business logic — only UI rendering and store calls
7. Format with Prettier after creation

Component template:
```typescript
interface ${ARGUMENTS}Props {
  // define props
}

export function $ARGUMENTS({ ...props }: ${ARGUMENTS}Props) {
  return (
    <div className="...">
      {/* implementation */}
    </div>
  );
}
```
