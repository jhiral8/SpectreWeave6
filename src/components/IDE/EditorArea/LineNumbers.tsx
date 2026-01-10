'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { LineNumbersProps, DEFAULT_LINE_HEIGHT } from './types';

/**
 * Line Numbers Component
 * 
 * VS Code-style line numbers with current line highlighting.
 * 
 * ┌────┐
 * │  1 │
 * │  2 │  ← current line (highlighted)
 * │  3 │
 * │  4 │
 * │  5 │
 * └────┘
 */
export const LineNumbers: React.FC<LineNumbersProps> = ({
  lineCount,
  currentLine,
  startLine = 1,
  visibleLines,
  lineHeight = 20,
  onLineClick,
}) => {
  // Calculate the width needed to fit the largest line number
  const gutterWidth = useMemo(() => {
    const digits = Math.max(2, String(lineCount).length);
    return digits * 9 + 16; // ~9px per digit + padding
  }, [lineCount]);

  // Generate line numbers to display
  const lines = useMemo(() => {
    const count = visibleLines || lineCount;
    const endLine = Math.min(startLine + count - 1, lineCount);
    const result: number[] = [];
    
    for (let i = startLine; i <= endLine; i++) {
      result.push(i);
    }
    
    return result;
  }, [lineCount, startLine, visibleLines]);

  return (
    <div
      className={cn(
        'vscode-line-numbers',
        'flex flex-col',
        'bg-[var(--vscode-editorGutter-background,#1e1e1e)]',
        'text-[var(--vscode-editorLineNumber-foreground,#858585)]',
        'font-mono text-[13px]',
        'select-none',
        'border-r border-[var(--vscode-editorGutter-border,transparent)]'
      )}
      style={{ width: `${gutterWidth}px` }}
      role="presentation"
      aria-hidden="true"
    >
      {lines.map((lineNumber) => (
        <div
          key={lineNumber}
          className={cn(
            'vscode-line-number',
            'px-2 text-right',
            'cursor-pointer',
            'hover:text-[var(--vscode-editorLineNumber-activeForeground,#c6c6c6)]',
            lineNumber === currentLine && [
              'text-[var(--vscode-editorLineNumber-activeForeground,#c6c6c6)]',
              'bg-[var(--vscode-editor-lineHighlightBackground,#282828)]',
            ]
          )}
          style={{ height: `${lineHeight}px`, lineHeight: `${lineHeight}px` }}
          onClick={() => onLineClick?.(lineNumber)}
        >
          {lineNumber}
        </div>
      ))}
    </div>
  );
};

export default LineNumbers;
