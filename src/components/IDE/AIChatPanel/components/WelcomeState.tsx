'use client';

import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WELCOME_MESSAGE, STARTER_ACTIONS } from '../constants';
import type { WelcomeStateProps, QuickAction } from '../types';

/**
 * Welcome state shown when chat history is empty
 *
 * Displays:
 * - Ghost Writer avatar and description
 * - Grid of quick-start action buttons
 */
export function WelcomeState({
  onQuickAction,
  starterActions = STARTER_ACTIONS,
}: WelcomeStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'flex-1 p-6',
        'text-center'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex items-center justify-center',
          'h-16 w-16 mb-4',
          'rounded-full',
          'bg-[var(--ide-activitybar-badge)]'
        )}
      >
        <Bot className="h-8 w-8 text-white" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-[var(--ide-foreground)] mb-2">
        {WELCOME_MESSAGE.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-[var(--ide-activitybar-inactive)] mb-6 max-w-[280px]">
        {WELCOME_MESSAGE.description}
      </p>

      {/* Quick-start grid */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-[300px]">
        {starterActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onQuickAction(action)}
              className={cn(
                'flex flex-col items-center gap-2',
                'p-3',
                'rounded-lg',
                'bg-[var(--ide-input-bg)]',
                'border border-[var(--ide-border)]',
                'hover:bg-[var(--ide-list-hover-bg)]',
                'transition-colors',
                'text-[var(--ide-foreground)]'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
