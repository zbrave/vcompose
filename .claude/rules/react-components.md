---
paths:
  - "src/components/**"
---

# React Component Rules

- Check 21st.dev MCP for existing components before building custom ones
- No business logic in components — delegate to `src/lib/` or store actions
- Tailwind CSS only, dark mode is default (`dark:` prefix for light overrides)
- Controlled inputs — auto-save to store, no "Save" buttons
- Use React Flow custom nodes/edges for canvas components
