/**
 * AI Chat Panel Type Definitions
 *
 * Core types for the Ghost Writer chat panel feature.
 * Based on specs/001-ai-chat-panel/data-model.md
 */

import type { LucideIcon } from 'lucide-react';

// =============================================================================
// Core Types
// =============================================================================

/**
 * Role of a message in the chat
 */
export type MessageRole = 'user' | 'assistant';

/**
 * A single message in the chat history
 */
export interface ChatMessage {
  /** Unique identifier */
  id: string;
  /** Message author role */
  role: MessageRole;
  /** Message content (may include markdown) */
  content: string;
  /** When the message was created */
  timestamp: Date;
  /** Editor context when message was sent (for user messages) */
  context?: ChatContext;
  /** Whether AI is still generating this message */
  isGenerating?: boolean;
  /** Whether this message represents an error */
  isError?: boolean;
  /** Original prompt (for regeneration) */
  originalPrompt?: string;
}

/**
 * Current editor context
 */
export interface ChatContext {
  /** Current chapter name/number */
  chapter?: string;
  /** Current scene identifier */
  scene?: string;
  /** Detected character names in current section */
  characters: string[];
  /** Currently selected text in editor */
  selectedText?: string;
  /** Word count of current document */
  wordCount?: number;
}

/**
 * Quick action button configuration
 */
export interface QuickAction {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Lucide icon name */
  icon: LucideIcon;
  /** Prompt template to send */
  prompt: string;
  /** Whether this action requires selection */
  requiresSelection?: boolean;
}

/**
 * Chat panel state
 */
export interface ChatPanelState {
  /** All messages in current session */
  messages: ChatMessage[];
  /** Current editor context */
  context: ChatContext;
  /** Whether AI is generating a response */
  isGenerating: boolean;
  /** Current input value */
  inputValue: string;
}

// =============================================================================
// Hook Return Types
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
// Component Props
// =============================================================================

/**
 * Main AI Chat Panel component props
 */
export interface AIChatPanelProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Panel header props
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
 * Context bar props
 */
export interface ContextBarProps {
  /** Current context to display */
  context: ChatContext;
  /** Whether to show in compact mode */
  compact?: boolean;
}

/**
 * Message list props
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
}

/**
 * Message bubble props
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
 * Message actions props
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
 * Quick actions bar props
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
 * Chat input props
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
 * Welcome state props
 */
export interface WelcomeStateProps {
  /** Handler for quick action from welcome */
  onQuickAction: (action: QuickAction) => void;
  /** Starter actions to show */
  starterActions?: QuickAction[];
}
