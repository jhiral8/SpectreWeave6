'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search, ChevronRight, Command, Keyboard } from 'lucide-react';
import type { Command as CommandType } from './types';
import { defaultCommands } from './defaultCommands';

interface CommandPaletteProps {
  /** Whether the palette is open */
  isOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Additional commands to include */
  commands?: CommandType[];
  /** Callback when command is executed */
  onCommandExecute?: (command: CommandType) => void;
}

/**
 * VS Code-style Command Palette
 * 
 * Modal with fuzzy search for commands, files, and actions.
 * 
 * ┌──────────────────────────────────────────────────────────┐
 * │ >  Search commands...                                   │
 * ├──────────────────────────────────────────────────────────┤
 * │   📄 Open File                                    ⌘O   │
 * │   💾 Save                                         ⌘S   │
 * │   🔍 Find in Files                                ⌘⇧F  │
 * │ > 👤 Characters: Show Panel                       ⌘2   │
 * │   🤖 AI: Generate Content                         ⌘G   │
 * └──────────────────────────────────────────────────────────┘
 */
export function CommandPalette({
  isOpen = false,
  onOpenChange,
  commands = [],
  onCommandExecute,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Combine default and custom commands
  const allCommands = useMemo(() => {
    return [...defaultCommands, ...commands];
  }, [commands]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return allCommands.slice(0, 10); // Show recent/popular when no query
    }

    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/);

    return allCommands
      .map(cmd => {
        const titleLower = cmd.title.toLowerCase();
        const categoryLower = (cmd.category || '').toLowerCase();
        const keywordsLower = (cmd.keywords || []).map((k: string) => k.toLowerCase());

        // Calculate match score
        let score = 0;
        
        // Exact match in title
        if (titleLower.includes(lowerQuery)) {
          score += 100;
        }
        
        // Term matches
        for (const term of terms) {
          if (titleLower.includes(term)) score += 50;
          if (categoryLower.includes(term)) score += 30;
          if (keywordsLower.some((k: string) => k.includes(term))) score += 20;
        }

        // Prefix match bonus
        if (titleLower.startsWith(lowerQuery)) {
          score += 50;
        }

        return { ...cmd, score };
      })
      .filter(cmd => cmd.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
  }, [allCommands, query]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onOpenChange?.(false);
        break;
    }
  }, [filteredCommands, selectedIndex, onOpenChange]);

  // Execute a command
  const executeCommand = useCallback((command: CommandType) => {
    onCommandExecute?.(command);
    command.action?.();
    onOpenChange?.(false);
  }, [onCommandExecute, onOpenChange]);

  // Close on backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange?.(false);
    }
  }, [onOpenChange]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        'flex items-start justify-center pt-[15vh]',
        'bg-black/50'
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'w-full max-w-[600px]',
          'bg-[var(--ide-bg-elevated,#252526)]',
          'border border-[var(--ide-border,#454545)]',
          'rounded-md shadow-2xl',
          'overflow-hidden',
          'animate-vscode-slide-up'
        )}
        role="dialog"
        aria-label="Command Palette"
      >
        {/* Search Input */}
        <div className="flex items-center px-3 border-b border-[var(--ide-border,#454545)]">
          <ChevronRight className="w-4 h-4 text-[var(--ide-foreground,#cccccc)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className={cn(
              'flex-1 h-[36px] px-2',
              'bg-transparent',
              'text-[14px]',
              'text-[var(--ide-foreground,#cccccc)]',
              'placeholder:text-[var(--ide-foreground-muted,#8c8c8c)]',
              'outline-none'
            )}
          />
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          className={cn(
            'max-h-[300px] overflow-y-auto',
            'vscode-scrollbar'
          )}
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-[var(--ide-foreground-muted,#8c8c8c)]">
              No commands found
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <CommandItem
                key={command.id}
                command={command}
                isSelected={index === selectedIndex}
                onClick={() => executeCommand(command)}
                onMouseEnter={() => setSelectedIndex(index)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Individual command item
 */
interface CommandItemProps {
  command: CommandType & { score?: number };
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

const CommandItem: React.FC<CommandItemProps> = ({
  command,
  isSelected,
  onClick,
  onMouseEnter,
}) => {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2',
        'text-left text-[13px]',
        isSelected
          ? 'bg-[var(--ide-accent-transparent,#094771)] text-[var(--ide-foreground,#ffffff)]'
          : 'text-[var(--ide-foreground,#cccccc)] hover:bg-[var(--ide-hover-bg,#2a2d2e)]'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      {/* Icon */}
      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        {command.icon || <Command className="w-4 h-4" />}
      </span>

      {/* Label + Category */}
      <span className="flex-1 truncate">
        {command.category && (
          <span className="text-[var(--ide-foreground-muted,#8c8c8c)]">
            {command.category}:{' '}
          </span>
        )}
        {command.title}
      </span>

      {/* Shortcut */}
      {command.shortcut && (
        <span className="flex items-center gap-1 text-[11px] text-[var(--ide-foreground-muted,#8c8c8c)]">
          {formatShortcut(command.shortcut)}
        </span>
      )}
    </button>
  );
};

/**
 * Format keyboard shortcut for display
 */
function formatShortcut(shortcut: string): React.ReactNode {
  const parts = shortcut.split('+').map((part, i) => {
    const key = part.trim();
    return (
      <kbd
        key={i}
        className={cn(
          'px-1.5 py-0.5',
          'bg-[var(--ide-bg,#3c3c3c)]',
          'border border-[var(--ide-border,#333333)]',
          'rounded text-[10px] font-medium'
        )}
      >
        {key}
      </kbd>
    );
  });

  return (
    <span className="flex items-center gap-0.5">
      {parts}
    </span>
  );
}

export default CommandPalette;