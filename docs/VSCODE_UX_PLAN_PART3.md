# Part 3: Main Editor Enhancements

> **Purpose**: Enhance the central editor area with VS Code-inspired features like tabs, breadcrumbs, minimap, and improved writing surface.

---

## 3.1 Editor Area Architecture

The editor area sits at the center of the IDE layout and contains:
- **Tab Bar** - Multiple open documents/chapters
- **Breadcrumb Navigation** - Chapter > Scene > Paragraph context
- **Editor Surface** - The TipTap writing area
- **MiniMap** - Document overview (optional)
- **Editor Actions** - Quick actions toolbar

```
┌─────────────────────────────────────────────────────────────┐
│ [Ch1.md] [Ch2.md] [Characters.fw] [×]                       │ ← Tabs
├─────────────────────────────────────────────────────────────┤
│ 📖 Manuscript > Chapter 2 > Scene 3 > Paragraph 12          │ ← Breadcrumb
├─────────────────────────────────────────────────────────┬───┤
│                                                         │▓▓▓│
│                                                         │▓▓▓│
│              Writing Surface                            │░░░│ ← MiniMap
│              (TipTap Editor)                            │░░░│
│                                                         │░░░│
│                                                         │░░░│
└─────────────────────────────────────────────────────────┴───┘
```

---

## 3.2 Editor Area Component

```typescript
// src/components/IDE/EditorArea/EditorArea.tsx

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { EditorTabs, EditorTab } from './EditorTabs';
import { EditorBreadcrumb } from './EditorBreadcrumb';
import { EditorToolbar } from './EditorToolbar';
import { WritingSurface } from './WritingSurface';
import { MiniMap } from './MiniMap';
import { useEditorTabs } from './hooks/useEditorTabs';
import { useEditorBreadcrumb } from './hooks/useEditorBreadcrumb';

interface EditorAreaProps {
  manuscriptEditor: Editor | null;
  frameworkEditor: Editor | null;
  className?: string;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  manuscriptEditor,
  frameworkEditor,
  className,
}) => {
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [activeEditorType, setActiveEditorType] = useState<'manuscript' | 'framework'>('manuscript');
  
  // Tab management
  const {
    tabs,
    activeTab,
    openTab,
    closeTab,
    setActiveTab,
    reorderTabs,
  } = useEditorTabs();
  
  // Get active editor based on active tab
  const activeEditor = useMemo(() => {
    if (activeTab?.type === 'framework') return frameworkEditor;
    return manuscriptEditor;
  }, [activeTab, manuscriptEditor, frameworkEditor]);
  
  // Breadcrumb data
  const { breadcrumbItems, navigateTo } = useEditorBreadcrumb(activeEditor);

  // Handle tab selection
  const handleTabSelect = useCallback((tab: EditorTab) => {
    setActiveTab(tab.id);
    setActiveEditorType(tab.type === 'framework' ? 'framework' : 'manuscript');
  }, [setActiveTab]);

  // Handle tab close
  const handleTabClose = useCallback((tabId: string) => {
    closeTab(tabId);
  }, [closeTab]);

  return (
    <div className={cn('editor-area flex flex-col h-full', className)}>
      {/* Tab Bar */}
      <EditorTabs
        tabs={tabs}
        activeTabId={activeTab?.id || null}
        onTabSelect={handleTabSelect}
        onTabClose={handleTabClose}
        onTabReorder={reorderTabs}
      />
      
      {/* Breadcrumb Navigation */}
      <EditorBreadcrumb
        items={breadcrumbItems}
        onNavigate={navigateTo}
      />
      
      {/* Editor Toolbar */}
      <EditorToolbar 
        editor={activeEditor}
        showMiniMap={showMiniMap}
        onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
      />
      
      {/* Main Editor Content */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Writing Surface */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <WritingSurface
            editor={activeEditor}
            type={activeEditorType}
          />
        </div>
        
        {/* MiniMap (optional) */}
        {showMiniMap && activeEditor && (
          <MiniMap
            editor={activeEditor}
            className="w-24 border-l border-[--ide-border]"
          />
        )}
      </div>
    </div>
  );
};
```

---

## 3.3 Editor Tabs Component

```typescript
// src/components/IDE/EditorArea/EditorTabs.tsx

'use client';

import React, { useCallback, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X, FileText, Users, Globe, StickyNote } from 'lucide-react';

export interface EditorTab {
  id: string;
  label: string;
  type: 'chapter' | 'scene' | 'character' | 'location' | 'note' | 'framework';
  isDirty: boolean;
  isPinned: boolean;
  icon?: string;
  metadata?: {
    chapterId?: string;
    sceneId?: string;
    position?: number;
  };
}

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onTabSelect: (tab: EditorTab) => void;
  onTabClose: (tabId: string) => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabReorder,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropIndex(index);
    }
  }, [draggedIndex]);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onTabReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDropIndex(null);
  }, [draggedIndex, onTabReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDropIndex(null);
  }, []);

  const handleClose = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose(tabId);
  }, [onTabClose]);

  const handleMiddleClick = useCallback((e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      e.preventDefault();
      onTabClose(tabId);
    }
  }, [onTabClose]);

  if (tabs.length === 0) {
    return (
      <div className="editor-tabs h-9 bg-[--ide-tab-inactive-bg] border-b border-[--ide-border]">
        <div className="h-full flex items-center px-4 text-sm text-[--ide-activitybar-inactive]">
          No open editors
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={tabsRef}
      className="editor-tabs h-9 bg-[--ide-tab-inactive-bg] border-b border-[--ide-border] flex overflow-x-auto"
      role="tablist"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        const Icon = getTabIcon(tab.type);
        
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onTabSelect(tab)}
            onMouseDown={(e) => handleMiddleClick(e, tab.id)}
            className={cn(
              'editor-tab flex items-center gap-2 px-3 h-full border-r border-[--ide-tab-border]',
              'cursor-pointer select-none min-w-0 max-w-[200px]',
              'transition-colors duration-100',
              isActive
                ? 'bg-[--ide-tab-active-bg] text-[--ide-foreground]'
                : 'bg-[--ide-tab-inactive-bg] text-[--ide-activitybar-inactive] hover:bg-[--ide-list-hover-bg]',
              dropIndex === index && 'border-l-2 border-l-[--ide-activitybar-badge]'
            )}
          >
            {/* Icon */}
            <Icon className={cn('w-4 h-4 flex-shrink-0', getTabIconColor(tab.type))} />
            
            {/* Label */}
            <span className="truncate text-sm">
              {tab.label}
            </span>
            
            {/* Dirty indicator */}
            {tab.isDirty && (
              <span className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
            )}
            
            {/* Close button */}
            {!tab.isPinned && (
              <button
                onClick={(e) => handleClose(e, tab.id)}
                className={cn(
                  'w-4 h-4 rounded flex items-center justify-center flex-shrink-0',
                  'hover:bg-[--ide-list-hover-bg] transition-colors',
                  'opacity-0 group-hover:opacity-100',
                  isActive && 'opacity-100'
                )}
                aria-label={`Close ${tab.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

function getTabIcon(type: EditorTab['type']) {
  const icons = {
    chapter: FileText,
    scene: FileText,
    character: Users,
    location: Globe,
    note: StickyNote,
    framework: FileText,
  };
  return icons[type] || FileText;
}

function getTabIconColor(type: EditorTab['type']): string {
  const colors = {
    chapter: 'text-blue-400',
    scene: 'text-green-400',
    character: 'text-purple-400',
    location: 'text-yellow-400',
    note: 'text-gray-400',
    framework: 'text-orange-400',
  };
  return colors[type] || '';
}
```

---

## 3.4 Editor Breadcrumb Component

```typescript
// src/components/IDE/EditorArea/EditorBreadcrumb.tsx

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, BookOpen, FileText, Type } from 'lucide-react';

export interface BreadcrumbItem {
  id: string;
  label: string;
  type: 'manuscript' | 'part' | 'chapter' | 'scene' | 'paragraph';
  position?: number;
  siblings?: BreadcrumbItem[]; // For dropdown navigation
}

interface EditorBreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
  className?: string;
}

export const EditorBreadcrumb: React.FC<EditorBreadcrumbProps> = ({
  items,
  onNavigate,
  className,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleItemClick = useCallback((item: BreadcrumbItem) => {
    if (item.siblings && item.siblings.length > 0) {
      setOpenDropdown(openDropdown === item.id ? null : item.id);
    } else {
      onNavigate(item);
    }
  }, [openDropdown, onNavigate]);

  const handleSiblingSelect = useCallback((sibling: BreadcrumbItem) => {
    setOpenDropdown(null);
    onNavigate(sibling);
  }, [onNavigate]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav 
      className={cn(
        'editor-breadcrumb flex items-center h-6 px-3 bg-[--ide-editor-bg]',
        'border-b border-[--ide-border] overflow-x-auto',
        className
      )}
      aria-label="Breadcrumb"
      ref={dropdownRef}
    >
      {items.map((item, index) => {
        const Icon = getBreadcrumbIcon(item.type);
        const isLast = index === items.length - 1;
        const hasSiblings = item.siblings && item.siblings.length > 0;
        const isDropdownOpen = openDropdown === item.id;
        
        return (
          <React.Fragment key={item.id}>
            <div className="relative flex items-center">
              <button
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex items-center gap-1 px-1 py-0.5 rounded text-xs',
                  'hover:bg-[--ide-list-hover-bg] transition-colors',
                  isLast 
                    ? 'text-[--ide-foreground]' 
                    : 'text-[--ide-activitybar-inactive]'
                )}
              >
                <Icon className="w-3 h-3" />
                <span className="max-w-[120px] truncate">{item.label}</span>
                {hasSiblings && (
                  <ChevronDown className={cn(
                    'w-3 h-3 transition-transform',
                    isDropdownOpen && 'rotate-180'
                  )} />
                )}
              </button>
              
              {/* Dropdown for siblings */}
              {isDropdownOpen && hasSiblings && (
                <div className={cn(
                  'absolute top-full left-0 mt-1 z-50 min-w-[160px] py-1',
                  'bg-[--ide-sidebar-bg] border border-[--ide-border] rounded shadow-lg'
                )}>
                  {item.siblings!.map((sibling) => (
                    <button
                      key={sibling.id}
                      onClick={() => handleSiblingSelect(sibling)}
                      className={cn(
                        'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2',
                        'hover:bg-[--ide-list-hover-bg] transition-colors',
                        sibling.id === item.id && 'bg-[--ide-list-active-bg]'
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="truncate">{sibling.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Separator */}
            {!isLast && (
              <ChevronRight className="w-3 h-3 mx-1 text-[--ide-activitybar-inactive] flex-shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

function getBreadcrumbIcon(type: BreadcrumbItem['type']) {
  const icons = {
    manuscript: BookOpen,
    part: BookOpen,
    chapter: FileText,
    scene: FileText,
    paragraph: Type,
  };
  return icons[type] || FileText;
}
```

---

## 3.5 Hook: useEditorBreadcrumb

```typescript
// src/components/IDE/EditorArea/hooks/useEditorBreadcrumb.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { BreadcrumbItem } from '../EditorBreadcrumb';

interface UseEditorBreadcrumbReturn {
  breadcrumbItems: BreadcrumbItem[];
  navigateTo: (item: BreadcrumbItem) => void;
}

export const useEditorBreadcrumb = (editor: Editor | null): UseEditorBreadcrumbReturn => {
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);

  // Extract current position context from editor
  const updateBreadcrumb = useCallback(() => {
    if (!editor) {
      setBreadcrumbItems([]);
      return;
    }

    const { selection } = editor.state;
    const { $from } = selection;
    const pos = $from.pos;
    
    const items: BreadcrumbItem[] = [];
    const doc = editor.state.doc;
    
    // Always start with manuscript root
    items.push({
      id: 'manuscript',
      label: 'Manuscript',
      type: 'manuscript',
      position: 0,
    });
    
    // Find enclosing headings
    let currentChapter: BreadcrumbItem | null = null;
    let currentScene: BreadcrumbItem | null = null;
    const allChapters: BreadcrumbItem[] = [];
    const allScenes: BreadcrumbItem[] = [];
    
    doc.descendants((node, nodePos) => {
      if (node.type.name === 'heading') {
        const level = node.attrs.level;
        const text = node.textContent || '';
        
        if (level === 2) {
          // Chapter heading
          const chapterItem: BreadcrumbItem = {
            id: `chapter-${nodePos}`,
            label: text || 'Untitled Chapter',
            type: 'chapter',
            position: nodePos,
          };
          allChapters.push(chapterItem);
          
          if (nodePos <= pos) {
            currentChapter = chapterItem;
            allScenes.length = 0; // Reset scenes for new chapter
          }
        } else if (level === 3) {
          // Scene heading
          const sceneItem: BreadcrumbItem = {
            id: `scene-${nodePos}`,
            label: text || 'Untitled Scene',
            type: 'scene',
            position: nodePos,
          };
          allScenes.push(sceneItem);
          
          if (nodePos <= pos) {
            currentScene = sceneItem;
          }
        }
      }
    });
    
    // Add chapter with siblings
    if (currentChapter) {
      items.push({
        ...currentChapter,
        siblings: allChapters,
      });
    }
    
    // Add scene with siblings (scenes within current chapter)
    if (currentScene) {
      items.push({
        ...currentScene,
        siblings: allScenes,
      });
    }
    
    // Add paragraph context
    const paragraphIndex = getParagraphIndex(doc, pos);
    if (paragraphIndex > 0) {
      items.push({
        id: `para-${paragraphIndex}`,
        label: `¶ ${paragraphIndex}`,
        type: 'paragraph',
        position: pos,
      });
    }
    
    setBreadcrumbItems(items);
  }, [editor]);

  // Update on selection change
  useEffect(() => {
    if (!editor) return;

    updateBreadcrumb();

    const handleSelectionUpdate = () => {
      updateBreadcrumb();
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, updateBreadcrumb]);

  // Navigate to a breadcrumb item
  const navigateTo = useCallback((item: BreadcrumbItem) => {
    if (!editor || item.position === undefined) return;

    editor.commands.focus();
    editor.commands.setTextSelection(item.position);
    
    // Scroll the position into view
    const { view } = editor;
    const coords = view.coordsAtPos(item.position);
    
    // Find the editor container and scroll
    const editorElement = view.dom.parentElement;
    if (editorElement) {
      const containerRect = editorElement.getBoundingClientRect();
      const scrollTop = editorElement.scrollTop;
      const relativeTop = coords.top - containerRect.top + scrollTop;
      
      editorElement.scrollTo({
        top: relativeTop - containerRect.height / 3,
        behavior: 'smooth',
      });
    }
  }, [editor]);

  return {
    breadcrumbItems,
    navigateTo,
  };
};

// Helper to get paragraph index within section
function getParagraphIndex(doc: any, pos: number): number {
  let index = 0;
  let lastHeadingPos = 0;
  
  doc.descendants((node: any, nodePos: number) => {
    if (nodePos > pos) return false;
    
    if (node.type.name === 'heading') {
      lastHeadingPos = nodePos;
      index = 0;
    } else if (node.type.name === 'paragraph' && nodePos > lastHeadingPos) {
      index++;
      if (nodePos === pos || (nodePos < pos && nodePos + node.nodeSize > pos)) {
        return false;
      }
    }
  });
  
  return index;
}
```

---

## 3.6 MiniMap Component

```typescript
// src/components/IDE/EditorArea/MiniMap.tsx

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';

interface MiniMapProps {
  editor: Editor;
  className?: string;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  editor,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportPosition, setViewportPosition] = useState({ top: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Render minimap content
  const renderMinimap = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !editor) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = container.getBoundingClientRect();
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = 'var(--ide-editor-bg)';
    ctx.fillRect(0, 0, width, height);

    // Get document content structure
    const doc = editor.state.doc;
    const totalHeight = doc.content.size;
    const scale = height / Math.max(totalHeight, 1);

    // Draw document structure
    let yPos = 0;
    doc.descendants((node, pos) => {
      const nodeHeight = Math.max(2, node.nodeSize * scale);
      const nodeY = pos * scale;

      if (node.type.name === 'heading') {
        // Headings - brighter color
        const level = node.attrs.level;
        const brightness = 1 - (level - 1) * 0.15;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.6})`;
        ctx.fillRect(4, nodeY, width - 8, Math.max(2, nodeHeight));
      } else if (node.type.name === 'paragraph' && node.textContent) {
        // Paragraphs - dim color proportional to text length
        const textLength = node.textContent.length;
        const barWidth = Math.min(width - 16, (textLength / 100) * (width - 16));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(8, nodeY, barWidth, Math.max(1, nodeHeight * 0.8));
      }

      yPos = nodeY + nodeHeight;
    });

    // Calculate viewport indicator
    const editorElement = editor.view.dom.parentElement;
    if (editorElement) {
      const scrollTop = editorElement.scrollTop;
      const viewportHeight = editorElement.clientHeight;
      const scrollHeight = editorElement.scrollHeight;

      const vpTop = (scrollTop / scrollHeight) * height;
      const vpHeight = (viewportHeight / scrollHeight) * height;

      setViewportPosition({
        top: vpTop,
        height: Math.max(vpHeight, 20),
      });
    }
  }, [editor]);

  // Initial render and updates
  useEffect(() => {
    renderMinimap();

    const handleUpdate = () => {
      requestAnimationFrame(renderMinimap);
    };

    editor.on('update', handleUpdate);
    
    // Also update on scroll
    const editorElement = editor.view.dom.parentElement;
    if (editorElement) {
      editorElement.addEventListener('scroll', handleUpdate);
    }

    return () => {
      editor.off('update', handleUpdate);
      if (editorElement) {
        editorElement.removeEventListener('scroll', handleUpdate);
      }
    };
  }, [editor, renderMinimap]);

  // Handle click/drag to navigate
  const handleInteraction = useCallback((clientY: number) => {
    const container = containerRef.current;
    const editorElement = editor.view.dom.parentElement;
    if (!container || !editorElement) return;

    const rect = container.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const percentage = relativeY / rect.height;
    
    const scrollTarget = percentage * editorElement.scrollHeight - editorElement.clientHeight / 2;
    editorElement.scrollTo({
      top: Math.max(0, scrollTarget),
      behavior: isDragging ? 'auto' : 'smooth',
    });
  }, [editor, isDragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleInteraction(e.clientY);
  }, [handleInteraction]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      handleInteraction(e.clientY);
    }
  }, [isDragging, handleInteraction]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'minimap relative bg-[--ide-editor-bg] cursor-pointer',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Document render */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      
      {/* Viewport indicator */}
      <div
        className={cn(
          'absolute left-0 right-0 bg-[--ide-editor-selection] opacity-40',
          'border-y border-[--ide-activitybar-badge]',
          isDragging && 'opacity-60'
        )}
        style={{
          top: viewportPosition.top,
          height: viewportPosition.height,
        }}
      />
    </div>
  );
};
```

---

## 3.7 Writing Surface Enhancements

```typescript
// src/components/IDE/EditorArea/WritingSurface.tsx

'use client';

import React, { useCallback, useMemo } from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { WritingMode } from './WritingMode';
import { FocusMode } from './FocusMode';
import { useWritingStats } from './hooks/useWritingStats';

interface WritingSurfaceProps {
  editor: Editor | null;
  type: 'manuscript' | 'framework';
  className?: string;
}

export const WritingSurface: React.FC<WritingSurfaceProps> = ({
  editor,
  type,
  className,
}) => {
  const [focusMode, setFocusMode] = React.useState(false);
  const [writingMode, setWritingMode] = React.useState<'normal' | 'typewriter' | 'zen'>('normal');
  
  const { sessionStats, updateStats } = useWritingStats(editor);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + F for focus mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        setFocusMode(!focusMode);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  if (!editor) {
    return (
      <div className={cn(
        'writing-surface h-full flex items-center justify-center',
        'bg-[--ide-editor-bg] text-[--ide-activitybar-inactive]',
        className
      )}>
        <p>No editor loaded</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'writing-surface h-full flex flex-col',
      'bg-[--ide-editor-bg]',
      focusMode && 'focus-mode-active',
      `writing-mode-${writingMode}`,
      className
    )}>
      {/* Focus mode overlay */}
      {focusMode && <FocusMode onExit={() => setFocusMode(false)} />}
      
      {/* Main editor area */}
      <div className={cn(
        'flex-1 overflow-y-auto overflow-x-hidden',
        'prose-container',
        writingMode === 'typewriter' && 'typewriter-scroll'
      )}>
        <div className={cn(
          'max-w-3xl mx-auto px-8 py-12',
          type === 'framework' && 'max-w-4xl'
        )}>
          <EditorContent 
            editor={editor}
            className={cn(
              'writing-content',
              'prose prose-invert max-w-none',
              'focus:outline-none',
              type === 'manuscript' && 'prose-manuscript',
              type === 'framework' && 'prose-framework'
            )}
          />
        </div>
      </div>
      
      {/* Writing stats overlay (subtle) */}
      {!focusMode && sessionStats && (
        <div className={cn(
          'absolute bottom-4 right-4 text-xs text-[--ide-activitybar-inactive]',
          'bg-[--ide-editor-bg]/80 backdrop-blur-sm px-2 py-1 rounded'
        )}>
          <span>{sessionStats.wordsThisSession} words this session</span>
          {sessionStats.streak > 0 && (
            <span className="ml-2">🔥 {sessionStats.streak} day streak</span>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## 3.8 Writing Surface CSS

```css
/* src/styles/writing-surface.css */

/* Base prose styles for writing */
.prose-manuscript {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 1.125rem;
  line-height: 1.8;
  color: var(--ide-editor-fg);
}

.prose-manuscript h1,
.prose-manuscript h2,
.prose-manuscript h3 {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 600;
  color: var(--ide-foreground);
}

.prose-manuscript h2 {
  font-size: 1.5rem;
  margin-top: 3rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--ide-border);
}

.prose-manuscript h3 {
  font-size: 1.25rem;
  margin-top: 2rem;
  color: var(--ide-activitybar-inactive);
}

.prose-manuscript p {
  margin-bottom: 1.25em;
  text-indent: 1.5em;
}

.prose-manuscript p:first-of-type,
.prose-manuscript h2 + p,
.prose-manuscript h3 + p {
  text-indent: 0;
}

/* Dialogue styling */
.prose-manuscript p:has(> em:first-child) {
  text-indent: 0;
}

/* Framework styles - more structured */
.prose-framework {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.9375rem;
  line-height: 1.6;
}

.prose-framework h1,
.prose-framework h2 {
  color: var(--ide-foreground);
}

.prose-framework ul,
.prose-framework ol {
  padding-left: 1.5rem;
}

/* Typewriter mode - keep current line centered */
.typewriter-scroll {
  scroll-behavior: smooth;
}

.writing-mode-typewriter .ProseMirror {
  padding-bottom: 50vh;
}

.writing-mode-typewriter .ProseMirror .is-editor-cursor {
  scroll-margin-top: 40vh;
  scroll-margin-bottom: 40vh;
}

/* Zen mode - minimal distractions */
.writing-mode-zen .writing-content {
  max-width: 600px;
}

.writing-mode-zen .ProseMirror h2,
.writing-mode-zen .ProseMirror h3 {
  opacity: 0.5;
}

.writing-mode-zen .ProseMirror:focus h2,
.writing-mode-zen .ProseMirror:focus h3 {
  opacity: 1;
}

/* Focus mode overlay */
.focus-mode-active {
  position: relative;
}

.focus-mode-active::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.7) 0%,
    transparent 40%,
    transparent 60%,
    rgba(0, 0, 0, 0.7) 100%
  );
  pointer-events: none;
  z-index: 10;
}

/* Current paragraph highlight in focus mode */
.focus-mode-active .ProseMirror p.is-current-paragraph {
  position: relative;
  z-index: 20;
}

/* Line numbers (optional) */
.show-line-numbers .ProseMirror > * {
  position: relative;
  padding-left: 3rem;
}

.show-line-numbers .ProseMirror > *::before {
  content: attr(data-line-number);
  position: absolute;
  left: 0;
  width: 2.5rem;
  text-align: right;
  color: var(--ide-activitybar-inactive);
  font-size: 0.75rem;
  font-family: monospace;
  opacity: 0.5;
}
```

---

## Part 3 Summary

The Editor Area now provides:

1. **Tab System** - Multiple documents, drag-to-reorder, dirty indicators
2. **Breadcrumb Navigation** - Chapter > Scene > Paragraph context with dropdown
3. **MiniMap** - Document overview with click-to-navigate
4. **Writing Modes** - Normal, Typewriter (centered line), Zen (minimal)
5. **Focus Mode** - Dim everything except current paragraph
6. **Writing Stats** - Session words, streaks

**Key Components:**
- `EditorArea.tsx` - Main container
- `EditorTabs.tsx` - Tab bar with drag/drop
- `EditorBreadcrumb.tsx` - Navigation breadcrumbs
- `MiniMap.tsx` - Document overview
- `WritingSurface.tsx` - Enhanced TipTap wrapper

---

*Continue to Part 4 for AI Feedback Panel (Bottom Panel)...*
