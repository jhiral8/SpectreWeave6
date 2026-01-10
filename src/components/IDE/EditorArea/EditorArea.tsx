'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { EditorBreadcrumbs } from './EditorBreadcrumbs';
import { EditorGutter } from './EditorGutter';
import { EditorMinimap } from './EditorMinimap';
import type { EditorAreaProps, LineInfo, BreadcrumbItem } from './types';

/**
 * Editor Area Component
 * 
 * VS Code-style editor wrapper combining breadcrumbs, gutter, content, and minimap.
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 📁 My Novel > 📖 Chapter 3 > # The Storm                           │  Breadcrumbs
 * ├────────┬───────────────────────────────────────────────────┬───────┤
 * │  1  ▼  │                                                   │░░░░░░░│
 * │  2     │  The rain hammered against the windows...         │░░░░░░░│
 * │  3     │                                                   │▓▓▓▓▓▓▓│  Minimap
 * │  4  ▶  │  "You don't have to do this," Sarah said.         │░░░░░░░│
 * │  5     │                                                   │░░░░░░░│
 * │ Gutter │              Editor Content                       │       │
 * └────────┴───────────────────────────────────────────────────┴───────┘
 */
export const EditorArea: React.FC<EditorAreaProps> = ({
  children,
  breadcrumbs = [],
  lineCount = 1,
  currentLine = 1,
  viewportStart = 1,
  viewportSize = 30,
  showLineNumbers = true,
  showMinimap = true,
  showBreadcrumbs = true,
  contentForMinimap = '',
  onBreadcrumbClick,
  onLineClick,
  onMinimapClick,
}) => {
  // Generate line info for gutter
  const lines: LineInfo[] = useMemo(() => {
    const result: LineInfo[] = [];
    for (let i = 1; i <= lineCount; i++) {
      result.push({
        number: i,
        content: '',
        isCurrentLine: i === currentLine,
        // Mock foldable lines for headings (every 10th line for demo)
        foldable: i % 10 === 1 && i < lineCount - 5,
        isFolded: false,
      });
    }
    return result;
  }, [lineCount, currentLine]);

  // Handle fold toggle
  const handleFoldToggle = useCallback((lineNumber: number) => {
    console.log('[EditorArea] Fold toggle at line:', lineNumber);
  }, []);

  // Handle bookmark toggle
  const handleBookmarkToggle = useCallback((lineNumber: number) => {
    console.log('[EditorArea] Bookmark toggle at line:', lineNumber);
  }, []);

  return (
    <div className={cn(
      'vscode-editor-area',
      'flex flex-col h-full',
      'bg-[var(--ide-bg,#1e1e1e)]',
      'overflow-hidden'
    )}>
      {/* Breadcrumbs */}
      {showBreadcrumbs && breadcrumbs.length > 0 && (
        <EditorBreadcrumbs
          items={breadcrumbs}
          onItemClick={onBreadcrumbClick}
          showIcons={true}
        />
      )}

      {/* Main Editor Row */}
      <div className="flex-1 flex overflow-hidden">
        {/* Gutter (Line Numbers + Fold Indicators) */}
        {showLineNumbers && (
          <EditorGutter
            lines={lines}
            currentLine={currentLine}
            lineHeight={20}
            showLineNumbers={true}
            showFolding={true}
            onLineClick={onLineClick}
            onFoldToggle={handleFoldToggle}
            onBookmarkToggle={handleBookmarkToggle}
          />
        )}

        {/* Editor Content */}
        <div className={cn(
          'vscode-editor-content',
          'flex-1 overflow-auto',
          'vscode-scrollbar'
        )}>
          {/* Current Line Highlight Layer */}
          <div className="relative">
            {children}
          </div>
        </div>

        {/* Minimap */}
        {showMinimap && (
          <EditorMinimap
            content={contentForMinimap}
            lineCount={lineCount}
            viewportStart={viewportStart}
            viewportSize={viewportSize}
            width={80}
            isVisible={true}
            onViewportChange={onMinimapClick}
          />
        )}
      </div>
    </div>
  );
};

export default EditorArea;
