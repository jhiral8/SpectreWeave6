'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useChatHistory } from './hooks/useChatHistory';
import { useAIChat } from './hooks/useAIChat';
import { useEditorContext } from './hooks/useEditorContext';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { ContextBar } from './components/ContextBar';
import { QuickActions } from './components/QuickActions';
import { WelcomeState } from './components/WelcomeState';
import { ChatHeader } from './components/ChatHeader';
import { QUICK_ACTIONS } from './constants';
import type { AIChatPanelProps, ChatContext, QuickAction } from './types';

// Try to import editor context if available
let useEditors: (() => { activeEditor: unknown }) | null = null;
try {
  // Dynamic import to avoid hard dependency
  const editorContext = require('@/components/BlockEditor/context/UnifiedEditorContext');
  useEditors = editorContext.useEditors;
} catch {
  // Editor context not available - insert will show notification
}

/**
 * AI Chat Panel - Ghost Writer
 *
 * Main component for the VS Code Copilot-style AI chat interface.
 * Provides conversational AI assistance for fiction writing.
 *
 * Features (MVP - Phase 1):
 * - Send messages and receive streamed AI responses
 * - Message history with user/assistant bubbles
 * - Auto-scroll to newest message
 * - Disabled input during generation
 */
export function AIChatPanel({ className }: AIChatPanelProps) {
  const [inputValue, setInputValue] = useState('');

  // Try to get editor access
  const editors = useEditors?.();
  const activeEditor = editors?.activeEditor as {
    commands?: { insertContent: (content: string) => void };
    state?: { selection: { from: number } };
  } | null;

  // Initialize hooks
  const chatHistory = useChatHistory();
  const { context: editorContext } = useEditorContext();
  const { sendMessage, regenerate, isGenerating, cancel } = useAIChat({
    chatHistory,
    onError: (error) => {
      console.error('[AIChatPanel] AI error:', error);
    },
  });

  /**
   * Handle clearing chat history
   */
  const handleClear = useCallback(() => {
    if (isGenerating) {
      cancel();
    }
    chatHistory.clearHistory();
  }, [isGenerating, cancel, chatHistory]);

  /**
   * Handle sending a message
   */
  const handleSend = useCallback(async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isGenerating) return;

    // Clear input immediately
    setInputValue('');

    // Send to AI with current editor context
    const context: ChatContext = {
      chapter: editorContext.chapter,
      scene: editorContext.scene,
      characters: editorContext.characters,
      selectedText: editorContext.selectedText,
    };

    await sendMessage(trimmedValue, context);
  }, [inputValue, isGenerating, sendMessage]);

  /**
   * Handle inserting content into editor
   */
  const handleInsert = useCallback((content: string) => {
    if (!activeEditor?.commands) {
      // No active editor - show notification
      console.warn('[AIChatPanel] No active editor for insert');
      // TODO: Add toast notification
      return;
    }

    try {
      // Insert content at cursor position
      activeEditor.commands.insertContent(content);
    } catch (error) {
      console.error('[AIChatPanel] Insert failed:', error);
    }
  }, [activeEditor]);

  /**
   * Handle copying content to clipboard
   * (Placeholder - will be enhanced in Phase 7)
   */
  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // TODO: Add visual feedback in Phase 7 (US5)
    } catch (error) {
      console.error('[AIChatPanel] Copy failed:', error);
    }
  }, []);

  /**
   * Handle regenerating a message
   */
  const handleRegenerate = useCallback(
    (messageId: string) => {
      regenerate(messageId);
    },
    [regenerate]
  );

  /**
   * Handle quick action
   */
  const handleQuickAction = useCallback(
    async (action: QuickAction) => {
      if (isGenerating) return;

      // Build prompt from action template
      let prompt = action.prompt;

      // If action requires selection, include it
      if (action.requiresSelection && editorContext.selectedText) {
        prompt = `${prompt}\n\nSelected text:\n"${editorContext.selectedText}"`;
      }

      // Send as message
      const context: ChatContext = {
        chapter: editorContext.chapter,
        scene: editorContext.scene,
        characters: editorContext.characters,
        selectedText: editorContext.selectedText,
      };

      await sendMessage(prompt, context);
    },
    [isGenerating, editorContext, sendMessage]
  );

  const hasMessages = chatHistory.messages.length > 0;
  const hasSelection = !!editorContext.selectedText;

  return (
    <div
      className={cn(
        'flex flex-col h-full',
        'bg-[var(--ide-sidebar-bg)]',
        'border-l border-[var(--ide-border)]',
        className
      )}
    >
      {/* Header */}
      <ChatHeader
        isGenerating={isGenerating}
        onClear={handleClear}
      />

      {/* Context bar */}
      <ContextBar context={editorContext} />

      {/* Quick actions bar */}
      <QuickActions
        actions={QUICK_ACTIONS}
        onAction={handleQuickAction}
        disabled={isGenerating}
        hasSelection={hasSelection}
      />

      {/* Message list or welcome state */}
      {hasMessages ? (
        <MessageList
          messages={chatHistory.messages}
          onInsert={handleInsert}
          onCopy={handleCopy}
          onRegenerate={handleRegenerate}
        />
      ) : (
        <WelcomeState onQuickAction={handleQuickAction} />
      )}

      {/* Input area */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        disabled={isGenerating}
      />
    </div>
  );
}
