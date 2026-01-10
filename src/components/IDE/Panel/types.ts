import { ReactNode } from 'react';

/**
 * Panel tab configuration
 */
export interface PanelTab {
  /** Unique identifier */
  id: string;
  /** Tab label */
  label: string;
  /** Badge count */
  badge?: number;
  /** Badge color */
  badgeColor?: 'error' | 'warning' | 'info';
  /** Icon */
  icon?: ReactNode;
}

/**
 * Panel Props
 */
export interface PanelProps {
  /** Array of panel tabs */
  tabs: PanelTab[];
  /** ID of the currently active tab */
  activeTabId: string;
  /** Callback when a tab is clicked */
  onTabClick: (tabId: string) => void;
  /** Callback when panel is closed */
  onClose?: () => void;
  /** Callback when panel is maximized */
  onMaximize?: () => void;
  /** Whether the panel is maximized */
  isMaximized?: boolean;
  /** Panel content (keyed by tab id) */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * PanelTabs Props
 */
export interface PanelTabsProps {
  /** Array of tabs */
  tabs: PanelTab[];
  /** Active tab ID */
  activeTabId: string;
  /** Callback when tab clicked */
  onTabClick: (tabId: string) => void;
  /** Callback to close panel */
  onClose?: () => void;
  /** Callback to maximize panel */
  onMaximize?: () => void;
  /** Whether maximized */
  isMaximized?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Default panel tabs for fiction writing
 */
export const DEFAULT_PANEL_TABS: PanelTab[] = [
  { id: 'problems', label: 'PROBLEMS', badge: 0 },
  { id: 'output', label: 'OUTPUT' },
  { id: 'terminal', label: 'TERMINAL' },
];
