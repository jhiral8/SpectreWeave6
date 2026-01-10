'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { X, FileText, FileCode, FileJson, Image, Settings } from 'lucide-react';
import { TabProps } from './types';

/**
 * Get icon for file type
 */
const getFileIcon = (fileType?: string) => {
  switch (fileType?.toLowerCase()) {
    case 'tsx':
    case 'ts':
    case 'jsx':
    case 'js':
      return <FileCode className="w-4 h-4 text-[#519aba]" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-[#cbcb41]" />;
    case 'css':
    case 'scss':
      return <FileCode className="w-4 h-4 text-[#519aba]" />;
    case 'md':
      return <FileText className="w-4 h-4 text-[#519aba]" />;
    case 'png':
    case 'jpg':
    case 'svg':
      return <Image className="w-4 h-4 text-[#a074c4]" />;
    case 'settings':
      return <Settings className="w-4 h-4 text-[#8c8c8c]" />;
    default:
      return <FileText className="w-4 h-4 text-[#8c8c8c]" />;
  }
};

/**
 * Tab Component
 * 
 * Individual tab in the tab bar with VS Code styling.
 */
export const Tab: React.FC<TabProps> = ({
  tab,
  isActive,
  onClick,
  onClose,
  onDoubleClick,
  showCloseButton = true,
  className,
}) => {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className={cn(
        'vscode-tab group relative flex items-center gap-2',
        'h-[35px] px-3',
        'border-r border-[var(--ide-border,#252526)]',
        'cursor-pointer select-none',
        'transition-colors duration-100',
        isActive
          ? [
              'bg-[var(--ide-bg-elevated,#1e1e1e)]',
              'text-[var(--ide-foreground,#ffffff)]',
            ]
          : [
              'bg-[var(--ide-bg,#2d2d2d)]',
              'text-[var(--ide-foreground-muted,#8c8c8c)]',
              'hover:bg-[var(--ide-hover-bg,#2d2d2d)]',
            ],
        tab.isPreview && 'italic',
        className
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      role="tab"
      aria-selected={isActive}
      title={tab.path || tab.title}
    >
      {/* Active top border indicator */}
      {isActive && (
        <div 
          className="absolute top-0 left-0 right-0 h-[1px] bg-[var(--ide-accent,#007acc)]" 
        />
      )}

      {/* File icon */}
      <span className="flex-shrink-0">
        {tab.icon || getFileIcon(tab.fileType)}
      </span>

      {/* Tab title with dirty indicator */}
      <span className="flex items-center gap-1 min-w-0">
        {tab.isDirty && (
          <span className="text-[var(--ide-foreground,#ffffff)]">●</span>
        )}
        <span className="truncate max-w-[100px] text-[13px]">
          {tab.title}
        </span>
      </span>

      {/* Pinned indicator */}
      {tab.isPinned && (
        <span className="text-[10px] text-[var(--ide-foreground-muted,#8c8c8c)]">
          📌
        </span>
      )}

      {/* Close button */}
      {showCloseButton && (
        <button
          className={cn(
            'flex-shrink-0 w-5 h-5 rounded flex items-center justify-center',
            'opacity-0 group-hover:opacity-100',
            'hover:bg-[var(--ide-hover-bg,#5a5d5e50)]',
            'transition-opacity',
            isActive && 'opacity-100'
          )}
          onClick={handleClose}
          aria-label={`Close ${tab.title}`}
        >
          {tab.isDirty ? (
            <span className="w-2 h-2 rounded-full bg-current" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
};

export default Tab;
