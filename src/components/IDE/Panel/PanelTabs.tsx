'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { X, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import { PanelTabsProps } from './types';

/**
 * PanelTabs Component
 * 
 * VS Code-style panel tabs header with close/maximize buttons.
 */
export const PanelTabs: React.FC<PanelTabsProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onClose,
  onMaximize,
  isMaximized = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'vscode-panel-tabs flex items-center justify-between',
        'h-[35px] min-h-[35px]',
        'bg-[var(--ide-bg,#1e1e1e)]',
        'border-b border-[var(--ide-border,#2b2b2b)]',
        className
      )}
    >
      {/* Tab list */}
      <div className="flex items-center gap-0 h-full" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              className={cn(
                'vscode-panel-tab relative flex items-center gap-2',
                'h-full px-3',
                'text-[11px] uppercase tracking-wide font-medium',
                'transition-colors',
                isActive
                  ? 'text-[var(--ide-foreground,#e7e7e7)]'
                  : 'text-[var(--ide-foreground-muted,#8c8c8c)] hover:text-[var(--ide-foreground,#e7e7e7)]'
              )}
              onClick={() => onTabClick(tab.id)}
              role="tab"
              aria-selected={isActive}
            >
              {/* Active indicator */}
              {isActive && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--ide-accent,#007acc)]" 
                />
              )}

              {/* Tab icon */}
              {tab.icon && (
                <span className="flex-shrink-0">{tab.icon}</span>
              )}

              {/* Tab label */}
              <span>{tab.label}</span>

              {/* Badge */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={cn(
                    'min-w-[18px] h-[18px] px-1.5 rounded-full',
                    'text-[10px] font-medium flex items-center justify-center',
                    tab.badgeColor === 'error' && 'bg-[var(#f14c4c,#f14c4c)] text-white',
                    tab.badgeColor === 'warning' && 'bg-[var(#cca700,#cca700)] text-black',
                    tab.badgeColor === 'info' && 'bg-[var(#3794ff,#3794ff)] text-white',
                    !tab.badgeColor && 'bg-[var(--ide-bg-elevated,#4d4d4d)] text-[var(--ide-foreground,#ffffff)]'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-2">
        {/* Maximize/Minimize */}
        {onMaximize && (
          <button
            className={cn(
              'w-6 h-6 flex items-center justify-center rounded',
              'text-[var(--ide-foreground-muted,#8c8c8c)]',
              'hover:text-[var(--ide-foreground,#e7e7e7)]',
              'hover:bg-[var(--ide-hover-bg,#5a5d5e50)]'
            )}
            onClick={onMaximize}
            aria-label={isMaximized ? 'Restore panel size' : 'Maximize panel'}
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Close */}
        {onClose && (
          <button
            className={cn(
              'w-6 h-6 flex items-center justify-center rounded',
              'text-[var(--ide-foreground-muted,#8c8c8c)]',
              'hover:text-[var(--ide-foreground,#e7e7e7)]',
              'hover:bg-[var(--ide-hover-bg,#5a5d5e50)]'
            )}
            onClick={onClose}
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PanelTabs;
