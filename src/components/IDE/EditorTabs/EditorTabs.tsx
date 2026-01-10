'use client';

import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  X, 
  FileText, 
  User, 
  StickyNote, 
  Settings,
  Edit3,
  Circle,
  ChevronDown,
} from 'lucide-react';
import { EditorTab } from './types';

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabPin?: (tabId: string) => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
  className?: string;
}

// Get icon for tab type
function getTabIcon(type: EditorTab['type']): React.ElementType {
  switch (type) {
    case 'chapter':
      return FileText;
    case 'scene':
      return Edit3;
    case 'character':
      return User;
    case 'note':
      return StickyNote;
    case 'settings':
      return Settings;
    default:
      return FileText;
  }
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabPin,
  onTabReorder,
  className,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropTargetIndex(index);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (draggedTabId && dropTargetIndex !== null && onTabReorder) {
      const fromIndex = tabs.findIndex(t => t.id === draggedTabId);
      if (fromIndex !== -1 && fromIndex !== dropTargetIndex) {
        onTabReorder(fromIndex, dropTargetIndex);
      }
    }
    setDraggedTabId(null);
    setDropTargetIndex(null);
  }, [draggedTabId, dropTargetIndex, tabs, onTabReorder]);

  // Handle tab close with middle click
  const handleMouseDown = useCallback((e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) { // Middle click
      e.preventDefault();
      onTabClose(tabId);
    }
  }, [onTabClose]);

  // Handle double click to pin/unpin
  const handleDoubleClick = useCallback((tabId: string) => {
    onTabPin?.(tabId);
  }, [onTabPin]);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      'editor-tabs flex items-stretch',
      'h-[35px] min-h-[35px]',
      'bg-[--ide-background]',
      'border-b border-[--ide-border]',
      className
    )}>
      {/* Scrollable tab container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 flex items-stretch overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab, index) => {
          const Icon = getTabIcon(tab.type);
          const isActive = activeTabId === tab.id;
          const isDragTarget = dropTargetIndex === index;
          
          return (
            <div
              key={tab.id}
              draggable={!tab.isPinned}
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onTabSelect(tab.id)}
              onMouseDown={(e) => handleMouseDown(e, tab.id)}
              onDoubleClick={() => handleDoubleClick(tab.id)}
              className={cn(
                'group relative flex items-center gap-2 h-full px-3',
                'min-w-[120px] max-w-[200px]',
                'cursor-pointer select-none',
                'border-r border-[--ide-border]',
                'transition-colors duration-100',
                isActive 
                  ? 'bg-[--ide-editor-bg] text-[--ide-foreground]' 
                  : 'bg-[--ide-background] text-[--ide-foreground-secondary] hover:bg-[--ide-list-hover]',
                isDragTarget && 'border-l-2 border-l-[--ide-activitybar-badge]',
                tab.isPreview && 'italic'
              )}
              title={tab.path || tab.label}
            >
              {/* Active tab top border indicator */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-[--ide-activitybar-badge]" />
              )}
              
              {/* Icon */}
              <Icon className={cn(
                'w-4 h-4 flex-shrink-0',
                isActive ? 'text-[--ide-foreground]' : 'text-[--ide-foreground-muted] opacity-70'
              )} />
              
              {/* Label */}
              <span className="flex-1 text-[13px] truncate">{tab.label}</span>
              
              {/* Dirty indicator / Close button container */}
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 relative">
                {/* Dirty indicator */}
                {tab.isDirty && (
                  <Circle 
                    className={cn(
                      'w-2 h-2 fill-current absolute',
                      'text-[--ide-foreground-secondary]',
                      'group-hover:opacity-0 transition-opacity'
                    )} 
                  />
                )}
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className={cn(
                    'w-5 h-5 rounded flex items-center justify-center',
                    'hover:bg-[--ide-list-hover] transition-all duration-100',
                    'text-[--ide-foreground-secondary] hover:text-[--ide-foreground]',
                    tab.isDirty 
                      ? 'opacity-0 group-hover:opacity-100' 
                      : 'opacity-0 group-hover:opacity-100'
                  )}
                  aria-label={`Close ${tab.label}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Pinned indicator */}
              {tab.isPinned && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[--ide-activitybar-badge]" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Tab actions / overflow */}
      <div className="flex items-center border-l border-[--ide-border] bg-[--ide-background]">
        <button
          className={cn(
            'h-full px-3 flex items-center justify-center',
            'text-[--ide-foreground-secondary] hover:text-[--ide-foreground]',
            'hover:bg-[--ide-list-hover] transition-colors'
          )}
          title="Tab actions"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
