/**
 * Command Palette Component
 * 
 * VS Code-style command palette accessible via ⌘K or ⌘⇧P.
 * Provides fuzzy search across all registered commands.
 */

'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search, Command as CommandIcon, X, ChevronRight } from 'lucide-react';
import { commandRegistry } from './CommandRegistry';
import { defaultCommands } from './defaultCommands';
import { 
  Command, 
  CommandContext, 
  CommandCategory,
  CATEGORY_LABELS, 
  CATEGORY_ICONS 
} from './types';
import { useAgents } from '../AIAgents/context/AgentContext';
import { usePanels } from '../PanelSystem/PanelContext';
import type { AgentId } from '../AIAgents/types';

// Register default commands on module load
commandRegistry.registerAll(defaultCommands);

interface CommandPaletteProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Support both controlled and uncontrolled modes
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = useCallback((open: boolean) => {
    setInternalIsOpen(open);
    onOpenChange?.(open);
  }, [onOpenChange]);
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const { runAgent } = useAgents();
  const { togglePanel, setActivePanel } = usePanels();

  // Build command context
  const context: CommandContext = useMemo(() => ({
    selection: '',
    cursorPosition: 0,
    previousText: '',
    followingText: '',
    currentChapter: null,
    currentScene: null,
    selectionWordCount: 0,
    runAgent: async (agentId: AgentId, content?: string) => {
      await runAgent(agentId, content ? { content, context: {} } : undefined);
    },
    insertText: (text: string) => {
      // Will be connected to editor
      console.log('Insert text:', text);
    },
    replaceSelection: (text: string) => {
      console.log('Replace selection:', text);
    },
    navigateTo: (id: string) => {
      console.log('Navigate to:', id);
    },
    togglePanel: (panel: string) => {
      if (panel === 'bottom') {
        togglePanel('bottom');
      } else {
        setActivePanel('left', panel as any);
      }
    },
    closePalette: () => setIsOpen(false),
  }), [runAgent, togglePanel, setActivePanel]);

  // Get filtered commands
  const filteredCommands = useMemo(() => {
    return commandRegistry.search(query, context);
  }, [query, context]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: { category: CommandCategory; commands: Command[] }[] = [];
    const categoryMap = new Map<CommandCategory, Command[]>();
    
    filteredCommands.forEach(cmd => {
      if (!categoryMap.has(cmd.category)) {
        categoryMap.set(cmd.category, []);
      }
      categoryMap.get(cmd.category)!.push(cmd);
    });
    
    // Order categories
    const categoryOrder: CommandCategory[] = ['ai', 'agent', 'editor', 'navigation', 'view', 'character', 'file'];
    categoryOrder.forEach(cat => {
      const cmds = categoryMap.get(cat);
      if (cmds && cmds.length > 0) {
        groups.push({ category: cat, commands: cmds });
      }
    });
    
    return groups;
  }, [filteredCommands]);

  // Flatten for keyboard navigation
  const flatCommands = useMemo(() => filteredCommands, [filteredCommands]);

  // Keyboard shortcut to open palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or ⌘⇧P to open
      if ((e.metaKey || e.ctrlKey) && (
        e.key === 'k' || 
        (e.shiftKey && e.key === 'p')
      )) {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Escape to close (only if palette is open and focused)
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation in the list
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          executeCommand(flatCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [flatCommands, selectedIndex]);

  // Execute command
  const executeCommand = useCallback((command: Command) => {
    if (command.isEnabled && !command.isEnabled(context)) {
      return;
    }
    command.execute(context);
  }, [context]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Palette */}
      <div className={cn(
        'fixed top-[15%] left-1/2 -translate-x-1/2 z-[101]',
        'w-[600px] max-w-[90vw] max-h-[60vh]',
        'bg-[--ide-sidebar-bg] border border-[--ide-border]',
        'rounded-xl shadow-2xl overflow-hidden',
        'flex flex-col',
        'animate-slide-down',
        className
      )}>
        {/* Search Input */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-3',
          'border-b border-[--ide-border]',
          'bg-[--ide-input-bg]'
        )}>
          <Search className="w-5 h-5 text-[--ide-foreground-muted] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className={cn(
              'flex-1 bg-transparent border-none outline-none',
              'text-[--ide-foreground] placeholder:text-[--ide-foreground-muted]',
              'text-base'
            )}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <kbd className={cn(
            'hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded',
            'bg-[--ide-border] text-[--ide-foreground-muted]',
            'text-[10px] font-mono'
          )}>
            ESC
          </kbd>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-[--ide-border] transition-colors"
          >
            <X className="w-4 h-4 text-[--ide-foreground-muted]" />
          </button>
        </div>
        
        {/* Command List */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto py-2"
        >
          {flatCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-[--ide-foreground-muted]">
              <p className="text-sm">No commands found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            groupedCommands.map((group) => (
              <div key={group.category} className="mb-2">
                {/* Category Header */}
                <div className="px-4 py-1.5 text-[10px] font-medium text-[--ide-foreground-muted] uppercase tracking-wider">
                  {CATEGORY_ICONS[group.category]} {CATEGORY_LABELS[group.category]}
                </div>
                
                {/* Commands */}
                {group.commands.map((command) => {
                  const globalIndex = flatCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;
                  const isEnabled = !command.isEnabled || command.isEnabled(context);
                  
                  return (
                    <button
                      key={command.id}
                      data-index={globalIndex}
                      onClick={() => isEnabled && executeCommand(command)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left',
                        'transition-colors',
                        isSelected 
                          ? 'bg-[--ide-list-active-bg] text-[--ide-list-active-fg]'
                          : 'hover:bg-[--ide-list-hover]',
                        !isEnabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {/* Icon */}
                      <span className="text-base flex-shrink-0 w-6 text-center">
                        {command.icon || CATEGORY_ICONS[command.category]}
                      </span>
                      
                      {/* Label & Description */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[--ide-foreground] truncate">
                          {command.label}
                        </div>
                        {command.description && (
                          <div className="text-[10px] text-[--ide-foreground-muted] truncate">
                            {command.description}
                          </div>
                        )}
                      </div>
                      
                      {/* Shortcut */}
                      {command.shortcut && (
                        <kbd className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-mono',
                          'bg-[--ide-border] text-[--ide-foreground-muted]',
                          'flex-shrink-0'
                        )}>
                          {command.shortcut}
                        </kbd>
                      )}
                      
                      {/* Arrow indicator */}
                      {isSelected && (
                        <ChevronRight className="w-4 h-4 text-[--ide-foreground-muted] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className={cn(
          'flex items-center justify-between px-4 py-2',
          'border-t border-[--ide-border]',
          'text-[10px] text-[--ide-foreground-muted]'
        )}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[--ide-border]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[--ide-border]">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[--ide-border]">ESC</kbd>
              Close
            </span>
          </div>
          <span>{flatCommands.length} commands</span>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
