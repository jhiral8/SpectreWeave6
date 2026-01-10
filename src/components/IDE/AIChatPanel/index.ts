/**
 * AI Chat Panel Public Exports
 *
 * Barrel file for the Ghost Writer AI Chat Panel feature.
 */

// Main component
export { AIChatPanel } from './AIChatPanel';

// Types
export type {
  MessageRole,
  ChatMessage,
  ChatContext,
  QuickAction,
  ChatPanelState,
  UseChatHistoryReturn,
  UseAIChatOptions,
  UseAIChatReturn,
  UseEditorContextOptions,
  UseEditorContextReturn,
  AIChatPanelProps,
  ChatHeaderProps,
  ContextBarProps,
  MessageListProps,
  MessageBubbleProps,
  MessageActionsProps,
  QuickActionsProps,
  ChatInputProps,
  WelcomeStateProps,
} from './types';

// Constants
export {
  QUICK_ACTIONS,
  STARTER_ACTIONS,
  INPUT_PLACEHOLDER,
  PANEL_TITLE,
  WELCOME_MESSAGE,
  GENERATING_TEXT,
  CONTEXT_LABELS,
  ACTION_LABELS,
  TIMING,
  LIMITS,
} from './constants';

// Hooks
export { useChatHistory } from './hooks/useChatHistory';
export { useAIChat } from './hooks/useAIChat';
export { useEditorContext, useEditorContextWithEditor } from './hooks/useEditorContext';
