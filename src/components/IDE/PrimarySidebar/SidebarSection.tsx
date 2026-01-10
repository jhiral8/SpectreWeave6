'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { SidebarSectionProps } from './types';

/**
 * Sidebar Section Component
 * 
 * Collapsible section with VS Code styling:
 * - Uppercase title (11px, bold)
 * - Chevron indicator (right when collapsed, down when expanded)
 * - Optional action buttons on hover
 * - Optional badge count
 * 
 * ┌─────────────────────────────────────┐
 * │ ▶ SECTION TITLE (2)     [+] [↻] [...│
 * └─────────────────────────────────────┘
 */
export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  isCollapsed,
  onToggle,
  children,
  actions = [],
  badge,
}) => {
  return (
    <div className="vscode-sidebar-section">
      {/* Section Header */}
      <button
        className={cn(
          'vscode-sidebar-section__header',
          'w-full flex items-center gap-1',
          'h-[22px] px-2',
          'text-[11px] font-semibold uppercase tracking-wide',
          'text-[var(--ide-foreground,#bbbbbb)]',
          'bg-[var(--ide-bg-elevated,transparent)]',
          'hover:bg-[var(--ide-hover-bg,#2a2d2e)]',
          'border-t border-b border-[var(--ide-border,#3c3c3c)]',
          'cursor-pointer select-none',
          'group'
        )}
        onClick={onToggle}
        aria-expanded={!isCollapsed}
      >
        {/* Chevron */}
        <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </span>

        {/* Title */}
        <span className="flex-1 text-left truncate">{title}</span>

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span
            className={cn(
              'flex-shrink-0 min-w-[18px] h-[18px] px-1.5',
              'flex items-center justify-center',
              'text-[10px] font-medium',
              'bg-[var(--ide-bg-elevated,#4d4d4d)]',
              'text-[var(--ide-foreground,#ffffff)]',
              'rounded-full'
            )}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}

        {/* Action Buttons (visible on hover) */}
        {actions.length > 0 && (
          <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {actions.map((action) => (
              <button
                key={action.id}
                className={cn(
                  'w-5 h-5 flex items-center justify-center',
                  'text-[var(--ide-foreground-muted,#c5c5c5)]',
                  'hover:bg-[var(--ide-hover-bg,#5a5d5e)]',
                  'rounded'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                title={action.label}
                aria-label={action.label}
              >
                <ActionIcon name={action.icon} />
              </button>
            ))}
          </div>
        )}
      </button>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="vscode-sidebar-section__content">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Simple icon component for action buttons
 */
const ActionIcon: React.FC<{ name: string }> = ({ name }) => {
  // Using inline SVGs for common icons to avoid lucide dependency issues
  const icons: Record<string, React.ReactNode> = {
    FilePlus: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M9.5 1.1l3.4 3.4v10c0 .3-.2.5-.5.5H3.6c-.3 0-.5-.2-.5-.5v-13c0-.3.2-.5.5-.5h5.9zm0 1H4v12h8V5h-2.5V2.1zM8 7h1v2h2v1H9v2H8v-2H6V9h2V7z"/>
      </svg>
    ),
    FolderPlus: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M14 4H9.618l-1-2H2v12h12V4zm-1 8H3V5h10v7zm-4-5h1v2h2v1h-2v2H9v-2H7V9h2V7z"/>
      </svg>
    ),
    RefreshCw: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.451 5.609l-.579-.939-1.068.812-.076.094c-.335.415-.927 1.341-1.124 2.876l-.021.165.033.163.071.345c.024.117.06.295.064.318.018.09.046.178.071.26h1.074a4.108 4.108 0 00-.024-.106l-.061-.295a11.783 11.783 0 01.612-2.223l.088-.203c.19-.441.46-1.027.94-1.267zm-4.451-2.609c-3.039 0-5.5 2.461-5.5 5.5s2.461 5.5 5.5 5.5 5.5-2.461 5.5-5.5h-1c0 2.486-2.014 4.5-4.5 4.5s-4.5-2.014-4.5-4.5 2.014-4.5 4.5-4.5v-1z"/>
      </svg>
    ),
    CollapseAll: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M9 9H4v1h5V9z"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M5 3l1-1h7l1 1v7l-1 1h-2v2l-1 1H3l-1-1V6l1-1h2V3zm1 2h4l1 1v4h2V3H6v2zm4 1H3v7h7V6z"/>
      </svg>
    ),
  };

  return <>{icons[name] || null}</>;
};

export default SidebarSection;
