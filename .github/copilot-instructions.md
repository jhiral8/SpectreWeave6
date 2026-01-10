# SpectreWeave6 Development Instructions

This project follows a strict constitution for development. When working on code:

## Core Principles

1. **YAGNI** - Only build what's needed now
2. **KISS** - Simple solutions over clever ones  
3. **DRY** - Single source of truth
4. **TypeScript Strict** - Zero `any` types
5. **React Best Practices** - Server Components default
6. **VS Code UX** - Match VS Code patterns
7. **Quality Gates** - Automated checks

## Component Rules

- Max 300 lines per component
- Max 50 lines per function
- Max 7 props max
- Use TanStack Query for server state
- Use useState for UI state
- No Redux, no Context for state

## Prohibited

- ❌ `any` type
- ❌ CSS-in-JS (styled-components, emotion)
- ❌ Inline styles (except dynamic values)
- ❌ Magic numbers

## Files to Reference

Read `.specify/memory/constitution.md` for full details.
