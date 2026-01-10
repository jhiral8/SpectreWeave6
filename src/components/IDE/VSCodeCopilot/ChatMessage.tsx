'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { User, Sparkles, Copy, Check, RefreshCw, Code, ArrowDownToLine } from 'lucide-react';
import type { ChatMessageProps, ChatMessageData, CodeBlock } from './types';

/**
 * Chat Message Component
 * 
 * VS Code Copilot-style message bubble with code blocks.
 * 
 * User messages: Right-aligned, accent background
 * Assistant messages: Left-aligned, dark background, with actions
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onCopy,
  onRegenerate,
  onInsertCode,
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'vscode-chat-message',
        'flex gap-2 px-3 py-2',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar - VS Code style 24px */}
      <div
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded-full',
          'flex items-center justify-center',
          isUser
            ? 'bg-[var(--ide-accent)]'
            : 'bg-[var(--ide-bg-elevated)]'
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-[var(--ide-accent)]" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex-1 min-w-0', isUser && 'text-right')}>
        {/* Message Bubble */}
        <div
          className={cn(
            'inline-block max-w-full',
            'px-3 py-1.5 rounded',
            'text-[12px] leading-relaxed',
            isUser
              ? [
                  'bg-[var(--ide-accent-transparent)]',
                  'text-[var(--ide-foreground)]',
                ]
              : [
                  'bg-[var(--ide-input-bg)]',
                  'text-[var(--ide-foreground)]',
                ],
            'text-left'
          )}
        >
          {/* Streaming indicator */}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
          )}

          {/* Error state */}
          {message.error ? (
            <span className="text-red-500">
              {message.error}
            </span>
          ) : (
            <MessageContent content={message.content} codeBlocks={message.codeBlocks} onInsertCode={onInsertCode} />
          )}
        </div>

        {/* Message Actions (for assistant messages) */}
        {isAssistant && !message.isStreaming && (
          <MessageActions
            message={message}
            onCopy={onCopy}
            onRegenerate={onRegenerate}
          />
        )}

        {/* Timestamp */}
        <div
          className={cn(
            'text-[10px] mt-0.5',
            'text-[var(--ide-foreground-muted)]'
          )}
        >
          {message.agent && <span className="mr-2">{message.agent}</span>}
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

/**
 * Message content with markdown-like rendering
 */
const MessageContent: React.FC<{
  content: string;
  codeBlocks?: CodeBlock[];
  onInsertCode?: (code: string) => void;
}> = ({ content, codeBlocks, onInsertCode }) => {
  // Simple markdown-like parsing
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g);

  return (
    <div className="whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        // Code block
        if (part.startsWith('```')) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          if (match) {
            const [, language, code] = match;
            return (
              <CodeBlockComponent
                key={i}
                language={language || 'plaintext'}
                code={code.trim()}
                onInsert={onInsertCode}
              />
            );
          }
        }

        // Inline code
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className={cn(
                'px-1 py-0.5 mx-0.5',
                'bg-[var(--ide-bg-elevated)]',
                'text-[var(--ide-foreground)]',
                'rounded text-[11px] font-mono'
              )}
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        // Regular text
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

/**
 * Code block with copy and insert actions
 */
const CodeBlockComponent: React.FC<{
  language: string;
  code: string;
  filename?: string;
  onInsert?: (code: string) => void;
}> = ({ language, code, filename, onInsert }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'my-2 rounded overflow-hidden',
        'bg-[var(--ide-bg-elevated,#1e1e1e)]',
        'border border-[var(--ide-border,#3c3c3c)]'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between',
          'px-3 py-1.5',
          'bg-[var(--ide-bg,#1e1e1e)]',
          'border-b border-[var(--ide-border,#3c3c3c)]'
        )}
      >
        <span className="text-[11px] text-[var(--ide-foreground-muted,#8a8a8a)]">
          {filename || language}
        </span>
        <div className="flex items-center gap-1">
          {onInsert && (
            <button
              className={cn(
                'p-1 rounded',
                'text-[var(--ide-foreground-muted,#c5c5c5)]',
                'hover:bg-[var(--ide-hover-bg,#5a5d5e)]'
              )}
              onClick={() => onInsert(code)}
              title="Insert at cursor"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            className={cn(
              'p-1 rounded',
              'text-[var(--ide-foreground-muted,#c5c5c5)]',
              'hover:bg-[var(--ide-hover-bg,#5a5d5e)]'
            )}
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <pre className="p-3 overflow-x-auto text-[12px] font-mono">
        <code className="text-[var(--ide-foreground,#d4d4d4)]">{code}</code>
      </pre>
    </div>
  );
};

/**
 * Message action buttons
 */
const MessageActions: React.FC<{
  message: ChatMessageData;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
}> = ({ message, onCopy, onRegenerate }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    onCopy?.(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <button
        className={cn(
          'p-1 rounded',
          'text-[var(--ide-foreground-muted,#8a8a8a)]',
          'hover:text-[var(--ide-foreground,#cccccc)]',
          'hover:bg-[var(--ide-hover-bg,#5a5d5e)]'
        )}
        onClick={handleCopy}
        title="Copy"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
      {onRegenerate && (
        <button
          className={cn(
            'p-1 rounded',
            'text-[var(--ide-foreground-muted,#8a8a8a)]',
            'hover:text-[var(--ide-foreground,#cccccc)]',
            'hover:bg-[var(--ide-hover-bg,#5a5d5e)]'
          )}
          onClick={() => onRegenerate(message.id)}
          title="Regenerate"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

/**
 * Format timestamp
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default ChatMessage;
