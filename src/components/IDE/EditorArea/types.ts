'use client';

/**
 * Editor Area Types
 * VS Code-style editor components
 */

export interface BreadcrumbItem {
  id: string;
  label: string;
  type: 'project' | 'folder' | 'chapter' | 'scene' | 'heading';
  icon?: string;
  path?: string;
}

export interface LineInfo {
  number: number;
  content: string;
  isFolded?: boolean;
  foldable?: boolean;
  foldLevel?: number;
  hasBookmark?: boolean;
  hasBreakpoint?: boolean;
  isCurrentLine?: boolean;
  isSelected?: boolean;
  hasError?: boolean;
  hasWarning?: boolean;
}

export interface EditorGutterProps {
  /** Line information for rendering */
  lines: LineInfo[];
  /** Current cursor line (1-indexed) */
  currentLine: number;
  /** First visible line (for virtual scrolling) */
  startLine?: number;
  /** Line height in pixels */
  lineHeight?: number;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Show fold indicators */
  showFolding?: boolean;
  /** Callback when line is clicked */
  onLineClick?: (lineNumber: number) => void;
  /** Callback when fold is toggled */
  onFoldToggle?: (lineNumber: number) => void;
  /** Callback when bookmark is toggled */
  onBookmarkToggle?: (lineNumber: number) => void;
}

export interface LineNumbersProps {
  /** Total line count */
  lineCount: number;
  /** Current cursor line (1-indexed) */
  currentLine: number;
  /** First visible line (for virtual scrolling) */
  startLine?: number;
  /** Number of visible lines */
  visibleLines?: number;
  /** Line height in pixels */
  lineHeight?: number;
  /** Callback when line number is clicked */
  onLineClick?: (lineNumber: number) => void;
}

export interface EditorBreadcrumbsProps {
  /** Breadcrumb path items */
  items: BreadcrumbItem[];
  /** Callback when breadcrumb is clicked */
  onItemClick?: (item: BreadcrumbItem) => void;
  /** Show icons */
  showIcons?: boolean;
}

export interface EditorMinimapProps {
  /** Editor content (HTML or plain text) */
  content: string;
  /** Total line count */
  lineCount: number;
  /** First visible line */
  viewportStart: number;
  /** Number of visible lines in viewport */
  viewportSize: number;
  /** Minimap width in pixels */
  width?: number;
  /** Whether minimap is visible */
  isVisible?: boolean;
  /** Callback when minimap is clicked */
  onViewportChange?: (startLine: number) => void;
  /** Highlights (search results, errors, etc.) */
  highlights?: MinimapHighlight[];
}

export interface MinimapHighlight {
  line: number;
  type: 'search' | 'error' | 'warning' | 'selection' | 'change';
}

export interface EditorAreaProps {
  /** Editor content */
  children: React.ReactNode;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Line count for gutter */
  lineCount?: number;
  /** Current cursor line */
  currentLine?: number;
  /** First visible line */
  viewportStart?: number;
  /** Visible line count */
  viewportSize?: number;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Show minimap */
  showMinimap?: boolean;
  /** Show breadcrumbs */
  showBreadcrumbs?: boolean;
  /** Editor content for minimap */
  contentForMinimap?: string;
  /** Callbacks */
  onBreadcrumbClick?: (item: BreadcrumbItem) => void;
  onLineClick?: (lineNumber: number) => void;
  onMinimapClick?: (startLine: number) => void;
}

/** Default line height matching VS Code */
export const DEFAULT_LINE_HEIGHT = 20;

/** Default minimap width */
export const DEFAULT_MINIMAP_WIDTH = 80;
