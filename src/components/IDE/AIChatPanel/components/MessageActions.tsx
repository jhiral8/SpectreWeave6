'use client';

import { useState, useCallback } from 'react';
import { FileInput, Copy, RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACTION_LABELS, TIMING } from '../constants';
import type { MessageActionsProps } from '../types';

/**
 * Action buttons for AI messages
 *
 * Provides Insert, Copy, and Regenerate actions with:
 * - Visual feedback for copy success
 * - Disabled state during generation
 */
export function MessageActions({
  content,
  messageId,
  onInsert,
  onCopy,
  onRegenerate,
  visible = true,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  /**
   * Handle copy with visual feedback
   */
  const handleCopy = useCallback(async () => {
    await onCopy(content);
    setCopied(true);
    setTimeout(() => setCopied(false), TIMING.copiedFeedback);
  }, [content, onCopy]);

  /**
   * Handle insert
   */
  const handleInsert = useCallback(() => {
    onInsert(content);
  }, [content, onInsert]);

  /**
   * Handle regenerate
   */
  const handleRegenerate = useCallback(() => {
    onRegenerate(messageId);
  }, [messageId, onRegenerate]);

  if (!visible) return null;

  const buttonClass = cn(
    'inline-flex items-center gap-1.5',
    'px-2 py-1',
    'text-xs font-medium',
    'rounded',
    'bg-[var(--ide-input-bg)]',
    'border border-[var(--ide-border)]',
    'text-[var(--ide-foreground)]',
    'hover:bg-[var(--ide-list-hover-bg)]',
    'transition-colors',
    'focus:outline-none focus:ring-1 focus:ring-[var(--ide-input-focus-border)]'
  );

  return (
    <div className="flex items-center gap-1 mt-1">
      {/* Insert button */}
      <button
        type="button"
        onClick={handleInsert}
        className={buttonClass}
        aria-label={ACTION_LABELS.insert}
      >
        <FileInput className="h-3.5 w-3.5" />
        <span>{ACTION_LABELS.insert}</span>
      </button>

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        className={cn(buttonClass, copied && 'text-[var(--ide-success)]')}
        aria-label={copied ? ACTION_LABELS.copied : ACTION_LABELS.copy}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            <span>{ACTION_LABELS.copied}</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span>{ACTION_LABELS.copy}</span>
          </>
        )}
      </button>

      {/* Regenerate button */}
      <button
        type="button"
        onClick={handleRegenerate}
        className={buttonClass}
        aria-label={ACTION_LABELS.regenerate}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>{ACTION_LABELS.regenerate}</span>
      </button>
    </div>
  );
}
