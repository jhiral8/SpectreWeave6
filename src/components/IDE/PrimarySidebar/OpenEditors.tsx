'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { X, Circle } from 'lucide-react';
import type { OpenEditor } from './types';

interface OpenEditorsProps {
  editors: OpenEditor[];
  onSelect?: (editorId: string) => void;
  onClose?: (editorId: string) => void;
}

/**
 * Open Editors Component
 * 
 * Shows list of currently open editor tabs.
 * 
 * ┌─────────────────────────────────────┐
 * │ ● Chapter 1.md              [×]    │
 * │   Scene 1.1.md              [×]    │
 * │   Characters.md             [×]    │  (active)
 * └─────────────────────────────────────┘
 */
export const OpenEditors: React.FC<OpenEditorsProps> = ({
  editors,
  onSelect,
  onClose,
}) => {
  return (
    <div className="vscode-open-editors">
      {editors.map((editor) => (
        <div
          key={editor.id}
          className={cn(
            'vscode-open-editors__item',
            'flex items-center gap-1 h-[22px] px-2',
            'cursor-pointer select-none',
            'hover:bg-[var(--ide-hover-bg,#2a2d2e)]',
            editor.isActive && 'bg-[var(--ide-accent-transparent,#094771)]',
            'group'
          )}
          onClick={() => onSelect?.(editor.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSelect?.(editor.id);
            }
          }}
        >
          {/* Modified Indicator / File Icon */}
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {editor.isModified ? (
              <Circle className="w-2 h-2 fill-current" />
            ) : (
              <FileIcon type={editor.icon} />
            )}
          </span>

          {/* File Name */}
          <span
            className={cn(
              'flex-1 truncate text-[13px]',
              'text-[var(--ide-foreground,#cccccc)]',
              editor.isModified && 'italic'
            )}
          >
            {editor.title}
          </span>

          {/* Close Button */}
          <button
            className={cn(
              'flex-shrink-0 w-4 h-4 flex items-center justify-center',
              'text-[var(--ide-foreground-muted,#c5c5c5)]',
              'hover:bg-[var(--ide-hover-bg,#5a5d5e)]',
              'rounded',
              'opacity-0 group-hover:opacity-100',
              editor.isActive && 'opacity-100'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onClose?.(editor.id);
            }}
            title="Close"
            aria-label={`Close ${editor.title}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {editors.length === 0 && (
        <div className="px-4 py-2 text-[12px] text-[var(--ide-foreground-muted,#8b8b8b)]">
          No editors open
        </div>
      )}
    </div>
  );
};

/**
 * Simple file icon based on type
 */
const FileIcon: React.FC<{ type?: string }> = ({ type }) => {
  // Default document icon
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--ide-foreground-muted,#c5c5c5)]">
      <path d="M13.71 4.29l-3-3L10 1H4L3 2v12l1 1h9l1-1V5l-.29-.71zM13 14H4V2h5v4h4v8zm-3-9V2l3 3h-3z"/>
    </svg>
  );
};

export default OpenEditors;
