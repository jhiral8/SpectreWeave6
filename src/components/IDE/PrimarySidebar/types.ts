'use client';

/**
 * Primary Sidebar Types
 * VS Code-style sidebar with collapsible sections
 */

export type SidebarViewId = 
  | 'explorer'    // File tree / chapters
  | 'search'      // Search & replace
  | 'characters'  // Character profiles
  | 'aiAgents'    // AI agents panel
  | 'framework'   // Novel framework
  | 'outline';    // Table of contents

export interface SidebarView {
  id: SidebarViewId;
  label: string;
  icon: string;
  badge?: number;
}

export interface SidebarSectionProps {
  /** Section title (displayed uppercase) */
  title: string;
  /** Whether section is collapsed */
  isCollapsed: boolean;
  /** Toggle collapse state */
  onToggle: () => void;
  /** Section content */
  children: React.ReactNode;
  /** Action buttons in header */
  actions?: SidebarAction[];
  /** Optional badge count */
  badge?: number;
}

export interface SidebarAction {
  id: string;
  icon: string;
  label: string;
  onClick: () => void;
}

export interface TreeNode {
  id: string;
  label: string;
  type: 'file' | 'folder' | 'chapter' | 'scene';
  icon?: string;
  children?: TreeNode[];
  isExpanded?: boolean;
  isModified?: boolean;
  isActive?: boolean;
  depth: number;
}

export interface OpenEditor {
  id: string;
  title: string;
  path: string;
  isModified: boolean;
  isActive: boolean;
  icon?: string;
}

export interface OutlineItem {
  id: string;
  label: string;
  level: number; // h1=1, h2=2, h3=3
  position: number; // document position for scrolling
}

export interface SearchResult {
  fileId: string;
  fileName: string;
  matches: SearchMatch[];
}

export interface SearchMatch {
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

export interface PrimarySidebarProps {
  /** Current active view */
  activeView: SidebarViewId;
  /** Callback when view changes (from ActivityBar) */
  onViewChange?: (view: SidebarViewId) => void;
  /** Current width (controlled by resize) */
  width?: number;
  /** Minimum width constraint */
  minWidth?: number;
  /** Maximum width constraint */
  maxWidth?: number;
  /** Whether sidebar is visible */
  isVisible?: boolean;
  /** Open editors list */
  openEditors?: OpenEditor[];
  /** File tree nodes */
  fileTree?: TreeNode[];
  /** Outline items from current document */
  outlineItems?: OutlineItem[];
  /** Callbacks */
  onFileSelect?: (fileId: string) => void;
  onEditorClose?: (editorId: string) => void;
  onOutlineClick?: (position: number) => void;
  onSearch?: (query: string, options: SearchOptions) => void;
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

/** Default sidebar views configuration */
export const DEFAULT_SIDEBAR_VIEWS: SidebarView[] = [
  { id: 'explorer', label: 'Explorer', icon: 'Files' },
  { id: 'search', label: 'Search', icon: 'Search' },
  { id: 'characters', label: 'Characters', icon: 'Users' },
  { id: 'aiAgents', label: 'AI Agents', icon: 'Bot' },
  { id: 'framework', label: 'Framework', icon: 'BookOpen' },
  { id: 'outline', label: 'Outline', icon: 'List' },
];
