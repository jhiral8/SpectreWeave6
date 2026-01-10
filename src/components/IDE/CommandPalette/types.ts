/**
 * Command Types for Command Palette
 * 
 * Defines the structure for commands that can be executed
 * through the command palette or keyboard shortcuts.
 */

import type { AgentId } from '../AIAgents/types';

export type CommandCategory = 
  | 'ai'
  | 'editor'
  | 'navigation'
  | 'character'
  | 'view'
  | 'file'
  | 'agent';

export interface Command {
  /** Unique identifier for the command */
  id: string;
  /** Display label shown in the palette */
  label: string;
  /** Category for grouping */
  category: CommandCategory;
  /** Icon (emoji or Lucide icon name) */
  icon?: string;
  /** Keyboard shortcut hint (display only) */
  shortcut?: string;
  /** Alternative search terms */
  keywords?: string[];
  /** Execute the command */
  execute: (context: CommandContext) => void | Promise<void>;
  /** Check if command is enabled in current context */
  isEnabled?: (context: CommandContext) => boolean;
  /** Check if command should be visible in current context */
  isVisible?: (context: CommandContext) => boolean;
  /** Description shown in tooltip */
  description?: string;
}

export interface CommandContext {
  /** Selection text from active editor */
  selection: string;
  /** Cursor position in active editor */
  cursorPosition: number;
  /** Text before cursor (for context) */
  previousText: string;
  /** Text after cursor */
  followingText: string;
  /** Current chapter name if available */
  currentChapter: string | null;
  /** Current scene name if available */
  currentScene: string | null;
  /** Word count of selection */
  selectionWordCount: number;
  /** Run an AI agent */
  runAgent: (agentId: AgentId, content?: string) => Promise<void>;
  /** Insert text at cursor */
  insertText: (text: string) => void;
  /** Replace selection with text */
  replaceSelection: (text: string) => void;
  /** Navigate to a chapter/scene */
  navigateTo: (id: string) => void;
  /** Toggle a panel */
  togglePanel: (panel: string) => void;
  /** Close the command palette */
  closePalette: () => void;
}

export interface CommandGroup {
  category: CommandCategory;
  label: string;
  commands: Command[];
}

export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  ai: 'AI Actions',
  agent: 'AI Agents',
  editor: 'Editor',
  navigation: 'Navigation',
  character: 'Characters',
  view: 'View',
  file: 'File',
};

export const CATEGORY_ICONS: Record<CommandCategory, string> = {
  ai: '🤖',
  agent: '✨',
  editor: '📝',
  navigation: '📍',
  character: '👤',
  view: '👁️',
  file: '📄',
};
