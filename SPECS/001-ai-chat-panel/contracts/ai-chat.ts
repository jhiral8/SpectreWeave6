/**
 * AI Chat Panel Component Contracts
 * 
 * TypeScript interfaces for all components in the AIChatPanel feature.
 * These contracts define the public API for each component.
 */

import type { LucideIcon } from 'lucide-react';

// =============================================================================
// Core Types (from data-model.md)
// =============================================================================

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  context?: ChatContext;
  isGenerating?: boolean;
  isError?: boolean;
  originalPrompt?: string;
}

export interface ChatContext {
  chapter?: string;
  scene?: string;
  characters: string[];
  selectedText?: string;
  wordCount?: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  requiresSelection?: boolean;
}

// =============================================================================
// Component Props
// =============================================================================

/**
 * Main AI Chat Panel component
 */
export interface AIChatPanelProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Panel header with title and action buttons
 */
export interface ChatHeaderProps {
  /** Whether AI is currently generating */
  isGenerating: boolean;
  /** Handler for clear button */
  onClear: () => void;
  /** Handler for settings button */
  onSettings?: () => void;
}

/**
 * Context bar showing current editor context
 */
export interface ContextBarProps {
  /** Current context to display */
  context: ChatContext;
  /** Whether to show in compact mode */
  compact?: boolean;
}

/**
 * Scrollable list of messages
 */
export interface MessageListProps {
  /** Messages to display */
  messages: ChatMessage[];
  /** Handler for insert action */
  onInsert: (content: string) => void;
  /** Handler for copy action */
  onCopy: (content: string) => void;
  /** Handler for regenerate action */
  onRegenerate: (messageId: string) => void;
  /** Ref for scroll container */
  scrollRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Individual message bubble
 */
export interface MessageBubbleProps {
  /** Message to display */
  message: ChatMessage;
  /** Handler for insert action */
  onInsert: (content: string) => void;
  /** Handler for copy action */
  onCopy: (content: string) => void;
  /** Handler for regenerate action */
  onRegenerate: (messageId: string) => void;
}

/**
 * Action buttons for AI messages (Insert, Copy, Regenerate)
 */
export interface MessageActionsProps {
  /** Message content for copy/insert */
  content: string;
  /** Message ID for regenerate */
  messageId: string;
  /** Handler for insert action */
  onInsert: (content: string) => void;
  /** Handler for copy action */
  onCopy: (content: string) => void;
  /** Handler for regenerate action */
  onRegenerate: (messageId: string) => void;
  /** Whether to show actions (hidden during generation) */
  visible?: boolean;
}

/**
 * Quick action buttons bar
 */
export interface QuickActionsProps {
  /** Available actions */
  actions: QuickAction[];
  /** Handler when action is triggered */
  onAction: (action: QuickAction) => void;
  /** Whether actions are disabled */
  disabled?: boolean;
  /** Current selection for context-aware actions */
  hasSelection?: boolean;
}

/**
 * Chat input textarea with send button
 */
export interface ChatInputProps {
  /** Current input value */
  value: string;
  /** Handler for value changes */
  onChange: (value: string) => void;
  /** Handler for send action */
  onSend: () => void;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Welcome state shown when chat is empty
 */
export interface WelcomeStateProps {
  /** Handler for quick action from welcome */
  onQuickAction: (action: QuickAction) => void;
  /** Starter actions to show */
  starterActions?: QuickAction[];
}

// =============================================================================
// Hook Contracts
// =============================================================================

/**
 * Return type for useChatHistory hook
 */
export interface UseChatHistoryReturn {
  /** Current messages */
  messages: ChatMessage[];
  /** Add a new message */
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  /** Update an existing message */
  updateMessage: (id: string, update: Partial<ChatMessage>) => void;
  /** Remove a message */
  removeMessage: (id: string) => void;
  /** Clear all messages */
  clearHistory: () => void;
  /** Get message by ID */
  getMessage: (id: string) => ChatMessage | undefined;
}

/**
 * Options for useAIChat hook
 */
export interface UseAIChatOptions {
  /** Error handler */
  onError?: (error: Error) => void;
  /** Success handler */
  onComplete?: (response: string) => void;
  /** Chat history instance */
  chatHistory: UseChatHistoryReturn;
}

/**
 * Return type for useAIChat hook
 */
export interface UseAIChatReturn {
  /** Send a message and get AI response */
  sendMessage: (content: string, context?: ChatContext) => Promise<void>;
  /** Regenerate a specific message */
  regenerate: (messageId: string) => Promise<void>;
  /** Whether currently generating */
  isGenerating: boolean;
  /** Cancel current generation */
  cancel: () => void;
}

/**
 * Options for useEditorContext hook
 */
export interface UseEditorContextOptions {
  /** Debounce delay in ms */
  debounceMs?: number;
  /** TipTap editor instance */
  editor?: unknown; // Editor type from @tiptap/react
}

/**
 * Return type for useEditorContext hook
 */
export interface UseEditorContextReturn {
  /** Current editor context */
  context: ChatContext;
  /** Force update context */
  updateContext: () => void;
  /** Whether editor is available */
  hasEditor: boolean;
}

// =============================================================================
// Event Handlers
// =============================================================================

export type OnInsertHandler = (content: string) => void;
export type OnCopyHandler = (content: string) => void;
export type OnRegenerateHandler = (messageId: string) => void;
export type OnQuickActionHandler = (action: QuickAction) => void;
export type OnSendHandler = () => void;
export type OnClearHandler = () => void;
