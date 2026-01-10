// Agent Result Actions Component
// Floating action bar for AI-generated content

'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  FileInput,
  Replace,
  Copy,
  Check,
  X,
  RefreshCw,
  ChevronDown,
  Wand2,
  FileText,
} from 'lucide-react';

interface AgentResultActionsProps {
  // The generated content
  content: string;
  // Is this a replacement or insertion?
  mode: 'insert' | 'replace' | 'both';
  // Callbacks
  onInsert: () => void;
  onReplace: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
  onDismiss: () => void;
  // State
  isRegenerating?: boolean;
  // Position (for floating)
  position?: 'inline' | 'floating' | 'bottom';
  className?: string;
}

export const AgentResultActions: React.FC<AgentResultActionsProps> = ({
  content,
  mode,
  onInsert,
  onReplace,
  onCopy,
  onRegenerate,
  onDismiss,
  isRegenerating = false,
  position = 'inline',
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);
  
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  }, [content, onCopy]);
  
  const baseClasses = cn(
    'agent-result-actions flex items-center gap-1',
    position === 'floating' && [
      'fixed z-50 p-1.5 rounded-lg shadow-lg',
      'bg-[--ide-tooltip-bg] border border-[--ide-border]',
      'animate-fade-in',
    ],
    position === 'inline' && [
      'p-1 rounded-md',
      'bg-[--ide-sidebar-bg] border border-[--ide-border]',
    ],
    position === 'bottom' && [
      'p-2 border-t border-[--ide-border]',
      'bg-[--ide-sidebar-bg]',
    ],
    className
  );
  
  const buttonClasses = cn(
    'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium',
    'transition-colors duration-150',
    'focus:outline-none focus:ring-1 focus:ring-[--ide-focus-border]'
  );
  
  const primaryButton = cn(
    buttonClasses,
    'bg-[--ide-activitybar-badge] text-white',
    'hover:opacity-90',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );
  
  const secondaryButton = cn(
    buttonClasses,
    'text-[--ide-foreground]',
    'hover:bg-[--ide-list-hover-bg]',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );
  
  const iconButton = cn(
    'p-1.5 rounded',
    'text-[--ide-activitybar-inactive]',
    'hover:text-[--ide-foreground] hover:bg-[--ide-list-hover-bg]',
    'transition-colors duration-150',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );
  
  return (
    <div className={baseClasses}>
      {/* Primary actions */}
      <div className="flex items-center gap-1">
        {(mode === 'insert' || mode === 'both') && (
          <button
            onClick={onInsert}
            className={primaryButton}
            title="Insert at cursor (⌘↵)"
          >
            <FileInput className="w-3.5 h-3.5" />
            Insert
          </button>
        )}
        
        {(mode === 'replace' || mode === 'both') && (
          <button
            onClick={onReplace}
            className={mode === 'both' ? secondaryButton : primaryButton}
            title="Replace selection"
          >
            <Replace className="w-3.5 h-3.5" />
            Replace
          </button>
        )}
      </div>
      
      {/* Divider */}
      <div className="w-px h-4 bg-[--ide-border] mx-1" />
      
      {/* Secondary actions */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleCopy}
          className={iconButton}
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-[--ide-success]" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
        
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className={iconButton}
          title="Regenerate (⌘R)"
        >
          <RefreshCw className={cn(
            'w-3.5 h-3.5',
            isRegenerating && 'animate-spin'
          )} />
        </button>
        
        <button
          onClick={onDismiss}
          className={iconButton}
          title="Dismiss (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// Expanded result panel with preview
interface AgentResultPanelProps {
  content: string;
  agentName: string;
  mode: 'insert' | 'replace' | 'both';
  onInsert: () => void;
  onReplace: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
  onDismiss: () => void;
  isRegenerating?: boolean;
  className?: string;
}

export const AgentResultPanel: React.FC<AgentResultPanelProps> = ({
  content,
  agentName,
  mode,
  onInsert,
  onReplace,
  onCopy,
  onRegenerate,
  onDismiss,
  isRegenerating = false,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const wordCount = content.trim().split(/\s+/).length;
  
  return (
    <div className={cn(
      'agent-result-panel rounded-lg overflow-hidden',
      'bg-[--ide-sidebar-bg] border border-[--ide-border]',
      'shadow-lg',
      className
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-3 py-2',
        'bg-[--ide-input-bg] border-b border-[--ide-border]'
      )}>
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-[--ide-activitybar-badge]" />
          <span className="text-sm font-medium">{agentName}</span>
          <span className="text-xs text-[--ide-activitybar-inactive]">
            {wordCount} words
          </span>
        </div>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-[--ide-list-hover-bg]"
        >
          <ChevronDown className={cn(
            'w-4 h-4 transition-transform',
            isCollapsed && '-rotate-90'
          )} />
        </button>
      </div>
      
      {/* Content preview */}
      {!isCollapsed && (
        <div className={cn(
          'p-3 max-h-[200px] overflow-y-auto',
          'prose prose-sm dark:prose-invert',
          'text-[--ide-foreground]'
        )}>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <AgentResultActions
        content={content}
        mode={mode}
        onInsert={onInsert}
        onReplace={onReplace}
        onCopy={onCopy}
        onRegenerate={onRegenerate}
        onDismiss={onDismiss}
        isRegenerating={isRegenerating}
        position="bottom"
      />
    </div>
  );
};

// Inline suggestion with diff preview
interface InlineSuggestionProps {
  originalText: string;
  suggestedText: string;
  onAccept: () => void;
  onReject: () => void;
  className?: string;
}

export const InlineSuggestion: React.FC<InlineSuggestionProps> = ({
  originalText,
  suggestedText,
  onAccept,
  onReject,
  className,
}) => {
  return (
    <div className={cn(
      'inline-suggestion rounded border border-[--ide-ai-accent]',
      'bg-[--ide-ai-accent]/10',
      className
    )}>
      {/* Original text (strikethrough) */}
      {originalText && (
        <span className="line-through opacity-50 text-[--ide-error]">
          {originalText}
        </span>
      )}
      
      {/* Arrow or separator */}
      {originalText && suggestedText && (
        <span className="mx-1 text-[--ide-activitybar-inactive]">→</span>
      )}
      
      {/* Suggested text */}
      <span className="text-[--ide-ai-accent] font-medium">
        {suggestedText}
      </span>
      
      {/* Inline actions */}
      <span className="ml-2 inline-flex items-center gap-1">
        <button
          onClick={onAccept}
          className={cn(
            'p-0.5 rounded',
            'text-[--ide-success] hover:bg-[--ide-success]/10'
          )}
          title="Accept (Tab)"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={onReject}
          className={cn(
            'p-0.5 rounded',
            'text-[--ide-error] hover:bg-[--ide-error]/10'
          )}
          title="Reject (Esc)"
        >
          <X className="w-3 h-3" />
        </button>
      </span>
    </div>
  );
};
