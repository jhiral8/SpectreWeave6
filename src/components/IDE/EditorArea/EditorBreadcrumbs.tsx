'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import type { EditorBreadcrumbsProps, BreadcrumbItem } from './types';

/**
 * Editor Breadcrumbs Component
 * 
 * VS Code-style breadcrumb navigation showing document path.
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │ 📁 My Novel > 📖 Part One > 📄 Chapter 3 > # Heading   │
 * └─────────────────────────────────────────────────────────┘
 */
export const EditorBreadcrumbs: React.FC<EditorBreadcrumbsProps> = ({
  items,
  onItemClick,
  showIcons = true,
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn(
        'vscode-breadcrumbs',
        'flex items-center gap-0.5',
        'h-[22px] px-3',
        'bg-[var(--vscode-breadcrumb-background,#1e1e1e)]',
        'border-b border-[var(--vscode-breadcrumb-border,transparent)]',
        'text-[12px]',
        'overflow-x-auto overflow-y-hidden',
        'scrollbar-none'
      )}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {/* Separator (except for first item) */}
          {index > 0 && (
            <ChevronRight
              className="w-3 h-3 flex-shrink-0 text-[var(--vscode-breadcrumb-foreground,#8a8a8a)]"
              aria-hidden="true"
            />
          )}

          {/* Breadcrumb Item */}
          <button
            className={cn(
              'vscode-breadcrumb-item',
              'flex items-center gap-1',
              'px-1 py-0.5 rounded',
              'text-[var(--vscode-breadcrumb-foreground,#8a8a8a)]',
              'hover:text-[var(--vscode-breadcrumb-focusForeground,#e0e0e0)]',
              'hover:bg-[var(--vscode-breadcrumb-activeSelectionBackground,#2d2d30)]',
              'focus:outline-none focus:ring-1 focus:ring-[var(--ide-accent,#007fd4)]',
              'whitespace-nowrap'
            )}
            onClick={() => onItemClick?.(item)}
            title={item.path || item.label}
          >
            {showIcons && (
              <BreadcrumbIcon type={item.type} />
            )}
            <span>{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

/**
 * Breadcrumb icon based on item type
 */
const BreadcrumbIcon: React.FC<{ type: BreadcrumbItem['type'] }> = ({ type }) => {
  const iconClass = "w-3.5 h-3.5 flex-shrink-0";
  
  switch (type) {
    case 'project':
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="#dcb67a">
          <path d="M14.5 3H7.71l-1-1H1.5l-.5.5v11l.5.5h13l.5-.5v-10l-.5-.5zm-.5 10H2V4h3.29l1 1H14v8z"/>
        </svg>
      );
    case 'folder':
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="#dcb67a">
          <path d="M14.5 3H7.71l-1-1H1.5l-.5.5v11l.5.5h13l.5-.5v-10l-.5-.5zm-.5 10H2V4h3.29l1 1H14v8z"/>
        </svg>
      );
    case 'chapter':
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="#519aba">
          <path d="M14.5 2h-13l-.5.5v11l.5.5h13l.5-.5v-11l-.5-.5zm-.5 11H2V3h12v10zM4 6h8v1H4V6zm0 3h8v1H4V9z"/>
        </svg>
      );
    case 'scene':
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="#a074c4">
          <path d="M13.71 4.29l-3-3L10 1H4L3 2v12l1 1h9l1-1V5l-.29-.71zM13 14H4V2h5v4h4v8zm-3-9V2l3 3h-3z"/>
        </svg>
      );
    case 'heading':
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="#569cd6">
          <text x="2" y="12" fontSize="10" fontWeight="bold" fontFamily="monospace">#</text>
        </svg>
      );
    default:
      return null;
  }
};

export default EditorBreadcrumbs;
