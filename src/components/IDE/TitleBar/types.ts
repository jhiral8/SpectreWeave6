import { ReactNode } from 'react';

/**
 * TitleBar Props
 * The main title bar component at the top of the IDE
 */
export interface TitleBarProps {
  /** Platform name displayed in the title bar */
  platformName?: string;
  /** Optional logo icon */
  platformLogo?: ReactNode;
  /** Menu bar items */
  menuItems?: MenuBarItem[];
  /** Whether to show the command palette search */
  showCommandPalette?: boolean;
  /** Keyboard shortcut hint for command palette */
  commandPaletteShortcut?: string;
  /** Callback when command palette is opened */
  onCommandPaletteOpen?: () => void;
  /** Whether to show window controls (macOS traffic lights) */
  showWindowControls?: boolean;
  /** User information for account dropdown */
  userInfo?: UserInfo;
  /** Callback when user account is clicked */
  onUserClick?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * User information for the account dropdown
 */
export interface UserInfo {
  name: string;
  email?: string;
  avatar?: string;
}

/**
 * Menu bar item configuration
 */
export interface MenuBarItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Keyboard shortcut (e.g., "⌘S") */
  shortcut?: string;
  /** Submenu items */
  submenu?: MenuBarItem[];
  /** Action callback */
  action?: () => void;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Divider after this item */
  dividerAfter?: boolean;
  /** Icon to display */
  icon?: ReactNode;
}

/**
 * MenuBar Props
 */
export interface MenuBarProps {
  /** Menu items to display */
  items: MenuBarItem[];
  /** Callback when a menu item is clicked */
  onItemClick?: (item: MenuBarItem) => void;
  /** Additional class names */
  className?: string;
}

/**
 * MenuBarItem Props (individual menu button)
 */
export interface MenuBarItemProps {
  /** Menu item configuration */
  item: MenuBarItem;
  /** Whether this menu is currently open */
  isOpen?: boolean;
  /** Callback when clicked */
  onClick?: () => void;
  /** Callback when submenu item is clicked */
  onSubmenuClick?: (item: MenuBarItem) => void;
  /** Additional class names */
  className?: string;
}

/**
 * CommandPaletteSearch Props
 */
export interface CommandPaletteSearchProps {
  /** Placeholder text */
  placeholder?: string;
  /** Keyboard shortcut hint */
  shortcut?: string;
  /** Callback when search is clicked/focused */
  onOpen?: () => void;
  /** Whether the search is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * WindowControls Props (macOS traffic lights)
 */
export interface WindowControlsProps {
  /** Callback when close is clicked */
  onClose?: () => void;
  /** Callback when minimize is clicked */
  onMinimize?: () => void;
  /** Callback when maximize is clicked */
  onMaximize?: () => void;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Default menu items for fiction writing
 */
export const DEFAULT_MENU_ITEMS: MenuBarItem[] = [
  {
    id: 'file',
    label: 'File',
    submenu: [
      { id: 'new-chapter', label: 'New Chapter', shortcut: '⌘N' },
      { id: 'new-scene', label: 'New Scene', shortcut: '⇧⌘N' },
      { id: 'divider-1', label: '', dividerAfter: true },
      { id: 'open-project', label: 'Open Project...', shortcut: '⌘O' },
      { id: 'open-recent', label: 'Open Recent', submenu: [] },
      { id: 'divider-2', label: '', dividerAfter: true },
      { id: 'save', label: 'Save', shortcut: '⌘S' },
      { id: 'save-all', label: 'Save All', shortcut: '⌥⌘S' },
      { id: 'divider-3', label: '', dividerAfter: true },
      { id: 'export', label: 'Export...', shortcut: '⇧⌘E' },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    submenu: [
      { id: 'undo', label: 'Undo', shortcut: '⌘Z' },
      { id: 'redo', label: 'Redo', shortcut: '⇧⌘Z' },
      { id: 'divider-1', label: '', dividerAfter: true },
      { id: 'cut', label: 'Cut', shortcut: '⌘X' },
      { id: 'copy', label: 'Copy', shortcut: '⌘C' },
      { id: 'paste', label: 'Paste', shortcut: '⌘V' },
      { id: 'divider-2', label: '', dividerAfter: true },
      { id: 'find', label: 'Find', shortcut: '⌘F' },
      { id: 'replace', label: 'Replace', shortcut: '⌥⌘F' },
      { id: 'divider-3', label: '', dividerAfter: true },
      { id: 'ai-suggestions', label: 'AI Suggestions', shortcut: '⌘I' },
    ],
  },
  {
    id: 'view',
    label: 'View',
    submenu: [
      { id: 'command-palette', label: 'Command Palette...', shortcut: '⌘K' },
      { id: 'divider-1', label: '', dividerAfter: true },
      { id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: '⌘B' },
      { id: 'toggle-panel', label: 'Toggle Panel', shortcut: '⌘J' },
      { id: 'toggle-ai-panel', label: 'Toggle AI Panel', shortcut: '⌘\\' },
      { id: 'divider-2', label: '', dividerAfter: true },
      { id: 'toggle-minimap', label: 'Toggle Minimap' },
      { id: 'toggle-breadcrumbs', label: 'Toggle Breadcrumbs' },
      { id: 'divider-3', label: '', dividerAfter: true },
      { id: 'zoom-in', label: 'Zoom In', shortcut: '⌘+' },
      { id: 'zoom-out', label: 'Zoom Out', shortcut: '⌘-' },
    ],
  },
  {
    id: 'characters',
    label: 'Characters',
    submenu: [
      { id: 'character-browser', label: 'Character Browser', shortcut: '⇧⌘C' },
      { id: 'new-character', label: 'New Character...' },
      { id: 'divider-1', label: '', dividerAfter: true },
      { id: 'insert-character', label: 'Insert Character Reference' },
      { id: 'character-relationships', label: 'Relationships Map' },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    submenu: [
      { id: 'generate-suggestions', label: 'Generate Suggestions', shortcut: '⌘I' },
      { id: 'style-analysis', label: 'Style Analysis' },
      { id: 'divider-1', label: '', dividerAfter: true },
      { id: 'continue-writing', label: 'Continue Writing...', shortcut: '⌃⌘I' },
      { id: 'expand-scene', label: 'Expand Scene' },
      { id: 'divider-2', label: '', dividerAfter: true },
      { id: 'ai-settings', label: 'AI Settings...' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    submenu: [
      { id: 'documentation', label: 'Documentation', shortcut: 'F1' },
      { id: 'keyboard-shortcuts', label: 'Keyboard Shortcuts', shortcut: '⌘K ⌘S' },
      { id: 'divider-1', label: '', dividerAfter: true },
      { id: 'release-notes', label: 'Release Notes' },
      { id: 'report-issue', label: 'Report Issue' },
      { id: 'divider-2', label: '', dividerAfter: true },
      { id: 'about', label: 'About SpectreWeave' },
    ],
  },
];
