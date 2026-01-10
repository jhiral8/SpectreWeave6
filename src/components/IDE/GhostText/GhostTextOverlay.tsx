// Ghost Text Overlay Component
// Renders the semi-transparent suggestion text in the editor

'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { GhostTextSuggestion } from './types';

interface GhostTextOverlayProps {
  suggestion: GhostTextSuggestion | null;
  position: { top: number; left: number } | null;
  isGenerating: boolean;
  onAccept: () => void;
  onDismiss: () => void;
  className?: string;
}

export const GhostTextOverlay: React.FC<GhostTextOverlayProps> = ({
  suggestion,
  position,
  isGenerating,
  onAccept,
  onDismiss,
  className,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Don't render if no suggestion or position
  if (!suggestion || !position) {
    if (isGenerating) {
      // Show loading indicator
      return (
        <div
          className={cn(
            'ghost-text-loading fixed pointer-events-none',
            'text-[--ghost-text-color] opacity-50',
            className
          )}
          style={{
            top: position?.top ?? 0,
            left: position?.left ?? 0,
          }}
        >
          <span className="inline-flex items-center gap-1">
            <span className="w-1 h-1 bg-current rounded-full animate-pulse" />
            <span className="w-1 h-1 bg-current rounded-full animate-pulse delay-100" />
            <span className="w-1 h-1 bg-current rounded-full animate-pulse delay-200" />
          </span>
        </div>
      );
    }
    return null;
  }
  
  return (
    <div
      ref={overlayRef}
      className={cn(
        'ghost-text-overlay fixed pointer-events-none z-50',
        'font-[family-name:var(--writing-font)]',
        'text-[length:var(--writing-font-size)]',
        'leading-[var(--writing-line-height)]',
        className
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Ghost text */}
      <span
        className={cn(
          'ghost-text',
          'text-[--ghost-text-color]',
          'opacity-[var(--ghost-text-opacity,0.4)]',
          'animate-ghost-text-appear'
        )}
      >
        {suggestion.text}
      </span>
      
      {/* Hint tooltip */}
      <div
        className={cn(
          'ghost-text-hint absolute -top-6 left-0',
          'px-1.5 py-0.5 rounded text-[10px]',
          'bg-[--ide-tooltip-bg] text-[--ide-tooltip-fg]',
          'border border-[--ide-border]',
          'whitespace-nowrap opacity-0 group-hover:opacity-100',
          'transition-opacity'
        )}
      >
        <kbd className="font-mono">Tab</kbd> to accept
        <span className="mx-1">·</span>
        <kbd className="font-mono">Esc</kbd> to dismiss
      </div>
    </div>
  );
};

// Inline ghost text component for TipTap
interface InlineGhostTextProps {
  text: string;
  className?: string;
}

export const InlineGhostText: React.FC<InlineGhostTextProps> = ({
  text,
  className,
}) => {
  return (
    <span
      className={cn(
        'ghost-text-inline',
        'text-[--ghost-text-color]',
        'opacity-[var(--ghost-text-opacity,0.4)]',
        'pointer-events-none select-none',
        className
      )}
      contentEditable={false}
      data-ghost-text="true"
    >
      {text}
    </span>
  );
};

// Ghost text with streaming effect
interface StreamingGhostTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

export const StreamingGhostText: React.FC<StreamingGhostTextProps> = ({
  text,
  isStreaming,
  className,
}) => {
  const [displayText, setDisplayText] = React.useState('');
  const [charIndex, setCharIndex] = React.useState(0);
  
  useEffect(() => {
    if (!isStreaming) {
      setDisplayText(text);
      return;
    }
    
    if (charIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.slice(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      }, 15); // Type speed
      
      return () => clearTimeout(timer);
    }
  }, [text, charIndex, isStreaming]);
  
  // Reset when text changes
  useEffect(() => {
    setCharIndex(0);
    setDisplayText('');
  }, [text]);
  
  return (
    <span
      className={cn(
        'ghost-text-streaming',
        'text-[--ghost-text-color]',
        'opacity-[var(--ghost-text-opacity,0.4)]',
        className
      )}
    >
      {displayText}
      {isStreaming && charIndex < text.length && (
        <span className="animate-pulse">▋</span>
      )}
    </span>
  );
};
