# VS Code IDE Rework - Implementation Tasks

> **Spec**: `SPECS/VSCODE_IDE_REWORK.md`  
> **Reference Images**: 
> - `image-1767821174386.png` - Main VS Code TARGET layout
> - Title Bar detail - Command Palette search  
> **Created**: 2026-01-07

---

## Overview

This document contains the detailed, actionable tasks for reworking the SpectreWeave6 IDE to match VS Code exactly.

> ⚠️ **CRITICAL**: The reference images show the **TARGET VS Code IDE** to replicate - NOT current SpectreWeave6 state.

**Guiding Principles** (from CONSTITUTION.md):
- **YAGNI**: Only implement what VS Code has, nothing more
- **DRY**: All styles in CSS variables, all logic in shared hooks
- **KISS**: Simple components, single responsibility

---

## Phase 1: Core Layout Shell + Title Bar (P0)

**Duration**: 4-5 days  
**Goal**: Pixel-perfect VS Code shell with Title Bar

### 1.0 Create Title Bar Component (P0 - HIGHEST PRIORITY)

**New File**: `src/components/IDE/TitleBar/TitleBar.tsx`

```typescript
// TARGET STRUCTURE
<header className="vscode-titlebar">
  <div className="titlebar__window-controls" />
  <div className="titlebar__logo">SpectreWeave</div>
  <nav className="titlebar__menubar">
    <MenuBarItem label="File" />
    <MenuBarItem label="Edit" />
    <MenuBarItem label="View" />
    <MenuBarItem label="Characters" />
    <MenuBarItem label="AI" />
    <MenuBarItem label="Help" />
  </nav>
  <div className="titlebar__command-palette">
    <CommandPaletteSearch />
  </div>
  <div className="titlebar__user" />
</header>
```

**Tasks**:
- [ ] Create TitleBar component directory structure
- [ ] Implement TitleBar.tsx with 30px height
- [ ] Add WindowControls (macOS traffic lights - optional for web)
- [ ] Add PlatformLogo with "SpectreWeave" branding
- [ ] Implement MenuBar with File/Edit/View/Characters/AI/Help
- [ ] Create CommandPaletteSearch input (centered, ⌘K hint)
- [ ] Add UserAccount dropdown
- [ ] Style with VS Code CSS tokens
- [ ] Wire ⌘K keyboard shortcut to open full Command Palette modal
- [ ] Test window dragging in Electron (if applicable)

**CSS Target**:
```css
.vscode-titlebar {
  height: 30px;
  display: flex;
  align-items: center;
  background: var(--vscode-titleBar-activeBackground);
  border-bottom: 1px solid var(--vscode-titleBar-border);
  -webkit-app-region: drag;
}

.titlebar__command-palette input {
  width: 100%;
  max-width: 600px;
  min-width: 200px;
  height: 22px;
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
}
```

**Acceptance Criteria**:
- [ ] Title Bar visible at top of IDE (30px height)
- [ ] "SpectreWeave" branding clearly visible
- [ ] Menu items are clickable and show dropdowns
- [ ] Command Palette search input is centered
- [ ] ⌘K opens Command Palette modal
- [ ] Looks identical to reference image

---

### 1.1 Refactor IDEShell.tsx

**Current File**: `src/components/IDE/IDEShell.tsx`

```typescript
// TARGET STRUCTURE (WITH TITLE BAR)
<div className="vscode-workbench">
  <TitleBar />
  <div className="vscode-workbench__main">
    <div className="activitybar" />
    <div className="sidebar primary" />
    <div className="editor-area">
      <div className="tabs-container" />
      <div className="breadcrumbs" />
      <div className="editor-container" />
    </div>
    <div className="sidebar secondary" />
    <div className="panel" />
  </div>
  <div className="statusbar" />
</div>
```

**Tasks**:
- [ ] Add TitleBar as first child of vscode-workbench
- [ ] Update grid to account for 30px title bar row
- [ ] Replace current grid with CSS Grid matching VS Code
- [ ] Add CSS custom properties for all dimensions
- [ ] Implement panel visibility toggles
- [ ] Add resize handles between sections
- [ ] Test at multiple viewport sizes

**CSS Grid Target**:
```css
.vscode-workbench {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 30px 1fr 22px; /* titlebar, main, statusbar */
}

.vscode-workbench__main {
  display: grid;
  grid-template-columns: 48px auto 1fr auto;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    "activitybar sidebar editor secondary"
    "activitybar sidebar panel secondary"
    "statusbar statusbar statusbar statusbar";
  height: 100vh;
}
```

### 1.2 Activity Bar Rework

**Current File**: `src/components/IDE/ActivityBar/ActivityBar.tsx`

**Tasks**:
- [ ] Set exact width to 48px
- [ ] Center icons (24px) vertically and horizontally
- [ ] Add active indicator (2px white left border)
- [ ] Implement badge component
- [ ] Add separator between top and bottom items
- [ ] Match VS Code dark theme colors exactly

**Component API**:
```typescript
interface ActivityBarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
}

type ViewId = 'explorer' | 'search' | 'characters' | 'ai' | 'framework' | 'settings';
```

### 1.3 Status Bar Rework

**Current File**: `src/components/IDE/StatusBar/StatusBar.tsx`

**Tasks**:
- [ ] Set exact height to 22px
- [ ] Implement left/center/right sections
- [ ] Add StatusBarItem component
- [ ] Implement click handlers
- [ ] Add tooltip support
- [ ] Match blue background (#007acc)

**Status Bar Items** (Fiction Writing):
```typescript
const LEFT_ITEMS = [
  { id: 'branch', icon: 'git-branch', text: 'main' },
  { id: 'sync', icon: 'sync', text: '' },
  { id: 'errors', icon: 'error', text: '0' },
  { id: 'warnings', icon: 'warning', text: '0' },
];

const CENTER_ITEMS = [
  { id: 'words', text: '0 words' },
  { id: 'cursor', text: 'Ln 1, Col 1' },
];

const RIGHT_ITEMS = [
  { id: 'ai-status', icon: 'sparkle', text: 'Claude' },
  { id: 'framework', text: 'Framework: None' },
  { id: 'encoding', text: 'UTF-8' },
];
```

### 1.4 Panel Component

**Current File**: `src/components/IDE/BottomPanel/BottomPanel.tsx`

**Tasks**:
- [ ] Rename to Panel.tsx
- [ ] Add PanelTabs subcomponent
- [ ] Support badge on tabs
- [ ] Implement maximize/restore
- [ ] Add resize handle (top border)
- [ ] Store height in localStorage

**Panel Tabs**:
```typescript
const PANEL_TABS = [
  { id: 'problems', label: 'PROBLEMS', badge: 0 },
  { id: 'output', label: 'OUTPUT' },
  { id: 'ai-chat', label: 'AI CHAT' },
  { id: 'terminal', label: 'TERMINAL' },
];
```

### 1.5 CSS Token Setup

**File**: `src/styles/vscode-layout.css`

**Tasks**:
- [ ] Add ALL VS Code dark theme tokens
- [ ] Organize by component
- [ ] Add comments for each section
- [ ] Remove any hardcoded colors from components
- [ ] Verify tokens match VS Code exactly

---

## Phase 2: Tab System

**Duration**: 2-3 days  
**Goal**: Full tab bar with all VS Code behaviors

### 2.1 TabBar Component

**New File**: `src/components/IDE/TabBar/TabBar.tsx`

**Tasks**:
- [ ] Create TabBar container (35px height)
- [ ] Implement Tab component
- [ ] Add file icon based on extension
- [ ] Show modified indicator (●)
- [ ] Show preview state (italic)
- [ ] Add close button on hover
- [ ] Implement horizontal scroll for overflow

### 2.2 Tab State Management

**Tasks**:
- [ ] Create useTabManager hook
- [ ] Track open tabs
- [ ] Track active tab
- [ ] Track dirty state per tab
- [ ] Persist to localStorage
- [ ] Support pinned tabs

**Hook API**:
```typescript
function useTabManager() {
  return {
    tabs: Tab[];
    activeTabId: string;
    openTab: (doc: Document) => void;
    closeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    markDirty: (id: string, dirty: boolean) => void;
    reorderTabs: (from: number, to: number) => void;
  };
}
```

### 2.3 Tab Drag and Drop

**Tasks**:
- [ ] Implement drag start/end handlers
- [ ] Show drop indicator
- [ ] Reorder on drop
- [ ] Support drag to new editor group (future)

---

## Phase 3: Primary Sidebar

**Duration**: 4-5 days  
**Goal**: Full Explorer sidebar with fiction-specific sections

### 3.1 Sidebar Container

**New File**: `src/components/IDE/Sidebar/PrimarySidebar.tsx`

**Tasks**:
- [ ] Create resizable container (170-500px)
- [ ] Add resize handle
- [ ] Support collapse to icon-only mode
- [ ] Store width in localStorage

### 3.2 Sidebar Sections

**Tasks**:
- [ ] Create SidebarSection component
- [ ] Implement collapse/expand
- [ ] Add section header with actions
- [ ] Support multiple sections

**Sections for Fiction**:
```typescript
const SIDEBAR_SECTIONS = [
  { id: 'open-editors', title: 'OPEN EDITORS' },
  { id: 'project', title: 'STORY NAME' },
  { id: 'outline', title: 'OUTLINE' },
  { id: 'characters', title: 'CHARACTERS' },
  { id: 'timeline', title: 'TIMELINE' },
];
```

### 3.3 Tree View Component

**New File**: `src/components/IDE/Sidebar/FileTree/TreeView.tsx`

**Tasks**:
- [ ] Create TreeNode component
- [ ] Support expand/collapse
- [ ] Add file/folder icons
- [ ] Show badges (M, U, 9+)
- [ ] Implement selection
- [ ] Add keyboard navigation
- [ ] Support context menu

### 3.4 Open Editors Section

**Tasks**:
- [ ] Show all open tabs as list
- [ ] Group by editor group
- [ ] Show dirty indicator
- [ ] Click to activate tab
- [ ] Close button on hover

### 3.5 Search Panel

**New File**: `src/components/IDE/SearchPanel/SearchPanel.tsx`

**Tasks**:
- [ ] Create search input
- [ ] Add replace input (toggle)
- [ ] Show match count
- [ ] Group results by file
- [ ] Highlight matches
- [ ] Support regex, case sensitive, whole word

---

## Phase 4: Editor Enhancements

**Duration**: 3-4 days  
**Goal**: VS Code-like editor with gutter and breadcrumbs

### 4.1 Editor Gutter

**New File**: `src/components/IDE/Editor/EditorGutter.tsx`

**Tasks**:
- [ ] Create line number column
- [ ] Right-align numbers
- [ ] Highlight current line number
- [ ] Support gutter decorations
- [ ] Add fold indicators (future)

**Gutter Decorations for Fiction**:
```typescript
type GutterDecoration = {
  line: number;
  type: 'ai-suggestion' | 'issue' | 'character' | 'approved';
  tooltip?: string;
};
```

### 4.2 Breadcrumbs

**New File**: `src/components/IDE/Editor/EditorBreadcrumbs.tsx`

**Tasks**:
- [ ] Show file path
- [ ] Truncate long paths
- [ ] Click to navigate
- [ ] Show structure outline (chapters)

### 4.3 Editor Integration

**Tasks**:
- [ ] Wrap TipTap editor in EditorContainer
- [ ] Add gutter alongside editor
- [ ] Sync scroll between gutter and content
- [ ] Position cursor indicator

---

## Phase 5: AI Copilot Panel Rework

**Duration**: 3-4 days  
**Goal**: Exact VS Code Copilot Chat appearance

### 5.1 Panel Structure Rework

**File**: `src/components/IDE/AICopilotPanel/AICopilotPanel.tsx`

**Target Structure**:
```typescript
<div className="chat-panel">
  <div className="chat-header">
    <span>CHAT</span>
    <button className="close" />
  </div>
  
  <div className="chat-messages">
    {messages.map(msg => <ChatMessage key={msg.id} {...msg} />)}
  </div>
  
  <div className="chat-input-area">
    <div className="context-chips">
      {contexts.map(ctx => <ContextChip key={ctx.id} {...ctx} />)}
    </div>
    <div className="input-container">
      <textarea />
      <button className="send" />
    </div>
    <div className="agent-selector">
      <select>{agents.map(a => <option>{a.name}</option>)}</select>
    </div>
  </div>
</div>
```

### 5.2 Chat Messages

**Tasks**:
- [ ] Style user messages (right-aligned bubble)
- [ ] Style assistant messages (left-aligned)
- [ ] Add avatar/icon
- [ ] Support markdown rendering
- [ ] Support code blocks with copy
- [ ] Add action buttons (insert, copy)

### 5.3 Context Chips

**New File**: `src/components/IDE/AICopilotPanel/ContextChips.tsx`

**Tasks**:
- [ ] Show attached files as chips
- [ ] Support selection context
- [ ] Add remove button
- [ ] Style matching VS Code

### 5.4 Agent Selector

**Tasks**:
- [ ] Dropdown for model selection
- [ ] Show model icon
- [ ] Display "Working..." state
- [ ] Match VS Code dropdown style

---

## Phase 6: Polish & Integration

**Duration**: 3-4 days  
**Goal**: Production-ready VS Code clone

### 6.1 Keyboard Shortcuts

**Tasks**:
- [ ] Cmd+B: Toggle sidebar
- [ ] Cmd+J: Toggle panel
- [ ] Cmd+Shift+E: Focus explorer
- [ ] Cmd+Shift+F: Focus search
- [ ] Cmd+K Cmd+S: Open shortcuts
- [ ] Cmd+,: Open settings

### 6.2 Context Menus

**Tasks**:
- [ ] File tree right-click menu
- [ ] Tab right-click menu
- [ ] Editor right-click menu
- [ ] Use VS Code menu styling

### 6.3 Accessibility

**Tasks**:
- [ ] Add ARIA labels
- [ ] Support keyboard navigation
- [ ] Test with screen reader
- [ ] Ensure focus visible
- [ ] Support reduced motion

### 6.4 Performance

**Tasks**:
- [ ] Virtual scrolling for large trees
- [ ] Lazy load sidebar sections
- [ ] Memoize expensive renders
- [ ] Profile and optimize

---

## Testing Checklist

### Visual Regression
- [ ] Screenshot comparison with VS Code
- [ ] Test at 1920x1080
- [ ] Test at 1440x900
- [ ] Test at 1280x720

### Functional
- [ ] All panels resize correctly
- [ ] All panels persist state
- [ ] Tabs work correctly
- [ ] Search works
- [ ] AI chat works

### Integration
- [ ] Editor content saves
- [ ] Framework wizard accessible
- [ ] Characters panel works
- [ ] Ghost text works

---

## File Checklist

### New Files to Create
- [ ] `src/components/IDE/TabBar/TabBar.tsx`
- [ ] `src/components/IDE/TabBar/Tab.tsx`
- [ ] `src/components/IDE/Sidebar/PrimarySidebar.tsx`
- [ ] `src/components/IDE/Sidebar/SidebarSection.tsx`
- [ ] `src/components/IDE/Sidebar/FileTree/TreeView.tsx`
- [ ] `src/components/IDE/Sidebar/FileTree/TreeNode.tsx`
- [ ] `src/components/IDE/Editor/EditorGutter.tsx`
- [ ] `src/components/IDE/Editor/EditorBreadcrumbs.tsx`
- [ ] `src/components/IDE/SearchPanel/SearchPanel.tsx`
- [ ] `src/components/IDE/AICopilotPanel/ContextChips.tsx`

### Files to Rework
- [ ] `src/components/IDE/IDEShell.tsx`
- [ ] `src/components/IDE/ActivityBar/ActivityBar.tsx`
- [ ] `src/components/IDE/ActivityBar/ActivityBarItem.tsx`
- [ ] `src/components/IDE/StatusBar/StatusBar.tsx`
- [ ] `src/components/IDE/BottomPanel/BottomPanel.tsx`
- [ ] `src/components/IDE/AICopilotPanel/AICopilotPanel.tsx`
- [ ] `src/styles/vscode-layout.css`

### Files to Delete (after migration)
- [ ] Any duplicate/unused IDE components
- [ ] Old sidebar implementations
- [ ] Deprecated panel components

---

## Success Metrics

1. **Visual**: Side-by-side with VS Code, differences not visible at arm's length
2. **Functional**: All VS Code-like interactions work
3. **Performance**: Initial render < 200ms, resize at 60fps
4. **Code Quality**: All components follow CONSTITUTION.md standards

---

*Track progress by checking off tasks. Each phase should be fully complete before starting the next.*
