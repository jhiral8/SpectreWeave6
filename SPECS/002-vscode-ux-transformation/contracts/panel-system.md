# Contract: Panel System API

**Feature**: `002-vscode-ux-transformation`  
**Component**: PanelSystem  
**Version**: 1.0.0

---

## Overview

The Panel System provides centralized state management and components for resizable IDE panels.

---

## Types

```typescript
// Panel position in layout
type PanelPosition = 'left' | 'right' | 'bottom';

// Panel identifiers
type PanelId = 
  | 'story-explorer' 
  | 'characters' 
  | 'world' 
  | 'search' 
  | 'ai-chat' 
  | 'ai-feedback' 
  | 'output' 
  | 'settings';

// Layout state structure
interface PanelLayoutState {
  leftPanel: {
    activePanel: PanelId | null;
    size: number;
    isCollapsed: boolean;
  };
  rightPanel: {
    activePanel: PanelId | null;
    size: number;
    isCollapsed: boolean;
  };
  bottomPanel: {
    activePanel: PanelId | null;
    size: number;
    isCollapsed: boolean;
    tabs: PanelId[];
  };
}
```

---

## Context API

### PanelProvider

Wrap the IDE layout with this provider.

```typescript
import { PanelProvider } from '@/components/IDE/PanelSystem';

function App() {
  return (
    <PanelProvider>
      <IDELayout />
    </PanelProvider>
  );
}
```

### usePanels Hook

Access panel state and actions.

```typescript
import { usePanels } from '@/components/IDE/PanelSystem';

function MyComponent() {
  const {
    layout,           // PanelLayoutState
    togglePanel,      // (id: PanelId) => void
    showPanel,        // (id: PanelId) => void
    hidePanel,        // (id: PanelId) => void
    resizePanel,      // (position: PanelPosition, size: number) => void
    setActivePanel,   // (position: PanelPosition, id: PanelId) => void
    isPanelVisible,   // (id: PanelId) => boolean
    getActivePanel,   // (position: PanelPosition) => PanelId | null
  } = usePanels();
}
```

---

## Component API

### ResizablePanel

A panel container with drag-to-resize functionality.

```typescript
interface ResizablePanelProps {
  position: 'left' | 'right' | 'bottom';
  defaultSize: number;    // Initial size in pixels
  minSize: number;        // Minimum size constraint
  maxSize: number;        // Maximum size constraint
  children: React.ReactNode;
  className?: string;
}
```

**Usage:**

```tsx
import { ResizablePanel } from '@/components/IDE/PanelSystem';

<ResizablePanel 
  position="left"
  defaultSize={280}
  minSize={200}
  maxSize={500}
>
  <StoryExplorer />
</ResizablePanel>
```

**Behavior:**
- Renders children in a resizable container
- Shows resize handle on appropriate edge
- Handles are 4px wide/tall
- Collapsed when size < minSize
- Persists size to localStorage

---

## Actions Contract

### togglePanel(id: PanelId)

Toggle visibility of a panel.

**Preconditions:**
- Valid PanelId

**Postconditions:**
- If panel was visible, it becomes hidden
- If panel was hidden, it becomes visible
- localStorage is updated

### showPanel(id: PanelId)

Show a panel (no-op if already visible).

**Preconditions:**
- Valid PanelId

**Postconditions:**
- Panel is visible
- Panel position's `activePanel` is set to this id
- Panel position's `isCollapsed` is false

### hidePanel(id: PanelId)

Hide a panel (no-op if already hidden).

**Preconditions:**
- Valid PanelId

**Postconditions:**
- Panel is not visible
- If this was `activePanel`, it's set to null

### resizePanel(position: PanelPosition, size: number)

Set the size of a panel area.

**Preconditions:**
- Valid PanelPosition
- Size is a positive number

**Postconditions:**
- Size is clamped to panel's min/max
- Layout state is updated
- localStorage is updated (debounced)

### setActivePanel(position: PanelPosition, id: PanelId)

Set which panel is active in a position.

**Preconditions:**
- Valid PanelPosition
- Valid PanelId that belongs to that position

**Postconditions:**
- Position's `activePanel` is set to id
- Position's `isCollapsed` is false

---

## Storage Contract

### Key

`spectreweave:panel-layout`

### Schema

```typescript
interface PersistedPanelLayout {
  version: 1;
  timestamp: number;
  layout: PanelLayoutState;
}
```

### Migration

If `version` is missing or outdated, use default layout.

---

## Events

The panel system does not emit custom events. Use React's re-render cycle.

---

## Error Handling

- Invalid PanelId: Ignored (no-op)
- Invalid PanelPosition: Ignored (no-op)
- Corrupted localStorage: Reset to defaults
- Missing provider: Throw error with helpful message

---

## Testing Requirements

### Unit Tests
- [ ] togglePanel changes visibility state
- [ ] resizePanel clamps to min/max
- [ ] Persistence saves on change
- [ ] Persistence restores on mount

### Integration Tests
- [ ] Activity Bar uses togglePanel correctly
- [ ] ResizablePanel calls resizePanel on drag

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-10 | Initial contract |
