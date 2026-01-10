# Data Model: VS Code UX Transformation

**Feature**: `002-vscode-ux-transformation`  
**Created**: 2026-01-10

---

## Panel System Types

### Core Panel Types

```typescript
// src/components/IDE/PanelSystem/types.ts

/**
 * Panel positions in the IDE layout
 */
export type PanelPosition = 'left' | 'right' | 'bottom';

/**
 * Unique identifiers for all panels
 */
export type PanelId = 
  | 'story-explorer' 
  | 'characters' 
  | 'world' 
  | 'search' 
  | 'ai-chat' 
  | 'ai-feedback' 
  | 'ai-output'
  | 'story-analysis'
  | 'history'
  | 'settings';

/**
 * Configuration for a panel type
 */
export interface PanelConfig {
  id: PanelId;
  position: PanelPosition;
  label: string;
  icon: string;
  component: React.ComponentType<PanelProps>;
  defaultVisible: boolean;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  canClose: boolean;
  canMove: boolean;
  activityBarIcon?: string;
  keyboardShortcut?: string;
}

/**
 * Runtime state of a single panel
 */
export interface PanelState {
  id: PanelId;
  isVisible: boolean;
  size: number;
  isMaximized: boolean;
  isPinned: boolean;
}

/**
 * Props passed to panel components
 */
export interface PanelProps {
  className?: string;
}

/**
 * Complete layout state for persistence
 */
export interface PanelLayoutState {
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

## Story Explorer Types

### Story Node Model

```typescript
// src/components/IDE/StoryExplorer/types.ts

/**
 * Types of nodes in the story tree
 */
export type StoryNodeType = 
  | 'manuscript'
  | 'part'
  | 'chapter'
  | 'scene'
  | 'beat'
  | 'character'
  | 'character-group'
  | 'location'
  | 'location-group'
  | 'timeline'
  | 'event'
  | 'note'
  | 'note-folder'
  | 'research'
  | 'style-guide';

/**
 * AI analysis status for a node
 */
export type AINodeStatus = 'idle' | 'analyzing' | 'has-issues' | 'approved';

/**
 * A single node in the story tree
 */
export interface StoryNode {
  id: string;
  type: StoryNodeType;
  label: string;
  icon?: string;
  children?: StoryNode[];
  isExpanded?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
  metadata: StoryNodeMetadata;
  linkedNodes?: string[];
  aiSuggestions?: AISuggestion[];
  aiStatus?: AINodeStatus;
}

/**
 * Metadata attached to story nodes
 */
export interface StoryNodeMetadata {
  // Common
  createdAt: Date;
  updatedAt: Date;
  
  // Manuscript/Chapter/Scene specific
  wordCount?: number;
  targetWordCount?: number;
  status?: 'draft' | 'in-progress' | 'review' | 'complete';
  position?: number;
  
  // Character specific
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  firstAppearance?: string;
  appearances?: string[];
  traits?: string[];
  
  // Location specific
  locationType?: 'interior' | 'exterior' | 'abstract';
  scenesSet?: string[];
  
  // Timeline/Event specific
  timelinePosition?: number;
  date?: string;
  involvedCharacters?: string[];
  
  // Note specific
  noteType?: 'idea' | 'research' | 'todo' | 'reference';
  tags?: string[];
}

/**
 * AI suggestion attached to a node
 */
export interface AISuggestion {
  id: string;
  type: 'consistency' | 'development' | 'pacing' | 'style';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
}
```

---

## Editor Types

### Tab Model

```typescript
// src/components/IDE/EditorArea/types.ts

/**
 * Types of content that can be opened in tabs
 */
export type TabType = 
  | 'chapter' 
  | 'scene' 
  | 'character' 
  | 'location' 
  | 'note' 
  | 'framework'
  | 'settings';

/**
 * A single editor tab
 */
export interface EditorTab {
  id: string;
  type: TabType;
  label: string;
  icon?: string;
  isDirty: boolean;
  isPinned: boolean;
  metadata?: TabMetadata;
}

/**
 * Additional metadata for navigation
 */
export interface TabMetadata {
  documentId?: string;
  chapterId?: string;
  sceneId?: string;
  scrollPosition?: number;
  cursorPosition?: number;
}

/**
 * Breadcrumb path item
 */
export interface BreadcrumbItem {
  id: string;
  label: string;
  type: 'manuscript' | 'chapter' | 'scene' | 'paragraph';
  icon?: string;
  position?: number;
  children?: BreadcrumbItem[];
}
```

---

## Bottom Panel Types

### Writing Problems

```typescript
// src/components/IDE/BottomPanel/types.ts

/**
 * Severity levels matching VS Code Problems
 */
export type ProblemSeverity = 'error' | 'warning' | 'info' | 'hint';

/**
 * Categories of writing problems
 */
export type ProblemCategory = 
  | 'grammar'
  | 'style'
  | 'consistency'
  | 'pacing'
  | 'pov'
  | 'character'
  | 'plot';

/**
 * A detected writing problem
 */
export interface WritingProblem {
  id: string;
  severity: ProblemSeverity;
  category: ProblemCategory;
  message: string;
  location: ProblemLocation;
  suggestion?: string;
  quickFix?: QuickFix;
}

/**
 * Location of a problem in the document
 */
export interface ProblemLocation {
  chapterId?: string;
  chapterName?: string;
  line: number;
  column?: number;
  length?: number;
  editorPosition?: number;
}

/**
 * Quick fix action for a problem
 */
export interface QuickFix {
  label: string;
  action: () => void | Promise<void>;
}

/**
 * AI output log entry
 */
export interface AIOutputEntry {
  id: string;
  timestamp: Date;
  type: 'request' | 'response' | 'error' | 'info';
  content: string;
  metadata?: Record<string, unknown>;
}
```

---

## Command Palette Types

### Command Model

```typescript
// src/components/IDE/CommandPalette/types.ts

/**
 * Command categories for organization
 */
export type CommandCategory = 
  | 'Navigation'
  | 'AI Agents'
  | 'View'
  | 'Edit'
  | 'File'
  | 'Debug';

/**
 * A registered command
 */
export interface Command {
  id: string;
  label: string;
  category: CommandCategory;
  description?: string;
  shortcut?: string;
  icon?: string;
  execute: () => void | Promise<void>;
  isEnabled?: () => boolean;
  isVisible?: () => boolean;
}

/**
 * Search result for command palette
 */
export interface CommandSearchResult {
  command: Command;
  score: number;
  matchedChars: number[];
}

/**
 * Keyboard shortcut binding
 */
export interface KeyBinding {
  key: string;
  modifiers: {
    meta?: boolean;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
  };
  commandId: string;
  when?: string;
}
```

---

## Theme Types

### Theme Configuration

```typescript
// src/components/IDE/Theme/types.ts

/**
 * Available theme identifiers
 */
export type ThemeId = 
  | 'spectre-dark'
  | 'spectre-light'
  | 'midnight-writer'
  | 'parchment'
  | 'focus-mode';

/**
 * Theme mode (for system preference)
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Theme definition
 */
export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
}

/**
 * All color tokens for a theme
 */
export interface ThemeColors {
  // Core
  background: string;
  foreground: string;
  border: string;
  
  // Activity Bar
  activityBarBg: string;
  activityBarFg: string;
  activityBarInactive: string;
  activityBarBadge: string;
  
  // Sidebar
  sidebarBg: string;
  sidebarFg: string;
  sidebarHeader: string;
  
  // Editor
  editorBg: string;
  editorFg: string;
  editorSelection: string;
  editorCursor: string;
  
  // Status Bar
  statusBarBg: string;
  statusBarFg: string;
  
  // Writing Surface
  writingBg: string;
  writingFg: string;
  writingHeading: string;
  writingDialogue: string;
  
  // Semantic
  error: string;
  warning: string;
  info: string;
  success: string;
  
  // AI
  aiAccent: string;
  ghostText: string;
}
```

---

## Status Bar Types

```typescript
// src/components/IDE/StatusBar/types.ts

/**
 * Position of status bar item
 */
export type StatusBarAlignment = 'left' | 'right';

/**
 * A status bar item configuration
 */
export interface StatusBarItem {
  id: string;
  alignment: StatusBarAlignment;
  priority: number;
  label: string;
  icon?: string;
  tooltip?: string;
  onClick?: () => void;
  isVisible?: () => boolean;
}

/**
 * AI status states
 */
export type AIStatusState = 
  | 'idle'
  | 'analyzing'
  | 'generating'
  | 'error';

/**
 * Sync status states
 */
export type SyncStatusState = 
  | 'synced'
  | 'syncing'
  | 'offline'
  | 'error';
```

---

## Persistence Schema

### LocalStorage Keys

```typescript
// Storage key constants
export const STORAGE_KEYS = {
  PANEL_LAYOUT: 'spectreweave:panel-layout',
  THEME: 'spectreweave:theme',
  RECENT_COMMANDS: 'spectreweave:recent-commands',
  OPEN_TABS: 'spectreweave:open-tabs',
  ACTIVE_TAB: 'spectreweave:active-tab',
  EXPANDED_NODES: 'spectreweave:expanded-nodes',
} as const;
```

### Persisted Panel Layout

```typescript
// Schema for PANEL_LAYOUT storage
interface PersistedPanelLayout {
  version: 1;
  timestamp: number;
  layout: PanelLayoutState;
}
```

### Persisted Theme

```typescript
// Schema for THEME storage
interface PersistedTheme {
  version: 1;
  themeId: ThemeId;
  useSystemPreference: boolean;
}
```

---

## Type Guards

```typescript
// src/components/IDE/types/guards.ts

export function isStoryNode(obj: unknown): obj is StoryNode {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'type' in obj &&
    'label' in obj
  );
}

export function isWritingProblem(obj: unknown): obj is WritingProblem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'severity' in obj &&
    'message' in obj &&
    'location' in obj
  );
}

export function isCommand(obj: unknown): obj is Command {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'label' in obj &&
    'execute' in obj &&
    typeof (obj as Command).execute === 'function'
  );
}
```
