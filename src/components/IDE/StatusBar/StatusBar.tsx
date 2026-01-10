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
  const { togglePanel } = usePanels();
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
  
  const totalProblems = problemCount.errors + problemCount.warnings;

  return (
    <div className={cn(
      'status-bar flex items-center',
      'h-[22px] min-h-[22px]',
      'bg-[--ide-statusbar-bg] text-[--ide-statusbar-fg]',
      'text-[12px] select-none flex-shrink-0'
    )}>
      {/* Left section */}
      <div className="flex items-center h-full">
        {/* Remote indicator (like VSCode's remote status) */}
        <StatusBarItem 
          icon={FileText}
          label={projectTitle}
          tooltip="Current project"
          className="bg-[--ide-accent] hover:bg-[--ide-accent-hover]"
        />
        
        {/* Problems indicator - always visible */}
        <StatusBarItem
          icon={totalProblems > 0 
            ? (problemCount.errors > 0 ? AlertCircle : AlertTriangle) 
            : CheckCircle}
          label={totalProblems > 0 
            ? `${problemCount.errors} ${problemCount.warnings}` 
            : ''}
          onClick={handleProblemsClick}
          tooltip={`${problemCount.errors} errors, ${problemCount.warnings} warnings`}
          className={cn(
            problemCount.errors > 0 && 'text-[--ide-error]',
            problemCount.warnings > 0 && !problemCount.errors && 'text-[--ide-warning]'
          )}
        />
      </div>
      
      {/* Center section - spacer */}
      <div className="flex-1" />
      
      {/* Right section */}
      <div className="flex items-center h-full">
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
            aiStatus === 'working' && 'text-[--ide-activitybar-badge] animate-pulse',
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
          'flex items-center gap-1.5 h-full px-2',
          'transition-colors duration-100',
          onClick ? 'hover:bg-[--ide-statusbar-item-hover] cursor-pointer' : 'cursor-default',
          className
        )}
        aria-label={tooltip || label}
      >
        {Icon && <Icon className="w-[14px] h-[14px]" />}
        {label && <span className="leading-none">{label}</span>}
      </button>
      
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className={cn(
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5',
          'px-2 py-1 rounded text-[11px] whitespace-nowrap',
          'bg-[--ide-background-tertiary] text-[--ide-foreground]',
          'border border-[--ide-border] shadow-lg',
          'pointer-events-none z-50',
          'animate-in fade-in-0 slide-in-from-bottom-1 duration-100'
        )}>
          {tooltip}
        </div>
      )}
    </div>
  );
};
