# VS Code IDE Rework Specification

> **Goal**: Rework SpectreWeave6's manuscript IDE to be visually and functionally indistinguishable from VS Code, adapted for fiction writing.

**Reference Image**: `image-1767821174386.png` (VS Code dark theme layout)  
**Created**: 2026-01-07  
**Status**: Planning

### Related Documents
| Document | Purpose |
|----------|---------|
| `SPECS/IMPLEMENTATION_PLAN.md` | **Day-by-day implementation roadmap** |
| `SPECS/VSCODE_IDE_TASKS.md` | Detailed task checklists |
| `SPECS/REFERENCE_IMAGE_ANALYSIS.md` | Pixel-by-pixel target breakdown |
| `CONSTITUTION.md` | UX standards & CSS tokens |

---

## Table of Contents

1. [Reference Analysis](#reference-analysis)
2. [Current State Assessment](#current-state-assessment)
3. [Target Architecture](#target-architecture)
4. [Component Specifications](#component-specifications)
   - [0. Title Bar (P0)](#0-title-bar-p0---highest-priority)
   - [1. Activity Bar](#1-activity-bar)
   - [2. Tab Bar](#2-tab-bar)
   - [3. Primary Sidebar](#3-primary-sidebar)
   - [4. Editor Area](#4-editor-area)
   - [5. Panel](#5-panel)
   - [6. Status Bar](#6-status-bar)
   - [7. AI Copilot (Secondary Sidebar)](#7-ai-copilot-secondary-sidebar)
5. [CSS Token Mapping](#css-token-mapping)
6. [Implementation Phases](#implementation-phases)
7. [Migration Strategy](#migration-strategy)
8. [Acceptance Criteria](#acceptance-criteria)

---

## Reference Analysis

### VS Code Layout from Reference Image

The reference image (`image-1767821174386.png`) shows the **TARGET VS Code IDE** that SpectreWeave6 must match:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [←] [→]    │  🔍 SpectreWeave6                      │  [⬇] │ [□] [□] [□]  │  TITLE BAR
├────────────────────────────────────────────────────────────────────────────┤
│ [Activity Bar] │ [Tab Bar with multiple tabs]              │ [Chat Panel] │
│                │                                            │              │
│  📁 Explorer   │  globals.css content visible:              │  /speckit    │
│  🔍 Search     │  - @tailwind imports                       │  prompt      │
│  🤖 AI (157)   │  - @import statements                      │              │
│  📝 Writing    │  - CSS keyframes (peek-pulse)              │  Working...  │
│  ⚙️ Settings   │  - Animation definitions                   │              │
│                │                                            │              │
│  OUTLINE       │  Line numbers visible                      │              │
│  TIMELINE      │  Syntax highlighting active                │              │
│  CONTAINERS    │                                            │              │
│  IMAGES        │                                            │              │
│  REGISTRIES    │                                            │              │
│  NETWORKS      │                                            │              │
│  VOLUMES       │                                            │              │
├────────────────┴────────────────────────────────────────────┴──────────────┤
│ [PROBLEMS 54] [OUTPUT] [DEBUG CONSOLE] [TERMINAL] [PORTS]    │ zsh prompt  │
├────────────────────────────────────────────────────────────────────────────┤
│ main*+ ○  ⊙ 51 ⚠ 13  │  Ln 19, Col 1  │  Spaces: 2  │  UTF-8  │  CSS      │
└────────────────────────────────────────────────────────────────────────────┘
```

### Key VS Code Visual Elements Observed

1. **Title Bar / Header** (topmost, ~35px)
   - Navigation arrows (← →) on left
   - **Centered Command Palette / Search** - "SpectreWeave6" with search icon
   - Download/action button
   - Window controls (minimize, maximize, close) on right
   - Dark background matching activity bar

2. **Activity Bar** (leftmost, 48px wide)
   - Dark background (`#333333`)
   - Icon-only navigation
   - Active indicator (white left border)
   - Badge counts visible (157 on AI icon)

2. **Primary Sidebar** (Explorer)
   - Section headers: OPEN EDITORS, SPECTREWEAVE6
   - Collapsible tree view
   - File icons with language indicators
   - Modified indicator (M) on files
   - Nested folder structure visible

3. **Tab Bar**
   - Multiple tabs with file icons
   - Active tab highlighted
   - Modified indicator (●) on unsaved files
   - Close button on hover
   - Scroll for overflow

4. **Editor Area**
   - Line numbers (gutter)
   - Syntax highlighting
   - Current line highlight
   - Minimap would be on right

5. **Panel** (Bottom)
   - Tab bar: PROBLEMS (54), OUTPUT, DEBUG CONSOLE, TERMINAL, PORTS
   - Badge on PROBLEMS tab
   - Terminal with zsh prompt visible
   - Resizable

6. **Secondary Sidebar** (Right - Chat Panel)
   - CHAT header
   - Context chips (globals.css)
   - Agent selector dropdown
   - Working indicator

7. **Status Bar** (Bottom)
   - Git branch (main*+)
   - Errors/warnings (⊙ 51, ⚠ 13)
   - Line/column position
   - Encoding, file type

---

## Current State Assessment

### What Exists ✅

| Component | File | VS Code Match |
|-----------|------|---------------|
| ActivityBar | `src/components/IDE/ActivityBar/` | Partial |
| StatusBar | `src/components/IDE/StatusBar/` | Partial |
| BottomPanel | `src/components/IDE/BottomPanel/` | Partial |
| CommandPalette | `src/components/IDE/CommandPalette/` | Good |
| AICopilotPanel | `src/components/IDE/AICopilotPanel/` | Needs rework |
| IDEShell | `src/components/IDE/IDEShell.tsx` | Needs rework |

### What's Missing ❌

| Component | VS Code Reference | Priority |
|-----------|-------------------|----------|
| **Title Bar** | Navigation, Command Palette search, window controls | **P0** |
| Tab Bar | File tabs with icons, modified state | P0 |
| Primary Sidebar | Full tree view with sections | P0 |
| Editor Gutter | Line numbers, folding, breakpoints | P1 |
| Minimap | Document overview | P2 |
| Breadcrumbs | File path navigation | P1 |
| Panel Tabs | PROBLEMS, OUTPUT, TERMINAL tabs | P0 |
| Search Panel | Full search UI | P1 |

### What Needs Rework 🔄

| Component | Issue | Target |
|-----------|-------|--------|
| ActivityBar | Wrong sizing, missing badges | Exact VS Code match |
| StatusBar | Missing segments | Full VS Code status |
| AICopilotPanel | Doesn't match Copilot Chat | VS Code Copilot Chat exact |
| Layout | Not responsive like VS Code | Exact panel system |

---

## Target Architecture

### Layout Grid

```
┌──────────────────────────────────────────────────────────────────────┐
│                           TITLE BAR                                  │
│  [←][→]     │  🔍 SpectreWeave6 (Command Palette)  │  [⬇] [□][□][□] │
├────┬─────────────────────────────────────────────────────────┬───────┤
│    │                      TAB BAR                            │       │
│    ├─────────────────────────────────────────────────────────┤       │
│    │                     BREADCRUMBS                         │       │
│ A  ├─────────────────────────────────────────────────────────┤  S    │
│ C  │                                                         │  E    │
│ T  │                                                         │  C    │
│ I  │  P                                                      │  O    │
│ V  │  R                    EDITOR                            │  N    │
│ I  │  I                                                      │  D    │
│ T  │  M                                                      │  A    │
│ Y  │  A                                                      │  R    │
│    │  R                                                      │  Y    │
│ B  │  Y                                                      │       │
│ A  │                                                         │  S    │
│ R  │  S                                                      │  I    │
│    │  I                                                      │  D    │
│    │  D                                                      │  E    │
│    │  E                                                      │  B    │
│    │  B                                                      │  A    │
│    │  A                                                      │  R    │
│    │  R                                                      │       │
│    ├─────────────────────────────────────────────────────────┤       │
│    │                       PANEL                             │       │
│    │  [PROBLEMS] [OUTPUT] [TERMINAL]                         │       │
├────┴─────────────────────────────────────────────────────────┴───────┤
│                          STATUS BAR                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
IDEShell
├── TitleBar (P0 - REQUIRED)
│   ├── WindowControls (macOS traffic lights)
│   ├── PlatformLogo ("SpectreWeave")
│   ├── MenuBar
│   │   ├── FileMenu
│   │   ├── EditMenu
│   │   ├── ViewMenu
│   │   ├── CharactersMenu [fiction-specific]
│   │   ├── AIMenu [fiction-specific]
│   │   └── HelpMenu
│   ├── CommandPaletteSearch (⌘K)
│   └── UserAccount
├── MainLayout
│   ├── ActivityBar
│   │   ├── ActivityBarItem (Explorer)
│   │   ├── ActivityBarItem (Search)
│   │   ├── ActivityBarItem (Characters) [fiction-specific]
│   │   ├── ActivityBarItem (AI Agents)
│   │   ├── ActivityBarItem (Framework) [fiction-specific]
│   │   └── ActivityBarItem (Settings)
│   ├── PrimarySidebar
│   │   ├── SidebarHeader
│   │   ├── OpenEditors
│   │   ├── FileExplorer
│   │   │   ├── TreeView
│   │   │   └── TreeNode
│   │   ├── Outline
│   │   ├── Timeline
│   │   └── [Collapsible sections]
│   ├── EditorGroup
│   │   ├── TabBar
│   │   │   ├── Tab
│   │   │   └── TabActions
│   │   ├── Breadcrumbs
│   │   ├── EditorContainer
│   │   │   ├── Gutter (line numbers)
│   │   │   ├── EditorContent (TipTap)
│   │   │   └── Minimap
│   │   └── EditorActions
│   ├── SecondarySidebar
│   │   ├── SidebarHeader
│   │   └── AICopilotPanel
│   └── Panel
│       ├── PanelTabs
│       │   ├── ProblemsTab
│       │   ├── OutputTab
│       │   ├── TerminalTab
│       │   └── AIOutputTab [fiction-specific]
│       └── PanelContent
└── StatusBar
    ├── LeftSegment (git, errors)
    ├── CenterSegment (cursor position)
    └── RightSegment (file info, notifications)
```

---

## Component Specifications

### 0. Title Bar (P0 - HIGHEST PRIORITY)

**Reference**: VS Code's `workbench.titleBar` + Electron window controls

> **NOTE**: This component is visible in the TARGET reference image showing platform branding and command palette search. This is the FIRST visual element users see and establishes brand identity.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ◉ ◉ ◉ │ SpectreWeave │ File Edit View ... │ ⌘ Command Palette...  │ ▾ │
└──────────────────────────────────────────────────────────────────────┘
  [1]        [2]              [3]                   [4]            [5]

1. Window Controls (macOS: close/minimize/zoom)
2. Platform Logo/Name
3. Menu Bar Items  
4. Command Palette Search (CENTRAL FEATURE)
5. User/Account dropdown
```

```typescript
interface TitleBarProps {
  platformName: string;           // "SpectreWeave"
  platformLogo?: ReactNode;       // Optional logo icon
  menuItems: MenuBarItem[];       // File, Edit, View, etc.
  showCommandPalette?: boolean;   // true by default
  commandPaletteShortcut?: string; // ⌘K or ⌘P
  onCommandPaletteOpen: () => void;
  showWindowControls?: boolean;   // Electron only
  userInfo?: {
    name: string;
    avatar?: string;
  };
}

interface MenuBarItem {
  id: string;
  label: string;
  shortcut?: string;
  submenu?: MenuBarItem[];
  action?: () => void;
  disabled?: boolean;
}
```

**Dimensions**:
- Height: **30px** (exact VS Code match)
- Command Palette Width: **min 200px, max 600px** (centered)
- Logo/Name Section: **~120px**
- Menu Items: **auto** (shrink on small screens)

**Styling Requirements**:
```css
.titlebar {
  height: 30px;
  display: flex;
  align-items: center;
  background: var(--vscode-titleBar-activeBackground); /* #3c3c3c */
  border-bottom: 1px solid var(--vscode-titleBar-border);
  -webkit-app-region: drag; /* Allow window dragging */
  user-select: none;
}

.titlebar-inactive {
  background: var(--vscode-titleBar-inactiveBackground); /* #3c3c3c with opacity */
  color: var(--vscode-titleBar-inactiveForeground);
}

.titlebar__window-controls {
  display: flex;
  gap: 8px;
  padding: 0 12px;
  -webkit-app-region: no-drag;
}

.titlebar__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  font-weight: 600;
  color: var(--vscode-titleBar-activeForeground); /* #cccccc */
}

.titlebar__menubar {
  display: flex;
  gap: 4px;
  padding: 0 8px;
  -webkit-app-region: no-drag;
}

.titlebar__menu-item {
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.titlebar__menu-item:hover {
  background: var(--vscode-toolbar-hoverBackground);
}

.titlebar__command-palette {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 16px;
  -webkit-app-region: no-drag;
}

.titlebar__command-palette-input {
  width: 100%;
  max-width: 600px;
  min-width: 200px;
  height: 22px;
  padding: 0 8px 0 28px; /* Space for search icon */
  background: var(--vscode-input-background); /* #3c3c3c */
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  color: var(--vscode-input-foreground);
  font-size: 12px;
}

.titlebar__command-palette-input::placeholder {
  color: var(--vscode-input-placeholderForeground);
}

.titlebar__command-palette-input:focus {
  border-color: var(--vscode-focusBorder); /* #007acc */
  outline: none;
}

.titlebar__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  -webkit-app-region: no-drag;
}
```

**Keyboard Shortcuts**:
- `⌘K` or `⌘P` - Open Command Palette
- `⌘,` - Open Settings
- Menu items use standard shortcuts (⌘S, ⌘Z, etc.)

**Behavior**:
1. Command Palette shows placeholder: "⌘K Command Palette..."
2. Click on search bar opens full command palette modal
3. Menu bar items show dropdowns on click (not hover like native)
4. Window controls are macOS native traffic lights (web apps hide these)
5. Title bar background changes when window loses focus

**Fiction-Specific Menu Items**:
- **File**: New Chapter, New Scene, Open Project, Export...
- **Edit**: Standard + "AI Suggestions", "Character Insert"
- **View**: Panel Toggle, Sidebar Toggle, Minimap Toggle
- **Characters**: Character Browser, New Character
- **AI**: Generate Suggestions, Style Analysis
- **Help**: Documentation, Keyboard Shortcuts

---

### 1. Activity Bar

**Reference**: VS Code's `workbench.activityBar`

```typescript
interface ActivityBarProps {
  items: ActivityBarItem[];
  activeId: string;
  onItemClick: (id: string) => void;
  position: 'left' | 'right'; // VS Code supports both
}

interface ActivityBarItem {
  id: string;
  icon: ReactNode;
  label: string;
  badge?: number | string;
  badgeColor?: 'default' | 'warning' | 'error';
}
```

**Styling Requirements**:
```css
.activitybar {
  width: 48px;
  background: var(--vscode-activityBar-background); /* #333333 */
  border-right: 1px solid var(--vscode-activityBar-border);
}

.activitybar-item {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.activitybar-item.active {
  border-left: 2px solid var(--vscode-activityBar-activeBorder); /* white */
}

.activitybar-item .badge {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: var(--vscode-activityBarBadge-background); /* #007acc */
  color: var(--vscode-activityBarBadge-foreground); /* white */
  font-size: 11px;
}
```

### 2. Tab Bar

**Reference**: VS Code's `workbench.editor.tabBar`

```typescript
interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
}

interface Tab {
  id: string;
  title: string;
  icon?: ReactNode;
  isDirty: boolean;
  isPinned: boolean;
  isPreview: boolean; // italic title
  filePath?: string;
}
```

**Styling Requirements**:
```css
.tabs-container {
  height: 35px;
  background: var(--vscode-editorGroupHeader-tabsBackground);
  display: flex;
  overflow-x: auto;
}

.tab {
  height: 35px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-right: 1px solid var(--vscode-tab-border);
  background: var(--vscode-tab-inactiveBackground);
  color: var(--vscode-tab-inactiveForeground);
  font-size: 13px;
  cursor: pointer;
}

.tab.active {
  background: var(--vscode-tab-activeBackground);
  color: var(--vscode-tab-activeForeground);
  border-bottom: 1px solid var(--vscode-tab-activeBorderTop);
}

.tab.dirty::before {
  content: '●';
  color: var(--vscode-tab-inactiveModifiedBorder);
}

.tab.preview .tab-title {
  font-style: italic;
}
```

### 3. Primary Sidebar (Explorer)

**Reference**: VS Code's `workbench.view.explorer`

```typescript
interface SidebarProps {
  sections: SidebarSection[];
  width: number;
  onResize: (width: number) => void;
  minWidth: number; // 170px
  maxWidth: number; // 500px
}

interface SidebarSection {
  id: string;
  title: string;
  isCollapsed: boolean;
  content: ReactNode;
  actions?: SidebarAction[];
}

interface TreeNode {
  id: string;
  label: string;
  icon?: ReactNode;
  children?: TreeNode[];
  isExpanded?: boolean;
  isSelected?: boolean;
  badges?: Badge[];
  contextMenu?: ContextMenuItem[];
}
```

**Section Mapping for Fiction Writing**:

| VS Code Section | SpectreWeave Equivalent |
|-----------------|-------------------------|
| OPEN EDITORS | Open Documents |
| [PROJECT NAME] | [Story Name] |
| OUTLINE | Chapter Outline |
| TIMELINE | Revision Timeline |
| NPM SCRIPTS | — (not applicable) |

**Fiction-Specific Sections**:
- **CHARACTERS** - Character tree
- **LOCATIONS** - World locations
- **PLOT THREADS** - Active plot lines
- **NOTES** - Research notes

### 4. Editor Area

**Reference**: VS Code's `workbench.editor`

```typescript
interface EditorProps {
  content: JSONContent; // TipTap content
  gutter: GutterConfig;
  minimap: MinimapConfig;
  breadcrumbs: BreadcrumbItem[];
}

interface GutterConfig {
  showLineNumbers: boolean;
  showFolding: boolean;
  showDecorations: boolean; // AI suggestions, issues
  lineNumbersMinChars: number; // 5 default
}

interface MinimapConfig {
  enabled: boolean;
  side: 'left' | 'right';
  scale: number; // 1-3
  showSlider: 'always' | 'mouseover';
}
```

**Gutter Decorations for Fiction**:

| Decoration | VS Code Equivalent | Purpose |
|------------|-------------------|---------|
| Blue dot | Breakpoint | AI suggestion available |
| Yellow line | Warning | Consistency issue |
| Red line | Error | Plot hole detected |
| Purple line | Debug | Character mention |
| Green check | — | AI approved section |

### 5. Panel (Bottom)

**Reference**: VS Code's `workbench.panel`

```typescript
interface PanelProps {
  tabs: PanelTab[];
  activeTabId: string;
  height: number;
  onResize: (height: number) => void;
  isMaximized: boolean;
}

interface PanelTab {
  id: string;
  label: string;
  badge?: number;
  badgeColor?: 'info' | 'warning' | 'error';
  content: ReactNode;
}
```

**Panel Tabs for Fiction Writing**:

| Tab | VS Code Equivalent | Content |
|-----|-------------------|---------|
| PROBLEMS | PROBLEMS | Story issues, plot holes, inconsistencies |
| OUTPUT | OUTPUT | AI generation logs |
| AI CHAT | DEBUG CONSOLE | Inline AI chat (alternative to sidebar) |
| TERMINAL | TERMINAL | Command line (export, scripts) |

### 6. Status Bar

**Reference**: VS Code's `workbench.statusBar`

```typescript
interface StatusBarProps {
  leftItems: StatusBarItem[];
  centerItems: StatusBarItem[];
  rightItems: StatusBarItem[];
}

interface StatusBarItem {
  id: string;
  text: string;
  icon?: ReactNode;
  tooltip?: string;
  onClick?: () => void;
  backgroundColor?: string;
  priority: number; // higher = more left within section
}
```

**Status Bar Items for Fiction Writing**:

| Position | Item | Content |
|----------|------|---------|
| Left | Branch | Current story version |
| Left | Sync Status | Cloud sync status |
| Left | Problems | Issue count (errors/warnings) |
| Center | Word Count | `12,345 words` |
| Center | Chapter | `Chapter 5 of 24` |
| Center | Cursor | `Ln 42, Para 3` |
| Right | AI Status | `Claude Sonnet ✓` |
| Right | Framework | `Framework: Complete` |
| Right | Encoding | `UTF-8` |

### 7. Secondary Sidebar (AI Copilot)

**Reference**: VS Code Copilot Chat panel

```typescript
interface AICopilotPanelProps {
  messages: ChatMessage[];
  mode: 'discuss' | 'ghostwrite' | 'framework' | 'agents';
  context: ContextItem[];
  model: AIModel;
  isLoading: boolean;
}
```

**Must Match VS Code Copilot Chat**:
- Header with CHAT title
- Context chips below input
- Mode selector tabs
- Agent dropdown
- Message bubbles with user/assistant distinction
- Code blocks with copy button
- Streaming indicator

---

## CSS Token Mapping

### Complete VS Code Dark Theme Tokens

```css
:root {
  /* Activity Bar */
  --vscode-activityBar-background: #333333;
  --vscode-activityBar-foreground: #ffffff;
  --vscode-activityBar-inactiveForeground: #ffffff66;
  --vscode-activityBar-border: #333333;
  --vscode-activityBar-activeBorder: #ffffff;
  --vscode-activityBarBadge-background: #007acc;
  --vscode-activityBarBadge-foreground: #ffffff;
  
  /* Sidebar */
  --vscode-sideBar-background: #252526;
  --vscode-sideBar-foreground: #cccccc;
  --vscode-sideBar-border: #00000000;
  --vscode-sideBarTitle-foreground: #bbbbbb;
  --vscode-sideBarSectionHeader-background: #00000000;
  --vscode-sideBarSectionHeader-foreground: #bbbbbb;
  --vscode-sideBarSectionHeader-border: #cccccc33;
  
  /* Editor */
  --vscode-editor-background: #1e1e1e;
  --vscode-editor-foreground: #d4d4d4;
  --vscode-editorLineNumber-foreground: #858585;
  --vscode-editorLineNumber-activeForeground: #c6c6c6;
  --vscode-editorCursor-foreground: #aeafad;
  --vscode-editor-selectionBackground: #264f78;
  --vscode-editor-lineHighlightBackground: #ffffff0a;
  
  /* Editor Groups */
  --vscode-editorGroup-border: #444444;
  --vscode-editorGroupHeader-tabsBackground: #252526;
  --vscode-editorGroupHeader-tabsBorder: #00000000;
  
  /* Tabs */
  --vscode-tab-activeBackground: #1e1e1e;
  --vscode-tab-activeForeground: #ffffff;
  --vscode-tab-activeBorder: #00000000;
  --vscode-tab-activeBorderTop: #00000000;
  --vscode-tab-inactiveBackground: #2d2d2d;
  --vscode-tab-inactiveForeground: #ffffff80;
  --vscode-tab-border: #252526;
  --vscode-tab-unfocusedActiveBackground: #1e1e1e;
  --vscode-tab-unfocusedActiveForeground: #ffffff80;
  --vscode-tab-unfocusedInactiveBackground: #2d2d2d;
  --vscode-tab-unfocusedInactiveForeground: #ffffff40;
  --vscode-tab-hoverBackground: #00000000;
  --vscode-tab-unfocusedHoverBackground: #00000000;
  --vscode-tab-hoverForeground: #ffffff;
  --vscode-tab-activeModifiedBorder: #3399cc;
  --vscode-tab-inactiveModifiedBorder: #3399cc80;
  
  /* Panel */
  --vscode-panel-background: #1e1e1e;
  --vscode-panel-border: #80808059;
  --vscode-panelTitle-activeBorder: #e7e7e7;
  --vscode-panelTitle-activeForeground: #e7e7e7;
  --vscode-panelTitle-inactiveForeground: #e7e7e780;
  
  /* Status Bar */
  --vscode-statusBar-background: #007acc;
  --vscode-statusBar-foreground: #ffffff;
  --vscode-statusBar-border: #00000000;
  --vscode-statusBarItem-hoverBackground: #ffffff1f;
  --vscode-statusBarItem-activeBackground: #ffffff2e;
  --vscode-statusBar-debuggingBackground: #cc6633;
  --vscode-statusBar-noFolderBackground: #68217a;
  
  /* Input */
  --vscode-input-background: #3c3c3c;
  --vscode-input-foreground: #cccccc;
  --vscode-input-border: #00000000;
  --vscode-input-placeholderForeground: #a6a6a6;
  --vscode-inputOption-activeBackground: #007acc66;
  --vscode-inputOption-activeBorder: #007acc00;
  --vscode-inputOption-activeForeground: #ffffff;
  
  /* List */
  --vscode-list-activeSelectionBackground: #04395e;
  --vscode-list-activeSelectionForeground: #ffffff;
  --vscode-list-inactiveSelectionBackground: #37373d;
  --vscode-list-inactiveSelectionForeground: #cccccc;
  --vscode-list-hoverBackground: #2a2d2e;
  --vscode-list-hoverForeground: #cccccc;
  --vscode-list-focusOutline: #007fd4;
  
  /* Scrollbar */
  --vscode-scrollbarSlider-background: #79797966;
  --vscode-scrollbarSlider-hoverBackground: #646464b3;
  --vscode-scrollbarSlider-activeBackground: #bfbfbf66;
  
  /* Focus */
  --vscode-focusBorder: #007fd4;
  
  /* Buttons */
  --vscode-button-background: #0e639c;
  --vscode-button-foreground: #ffffff;
  --vscode-button-hoverBackground: #1177bb;
  --vscode-button-secondaryBackground: #3a3d41;
  --vscode-button-secondaryForeground: #ffffff;
  --vscode-button-secondaryHoverBackground: #45494e;
  
  /* Badges */
  --vscode-badge-background: #4d4d4d;
  --vscode-badge-foreground: #ffffff;
}
```

---

## Implementation Phases

### Phase 1: Core Layout + Title Bar (Week 1)

**Goal**: Exact VS Code grid layout with Title Bar and correct proportions

| Task | Component | Estimate | Priority |
|------|-----------|----------|----------|
| 1.0 | **Implement Title Bar** | 4h | **P0** |
| 1.0a | - Window controls (macOS) | 1h | P0 |
| 1.0b | - Platform logo + name | 1h | P0 |
| 1.0c | - Menu bar items | 1h | P0 |
| 1.0d | - Command Palette search input | 1h | P0 |
| 1.1 | Refactor IDEShell to exact VS Code grid | 4h | P0 |
| 1.2 | Implement proper Activity Bar (48px) | 3h | P0 |
| 1.3 | Implement Tab Bar component | 4h | P0 |
| 1.4 | Implement Panel with tabs | 4h | P0 |
| 1.5 | Implement Status Bar segments | 3h | P1 |
| 1.6 | CSS tokens from VS Code | 2h | P0 |

**Deliverable**: Screenshot-accurate shell with Title Bar, Activity Bar, and core layout

### Phase 2: Primary Sidebar (Week 2)

**Goal**: Full Explorer-style sidebar with sections

| Task | Component | Estimate |
|------|-----------|----------|
| 2.1 | Sidebar container with resize | 3h |
| 2.2 | Collapsible section headers | 2h |
| 2.3 | Open Editors section | 3h |
| 2.4 | File tree (chapters/documents) | 4h |
| 2.5 | Outline section (TOC) | 3h |
| 2.6 | Search panel | 4h |
| 2.7 | Characters panel | 4h |

**Deliverable**: Functional primary sidebar with fiction sections

### Phase 3: Editor Area (Week 3)

**Goal**: VS Code-like editor with gutter and minimap

| Task | Component | Estimate |
|------|-----------|----------|
| 3.1 | Line number gutter | 4h |
| 3.2 | Gutter decorations | 3h |
| 3.3 | Breadcrumbs | 2h |
| 3.4 | Minimap (optional) | 4h |
| 3.5 | Editor tabs integration | 3h |
| 3.6 | Editor group splitting | 4h |

**Deliverable**: Full editor area matching VS Code

### Phase 4: Secondary Sidebar - AI (Week 4)

**Goal**: VS Code Copilot Chat exact match

| Task | Component | Estimate |
|------|-----------|----------|
| 4.1 | Rework AICopilotPanel structure | 4h |
| 4.2 | Context chips UI | 2h |
| 4.3 | Message bubbles exact styling | 3h |
| 4.4 | Mode tabs (VS Code style) | 2h |
| 4.5 | Agent dropdown | 2h |
| 4.6 | Streaming indicator | 1h |

**Deliverable**: AI panel indistinguishable from VS Code Copilot

### Phase 5: Polish & Integration (Week 5)

**Goal**: Production-ready IDE

| Task | Component | Estimate |
|------|-----------|----------|
| 5.1 | Keyboard shortcuts | 3h |
| 5.2 | Context menus | 4h |
| 5.3 | Drag and drop | 3h |
| 5.4 | Panel persistence | 2h |
| 5.5 | Responsive behavior | 3h |
| 5.6 | Accessibility audit | 4h |
| 5.7 | Performance optimization | 3h |

**Deliverable**: Complete VS Code-like fiction IDE

---

## Migration Strategy

### File Structure Changes

```
src/components/IDE/
├── ActivityBar/
│   ├── ActivityBar.tsx          # Rework
│   ├── ActivityBarItem.tsx      # Rework
│   └── index.ts
├── Sidebar/
│   ├── PrimarySidebar.tsx       # NEW
│   ├── SecondarySidebar.tsx     # NEW
│   ├── SidebarSection.tsx       # NEW
│   ├── FileTree/
│   │   ├── FileTree.tsx         # NEW
│   │   ├── TreeNode.tsx         # NEW
│   │   └── index.ts
│   └── index.ts
├── TabBar/
│   ├── TabBar.tsx               # NEW
│   ├── Tab.tsx                  # NEW
│   ├── TabActions.tsx           # NEW
│   └── index.ts
├── Editor/
│   ├── EditorGroup.tsx          # NEW
│   ├── EditorGutter.tsx         # NEW
│   ├── EditorBreadcrumbs.tsx    # NEW
│   ├── EditorMinimap.tsx        # NEW
│   └── index.ts
├── Panel/
│   ├── Panel.tsx                # Rework
│   ├── PanelTabs.tsx            # NEW
│   ├── ProblemsPanel.tsx        # NEW
│   ├── OutputPanel.tsx          # NEW
│   └── index.ts
├── StatusBar/
│   ├── StatusBar.tsx            # Rework
│   ├── StatusBarItem.tsx        # NEW
│   └── index.ts
├── AICopilotPanel/
│   ├── AICopilotPanel.tsx       # Major rework
│   ├── ChatMessage.tsx          # Rework
│   ├── ContextChips.tsx         # NEW
│   └── index.ts
└── IDEShell.tsx                 # Rework
```

### Breaking Changes

| Current | New | Migration |
|---------|-----|-----------|
| `<BottomPanel>` | `<Panel>` | Rename + props change |
| `<ActivityBar items={...}>` | `<ActivityBar>` with context | Refactor |
| CSS in components | CSS variables only | Move to vscode-layout.css |

---

## Acceptance Criteria

### Visual Accuracy

- [ ] Activity Bar is exactly 48px wide
- [ ] Tab bar height is 35px
- [ ] Status bar height is 22px
- [ ] All colors match VS Code dark theme
- [ ] Font sizes match VS Code (13px base)
- [ ] Icons match VS Code Codicons or equivalent
- [ ] Spacing matches VS Code exactly

### Functional Parity

- [ ] Sidebar resizing works smoothly
- [ ] Panel resizing works smoothly
- [ ] Tabs can be reordered
- [ ] Tabs show dirty state
- [ ] Keyboard shortcuts work (Cmd+B, Cmd+J, etc.)
- [ ] Context menus appear on right-click
- [ ] Drag and drop works for files

### Fiction-Specific Features

- [ ] Character panel in sidebar
- [ ] Chapter outline in sidebar
- [ ] Word count in status bar
- [ ] AI suggestions in gutter
- [ ] Framework completion status
- [ ] AI Copilot panel functional

### Performance

- [ ] Initial render < 200ms
- [ ] Panel resize is 60fps
- [ ] No layout shift on load
- [ ] Memory usage < 200MB baseline

---

## Reference Files

### Images to Refer To

1. **`image-1767821174386.png`** - Primary VS Code reference showing:
   - Activity bar with badges
   - File explorer with tree
   - Tab bar with multiple files
   - Editor with CSS syntax highlighting
   - Terminal in bottom panel
   - Chat sidebar on right
   - Status bar with git info

### VS Code Source References

- [VS Code Workbench CSS](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/browser/media/style.css)
- [VS Code Chat CSS](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/chat/browser/media/chat.css)
- [VS Code Theme Tokens](https://code.visualstudio.com/api/references/theme-color)

---

## Appendix: Quick Reference

### VS Code Dimensions

| Element | Size |
|---------|------|
| Activity Bar width | 48px |
| Sidebar min width | 170px |
| Tab height | 35px |
| Status bar height | 22px |
| Panel min height | 100px |
| Breadcrumb height | 22px |
| Line number width | 5ch minimum |

### VS Code Z-Index Stack

| Element | Z-Index |
|---------|---------|
| Status bar | 10 |
| Activity bar | 20 |
| Sidebar | 30 |
| Panel | 40 |
| Dropdowns | 100 |
| Modals | 1000 |
| Notifications | 2000 |

---

*This specification should be treated as the source of truth for the IDE rework. Reference the attached image frequently during implementation.*
