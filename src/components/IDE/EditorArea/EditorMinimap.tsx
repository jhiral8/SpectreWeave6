'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { EditorMinimapProps, MinimapHighlight } from './types';

/**
 * Editor Minimap Component
 * 
 * VS Code-style minimap showing scaled-down document preview.
 * 
 * ┌─────┐
 * │░░░░░│ ← content preview
 * │░░░░░│
 * │▓▓▓▓▓│ ← viewport indicator (current view)
 * │░░░░░│
 * │░░░░░│
 * │  •  │ ← error highlight
 * │░░░░░│
 * └─────┘
 */
export const EditorMinimap: React.FC<EditorMinimapProps> = ({
  content,
  lineCount,
  viewportStart,
  viewportSize,
  width = 80,
  isVisible = true,
  onViewportChange,
  highlights = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scale factor: how many pixels per line
  const lineScale = useMemo(() => {
    // Aim for ~2px per line, capped at container height
    return Math.min(2, 400 / lineCount);
  }, [lineCount]);

  // Total minimap height
  const minimapHeight = useMemo(() => {
    return Math.max(100, lineCount * lineScale);
  }, [lineCount, lineScale]);

  // Viewport indicator position and size
  const viewportIndicator = useMemo(() => {
    const top = (viewportStart - 1) * lineScale;
    const height = Math.max(20, viewportSize * lineScale);
    return { top, height };
  }, [viewportStart, viewportSize, lineScale]);

  // Handle click to scroll
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !onViewportChange) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickedLine = Math.floor(clickY / lineScale) + 1;
    const targetLine = Math.max(1, Math.min(lineCount - viewportSize + 1, clickedLine - Math.floor(viewportSize / 2)));
    
    onViewportChange(targetLine);
  }, [lineScale, lineCount, viewportSize, onViewportChange]);

  // Parse content into simple line representations
  const minimapLines = useMemo(() => {
    // Strip HTML and split into lines
    const textContent = content.replace(/<[^>]*>/g, '');
    const lines = textContent.split('\n');
    
    return lines.slice(0, lineCount).map((line, i) => ({
      number: i + 1,
      length: Math.min(line.trim().length, 100), // Cap at 100 chars
      isEmpty: line.trim().length === 0,
    }));
  }, [content, lineCount]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'vscode-minimap',
        'relative flex-shrink-0',
        'bg-[var(--vscode-minimap-background,#1e1e1e)]',
        'border-l border-[var(--vscode-minimap-border,transparent)]',
        'cursor-pointer',
        'overflow-hidden'
      )}
      style={{ width: `${width}px` }}
      onClick={handleClick}
      role="slider"
      aria-label="Document minimap"
      aria-valuemin={1}
      aria-valuemax={lineCount}
      aria-valuenow={viewportStart}
    >
      {/* Minimap Content */}
      <div
        className="relative"
        style={{ height: `${minimapHeight}px` }}
      >
        {/* Line representations */}
        {minimapLines.map((line) => (
          <div
            key={line.number}
            className="absolute left-1"
            style={{
              top: `${(line.number - 1) * lineScale}px`,
              height: `${Math.max(1, lineScale - 1)}px`,
              width: `${Math.min(width - 8, line.length * 0.5)}px`,
              backgroundColor: line.isEmpty 
                ? 'transparent' 
                : 'var(--vscode-minimap-foregroundOpacity, rgba(200, 200, 200, 0.5))',
            }}
          />
        ))}

        {/* Highlights (errors, warnings, search matches) */}
        {highlights.map((highlight, i) => (
          <MinimapHighlightMarker
            key={`${highlight.line}-${i}`}
            highlight={highlight}
            lineScale={lineScale}
            width={width}
          />
        ))}

        {/* Viewport Indicator */}
        <div
          className={cn(
            'absolute left-0 right-0',
            'bg-[var(--vscode-minimap-sliderBackground,rgba(100,100,100,0.3))]',
            'hover:bg-[var(--vscode-minimap-sliderHoverBackground,rgba(100,100,100,0.5))]',
            'border-y border-[var(--vscode-minimap-sliderBorder,rgba(100,100,100,0.5))]'
          )}
          style={{
            top: `${viewportIndicator.top}px`,
            height: `${viewportIndicator.height}px`,
          }}
        />
      </div>
    </div>
  );
};

/**
 * Minimap highlight marker (errors, warnings, search results)
 */
const MinimapHighlightMarker: React.FC<{
  highlight: MinimapHighlight;
  lineScale: number;
  width: number;
}> = ({ highlight, lineScale, width }) => {
  const colors: Record<MinimapHighlight['type'], string> = {
    error: 'var(--vscode-minimap-errorHighlight, #ff0000)',
    warning: 'var(--vscode-minimap-warningHighlight, #ffcc00)',
    search: 'var(--vscode-minimap-findMatchHighlight, #d18616)',
    selection: 'var(--vscode-minimap-selectionHighlight, #264f78)',
    change: 'var(--vscode-minimap-modifiedHighlight, #007acc)',
  };

  return (
    <div
      className="absolute right-1"
      style={{
        top: `${(highlight.line - 1) * lineScale}px`,
        width: '4px',
        height: `${Math.max(2, lineScale)}px`,
        backgroundColor: colors[highlight.type],
        borderRadius: '1px',
      }}
    />
  );
};

export default EditorMinimap;
