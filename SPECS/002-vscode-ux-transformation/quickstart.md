# Quick Start: VS Code UX Transformation

**Feature**: `002-vscode-ux-transformation`  
**Created**: 2026-01-10

---

## Getting Started

This guide helps developers quickly understand and begin work on the VS Code UX Transformation.

### Prerequisites

- Node.js 18+
- pnpm (package manager)
- Familiarity with:
  - React 18+ with Server Components
  - TypeScript strict mode
  - TailwindCSS
  - TipTap editor

---

## Project Context

SpectreWeave6 is being transformed into a VS Code-style IDE for fiction writers. The UX transformation involves:

1. **Activity Bar** - Left icon strip for navigation
2. **Story Explorer** - Tree view for manuscript structure
3. **Editor Area** - Tabs, breadcrumbs, and writing surface
4. **Bottom Panel** - AI feedback / problems
5. **Right Panel** - AI chat assistant
6. **Status Bar** - Document stats
7. **Command Palette** - Cmd+Shift+P quick actions

---

## Directory Structure

All new IDE components go in:

```
src/components/IDE/
├── IDELayout.tsx           # Main layout shell
├── ActivityBar/            # Left icon bar
├── PanelSystem/            # Resize/persistence logic
├── StoryExplorer/          # Left panel content
├── EditorArea/             # Center: tabs, breadcrumbs, editor
├── BottomPanel/            # AI feedback panels
├── RightPanel/             # AI chat
├── StatusBar/              # Bottom info bar
├── CommandPalette/         # Cmd+Shift+P
└── Theme/                  # Theming system
```

---

## First Steps

### 1. Set Up Theme Tokens

Create `src/styles/theme-tokens.css`:

```css
:root {
  --ide-error: #f44336;
  --ide-warning: #ff9800;
  --ide-info: #2196f3;
  --ide-success: #4caf50;
  --ide-accent: #0078d4;
  
  /* Add more tokens as needed */
}

[data-theme="spectre-dark"] {
  --ide-background: #0d1117;
  --ide-foreground: #c9d1d9;
  --ide-border: #30363d;
  /* ... */
}
```

### 2. Create Panel Context

Create `src/components/IDE/PanelSystem/PanelContext.tsx`:

```typescript
'use client';

import React, { createContext, useContext, useReducer } from 'react';
import { PanelLayoutState, PanelId, PanelPosition } from './types';

interface PanelContextType {
  layout: PanelLayoutState;
  togglePanel: (id: PanelId) => void;
  resizePanel: (position: PanelPosition, size: number) => void;
  setActivePanel: (position: PanelPosition, id: PanelId) => void;
}

const PanelContext = createContext<PanelContextType | null>(null);

export const usePanels = () => {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanels must be used within PanelProvider');
  }
  return context;
};

// Implement PanelProvider with useReducer...
```

### 3. Create IDE Layout Shell

Create `src/components/IDE/IDELayout.tsx`:

```typescript
'use client';

import React from 'react';
import { PanelProvider } from './PanelSystem/PanelContext';
import { ActivityBar } from './ActivityBar/ActivityBar';
import { StatusBar } from './StatusBar/StatusBar';
import { ResizablePanel } from './PanelSystem/ResizablePanel';

export const IDELayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <PanelProvider>
      <div className="ide-layout h-screen flex flex-col">
        <div className="flex-1 flex min-h-0">
          <ActivityBar />
          <ResizablePanel position="left" defaultSize={280}>
            {/* Story Explorer */}
          </ResizablePanel>
          <div className="flex-1 flex flex-col min-w-0">
            {children}
          </div>
          <ResizablePanel position="right" defaultSize={320}>
            {/* AI Chat */}
          </ResizablePanel>
        </div>
        <StatusBar />
      </div>
    </PanelProvider>
  );
};
```

---

## Key Patterns

### Use CSS Custom Properties for Theming

```tsx
// ✅ Good - uses theme token
<div className="bg-[--ide-background] text-[--ide-foreground]">

// ❌ Bad - hardcoded color
<div className="bg-gray-900 text-gray-100">
```

### Use `cn()` for Class Merging

```tsx
import { cn } from '@/lib/utils';

<button className={cn(
  'px-3 py-2 rounded',
  isActive && 'bg-[--ide-accent]',
  className
)}>
```

### Type Everything Strictly

```tsx
// ✅ Good - explicit types
interface ActivityBarItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

// ❌ Bad - any or implicit
const ActivityBarItem = ({ icon, label, ...rest }: any) => {
```

### Follow Component Size Limits

- Max 300 lines per component
- Max 50 lines per function
- Max 7 props per component

If exceeding, split into sub-components.

---

## Testing Approach

### Unit Tests (Vitest)

```typescript
// src/components/IDE/PanelSystem/__tests__/usePanelResize.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePanelResize } from '../hooks/usePanelResize';

describe('usePanelResize', () => {
  it('clamps size to min/max', () => {
    const { result } = renderHook(() => 
      usePanelResize({ min: 200, max: 500, initial: 300 })
    );
    
    result.current.resize(100); // Below min
    expect(result.current.size).toBe(200);
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/ide-panels.spec.ts
import { test, expect } from '@playwright/test';

test('Activity Bar toggles Story Explorer', async ({ page }) => {
  await page.goto('/editor');
  
  // Story Explorer should be visible by default
  await expect(page.locator('[data-panel="story-explorer"]')).toBeVisible();
  
  // Click Activity Bar icon to toggle
  await page.click('[data-activity="story-explorer"]');
  
  // Panel should collapse
  await expect(page.locator('[data-panel="story-explorer"]')).not.toBeVisible();
});
```

---

## Common Tasks

### Add a New Panel

1. Add ID to `PanelId` type
2. Create component in appropriate folder
3. Register in panel config
4. Add Activity Bar icon if needed

### Add a New Command

1. Create command in `CommandPalette/commands/`
2. Register with `CommandRegistry`
3. Optionally bind keyboard shortcut

### Add a Theme

1. Add ID to `ThemeId` type
2. Define CSS variables in `theme-tokens.css`
3. Add to theme picker options

---

## Resources

- **Spec**: `/SPECS/002-vscode-ux-transformation/spec.md`
- **Tasks**: `/SPECS/002-vscode-ux-transformation/tasks.md`
- **Data Model**: `/SPECS/002-vscode-ux-transformation/data-model.md`
- **Plan**: `/SPECS/002-vscode-ux-transformation/plan.md`
- **Constitution**: `/.specify/memory/constitution.md`
- **VS Code UX Docs**: `/docs/VSCODE_UX_*.md`

---

## Questions?

Review the full specification and source documentation for detailed implementation guidance.
