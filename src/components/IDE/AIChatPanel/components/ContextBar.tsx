'use client';

import { Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONTEXT_LABELS } from '../constants';
import type { ContextBarProps } from '../types';

/**
 * Context bar - VS Code style compact pinned context
 *
 * Shows current chapter/scene and detected characters
 * in a single compact line with pin icon
 */
export function ContextBar({ context, compact = false }: ContextBarProps) {
  const hasContext = context.chapter || context.characters.length > 0;

  if (!hasContext) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1',
          'text-[11px] text-[var(--ide-foreground-muted)]',
          'border-b border-[var(--ide-border)]'
        )}
      >
        <Pin className="h-3 w-3" />
        <span>No context detected</span>
      </div>
    );
  }

  // Build context string
  const parts: string[] = [];
  if (context.chapter) parts.push(context.chapter);
  if (context.scene) parts.push(context.scene);

  const locationText = parts.length > 0 ? parts.join(', ') : null;
  const charactersText = context.characters.length > 0 
    ? context.characters.slice(0, 3).join(', ') + (context.characters.length > 3 ? '...' : '')
    : null;

  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 px-2 py-1.5',
        'text-[11px]',
        'border-b border-[var(--ide-border)]'
      )}
    >
      {/* Location row */}
      {locationText && (
        <div className="flex items-center gap-1.5">
          <Pin className="h-3 w-3 text-[var(--ide-activitybar-inactive)] flex-shrink-0" />
          <span className="text-[var(--ide-foreground-secondary)] truncate">
            {locationText}
          </span>
        </div>
      )}

      {/* Characters row */}
      {charactersText && (
        <div className="flex items-center gap-1.5 pl-[18px]">
          <span className="text-[var(--ide-foreground-muted)] truncate">
            Characters: {charactersText}
          </span>
        </div>
      )}

      {/* Selected text indicator */}
      {context.selectedText && (
        <div className="flex items-center gap-1.5 pl-[18px]">
          <span className="text-[var(--ide-foreground-muted)] italic truncate">
            "{context.selectedText.slice(0, 40)}
            {context.selectedText.length > 40 ? '...' : ''}"
          </span>
        </div>
      )}
    </div>
  );
}
