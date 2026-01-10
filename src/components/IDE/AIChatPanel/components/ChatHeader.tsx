'use client';

import { Trash2, Settings, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PANEL_TITLE, ACTION_LABELS } from '../constants';
import type { ChatHeaderProps } from '../types';

/**
 * Panel header - VS Code style compact header
 *
 * Features:
 * - Uppercase title matching VS Code panel headers
 * - Fixed 35px height
 * - Clear and settings buttons
 * - Loading indicator during generation
 */
export function ChatHeader({
  isGenerating,
  onClear,
  onSettings,
}: ChatHeaderProps) {
  return (
    <div
      className={cn(
        'h-[35px] min-h-[35px]',
        'flex items-center justify-between',
        'px-3',
        'border-b border-[var(--ide-border)]'
      )}
    >
      {/* Title - VS Code style uppercase */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-[var(--ide-foreground-secondary)] uppercase tracking-wider">
          {PANEL_TITLE}
        </span>
        {isGenerating && (
          <Loader2 className="h-3 w-3 animate-spin text-[var(--ide-info)]" />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5">
        {/* Clear button */}
        <button
          type="button"
          onClick={onClear}
          disabled={isGenerating}
          className={cn(
            'p-1 rounded',
            'text-[var(--ide-activitybar-inactive)]',
            'hover:text-[var(--ide-foreground)]',
            'hover:bg-[var(--ide-list-hover)]',
            'transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label={ACTION_LABELS.clear}
          title={ACTION_LABELS.clear}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        {/* Settings button */}
        {onSettings && (
          <button
            type="button"
            onClick={onSettings}
            className={cn(
              'p-1 rounded',
              'text-[var(--ide-activitybar-inactive)]',
              'hover:text-[var(--ide-foreground)]',
              'hover:bg-[var(--ide-list-hover)]',
              'transition-colors'
            )}
            aria-label={ACTION_LABELS.settings}
            title={ACTION_LABELS.settings}
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
