'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { OutlineItem } from './types';

interface OutlineSectionProps {
  items: OutlineItem[];
  isCollapsed: boolean;
  onToggle: () => void;
  onItemClick?: (position: number) => void;
}

/**
 * Outline Section Component
 * 
 * Shows document structure (headings) for navigation.
 * 
 * ┌─────────────────────────────────────┐
 * │ H1 Introduction                     │
 * │   H2 Background                     │
 * │   H2 Characters                     │
 * │     H3 The Hero                     │
 * │     H3 The Villain                  │
 * │ H1 Chapter One                      │
 * └─────────────────────────────────────┘
 */
export const OutlineSection: React.FC<OutlineSectionProps> = ({
  items,
  isCollapsed,
  onToggle,
  onItemClick,
}) => {
  if (isCollapsed) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-2 text-[12px] text-[var(--ide-foreground-muted,#8b8b8b)]">
        No outline available
      </div>
    );
  }

  return (
    <div className="vscode-outline" role="tree">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            'vscode-outline__item',
            'flex items-center h-[22px]',
            'cursor-pointer select-none',
            'hover:bg-[var(--ide-hover-bg,#2a2d2e)]'
          )}
          style={{ paddingLeft: `${8 + (item.level - 1) * 12}px` }}
          onClick={() => onItemClick?.(item.position)}
          role="treeitem"
        >
          {/* Heading Icon */}
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center mr-1">
            <HeadingIcon level={item.level} />
          </span>

          {/* Label */}
          <span
            className={cn(
              'flex-1 truncate text-[13px]',
              'text-[var(--ide-foreground,#cccccc)]',
              item.level === 1 && 'font-medium'
            )}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Heading level icon (H1, H2, H3)
 */
const HeadingIcon: React.FC<{ level: number }> = ({ level }) => {
  const colors: Record<number, string> = {
    1: '#569cd6', // Blue for H1
    2: '#4ec9b0', // Teal for H2
    3: '#ce9178', // Orange for H3
  };

  const color = colors[level] || colors[3];

  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill={color}>
      <text x="2" y="12" fontSize="10" fontWeight="bold" fontFamily="monospace">
        H{level}
      </text>
    </svg>
  );
};

export default OutlineSection;
