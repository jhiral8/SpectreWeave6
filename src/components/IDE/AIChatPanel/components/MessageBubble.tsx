'use client';

import { memo, useState, useMemo } from 'react';
import { Bot, User, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GENERATING_TEXT } from '../constants';
import { MessageActions } from './MessageActions';
import type { MessageBubbleProps } from '../types';

/** Maximum characters before collapsing (approximately 2000 words) */
const COLLAPSE_THRESHOLD = 12000;
/** Characters to show when collapsed */
const COLLAPSED_PREVIEW_LENGTH = 500;

/**
 * Format a timestamp for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Message bubble - VS Code Copilot Chat style
 *
 * Compact design with:
 * - Small avatars (24px)
 * - 12px text
 * - Minimal padding
 * - Actions on hover
 */
export const MessageBubble = memo(function MessageBubble({
  message,
  onInsert,
  onCopy,
  onRegenerate,
}: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isUser = message.role === 'user';
  const isGenerating = message.isGenerating;
  const isError = message.isError;

  // Check if message is long enough to collapse
  const isLongMessage = message.content.length > COLLAPSE_THRESHOLD;
  
  // Get display content (truncated if collapsed)
  const displayContent = useMemo(() => {
    if (!isLongMessage || isExpanded) {
      return message.content;
    }
    return message.content.slice(0, COLLAPSED_PREVIEW_LENGTH) + '...';
  }, [message.content, isLongMessage, isExpanded]);

  return (
    <div
      className={cn(
        'group flex gap-2 px-2 py-1.5',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar - smaller for compact look */}
      <div
        className={cn(
          'flex-shrink-0',
          'flex items-center justify-center',
          'h-6 w-6 rounded-full',
          isUser
            ? 'bg-[var(--ide-activitybar-badge)]'
            : 'bg-[var(--ide-input-bg)] border border-[var(--ide-border)]'
        )}
      >
        {isUser ? (
          <User className="h-3 w-3 text-white" />
        ) : (
          <Bot className="h-3 w-3 text-[var(--ide-foreground)]" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          'flex flex-col gap-0.5',
          'max-w-[85%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            'px-3 py-1.5 rounded-md',
            'text-[12px] leading-relaxed',
            isUser
              ? 'bg-[var(--ide-activitybar-badge)] text-white'
              : 'bg-[var(--ide-input-bg)] text-[var(--ide-foreground)] border border-[var(--ide-border)]',
            isError && 'border-[var(--ide-error)] bg-[var(--ide-error)]/10'
          )}
        >
          {/* Content or loading indicator */}
          {isGenerating && !message.content ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-[var(--ide-activitybar-inactive)]">
                {GENERATING_TEXT}
              </span>
            </div>
          ) : (
            <>
              <div className="whitespace-pre-wrap break-words">
                {displayContent}
                {isGenerating && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse" />
                )}
              </div>
              {/* Expand/Collapse button for long messages */}
              {isLongMessage && !isGenerating && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={cn(
                    'mt-2 flex items-center gap-1',
                    'text-xs font-medium',
                    'text-[var(--ide-activitybar-badge)]',
                    'hover:underline focus:outline-none focus:underline'
                  )}
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? 'Collapse message' : 'Expand message'}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Show more ({Math.round(message.content.length / 6)} words)
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Timestamp - smaller for compact look */}
        <span className="text-[10px] text-[var(--ide-foreground-muted)]">
          {formatTime(message.timestamp)}
        </span>

        {/* Actions - shown on hover for assistant messages only */}
        {!isUser && !isGenerating && isHovered && (
          <MessageActions
            content={message.content}
            messageId={message.id}
            onInsert={onInsert}
            onCopy={onCopy}
            onRegenerate={onRegenerate}
            visible={true}
          />
        )}
      </div>
    </div>
  );
});