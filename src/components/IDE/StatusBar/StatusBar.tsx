'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import {
  FileText,
  AlertCircle,
  AlertTriangle,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Bot,
  Sparkles,
  Type,
  Clock,
  BookOpen,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { usePanels } from '../PanelSystem/PanelContext';

interface StatusBarProps {
  editor: Editor | null;
  projectTitle?: string;
  problemCount?: { errors: number; warnings: number };
  aiStatus?: 'idle' | 'working' | 'error';
  isSynced?: boolean;
  isOnline?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  editor,
  projectTitle = 'Untitled',
  problemCount = { errors: 0, warnings: 0 },
  aiStatus = 'idle',
  isSynced = true,
  isOnline = true,
}) => {
  const { layout, togglePanel, setActivePanel } = usePanels();
  const [showWordCountDetails, setShowWordCountDetails] = useState(false);
  
  // Calculate stats
  const stats = useMemo(() => {
    if (!editor) return { words: 0, chars: 0, lines: 0, readingTime: 0 };
    
    const text = editor.getText();
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    return {
      words,
      chars: text.length,
      lines: text.split('\n').length,
      // Average reading speed: 200 words per minute
      readingTime: Math.max(1, Math.ceil(words / 200)),
    };
  }, [editor]);
  
  // Get cursor position
  const cursorPosition = useMemo(() => {
    if (!editor) return { line: 1, col: 1 };
    
    const { $from } = editor.state.selection;
    const doc = editor.state.doc;
    
    let line = 1;
    let col = 1;
    let currentPos = 0;
    
    doc.descendants((node, pos) => {
      if (pos >= $from.pos) return false;
      
      if (node.isBlock && pos > 0) {
        line++;
        currentPos = pos + node.nodeSize;
      }
    });
    
    col = $from.pos - currentPos + 1;
    
    return { line, col };
  }, [editor?.state.selection]);
  
  const handleProblemsClick = useCallback(() => {
    togglePanel('bottom');
  }, [togglePanel]);
  
  const handleWordCountClick = useCallback(() => {
    setShowWordCountDetails(prev => !prev);
  }, []);

  const handleAIChatClick = useCallback(() => {
    if (layout.rightPanel.isVisible && layout.rightPanel.activePanel === 'ai-chat') {
      // Toggle off if already showing AI Chat
      togglePanel('right');
    } else {
      // Show AI Chat panel
      setActivePanel('right', 'ai-chat');
    }
  }, [layout.rightPanel, togglePanel, setActivePanel]);
  
  const totalProblems = problemCount.errors + problemCount.warnings;
  const isAIChatActive = layout.rightPanel.isVisible && layout.rightPanel.activePanel === 'ai-chat';

  return (
    <div className={cn(
      'vscode-statusbar flex items-center',
      'h-[22px] min-h-[22px]', // Exact VS Code height
      'bg-[var(--ide-accent,#007acc)]',
      'text-[var(--ide-foreground,#ffffff)]',
      'text-[12px] select-none flex-shrink-0'
    )}
    role="status"
    aria-label="Status Bar"
    >
      {/* Left section */}
      <div className="vscode-statusbar__left flex items-center h-full">
        {/* Remote indicator (like VSCode's remote status) */}
        <StatusBarItem 
          icon={FileText}
          label={projectTitle}
          tooltip="Current project"
          className="bg-[var(--ide-accent,#16825d)] hover:bg-[var(--ide-accent,#16825d)]"
        />
        
        {/* Git branch indicator */}
        <StatusBarItem
          label="main*"
          tooltip="Git branch: main (modified)"
          onClick={() => {/* TODO: Git actions */}}
        />
        
        {/* Problems indicator - always visible */}
        <StatusBarItem
          icon={totalProblems > 0 
            ? (problemCount.errors > 0 ? AlertCircle : AlertTriangle) 
            : CheckCircle}
          label={`${problemCount.errors} ${problemCount.warnings}`}
          onClick={handleProblemsClick}
          tooltip={`${problemCount.errors} errors, ${problemCount.warnings} warnings`}
          className={cn(
            problemCount.errors > 0 && 'text-[var(#f14c4c,#f14c4c)]',
            problemCount.warnings > 0 && !problemCount.errors && 'text-[var(#cca700,#cca700)]'
          )}
        />
      </div>
      
      {/* Center section - spacer */}
      <div className="flex-1" />
      
      {/* Right section */}
      <div className="vsc-statusbar__right flex items-center h-full">
        {/* Ghost Writer Toggle - like VS Code Copilot */}
        <StatusBarItem
          icon={MessageSquare}
          label="Ghost Writer"
          onClick={handleAIChatClick}
          tooltip={isAIChatActive ? 'Hide Ghost Writer (⌘⇧G)' : 'Show Ghost Writer (⌘⇧G)'}
          className={cn(
            isAIChatActive && 'bg-[var(--ide-hover-bg,#ffffff1f)]'
          )}
        />

        {/* AI Status - always visible */}
        <StatusBarItem
          icon={aiStatus === 'working' ? Sparkles : Bot}
          label={
            aiStatus === 'working' ? 'AI Writing...' 
            : aiStatus === 'error' ? 'AI Error' 
            : 'AI Ready'
          }
          tooltip={
            aiStatus === 'working' ? 'AI is generating content' 
            : aiStatus === 'error' ? 'AI encountered an error' 
            : 'AI assistant ready'
          }
          className={cn(
            aiStatus === 'working' && 'text-[--vsc-activitybar-badge-bg] animate-pulse',
            aiStatus === 'error' && 'text-[--ide-error]'
          )}
        />
        
        {/* Reading time */}
        <StatusBarItem
          icon={Clock}
          label={`${stats.readingTime} min`}
          tooltip={`Estimated reading time: ${stats.readingTime} minutes`}
        />
        
        {/* Word count with expandable details */}
        <StatusBarItem
          icon={Type}
          label={showWordCountDetails 
            ? `${stats.words.toLocaleString()}w ${stats.chars.toLocaleString()}c ${stats.lines}ln`
            : `${stats.words.toLocaleString()} words`}
          onClick={handleWordCountClick}
          tooltip="Click for detailed stats"
        />
        
        {/* Cursor position */}
        <StatusBarItem
          label={`Ln ${cursorPosition.line}, Col ${cursorPosition.col}`}
          tooltip="Go to Line"
          onClick={() => {/* TODO: Show go to line dialog */}}
        />
        
        {/* Sync status */}
        <StatusBarItem
          icon={isSynced ? Cloud : CloudOff}
          label={isSynced ? '' : 'Saving...'}
          tooltip={isSynced ? 'All changes saved' : 'Saving changes...'}
          className={!isSynced ? 'animate-pulse' : ''}
        />
        
        {/* Online status - only show when offline */}
        {!isOnline && (
          <StatusBarItem
            icon={WifiOff}
            label="Offline"
            tooltip="No internet connection"
            className="text-[--ide-warning]"
          />
        )}
      </div>
    </div>
  );
};

// Individual status bar item
interface StatusBarItemProps {
  icon?: React.ElementType;
  label?: string;
  onClick?: () => void;
  className?: string;
  tooltip?: string;
}

const StatusBarItem: React.FC<StatusBarItemProps> = ({
  icon: Icon,
  label,
  onClick,
  className,
  tooltip,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative h-full">
      <button
        onClick={onClick}
        disabled={!onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          'vscode-statusbar__item flex items-center gap-1.5 h-full px-2',
          'transition-colors duration-100',
          onClick 
            ? 'hover:bg-[var(--ide-hover-bg,#ffffff1f)] cursor-pointer' 
            : 'cursor-default',
          className
        )}
        aria-label={tooltip || label}
      >
        {Icon && <Icon className="w-[14px] h-[14px]" />}
        {label && <span className="leading-none">{label}</span>}
      </button>
      
      {/* Tooltip - VS Code style */}
      {tooltip && showTooltip && (
        <div className={cn(
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5',
          'px-2 py-1 rounded text-[12px] whitespace-nowrap',
          'bg-[var(--ide-bg-elevated,#252526)]',
          'text-[var(--ide-foreground,#cccccc)]',
          'border border-[var(--ide-border,#454545)]',
          'shadow-lg pointer-events-none z-50'
        )}>
          {tooltip}
        </div>
      )}
    </div>
  );
};
