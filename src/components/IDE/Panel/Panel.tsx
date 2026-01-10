'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { PanelTabs } from './PanelTabs';
import { PanelProps, DEFAULT_PANEL_TABS } from './types';

/**
 * Panel Component
 * 
 * VS Code-style bottom panel with tabs (Problems, Output, Terminal).
 */
export const Panel: React.FC<PanelProps> = ({
  tabs = DEFAULT_PANEL_TABS,
  activeTabId,
  onTabClick,
  onClose,
  onMaximize,
  isMaximized = false,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'vscode-panel flex flex-col',
        'bg-[var(--ide-bg,#1e1e1e)]',
        'border-t border-[var(--ide-border,#2b2b2b)]',
        className
      )}
      role="region"
      aria-label="Panel"
    >
      {/* Panel header with tabs */}
      <PanelTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={onTabClick}
        onClose={onClose}
        onMaximize={onMaximize}
        isMaximized={isMaximized}
      />

      {/* Panel content */}
      <div 
        className={cn(
          'vscode-panel__content flex-1 overflow-auto',
          'text-[var(--ide-foreground,#cccccc)]',
          'text-[13px]'
        )}
        role="tabpanel"
      >
        {children}
      </div>
    </div>
  );
};

export default Panel;
