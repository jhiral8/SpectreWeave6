# VS Code IDE Rework - Implementation Plan

> **Master Spec**: `SPECS/VSCODE_IDE_REWORK.md`  
> **Task Details**: `SPECS/VSCODE_IDE_TASKS.md`  
> **Reference Analysis**: `SPECS/REFERENCE_IMAGE_ANALYSIS.md`  
> **Constitution**: `CONSTITUTION.md`  
> **Created**: 2026-01-07  
> **Target Completion**: 5 weeks

---

## Executive Summary

Transform SpectreWeave6's manuscript IDE into a pixel-perfect VS Code clone adapted for fiction writing. The result should be visually indistinguishable from VS Code while providing specialized tools for authors.

### Key Deliverables
1. **Title Bar** with platform branding + Command Palette
2. **Activity Bar** with fiction-specific icons
3. **Primary Sidebar** with Explorer, Characters, and Outline
4. **Tab Bar** with editor tabs
5. **Editor Area** with line numbers, gutter, minimap
6. **Panel** with Problems, Output, Terminal tabs
7. **Status Bar** with git, errors, position
8. **AI Copilot** (Secondary Sidebar) matching VS Code Copilot Chat

---

## Phase Overview

| Phase | Focus | Duration | Status |
|-------|-------|----------|--------|
| **Phase 1** | Core Layout + Title Bar | Week 1 | 🔴 Not Started |
| **Phase 2** | Primary Sidebar | Week 2 | 🔴 Not Started |
| **Phase 3** | Editor Area | Week 3 | 🔴 Not Started |
| **Phase 4** | AI Copilot Panel | Week 4 | 🔴 Not Started |
| **Phase 5** | Polish & Integration | Week 5 | 🔴 Not Started |

---

## Phase 1: Core Layout + Title Bar (Week 1)

### Objective
Create the foundational layout shell with Title Bar that is pixel-perfect to VS Code.

### Prerequisites
- [ ] Review VS Code CSS tokens in `CONSTITUTION.md`
- [ ] Verify reference images are accessible
- [ ] Ensure dev server running (`npm run dev`)

### Day 1-2: Title Bar (P0 - HIGHEST PRIORITY)

#### 1.0 Create Title Bar Component

**Files to Create**:
```
src/components/IDE/TitleBar/
├── TitleBar.tsx
├── TitleBar.module.css
├── MenuBar.tsx
├── MenuBarItem.tsx
├── CommandPaletteSearch.tsx
├── WindowControls.tsx
├── UserAccount.tsx
└── index.ts
```

**Implementation Steps**:

1. **Create directory structure**
   ```bash
   mkdir -p src/components/IDE/TitleBar
   ```

2. **Create TitleBar.tsx**
   ```typescript
   // src/components/IDE/TitleBar/TitleBar.tsx
   interface TitleBarProps {
     platformName?: string;
     onCommandPaletteOpen: () => void;
   }
   ```
   - Height: 30px fixed
   - Background: `var(--vscode-titleBar-activeBackground)` (#3c3c3c)
   - Flexbox layout with centered Command Palette

3. **Create MenuBar.tsx**
   - Menu items: File, Edit, View, Characters, AI, Help
   - Dropdown on click (not hover)
   - Standard keyboard shortcuts in labels

4. **Create CommandPaletteSearch.tsx**
   - Centered search input
   - Placeholder: "⌘K Command Palette..."
   - Click opens full Command Palette modal
   - Wire `⌘K` / `Ctrl+K` keyboard shortcut

5. **Style with CSS tokens**
   ```css
   .vscode-titlebar {
     height: 30px;
     background: var(--vscode-titleBar-activeBackground);
     border-bottom: 1px solid var(--vscode-titleBar-border);
   }
   ```

**Acceptance Criteria**:
- [ ] Title Bar renders at top of IDE (30px)
- [ ] "SpectreWeave" branding visible
- [ ] Menu bar items clickable
- [ ] Command Palette search centered
- [ ] ⌘K keyboard shortcut works
- [ ] Matches reference image

---

### Day 2-3: IDEShell Refactor

#### 1.1 Refactor IDEShell.tsx

**File to Modify**: `src/components/IDE/IDEShell.tsx`

**Target Structure**:
```tsx
<div className="vscode-workbench">
  <TitleBar onCommandPaletteOpen={openCommandPalette} />
  <div className="vscode-workbench__main">
    <ActivityBar />
    <PrimarySidebar />
    <EditorArea />
    <SecondarySidebar />
  </div>
  <Panel />
  <StatusBar />
</div>
```

**CSS Grid Layout**:
```css
.vscode-workbench {
  display: grid;
  grid-template-rows: 30px 1fr auto 22px;
  /* titlebar | main | panel | statusbar */
  height: 100vh;
}

.vscode-workbench__main {
  display: grid;
  grid-template-columns: 48px var(--sidebar-width, 250px) 1fr var(--secondary-sidebar-width, 350px);
  min-height: 0; /* Allow shrinking */
}
```

**Implementation Steps**:
1. Back up current IDEShell.tsx
2. Replace CSS Grid layout
3. Add TitleBar as first child
4. Update panel and statusbar positioning
5. Add CSS custom properties for widths
6. Implement resize handles

**Acceptance Criteria**:
- [ ] Layout matches VS Code 8-region structure
- [ ] Title Bar at top
- [ ] All regions resize correctly
- [ ] No layout shifts on window resize

---

### Day 3-4: Activity Bar

#### 1.2 Rework Activity Bar

**Files to Modify/Create**:
```
src/components/IDE/ActivityBar/
├── ActivityBar.tsx      # MODIFY
├── ActivityBarItem.tsx  # MODIFY
├── ActivityBar.module.css # CREATE
└── index.ts
```

**Key Changes**:
- Width: exactly 48px
- Icons: 24px, centered
- Active indicator: 2px white left border
- Badge: 18px pill, top-right position
- Background: `var(--vscode-activityBar-background)` (#333333)

**Icon Set** (Fiction-specific):
| Position | Icon | Label | Badge |
|----------|------|-------|-------|
| 1 | 📁 | Explorer | - |
| 2 | 🔍 | Search | - |
| 3 | 👤 | Characters | count |
| 4 | 🤖 | AI Agents | pending |
| 5 | 📖 | Framework | - |
| --- | --- | --- | --- |
| Bottom | ⚙️ | Settings | - |

**Acceptance Criteria**:
- [ ] Width is exactly 48px
- [ ] Icons centered at 24px
- [ ] Active item has white left border
- [ ] Badges render correctly
- [ ] Hover state visible

---

### Day 4-5: Tab Bar, Panel, Status Bar

#### 1.3 Create Tab Bar

**Files to Create**:
```
src/components/IDE/TabBar/
├── TabBar.tsx
├── Tab.tsx
├── TabBar.module.css
└── index.ts
```

**Key Features**:
- Height: 35px
- Tab max-width: 120px
- Active tab: brighter background
- Modified indicator: ● before title
- Close button on hover
- Scroll arrows for overflow

#### 1.4 Create Panel

**Files to Create**:
```
src/components/IDE/Panel/
├── Panel.tsx
├── PanelTabs.tsx
├── Panel.module.css
└── index.ts
```

**Tab Configuration**:
| Tab | Label | Badge | Fiction Use |
|-----|-------|-------|-------------|
| PROBLEMS | Problems | count | Style issues, consistency |
| OUTPUT | Output | - | AI responses |
| TERMINAL | Terminal | - | - |

#### 1.5 Create Status Bar

**Files to Modify**:
```
src/components/IDE/StatusBar/
├── StatusBar.tsx        # MODIFY
├── StatusBar.module.css # CREATE
└── index.ts
```

**Segments**:
- **Left**: Git branch, sync status, errors, warnings
- **Center**: Cursor position (Ln X, Col Y)
- **Right**: File type, encoding, line endings

#### 1.6 CSS Token Integration

**File to Create**: `src/styles/vscode-tokens.css`

Import VS Code's CSS tokens and map to our components:
```css
:root {
  --vscode-titleBar-activeBackground: #3c3c3c;
  --vscode-activityBar-background: #333333;
  --vscode-sideBar-background: #252526;
  --vscode-editor-background: #1e1e1e;
  --vscode-panel-background: #1e1e1e;
  --vscode-statusBar-background: #007acc;
  /* ... 200+ tokens */
}
```

---

### Phase 1 Deliverable

**Screenshot Comparison Test**:
```
┌──────────────────────────────────────────────────────────────────────┐
│                           TITLE BAR                                  │
│  [●●●]   SpectreWeave  │ File Edit View │  ⌘K Search...  │   [▾]    │
├────┬─────────────────────────────────────────────────────────┬───────┤
│    │                      TAB BAR                            │       │
│ A  ├─────────────────────────────────────────────────────────┤  S    │
│ C  │                                                         │  E    │
│ T  │                      EDITOR                             │  C    │
│ I  │                      (empty)                            │  O    │
│ V  │                                                         │  N    │
│ I  │                                                         │  D    │
│ T  │                                                         │  A    │
│ Y  │                                                         │  R    │
│    ├─────────────────────────────────────────────────────────┤  Y    │
│ B  │                       PANEL                             │       │
│ A  │  [PROBLEMS] [OUTPUT] [TERMINAL]                         │       │
│ R  │                                                         │       │
├────┴─────────────────────────────────────────────────────────┴───────┤
│ main* ○ │ ⊙ 0 ⚠ 0 │ Ln 1, Col 1 │ Spaces: 2 │ UTF-8 │ Plain Text   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Phase 2: Primary Sidebar (Week 2)

### Objective
Implement VS Code Explorer-style sidebar with fiction-specific sections.

### Day 1-2: Sidebar Container

**Files to Create**:
```
src/components/IDE/Sidebar/
├── PrimarySidebar.tsx
├── SidebarSection.tsx
├── SidebarHeader.tsx
├── Sidebar.module.css
└── index.ts
```

**Key Features**:
- Resizable (min: 170px, max: 50% viewport)
- Collapsible sections with chevrons
- Section headers: uppercase, 11px, bold
- Drag handle for resize

### Day 2-3: Open Editors & File Tree

**Files to Create**:
```
src/components/IDE/Sidebar/FileTree/
├── FileTree.tsx
├── TreeNode.tsx
├── FileIcon.tsx
└── index.ts
```

**Open Editors Section**:
- Shows all open tabs
- "Unsaved" badge count
- Close button on hover
- Drag to reorder

**File Tree**:
- For fiction: Chapters → Scenes hierarchy
- Icons for file types
- Modified indicator
- Context menu on right-click

### Day 3-4: Outline & Characters

**Outline Section** (Table of Contents):
- Headings from current document
- Click to navigate
- Icons for H1, H2, H3

**Characters Section** (Fiction-specific):
- Character cards with avatars
- Quick insert on click
- Badge for scenes with character

### Day 5: Search Panel

**Files to Create**:
```
src/components/IDE/Sidebar/SearchPanel/
├── SearchPanel.tsx
├── SearchInput.tsx
├── SearchResults.tsx
└── index.ts
```

**Features**:
- Search input with options (case, regex, word)
- Replace functionality
- Results grouped by file
- Match highlighting

---

## Phase 3: Editor Area (Week 3)

### Objective
Add VS Code editor features: gutter, line numbers, breadcrumbs, minimap.

### Day 1-2: Line Number Gutter

**Files to Create**:
```
src/components/IDE/Editor/
├── EditorGutter.tsx
├── LineNumbers.tsx
├── GutterDecorations.tsx
└── index.ts
```

**Features**:
- Line numbers (right-aligned, monospace)
- Fold indicators (chevrons)
- Breakpoint/bookmark markers
- Current line highlight
- Selection line highlighting

### Day 2-3: Breadcrumbs

**File to Create**: `src/components/IDE/Editor/EditorBreadcrumbs.tsx`

**Features**:
- Path: Project > Chapter > Scene > Heading
- Dropdown on click for navigation
- Icon for each level

### Day 3-4: Minimap

**File to Create**: `src/components/IDE/Editor/EditorMinimap.tsx`

**Features**:
- Scaled-down document preview
- Current viewport indicator
- Click to scroll
- Width: 80px (collapsible)

### Day 4-5: Editor Tabs Integration

**Features**:
- Multiple editor groups (split)
- Drag tabs between groups
- Tab overflow scrolling
- Unsaved indicator

---

## Phase 4: AI Copilot Panel (Week 4)

### Objective
Rework AICopilotPanel to exactly match VS Code Copilot Chat.

### Day 1-2: Panel Structure

**Files to Modify**:
```
src/components/AICopilotPanel/
├── AICopilotPanel.tsx    # MAJOR REWORK
├── ChatMessages.tsx      # MODIFY
├── ChatInput.tsx         # MODIFY
└── styles/               # REWORK
```

**Layout**:
```
┌─────────────────────────────────┐
│ [⊕] Chat │ [Edit] │ [Agent ▾]  │  Header
├─────────────────────────────────┤
│ [@file] [@selection] [@symbol]  │  Context chips
├─────────────────────────────────┤
│                                 │
│   User message bubble           │
│                                 │
│   AI response bubble            │
│   - Code blocks                 │
│   - Inline code                 │
│                                 │
├─────────────────────────────────┤
│ [📎] Ask Copilot...    [▶]     │  Input
└─────────────────────────────────┘
```

### Day 2-3: Context Chips

**Files to Create**:
```
src/components/AICopilotPanel/ContextChips/
├── ContextChips.tsx
├── ContextChip.tsx
└── index.ts
```

**Chip Types**:
- `@file` - Current file context
- `@selection` - Selected text
- `@character` - Character profile (fiction)
- `@scene` - Current scene (fiction)

### Day 3-4: Message Styling

**Styling Requirements**:
- User messages: Right-aligned, blue background
- AI messages: Left-aligned, dark background
- Code blocks: Syntax highlighted, copy button
- Inline code: Monospace, subtle background

### Day 4-5: Agent Selector & Mode Tabs

**Agent Dropdown**:
- Default Copilot
- Fiction Writer agent
- Editor agent
- Research agent

**Mode Tabs**:
- Chat (default)
- Edit (inline suggestions)
- Generate (bulk generation)

---

## Phase 5: Polish & Integration (Week 5)

### Objective
Production-ready IDE with full keyboard support, accessibility, and performance.

### Day 1: Keyboard Shortcuts

**Global Shortcuts**:
| Shortcut | Action |
|----------|--------|
| `⌘K` | Command Palette |
| `⌘B` | Toggle Sidebar |
| `⌘J` | Toggle Panel |
| `⌘\` | Split Editor |
| `⌘1/2/3` | Focus Editor Group |
| `⌘,` | Settings |

### Day 2: Context Menus

**Implementation**:
- Right-click on files: Open, Rename, Delete, Copy Path
- Right-click on tabs: Close, Close Others, Close All
- Right-click in editor: Cut, Copy, Paste, AI Actions

### Day 3: Drag and Drop

**Features**:
- Drag files in tree to reorder
- Drag tabs to reorder/split
- Drag characters to insert
- Drop zone indicators

### Day 4: State Persistence

**Persist in localStorage**:
- Sidebar width
- Panel height
- Open files/tabs
- Active sidebar section
- Collapsed sections

### Day 5: Accessibility & Performance

**Accessibility**:
- ARIA labels on all interactive elements
- Focus management
- Screen reader announcements
- Keyboard navigation

**Performance**:
- Virtualized file tree (1000+ items)
- Lazy load sidebar sections
- Debounced resize handlers
- Memoized components

---

## File Structure Summary

```
src/components/IDE/
├── TitleBar/                    # NEW
│   ├── TitleBar.tsx
│   ├── MenuBar.tsx
│   ├── CommandPaletteSearch.tsx
│   └── index.ts
├── ActivityBar/                 # REWORK
│   ├── ActivityBar.tsx
│   ├── ActivityBarItem.tsx
│   └── index.ts
├── Sidebar/                     # NEW
│   ├── PrimarySidebar.tsx
│   ├── SecondarySidebar.tsx
│   ├── SidebarSection.tsx
│   ├── FileTree/
│   ├── SearchPanel/
│   └── index.ts
├── TabBar/                      # NEW
│   ├── TabBar.tsx
│   ├── Tab.tsx
│   └── index.ts
├── Editor/                      # NEW
│   ├── EditorGroup.tsx
│   ├── EditorGutter.tsx
│   ├── EditorBreadcrumbs.tsx
│   ├── EditorMinimap.tsx
│   └── index.ts
├── Panel/                       # REWORK
│   ├── Panel.tsx
│   ├── PanelTabs.tsx
│   └── index.ts
├── StatusBar/                   # REWORK
│   ├── StatusBar.tsx
│   └── index.ts
├── IDEShell.tsx                 # MAJOR REWORK
└── index.ts
```

---

## Success Metrics

### Visual Accuracy
- [ ] Side-by-side screenshot comparison passes
- [ ] All VS Code CSS tokens applied correctly
- [ ] Animations match VS Code timing
- [ ] Dark theme exact match

### Functionality
- [ ] All keyboard shortcuts work
- [ ] Panel resize persists
- [ ] Context menus functional
- [ ] AI integration seamless

### Performance
- [ ] Initial load < 2s
- [ ] No layout jank on resize
- [ ] Smooth 60fps animations
- [ ] Memory stable over time

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Full keyboard navigation
- [ ] Screen reader compatible
- [ ] Focus indicators visible

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| TipTap integration complexity | Keep editor core simple, add features incrementally |
| CSS token coverage gaps | Extract directly from VS Code, test thoroughly |
| Performance with large documents | Implement virtualization early |
| Keyboard shortcut conflicts | Use existing VS Code mapping, test all combos |

---

## Getting Started

### Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Dev server working (`npm run dev`)
- [ ] Reference images saved locally
- [ ] VS Code open for comparison
- [ ] `CONSTITUTION.md` reviewed

### First Task

```bash
# Start with Phase 1, Task 1.0
mkdir -p src/components/IDE/TitleBar
touch src/components/IDE/TitleBar/TitleBar.tsx
touch src/components/IDE/TitleBar/index.ts
```

Then implement TitleBar.tsx following the specification in `VSCODE_IDE_REWORK.md` Section 0.

---

## Appendix: Reference Commands

```bash
# Run dev server
npm run dev

# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-07  
**Author**: SpectreWeave6 Development Team
