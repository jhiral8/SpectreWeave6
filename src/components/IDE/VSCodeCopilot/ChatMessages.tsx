'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessagesProps } from './types';

/**
 * Chat Messages Component
 * 
 * Scrollable container for chat messages.
 */
export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading = false,
  onCopy,
  onRegenerate,
  onInsertCode,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div
      className={cn(
        'vscode-chat-messages',
        'flex-1 overflow-y-auto',
        'vscode-scrollbar'
      )}
    >
      {/* Empty State */}
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--ide-bg-elevated,#4d4d4d)] flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-[var(--ide-foreground,#cccccc)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h3 className="text-[14px] font-medium text-[var(--ide-foreground,#cccccc)] mb-1">
            Ask Copilot
          </h3>
          <p className="text-[12px] text-[var(--ide-foreground-muted,#8a8a8a)] max-w-[250px]">
            Ask questions about your story, get writing suggestions, or explore ideas.
          </p>
          <div className="mt-4 space-y-2">
            <SuggestionChip text="Help me develop this character" />
            <SuggestionChip text="Suggest a plot twist for this scene" />
            <SuggestionChip text="Review my dialogue for authenticity" />
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
          onInsertCode={onInsertCode}
        />
      ))}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-6 h-6 rounded bg-[var(--ide-bg-elevated,#4d4d4d)] flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          </div>
          <span className="text-[12px] text-[var(--ide-foreground-muted,#8a8a8a)]">
            Copilot is thinking...
          </span>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

/**
 * Suggestion chip for empty state
 */
const SuggestionChip: React.FC<{ text: string; onClick?: () => void }> = ({ text, onClick }) => (
  <button
    className={cn(
      'block w-full px-3 py-2',
      'text-[12px] text-left',
      'bg-[var(--ide-bg,#3c3c3c)]',
      'text-[var(--ide-foreground,#cccccc)]',
      'hover:bg-[var(--ide-hover-bg,#2a2d2e)]',
      'rounded border border-[var(--ide-border,#3c3c3c)]'
    )}
    onClick={onClick}
  >
    {text}
  </button>
);

export default ChatMessages;
