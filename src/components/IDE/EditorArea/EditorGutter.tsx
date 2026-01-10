'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, Bookmark } from 'lucide-react';
import type { EditorGutterProps, LineInfo } from './types';

/**
 * Editor Gutter Component
 * 
 * VS Code-style gutter with line numbers, fold indicators, and decorations.
 * 
 * ┌─────────────┐
 * │   ▼  1  ●  │  fold indicator, line number, bookmark
 * │      2     │
 * │      3     │  ← current line (highlighted)
 * │   ▶  4     │  collapsed fold
 * │      5  ⚠  │  warning decoration
 * └─────────────┘
 */
export const EditorGutter: React.FC<EditorGutterProps> = ({
  lines,
  currentLine,
  startLine = 1,
  lineHeight = 20,
  showLineNumbers = true,
  showFolding = true,
  onLineClick,
  onFoldToggle,
  onBookmarkToggle,
}) => {
  // Calculate the width needed for line numbers
  const lineNumberWidth = useMemo(() => {
    const maxLine = lines.length > 0 ? lines[lines.length - 1].number : 1;
    const digits = Math.max(2, String(maxLine).length);
    return digits * 9 + 8; // ~9px per digit + padding
  }, [lines]);

  // Total gutter width
  const gutterWidth = useMemo(() => {
    let width = 0;
    if (showFolding) width += 16; // Fold indicator column
    if (showLineNumbers) width += lineNumberWidth;
    width += 20; // Decoration column (bookmarks, errors)
    return width;
  }, [showFolding, showLineNumbers, lineNumberWidth]);

  return (
    <div
      className={cn(
        'vscode-gutter',
        'flex flex-col',
        'bg-[var(--vscode-editorGutter-background,#1e1e1e)]',
        'select-none flex-shrink-0'
      )}
      style={{ width: `${gutterWidth}px` }}
      role="presentation"
    >
      {lines.map((line) => (
        <GutterLine
          key={line.number}
          line={line}
          isCurrentLine={line.number === currentLine}
          lineHeight={lineHeight}
          showFolding={showFolding}
          showLineNumbers={showLineNumbers}
          lineNumberWidth={lineNumberWidth}
          onLineClick={onLineClick}
          onFoldToggle={onFoldToggle}
          onBookmarkToggle={onBookmarkToggle}
        />
      ))}
    </div>
  );
};

interface GutterLineProps {
  line: LineInfo;
  isCurrentLine: boolean;
  lineHeight: number;
  showFolding: boolean;
  showLineNumbers: boolean;
  lineNumberWidth: number;
  onLineClick?: (lineNumber: number) => void;
  onFoldToggle?: (lineNumber: number) => void;
  onBookmarkToggle?: (lineNumber: number) => void;
}

const GutterLine: React.FC<GutterLineProps> = ({
  line,
  isCurrentLine,
  lineHeight,
  showFolding,
  showLineNumbers,
  lineNumberWidth,
  onLineClick,
  onFoldToggle,
  onBookmarkToggle,
}) => {
  return (
    <div
      className={cn(
        'vscode-gutter-line',
        'flex items-center',
        isCurrentLine && 'bg-[var(--vscode-editor-lineHighlightBackground,#282828)]'
      )}
      style={{ height: `${lineHeight}px` }}
    >
      {/* Fold Indicator */}
      {showFolding && (
        <div
          className={cn(
            'w-4 h-full flex items-center justify-center',
            'text-[var(--vscode-editorGutter-foldingControlForeground,#c5c5c5)]',
            line.foldable && 'cursor-pointer hover:text-[var(--ide-foreground,#ffffff)]'
          )}
          onClick={() => line.foldable && onFoldToggle?.(line.number)}
        >
          {line.foldable && (
            line.isFolded ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )
          )}
        </div>
      )}

      {/* Line Number */}
      {showLineNumbers && (
        <div
          className={cn(
            'text-right pr-2 font-mono text-[13px]',
            'cursor-pointer',
            isCurrentLine
              ? 'text-[var(--vscode-editorLineNumber-activeForeground,#c6c6c6)]'
              : 'text-[var(--vscode-editorLineNumber-foreground,#858585)]',
            'hover:text-[var(--vscode-editorLineNumber-activeForeground,#c6c6c6)]'
          )}
          style={{ width: `${lineNumberWidth}px`, lineHeight: `${lineHeight}px` }}
          onClick={() => onLineClick?.(line.number)}
        >
          {line.number}
        </div>
      )}

      {/* Decorations Column */}
      <div className="w-5 h-full flex items-center justify-center">
        {line.hasBookmark && (
          <Bookmark
            className="w-3 h-3 text-[var(--vscode-editorGutter-addedBackground,#587c0c)] fill-current cursor-pointer"
            onClick={() => onBookmarkToggle?.(line.number)}
          />
        )}
        {line.hasError && (
          <div className="w-2 h-2 rounded-full bg-[var(--vscode-editorError-foreground,#f14c4c)]" />
        )}
        {line.hasWarning && !line.hasError && (
          <div className="w-2 h-2 rounded-full bg-[var(--vscode-editorWarning-foreground,#cca700)]" />
        )}
      </div>
    </div>
  );
};

export default EditorGutter;
