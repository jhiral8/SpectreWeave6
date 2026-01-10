'use client';

import { useRef, useCallback, KeyboardEvent, ChangeEvent } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INPUT_PLACEHOLDER, ACTION_LABELS } from '../constants';
import type { ChatInputProps } from '../types';

/**
 * Chat input component - VS Code Copilot style
 *
 * Features:
 * - Compact VS Code-style design
 * - Send button inside input container
 * - Focus ring on container (not input)
 * - Enter to send, Shift+Enter for newline
 * - Disabled state during generation
 */
export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = INPUT_PLACEHOLDER,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handle textarea value changes
   */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);

      // Auto-resize textarea
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
      }
    },
    [onChange]
  );

  /**
   * Handle keyboard events for send on Enter
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !disabled) {
        e.preventDefault();
        if (value.trim()) {
          onSend();
          // Reset textarea height
          const textarea = textareaRef.current;
          if (textarea) {
            textarea.style.height = 'auto';
          }
        }
      }
    },
    [disabled, value, onSend]
  );

  /**
   * Handle send button click
   */
  const handleSendClick = useCallback(() => {
    if (value.trim() && !disabled) {
      onSend();
      // Reset textarea height
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
      }
    }
  }, [value, disabled, onSend]);

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="p-2 border-t border-[var(--ide-border)]">
      {/* VS Code style: input and button in same container */}
      <div
        className={cn(
          'flex items-end',
          'bg-[var(--ide-input-bg)]',
          'border border-[var(--ide-border)]',
          'rounded',
          'focus-within:border-[var(--ide-accent)]',
          'transition-colors',
          disabled && 'opacity-50'
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={cn(
            'flex-1 resize-none',
            'min-h-[32px] max-h-[120px]',
            'px-2 py-1.5',
            'text-[12px] text-[var(--ide-foreground)]',
            'bg-transparent',
            'focus:outline-none',
            'placeholder:text-[var(--ide-foreground-muted)]',
            'disabled:cursor-not-allowed'
          )}
          aria-label="Chat message input"
        />
        <button
          type="button"
          onClick={handleSendClick}
          disabled={!canSend}
          className={cn(
            'p-1.5 mr-0.5 mb-0.5',
            'rounded',
            'transition-colors',
            canSend
              ? 'text-[var(--ide-accent)] hover:bg-[var(--ide-list-hover)]'
              : 'text-[var(--ide-foreground-muted)] cursor-not-allowed'
          )}
          aria-label={ACTION_LABELS.send}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
