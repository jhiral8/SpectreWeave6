'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';

interface SidebarHeaderProps {
  /** View title (e.g., "EXPLORER", "SEARCH") */
  title: string;
  /** Collapse all sections */
  onCollapseAll?: () => void;
  /** Refresh content */
  onRefresh?: () => void;
  /** More actions menu */
  onMoreActions?: () => void;
}

/**
 * Sidebar Header Component
 * 
 * Header bar showing the current view name with action buttons.
 * 
 * ┌─────────────────────────────────────┐
 * │ EXPLORER                    [≡] [...│
 * └─────────────────────────────────────┘
 */
export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  title,
  onCollapseAll,
  onRefresh,
  onMoreActions,
}) => {
  return (
    <div
      className={cn(
        'vscode-sidebar-header',
        'flex items-center justify-between',
        'h-[35px] px-4 py-1',
        'text-[11px] font-medium uppercase tracking-wide',
        'text-[var(--ide-foreground,#bbbbbb)]',
        'border-b border-[var(--ide-border,transparent)]',
        'select-none',
        'group'
      )}
    >
      {/* Title */}
      <span className="truncate">{title}</span>

      {/* Action Buttons */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onCollapseAll && (
          <button
            className={cn(
              'w-6 h-6 flex items-center justify-center',
              'text-[var(--ide-foreground-muted,#c5c5c5)]',
              'hover:bg-[var(--ide-hover-bg,#5a5d5e)]',
              'rounded'
            )}
            onClick={onCollapseAll}
            title="Collapse All"
            aria-label="Collapse All"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9 9H4v1h5V9z"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M5 3l1-1h7l1 1v7l-1 1h-2v2l-1 1H3l-1-1V6l1-1h2V3zm1 2h4l1 1v4h2V3H6v2zm4 1H3v7h7V6z"/>
            </svg>
          </button>
        )}

        {onRefresh && (
          <button
            className={cn(
              'w-6 h-6 flex items-center justify-center',
              'text-[var(--ide-foreground-muted,#c5c5c5)]',
              'hover:bg-[var(--ide-hover-bg,#5a5d5e)]',
              'rounded'
            )}
            onClick={onRefresh}
            title="Refresh"
            aria-label="Refresh"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.451 5.609l-.579-.939-1.068.812-.076.094c-.335.415-.927 1.341-1.124 2.876l-.021.165.033.163.071.345c.024.117.06.295.064.318.018.09.046.178.071.26h1.074a4.108 4.108 0 00-.024-.106l-.061-.295a11.783 11.783 0 01.612-2.223l.088-.203c.19-.441.46-1.027.94-1.267zm-4.451-2.609c-3.039 0-5.5 2.461-5.5 5.5s2.461 5.5 5.5 5.5 5.5-2.461 5.5-5.5h-1c0 2.486-2.014 4.5-4.5 4.5s-4.5-2.014-4.5-4.5 2.014-4.5 4.5-4.5v-1z"/>
            </svg>
          </button>
        )}

        <button
          className={cn(
            'w-6 h-6 flex items-center justify-center',
            'text-[var(--ide-foreground-muted,#c5c5c5)]',
            'hover:bg-[var(--ide-hover-bg,#5a5d5e)]',
            'rounded'
          )}
          onClick={onMoreActions}
          title="More Actions..."
          aria-label="More Actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SidebarHeader;
