'use client';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Tab } from './Tab';
import { TabBarProps } from './types';

/**
 * TabBar Component
 * 
 * VS Code-style tab bar with scroll, overflow menu, and drag support.
 */
export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onTabReorder,
  onTabDoubleClick,
  className,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Check scroll position and update arrow visibility
  const updateScrollArrows = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftScroll(container.scrollLeft > 0);
    setShowRightScroll(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    updateScrollArrows();
    window.addEventListener('resize', updateScrollArrows);
    return () => window.removeEventListener('resize', updateScrollArrows);
  }, [tabs]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  // Scroll active tab into view
  useEffect(() => {
    if (!activeTabId || !scrollContainerRef.current) return;
    
    const activeTab = scrollContainerRef.current.querySelector(
      `[data-tab-id="${activeTabId}"]`
    );
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeTabId]);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'vscode-tabbar flex items-center',
        'h-[35px] min-h-[35px]',
        'bg-[var(--ide-bg,#252526)]',
        'border-b border-[var(--ide-border,#252526)]',
        className
      )}
      role="tablist"
      aria-label="Editor tabs"
    >
      {/* Left scroll button */}
      {showLeftScroll && (
        <button
          className={cn(
            'flex-shrink-0 w-7 h-full flex items-center justify-center',
            'bg-[var(--ide-bg,#252526)]',
            'text-[var(--ide-foreground-muted,#8c8c8c)]',
            'hover:text-[var(--ide-foreground,#ffffff)]',
            'border-r border-[var(--ide-border,#252526)]'
          )}
          onClick={scrollLeft}
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Tabs container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex-1 flex items-center overflow-x-auto',
          'scrollbar-none' // Hide scrollbar
        )}
        onScroll={updateScrollArrows}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab, index) => (
          <div key={tab.id} data-tab-id={tab.id}>
            <Tab
              tab={tab}
              isActive={tab.id === activeTabId}
              onClick={() => onTabClick(tab.id)}
              onClose={() => onTabClose(tab.id)}
              onDoubleClick={() => onTabDoubleClick?.(tab.id)}
            />
          </div>
        ))}
      </div>

      {/* Right scroll button */}
      {showRightScroll && (
        <button
          className={cn(
            'flex-shrink-0 w-7 h-full flex items-center justify-center',
            'bg-[var(--ide-bg,#252526)]',
            'text-[var(--ide-foreground-muted,#8c8c8c)]',
            'hover:text-[var(--ide-foreground,#ffffff)]',
            'border-l border-[var(--ide-border,#252526)]'
          )}
          onClick={scrollRight}
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* More actions button */}
      <button
        className={cn(
          'flex-shrink-0 w-7 h-full flex items-center justify-center',
          'bg-[var(--ide-bg,#252526)]',
          'text-[var(--ide-foreground-muted,#8c8c8c)]',
          'hover:text-[var(--ide-foreground,#ffffff)]',
          'border-l border-[var(--ide-border,#252526)]'
        )}
        aria-label="More tab actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
};

export default TabBar;
