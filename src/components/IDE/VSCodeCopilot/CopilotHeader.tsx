'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Plus, RotateCcw, Settings, MoreHorizontal } from 'lucide-react';
import type { CopilotHeaderProps } from './types';

export const CopilotHeader: React.FC<CopilotHeaderProps> = ({
  onNewChat,
}) => {
  return (
    <div
      className={cn(
        'vscode-copilot-header',
        'flex items-center justify-between',
        'h-[32px] px-3',
        'bg-[var(--ide-bg)]',
        'border-b border-[var(--ide-border)]'
      )}
    >
      <div className="flex items-center">
        <span 
          className={cn(
            'text-[11px] font-medium tracking-wide',
            'text-[var(--ide-foreground)]',
            'border-b border-[var(--ide-foreground)]',
            'pb-0.5'
          )}
        >
          CHAT
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          className={cn(
            'w-6 h-6 flex items-center justify-center',
            'text-[var(--ide-foreground-muted)]',
            'hover:bg-[var(--ide-hover-bg)]',
            'hover:text-[var(--ide-foreground)]',
            'rounded'
          )}
          onClick={onNewChat}
          title="New Chat"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          className={cn(
            'w-6 h-6 flex items-center justify-center',
            'text-[var(--ide-foreground-muted)]',
            'hover:bg-[var(--ide-hover-bg)]',
            'hover:text-[var(--ide-foreground)]',
            'rounded'
          )}
          title="History"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          className={cn(
            'w-6 h-6 flex items-center justify-center',
            'text-[var(--ide-foreground-muted)]',
            'hover:bg-[var(--ide-hover-bg)]',
            'hover:text-[var(--ide-foreground)]',
            'rounded'
          )}
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <button
          className={cn(
            'w-6 h-6 flex items-center justify-center',
            'text-[var(--ide-foreground-muted)]',
            'hover:bg-[var(--ide-hover-bg)]',
            'hover:text-[var(--ide-foreground)]',
            'rounded'
          )}
          title="More"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default CopilotHeader;
