'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CommandPaletteSearchProps } from './types';
import { Search } from 'lucide-react';

/**
 * CommandPaletteSearch Component
 * 
 * VS Code-style centered search input that opens the Command Palette.
 * Shows keyboard shortcut hint and search icon.
 */
export const CommandPaletteSearch: React.FC<CommandPaletteSearchProps> = ({
  placeholder = '⌘K Command Palette...',
  shortcut = '⌘K',
  onOpen,
  disabled = false,
  className,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onOpen?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Open on Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      className={cn(
        'command-palette-search',
        'flex items-center gap-2',
        'w-full max-w-[600px] min-w-[200px]',
        'h-[22px]',
        'px-2',
        'bg-[var(--ide-bg,#3c3c3c)]',
        'border border-[var(--ide-border,#3c3c3c)]',
        'rounded',
        'text-[12px] text-left',
        'text-[var(--ide-foreground-muted,#8c8c8c)]',
        'hover:bg-[var(--ide-bg,#3c3c3c)]',
        'hover:border-[var(--ide-accent,#007acc)]',
        'focus:border-[var(--ide-accent,#007acc)]',
        'focus:outline-none',
        'transition-colors',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      role="button"
      aria-label={`Open Command Palette (${shortcut})`}
    >
      <Search className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate">{placeholder}</span>
    </button>
  );
};

export default CommandPaletteSearch;
