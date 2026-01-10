import { ReactNode } from 'react';

/**
 * Tab interface for editor tabs
 */
export interface Tab {
  /** Unique identifier */
  id: string;
  /** Tab title (filename) */
  title: string;
  /** File path for tooltip */
  path?: string;
  /** File icon */
  icon?: ReactNode;
  /** Whether the tab has unsaved changes */
  isDirty?: boolean;
  /** Whether the tab is pinned */
  isPinned?: boolean;
  /** Whether the tab is a preview (italic) */
  isPreview?: boolean;
  /** File type/extension for icon */
  fileType?: string;
}

/**
 * TabBar Props
 */
export interface TabBarProps {
  /** Array of tabs to display */
  tabs: Tab[];
  /** ID of the currently active tab */
  activeTabId: string | null;
  /** Callback when a tab is clicked */
  onTabClick: (tabId: string) => void;
  /** Callback when a tab close button is clicked */
  onTabClose: (tabId: string) => void;
  /** Callback when tabs are reordered via drag */
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
  /** Callback when a tab is double-clicked (e.g., to pin) */
  onTabDoubleClick?: (tabId: string) => void;
  /** Additional class names */
  className?: string;
}

/**
 * Single Tab Props
 */
export interface TabProps {
  /** Tab data */
  tab: Tab;
  /** Whether this tab is active */
  isActive: boolean;
  /** Callback when clicked */
  onClick: () => void;
  /** Callback when close button clicked */
  onClose: () => void;
  /** Callback when double-clicked */
  onDoubleClick?: () => void;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Additional class names */
  className?: string;
}
