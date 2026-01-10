'use client';

import { cn } from '@/lib/utils';
import type { QuickActionsProps } from '../types';

/**
 * Quick action buttons bar - VS Code style compact
 *
 * Displays predefined prompt shortcuts for common writing tasks:
 * - Continue, Improve, Rephrase, Dialogue, Describe, Brainstorm
 */
export function QuickActions({
  actions,
  onAction,
  disabled = false,
  hasSelection = false,
}: QuickActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-1 px-2 py-1.5',
        'border-b border-[var(--ide-border)]'
      )}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        const isDisabledForSelection = action.requiresSelection && !hasSelection;
        const isButtonDisabled = disabled || isDisabledForSelection;

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action)}
            disabled={isButtonDisabled}
            title={
              isDisabledForSelection
                ? 'Select text in editor to use this action'
                : action.label
            }
            className={cn(
              'inline-flex items-center gap-1',
              'px-2 py-1',
              'text-[11px]',
              'rounded',
              'transition-colors',
              isButtonDisabled
                ? 'text-[var(--ide-foreground-muted)] cursor-not-allowed'
                : 'text-[var(--ide-foreground-secondary)] hover:text-[var(--ide-foreground)] hover:bg-[var(--ide-list-hover)]'
            )}
          >
            <Icon className="h-3 w-3" />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
