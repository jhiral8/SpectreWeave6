import { ReactNode } from 'react';

export type CommandCategory = 'navigation' | 'editing' | 'ai' | 'file' | 'view' | 'other';

export interface Command {
  /** Unique identifier */
  id: string;
  /** Display title for the command */
  title: string;
  /** Category for grouping */
  category: CommandCategory;
  /** Keyboard shortcut (e.g., "Cmd+S") */
  shortcut?: string;
  /** Action to execute */
  action: () => void | Promise<void>;
  /** Optional icon element */
  icon?: ReactNode;
  /** Additional search keywords */
  keywords?: string[];
}

export interface CommandContext {
  activeTab?: string;
  selectedText?: string;
  cursorPosition?: number;
}
