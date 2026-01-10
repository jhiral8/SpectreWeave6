# Feature Specification: VS Code UX Transformation

**Feature Branch**: `002-vscode-ux-transformation`  
**Created**: 2026-01-10  
**Status**: Draft  
**Source**: Consolidated from `/docs/VSCODE_UX_*.md` documentation

---

## Executive Summary

Transform SpectreWeave6 into "GitHub Copilot + VS Code for Fiction Writers" — a professional-grade AI-powered writing IDE with familiar, intuitive UX patterns. This specification consolidates the 10-part VS Code UX Transformation Plan into actionable implementation guidance.

### Vision Statement

> Every UX decision should answer: "How would VS Code handle this, and how do we adapt it for creative writing?"

### Target Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│ Activity Bar │ Story Explorer │ Editor Area    │ AI Chat Panel    │
│              │                │                │                  │
│ [📚]         │ 📖 Manuscript  │ ┌────────────┐ │ 🤖 Ghost Writer  │
│ [👤]         │  ├─ Ch 1       │ │            │ │                  │
│ [🌍]         │  ├─ Ch 2       │ │  Writing   │ │ [Chat history]   │
│ [🔍]         │  └─ Ch 3       │ │  Surface   │ │                  │
│ [⚙️]         │ 👥 Characters  │ │            │ │ [Input box]      │
│              │  ├─ Alice      │ └────────────┘ │                  │
│              │  └─ Bob        │                │                  │
│              │ 🌍 World       ├────────────────┤                  │
│              │ 📝 Notes       │ AI Feedback    │                  │
│              │                │ [Problems]     │                  │
├──────────────┴────────────────┴────────────────┴──────────────────┤
│ Status Bar: Word Count | Chapter | AI Status | Sync Status        │
└────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. IDE Layout Shell (IDELayout)

The main orchestrator component that wraps all IDE elements.

**Location**: `src/components/IDE/IDELayout.tsx`

**Responsibilities**:
- Orchestrate panel arrangement
- Manage keyboard shortcuts
- Provide panel context to children
- Handle responsive layout adjustments

### 2. Activity Bar

Left-most vertical icon strip for primary navigation.

**Location**: `src/components/IDE/ActivityBar/`

**Items**:
| Icon | Label | Panel |
|------|-------|-------|
| 📖 | Story Explorer | story-explorer |
| 👤 | Characters | characters |
| 🌍 | World Building | world |
| 🔍 | Search | search |
| 🤖 | AI Agents | ai-agents |
| ⚙️ | Settings | settings |

### 3. Story Explorer (Left Panel)

VS Code-style file explorer adapted for story elements.

**Location**: `src/components/IDE/StoryExplorer/`

**Tabs**:
- Manuscript (chapters, scenes)
- Characters
- World Building
- Notes

**Features**:
- Tree view with expand/collapse
- Drag-and-drop reordering
- Right-click context menus
- AI status indicators per node
- Quick actions (rename, delete)

### 4. Editor Area

Central writing surface with tabs and navigation.

**Location**: `src/components/IDE/EditorArea/`

**Sub-components**:
- **EditorTabs**: Multiple open documents
- **EditorBreadcrumb**: Chapter > Scene > Paragraph navigation
- **WritingSurface**: TipTap editor instance
- **MiniMap**: Document overview (optional)

### 5. Bottom Panel

AI Feedback / Problems panel similar to VS Code's Problems tab.

**Location**: `src/components/IDE/BottomPanel/`

**Tabs**:
| VS Code Equivalent | SpectreWeave Tab | Purpose |
|--------------------|------------------|---------|
| Problems | Writing Issues | Style, grammar, consistency |
| Output | AI Output | Generation logs |
| Debug Console | Story Analysis | Narrative coherence |
| Terminal | History | AI interaction history |

### 6. Right Panel (AI Chat)

VS Code Copilot-style AI assistant.

**Location**: `src/components/IDE/RightPanel/`

**See**: `SPECS/001-ai-chat-panel/spec.md` for detailed specification

### 7. Status Bar

Bottom information bar showing document stats and status.

**Location**: `src/components/IDE/StatusBar/`

**Items**:
- Word count (chapter/total)
- Current chapter/scene
- AI status (idle/analyzing/generating)
- Sync status
- Theme toggle

### 8. Command Palette

Cmd+Shift+P triggered command interface.

**Location**: `src/components/IDE/CommandPalette/`

**Features**:
- Fuzzy search
- Category organization
- Keyboard navigation
- Recent commands

---

## User Scenarios & Testing

### User Story 1 - Panel Resizing (Priority: P0)

A writer wants to resize panels to customize their workspace layout.

**Why this priority**: Fundamental IDE interaction pattern. Without resizing, the fixed layout fails to accommodate different workflows (writing vs. editing vs. research).

**Independent Test**: Drag resize handle on any panel and verify size changes persist across sessions.

**Acceptance Scenarios**:

1. **Given** any panel is visible, **When** dragging the resize handle, **Then** the panel resizes smoothly with min/max constraints
2. **Given** a panel has been resized, **When** refreshing the page, **Then** the panel size persists from localStorage
3. **Given** a panel is at minimum size, **When** dragging to make smaller, **Then** the panel snaps closed with collapse animation

---

### User Story 2 - Activity Bar Navigation (Priority: P0)

A writer wants to switch between different views (Manuscript, Characters, World) using the Activity Bar.

**Why this priority**: Primary navigation mechanism. This is how users will spend 90% of their navigation time.

**Independent Test**: Click each Activity Bar item and verify the corresponding panel opens in the left sidebar.

**Acceptance Scenarios**:

1. **Given** Story Explorer is active, **When** clicking Characters icon, **Then** left panel switches to Characters view
2. **Given** a panel is open, **When** clicking its Activity Bar icon again, **Then** the panel collapses
3. **Given** any Activity Bar item is active, **When** viewing it, **Then** a vertical indicator bar shows on the left edge

---

### User Story 3 - Story Explorer Tree Navigation (Priority: P0)

A writer wants to navigate their manuscript structure via the tree view.

**Why this priority**: Core content organization. Writers need to quickly jump between chapters, scenes, and story elements.

**Independent Test**: Expand chapter node, click scene, verify editor navigates to that position.

**Acceptance Scenarios**:

1. **Given** Manuscript tree is displayed, **When** clicking a chapter node arrow, **Then** the node expands to show scenes
2. **Given** a scene node is visible, **When** clicking the scene, **Then** the editor scrolls to that scene
3. **Given** a chapter is selected, **When** pressing keyboard arrow keys, **Then** tree navigation moves up/down

---

### User Story 4 - Editor Tabs (Priority: P1)

A writer wants to open multiple documents in tabs and switch between them.

**Why this priority**: Essential multi-document workflow. Writers often reference characters while writing chapters.

**Independent Test**: Open multiple chapters, verify each gets a tab, click tabs to switch.

**Acceptance Scenarios**:

1. **Given** Chapter 1 is open, **When** clicking Chapter 2 in Story Explorer, **Then** a new tab opens (or existing tab activates)
2. **Given** multiple tabs are open, **When** clicking a tab, **Then** that document becomes active
3. **Given** a tab has unsaved changes, **When** viewing the tab, **Then** a dot indicator shows next to the title
4. **Given** a tab is open, **When** clicking the X button, **Then** the tab closes (with save prompt if dirty)

---

### User Story 5 - Editor Breadcrumbs (Priority: P1)

A writer wants to see their current location in the document hierarchy.

**Why this priority**: Orientation in long documents. Writers need to know where they are within the manuscript structure.

**Independent Test**: Navigate to a scene, verify breadcrumb shows Manuscript > Chapter > Scene.

**Acceptance Scenarios**:

1. **Given** editing within Chapter 3, Scene 2, **When** viewing breadcrumbs, **Then** "📖 Manuscript > Chapter 3 > Scene 2" displays
2. **Given** breadcrumbs are visible, **When** clicking "Chapter 3", **Then** a dropdown shows all chapters for quick navigation
3. **Given** cursor moves to different section, **When** waiting 300ms, **Then** breadcrumbs update to reflect new location

---

### User Story 6 - Bottom Panel Problems Tab (Priority: P1)

A writer wants to see AI-detected writing issues in a structured list.

**Why this priority**: Actionable feedback. The VS Code Problems panel pattern is proven effective for surfacing issues.

**Independent Test**: Write text with passive voice, verify problem appears in list with severity indicator.

**Acceptance Scenarios**:

1. **Given** text contains a consistency error, **When** viewing Problems tab, **Then** error shows with 🔴 severity indicator
2. **Given** a problem is listed, **When** clicking it, **Then** the editor navigates to that location
3. **Given** problems exist, **When** viewing the tab header, **Then** badge count shows total problems

---

### User Story 7 - Command Palette (Priority: P1)

A writer wants to quickly access any command via keyboard.

**Why this priority**: Power user efficiency. Keyboard-driven workflows are essential for professional tools.

**Independent Test**: Press Cmd+Shift+P, type "focus", verify Focus Mode command appears and executes.

**Acceptance Scenarios**:

1. **Given** editor is focused, **When** pressing Cmd+Shift+P, **Then** Command Palette overlay opens centered
2. **Given** Command Palette is open, **When** typing partial command name, **Then** fuzzy-matched results appear
3. **Given** a command is highlighted, **When** pressing Enter, **Then** command executes and palette closes
4. **Given** Command Palette is open, **When** pressing Escape, **Then** palette closes without action

---

### User Story 8 - Status Bar Information (Priority: P2)

A writer wants to see document statistics and system status at a glance.

**Why this priority**: Passive information display. Useful but not critical for core workflows.

**Independent Test**: Write 100 words, verify word count updates in status bar.

**Acceptance Scenarios**:

1. **Given** editing a chapter, **When** viewing status bar, **Then** word count shows "X words (Y total)"
2. **Given** AI is analyzing, **When** viewing status bar, **Then** AI status shows spinner + "Analyzing..."
3. **Given** document has unsaved changes, **When** Y.js syncs, **Then** sync indicator shows briefly

---

### User Story 9 - Theme Switching (Priority: P2)

A writer wants to switch between light and dark themes.

**Why this priority**: Accessibility and preference. Essential for long writing sessions.

**Independent Test**: Click theme toggle, verify all panels switch to new theme.

**Acceptance Scenarios**:

1. **Given** dark theme is active, **When** clicking theme toggle, **Then** all panels smoothly transition to light theme
2. **Given** a theme is selected, **When** refreshing page, **Then** selected theme persists
3. **Given** 5 theme options exist, **When** opening theme picker, **Then** all options show with preview

---

### User Story 10 - Panel Persistence (Priority: P2)

A writer wants their workspace layout to persist between sessions.

**Why this priority**: Workflow continuity. Users shouldn't reconfigure their workspace each visit.

**Independent Test**: Customize layout, close browser, reopen, verify layout restored.

**Acceptance Scenarios**:

1. **Given** panels have been customized, **When** closing and reopening browser, **Then** panel sizes match previous session
2. **Given** certain panels were collapsed, **When** returning, **Then** collapsed state is preserved
3. **Given** active tab was specific panel, **When** returning, **Then** same panel is active

---

## Data Model

### Panel State Types

```typescript
type PanelPosition = 'left' | 'right' | 'bottom';

type PanelId = 
  | 'story-explorer' 
  | 'characters' 
  | 'world' 
  | 'search' 
  | 'ai-chat' 
  | 'ai-feedback' 
  | 'output' 
  | 'settings';

interface PanelConfig {
  id: PanelId;
  position: PanelPosition;
  label: string;
  icon: string;
  component: React.ComponentType;
  defaultVisible: boolean;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  keyboardShortcut?: string;
}

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

### Story Node Types

```typescript
type StoryNodeType = 
  | 'manuscript'
  | 'part'
  | 'chapter'
  | 'scene'
  | 'character'
  | 'character-group'
  | 'location'
  | 'location-group'
  | 'timeline'
  | 'event'
  | 'note'
  | 'note-folder';

interface StoryNode {
  id: string;
  type: StoryNodeType;
  label: string;
  icon?: string;
  children?: StoryNode[];
  isExpanded?: boolean;
  metadata: StoryNodeMetadata;
  aiStatus?: 'analyzing' | 'has-issues' | 'approved';
}

interface StoryNodeMetadata {
  createdAt: Date;
  updatedAt: Date;
  wordCount?: number;
  status?: 'draft' | 'in-progress' | 'review' | 'complete';
  position?: number;
}
```

### Editor Tab Types

```typescript
interface EditorTab {
  id: string;
  type: 'chapter' | 'scene' | 'character' | 'location' | 'note' | 'framework';
  label: string;
  isDirty: boolean;
  isPinned: boolean;
  metadata?: {
    chapterId?: string;
    sceneId?: string;
    scrollPosition?: number;
    cursorPosition?: number;
  };
}
```

### Command Types

```typescript
interface Command {
  id: string;
  label: string;
  category: 'Navigation' | 'AI Agents' | 'View' | 'Edit' | 'File';
  shortcut?: string;
  execute: () => void | Promise<void>;
  isEnabled?: () => boolean;
  icon?: string;
}
```

---

## Component Architecture

### File Structure

```
src/components/IDE/
├── IDELayout.tsx              # Main layout orchestrator
├── ActivityBar/
│   ├── ActivityBar.tsx
│   ├── ActivityBarItem.tsx
│   └── activityBarConfig.ts
├── PanelSystem/
│   ├── PanelContext.tsx
│   ├── PanelProvider.tsx
│   ├── ResizablePanel.tsx
│   └── hooks/
│       ├── usePanelResize.ts
│       └── usePanelPersistence.ts
├── StoryExplorer/
│   ├── StoryExplorer.tsx
│   ├── StoryTree.tsx
│   ├── TreeItem.tsx
│   ├── ManuscriptTree.tsx
│   ├── CharacterList.tsx
│   └── hooks/
│       └── useStoryStructure.ts
├── EditorArea/
│   ├── EditorArea.tsx
│   ├── EditorTabs.tsx
│   ├── EditorBreadcrumb.tsx
│   ├── WritingSurface.tsx
│   └── MiniMap.tsx
├── BottomPanel/
│   ├── BottomPanel.tsx
│   ├── ProblemsPanel.tsx
│   ├── AIOutputPanel.tsx
│   └── hooks/
│       └── useWritingProblems.ts
├── RightPanel/
│   └── RightPanel.tsx
├── StatusBar/
│   ├── StatusBar.tsx
│   ├── WordCountStatus.tsx
│   └── AIStatus.tsx
├── CommandPalette/
│   ├── CommandPalette.tsx
│   ├── CommandRegistry.ts
│   └── commands/
│       ├── navigationCommands.ts
│       └── aiCommands.ts
└── Theme/
    ├── ThemeProvider.tsx
    ├── ThemePicker.tsx
    └── themes/
        ├── spectre-dark.ts
        ├── spectre-light.ts
        └── midnight-writer.ts
```

---

## CSS Design Tokens

### Core Tokens (in `:root`)

```css
:root {
  /* Semantic Colors */
  --ide-error: #f44336;
  --ide-warning: #ff9800;
  --ide-info: #2196f3;
  --ide-success: #4caf50;
  
  /* Focus/Accent */
  --ide-focus-border: #007acc;
  --ide-accent: #0078d4;
  
  /* Typography */
  --ide-font-family: 'Inter', -apple-system, sans-serif;
  --ide-font-family-writing: 'Georgia', serif;
  
  /* Spacing */
  --ide-spacing-1: 4px;
  --ide-spacing-2: 8px;
  --ide-spacing-3: 12px;
  --ide-spacing-4: 16px;
  
  /* Z-Index Scale */
  --ide-z-dropdown: 100;
  --ide-z-modal: 200;
  --ide-z-command-palette: 500;
}
```

### Theme: Spectre Dark

```css
[data-theme="spectre-dark"] {
  --ide-background: #0d1117;
  --ide-foreground: #c9d1d9;
  --ide-border: #30363d;
  
  --ide-activitybar-bg: #0d1117;
  --ide-activitybar-fg: #c9d1d9;
  
  --ide-sidebar-bg: #0d1117;
  --ide-editor-bg: #0d1117;
  
  --ide-statusbar-bg: #0078d4;
  --ide-statusbar-fg: #ffffff;
  
  /* Writing-specific */
  --ide-writing-bg: #161b22;
  --ide-writing-fg: #e6edf3;
  --ide-ai-accent: #9c6ade;
}
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
- Theme system + design tokens
- Panel system infrastructure
- Activity Bar + Status Bar

### Phase 2: Core Panels (Weeks 4-7)
- Story Explorer (left panel)
- Bottom Panel (AI Feedback)
- AI Chat Panel (right panel) — See SPECS/001-ai-chat-panel

### Phase 3: Editor Enhancement (Weeks 8-10)
- Tab system
- Breadcrumbs
- Minimap
- Writing surface polish

### Phase 4: AI & Commands (Weeks 11-13)
- AI Agent system
- Command Palette
- Keyboard shortcuts

### Phase 5: Polish & Migration (Weeks 14-16)
- Data migration
- Testing & bug fixes
- Documentation

---

## Dependencies

### External Libraries
- `@tiptap/react` - Editor framework (existing)
- `lucide-react` - Icons
- `tailwind-merge` / `clsx` - Class utilities

### Internal Dependencies
- `useChapterNavigation` - Chapter parsing (existing)
- `useAI` - AI integration (existing)
- `UnifiedEditorContext` - Editor state (existing)

---

## Testing Strategy

### Unit Tests
- Panel resize calculations
- Tree node operations
- Command matching/fuzzy search

### Component Tests
- Each IDE component in isolation
- Panel interactions
- Tab management

### E2E Tests (Playwright)
- Full navigation workflow
- Panel resize persistence
- Command palette execution
- Theme switching

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for all features
- Screen reader compatibility

---

## Migration Notes

### Parallel Development Approach

1. **Weeks 1-7**: Build new components in `src/components/IDE/` alongside existing
2. **Weeks 8-10**: Gradually replace old components, map old props to new interfaces
3. **Weeks 11-13**: Feature flag `USE_NEW_IDE=true` for switchover
4. **Weeks 14-16**: Remove old code after stability confirmed

### Key Migration Targets

| Old Component | New Component |
|---------------|---------------|
| `LeftNavigationView.tsx` | `StoryExplorer.tsx` |
| `WritingFeedback.tsx` | `BottomPanel/ProblemsPanel.tsx` |
| `AIChatSidebar.tsx` | `RightPanel/AIChatPanel.tsx` |
| Inline styles | Theme token CSS variables |

---

## References

- Source: `/docs/VSCODE_UX_TRANSFORMATION_PLAN.md`
- Source: `/docs/VSCODE_UX_PLAN_PART2.md` through `PART10.md`
- Related: `/SPECS/001-ai-chat-panel/spec.md`
- Constitution: `/.specify/memory/constitution.md`
