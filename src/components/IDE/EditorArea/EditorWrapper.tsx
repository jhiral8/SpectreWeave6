'use client';

import React, { useMemo, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { EditorArea } from './EditorArea';
import type { BreadcrumbItem } from './types';

interface EditorWrapperProps {
  /** TipTap editor instance */
  editor: Editor | null;
  /** Children (the actual TipTap EditorContent) */
  children: React.ReactNode;
  /** Current document path for breadcrumbs */
  documentPath?: string[];
  /** Current chapter/section info */
  chapterInfo?: {
    bookTitle?: string;
    chapterTitle?: string;
    sectionTitle?: string;
  };
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Whether to show minimap */
  showMinimap?: boolean;
  /** Whether to show breadcrumbs */
  showBreadcrumbs?: boolean;
  /** Callback when breadcrumb is clicked */
  onBreadcrumbClick?: (path: string) => void;
}

/**
 * EditorWrapper Component
 * 
 * Wraps TipTap editor with VS Code-style EditorArea (breadcrumbs, gutter, minimap).
 * Extracts content info from TipTap to display line numbers and minimap.
 */
export const EditorWrapper: React.FC<EditorWrapperProps> = ({
  editor,
  children,
  documentPath = [],
  chapterInfo,
  showLineNumbers = true,
  showMinimap = true,
  showBreadcrumbs = true,
  onBreadcrumbClick,
}) => {
  // Extract line count from editor content
  const editorStats = useMemo(() => {
    if (!editor) {
      return {
        lineCount: 1,
        currentLine: 1,
        content: '',
      };
    }

    const content = editor.getText();
    const lines = content.split('\n');
    const lineCount = Math.max(lines.length, 1);

    // Get cursor position
    const { from } = editor.state.selection;
    const doc = editor.state.doc;
    
    // Calculate current line from position
    let currentLine = 1;
    let pos = 0;
    doc.descendants((node, nodePos) => {
      if (nodePos < from) {
        const nodeContent = node.textContent;
        const nodeLines = nodeContent.split('\n').length - 1;
        currentLine += nodeLines;
      }
      return from > nodePos;
    });

    return {
      lineCount,
      currentLine: Math.max(1, currentLine),
      content,
    };
  }, [editor, editor?.state.selection]);

  // Build breadcrumb items from chapter info
  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [];

    if (chapterInfo?.bookTitle) {
      items.push({
        id: 'book',
        label: chapterInfo.bookTitle,
        type: 'project',
        icon: 'book',
      });
    }

    if (chapterInfo?.chapterTitle) {
      items.push({
        id: 'chapter',
        label: chapterInfo.chapterTitle,
        type: 'chapter',
        icon: 'chapter',
      });
    }

    if (chapterInfo?.sectionTitle) {
      items.push({
        id: 'section',
        label: chapterInfo.sectionTitle,
        type: 'heading',
        icon: 'heading',
      });
    }

    // If no chapter info, use document path
    if (items.length === 0 && documentPath.length > 0) {
      documentPath.forEach((segment, index) => {
        items.push({
          id: `path-${index}`,
          label: segment,
          type: index === documentPath.length - 1 ? 'scene' : 'folder',
          icon: index === documentPath.length - 1 ? 'file' : 'folder',
        });
      });
    }

    return items;
  }, [chapterInfo, documentPath]);

  // Handle breadcrumb click
  const handleBreadcrumbClick = useCallback((item: BreadcrumbItem) => {
    if (onBreadcrumbClick) {
      onBreadcrumbClick(item.id);
    }
  }, [onBreadcrumbClick]);

  // Calculate viewport info for minimap
  const viewportInfo = useMemo(() => {
    // Approximate visible lines (assuming ~20px line height and ~600px viewport)
    const visibleLines = 30;
    const startLine = Math.max(1, editorStats.currentLine - Math.floor(visibleLines / 2));
    
    return {
      start: startLine,
      size: visibleLines,
    };
  }, [editorStats.currentLine]);

  return (
    <EditorArea
      breadcrumbs={breadcrumbs}
      lineCount={editorStats.lineCount}
      currentLine={editorStats.currentLine}
      viewportStart={viewportInfo.start}
      viewportSize={viewportInfo.size}
      showLineNumbers={showLineNumbers}
      showMinimap={showMinimap}
      showBreadcrumbs={showBreadcrumbs}
      contentForMinimap={editorStats.content}
      onBreadcrumbClick={handleBreadcrumbClick}
      onLineClick={(line) => {
        // Scroll editor to line (future enhancement)
        console.log('[EditorWrapper] Navigate to line:', line);
      }}
      onMinimapClick={(line) => {
        // Scroll editor to line (future enhancement)
        console.log('[EditorWrapper] Minimap click, navigate to line:', line);
      }}
    >
      {children}
    </EditorArea>
  );
};

export default EditorWrapper;
