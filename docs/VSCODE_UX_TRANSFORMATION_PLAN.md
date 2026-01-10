# SpectreWeave6: VS Code-Inspired UX Transformation Plan

> **Project Vision**: Transform SpectreWeave6 into the "GitHub Copilot + VS Code for Fiction Writers" - a professional-grade AI-powered writing IDE with familiar, intuitive UX patterns.

---

## Table of Contents

1. [Part 1: Architecture Overview & Panel System](#part-1-architecture-overview--panel-system)
2. [Part 2: Story Explorer (Left Panel)](#part-2-story-explorer-left-panel)
3. [Part 3: Main Editor Enhancements](#part-3-main-editor-enhancements)
4. [Part 4: AI Feedback Panel (Bottom)](#part-4-ai-feedback-panel-bottom)
5. [Part 5: AI Chat Panel (Right)](#part-5-ai-chat-panel-right)
6. [Part 6: Command System & Shortcuts](#part-6-command-system--shortcuts)
7. [Part 7: Activity Bar & Status Bar](#part-7-activity-bar--status-bar)
8. [Part 8: AI Agent Integration](#part-8-ai-agent-integration)
9. [Part 9: Implementation Timeline](#part-9-implementation-timeline)
10. [Part 10: Migration Strategy](#part-10-migration-strategy)

---

## Executive Summary

### Current State Analysis

SpectreWeave6 has strong foundations:
- ✅ TipTap v3 block editor (prose-optimized)
- ✅ Dual writing surfaces (Manuscript + Framework)
- ✅ AI integration (multi-provider)
- ✅ Real-time collaboration (Y.js)
- ✅ Writing feedback system
- ✅ Story frameworks (Three-Act, Hero's Journey, etc.)

### Target State

A VS Code-like layout with:
```
┌────────────────────────────────────────────────────────────────────┐
│ Activity Bar │ Story Explorer │ Editor Area    │ AI Chat Panel    │
│              │                │                │                  │
│ [📚]         │ 📖 Manuscript  │ ┌────────────┐ │ 🤖 Ghost Writer  │
│ [👤]         │  ├─ Ch 1       │ │            │ │                  │
│ [🌍]         │  ├─ Ch 2       │ │  Writing   │ │ [Chat history]   │
│ [🔍]         │  └─ Ch 3       │ │  Surface   │ │                  │
│ [⚙️]         │ 👥 Characters  │ │            │ │ [Input box]      │
│              │  ├─ Alice      │ └────────────┘ │                  │
│              │  └─ Bob        │                │                  │
│              │ 🌍 World       ├────────────────┤                  │
│              │ 📝 Notes       │ AI Feedback    │                  │
│              │                │ [Problems]     │                  │
├──────────────┴────────────────┴────────────────┴──────────────────┤
│ Status Bar: Word Count | Chapter | AI Status | Sync Status        │
└────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Architecture Overview & Panel System

### 1.1 Core Layout Architecture

#### New Component Hierarchy

```
src/
├── components/
│   └── IDE/                          # NEW: VS Code-like IDE shell
│       ├── IDELayout.tsx             # Main layout orchestrator
│       ├── ActivityBar/              # Left-most icon bar
│       │   ├── ActivityBar.tsx
│       │   ├── ActivityBarItem.tsx
│       │   └── activityBarConfig.ts
│       ├── PanelSystem/              # Unified panel management
│       │   ├── PanelManager.tsx
│       │   ├── PanelContainer.tsx
│       │   ├── ResizablePanel.tsx
│       │   ├── PanelHeader.tsx
│       │   └── hooks/
│       │       ├── usePanelState.ts
│       │       └── usePanelResize.ts
│       ├── StoryExplorer/            # Left sidebar content
│       │   ├── StoryExplorer.tsx
│       │   ├── ManuscriptTree.tsx
│       │   ├── CharacterList.tsx
│       │   ├── WorldBuildingTree.tsx
│       │   └── NotesTree.tsx
│       ├── EditorArea/               # Central editor region
│       │   ├── EditorArea.tsx
│       │   ├── EditorTabs.tsx
│       │   ├── EditorBreadcrumb.tsx
│       │   └── MiniMap.tsx
│       ├── BottomPanel/              # AI Feedback / Problems
│       │   ├── BottomPanel.tsx
│       │   ├── ProblemsPanel.tsx
│       │   ├── OutputPanel.tsx
│       │   └── AIFeedbackPanel.tsx
│       ├── RightPanel/               # AI Chat
│       │   ├── RightPanel.tsx
│       │   └── (uses existing AIChatSidebar)
│       ├── StatusBar/                # Bottom status bar
│       │   ├── StatusBar.tsx
│       │   ├── WordCountStatus.tsx
│       │   ├── ChapterStatus.tsx
│       │   └── AIStatus.tsx
│       └── CommandPalette/           # Cmd+Shift+P equivalent
│           ├── CommandPalette.tsx
│           ├── CommandRegistry.ts
│           └── commands/
│               ├── editorCommands.ts
│               ├── aiCommands.ts
│               └── navigationCommands.ts
```

### 1.2 Panel State Management

#### Core Types

```typescript
// src/components/IDE/PanelSystem/types.ts

export type PanelPosition = 'left' | 'right' | 'bottom';
export type PanelId = 
  | 'story-explorer' 
  | 'characters' 
  | 'world' 
  | 'search' 
  | 'ai-chat' 
  | 'ai-feedback' 
  | 'output' 
  | 'settings';

export interface PanelConfig {
  id: PanelId;
  position: PanelPosition;
  label: string;
  icon: string;
  component: React.ComponentType<PanelProps>;
  defaultVisible: boolean;
  defaultSize: number; // percentage or pixels
  minSize: number;
  maxSize: number;
  canClose: boolean;
  canMove: boolean;
  activityBarIcon?: string; // If shown in activity bar
  keyboardShortcut?: string;
}

export interface PanelState {
  id: PanelId;
  isVisible: boolean;
  size: number;
  isMaximized: boolean;
  isPinned: boolean;
}

export interface PanelLayoutState {
  leftPanel: {
    activePanel: PanelId | null;
    size: number;
    isCollapsed: boolean;
  };
  rightPanel: {
    activePanel: PanelId | null;
    size: number;
    isCollapsed: boolean;
  };
  bottomPanel: {
    activePanel: PanelId | null;
    size: number;
    isCollapsed: boolean;
    tabs: PanelId[];
  };
}
```

#### Panel Context

```typescript
// src/components/IDE/PanelSystem/PanelContext.tsx

import React, { createContext, useContext, useReducer, useCallback } from 'react';

interface PanelContextType {
  layout: PanelLayoutState;
  panels: Map<PanelId, PanelState>;
  
  // Actions
  togglePanel: (id: PanelId) => void;
  showPanel: (id: PanelId) => void;
  hidePanel: (id: PanelId) => void;
  resizePanel: (position: PanelPosition, size: number) => void;
  maximizePanel: (id: PanelId) => void;
  restorePanel: (id: PanelId) => void;
  movePanel: (id: PanelId, newPosition: PanelPosition) => void;
  setActivePanel: (position: PanelPosition, id: PanelId) => void;
  
  // Queries
  isPanelVisible: (id: PanelId) => boolean;
  getActivePanel: (position: PanelPosition) => PanelId | null;
}

export const PanelContext = createContext<PanelContextType | null>(null);

export const usePanels = () => {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanels must be used within PanelProvider');
  }
  return context;
};
```

### 1.3 Layout Component Structure

```typescript
// src/components/IDE/IDELayout.tsx

'use client';

import React, { useRef } from 'react';
import { PanelProvider } from './PanelSystem/PanelContext';
import { ActivityBar } from './ActivityBar/ActivityBar';
import { StoryExplorer } from './StoryExplorer/StoryExplorer';
import { EditorArea } from './EditorArea/EditorArea';
import { BottomPanel } from './BottomPanel/BottomPanel';
import { RightPanel } from './RightPanel/RightPanel';
import { StatusBar } from './StatusBar/StatusBar';
import { CommandPalette } from './CommandPalette/CommandPalette';
import { ResizablePanel } from './PanelSystem/ResizablePanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

interface IDELayoutProps {
  children?: React.ReactNode;
  // Editor instances from existing hooks
  manuscriptEditor: Editor | null;
  frameworkEditor: Editor | null;
  // Project data
  project: Project | null;
  user: User | null;
}

export const IDELayout: React.FC<IDELayoutProps> = ({
  manuscriptEditor,
  frameworkEditor,
  project,
  user,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();
  
  return (
    <PanelProvider>
      <div 
        ref={containerRef}
        className="ide-layout h-screen w-screen flex flex-col overflow-hidden bg-[--background]"
      >
        {/* Command Palette Overlay */}
        <CommandPalette />
        
        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Activity Bar - Fixed width */}
          <ActivityBar />
          
          {/* Left Panel - Resizable */}
          <ResizablePanel 
            position="left" 
            defaultSize={280}
            minSize={200}
            maxSize={500}
          >
            <StoryExplorer project={project} />
          </ResizablePanel>
          
          {/* Center Area - Editor + Bottom Panel */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Editor Area */}
            <div className="flex-1 min-h-0">
              <EditorArea 
                manuscriptEditor={manuscriptEditor}
                frameworkEditor={frameworkEditor}
              />
            </div>
            
            {/* Bottom Panel - Resizable */}
            <ResizablePanel 
              position="bottom"
              defaultSize={200}
              minSize={100}
              maxSize={400}
            >
              <BottomPanel editor={manuscriptEditor} />
            </ResizablePanel>
          </div>
          
          {/* Right Panel - Resizable */}
          <ResizablePanel 
            position="right"
            defaultSize={320}
            minSize={280}
            maxSize={500}
          >
            <RightPanel 
              manuscriptEditor={manuscriptEditor}
              frameworkEditor={frameworkEditor}
            />
          </ResizablePanel>
        </div>
        
        {/* Status Bar - Fixed height */}
        <StatusBar 
          editor={manuscriptEditor}
          project={project}
          user={user}
        />
      </div>
    </PanelProvider>
  );
};
```

### 1.4 Resizable Panel Implementation

```typescript
// src/components/IDE/PanelSystem/ResizablePanel.tsx

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePanels } from './PanelContext';

interface ResizablePanelProps {
  position: 'left' | 'right' | 'bottom';
  defaultSize: number;
  minSize: number;
  maxSize: number;
  children: React.ReactNode;
  className?: string;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  position,
  defaultSize,
  minSize,
  maxSize,
  children,
  className,
}) => {
  const { layout, resizePanel } = usePanels();
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);

  const isCollapsed = position === 'left' 
    ? layout.leftPanel.isCollapsed 
    : position === 'right'
    ? layout.rightPanel.isCollapsed
    : layout.bottomPanel.isCollapsed;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startPosRef.current = position === 'bottom' ? e.clientY : e.clientX;
    startSizeRef.current = size;
  }, [position, size]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = position === 'bottom' ? e.clientY : e.clientX;
      const delta = position === 'right' || position === 'bottom'
        ? startPosRef.current - currentPos
        : currentPos - startPosRef.current;
      
      const newSize = Math.max(minSize, Math.min(maxSize, startSizeRef.current + delta));
      setSize(newSize);
      resizePanel(position, newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, position, minSize, maxSize, resizePanel]);

  if (isCollapsed) {
    return null;
  }

  const sizeStyle = position === 'bottom'
    ? { height: size }
    : { width: size };

  const resizeHandlePosition = {
    left: 'right-0 top-0 bottom-0 w-1 cursor-ew-resize',
    right: 'left-0 top-0 bottom-0 w-1 cursor-ew-resize',
    bottom: 'top-0 left-0 right-0 h-1 cursor-ns-resize',
  };

  return (
    <div
      ref={panelRef}
      className={cn(
        'relative flex-shrink-0 overflow-hidden',
        position === 'bottom' ? 'border-t' : position === 'left' ? 'border-r' : 'border-l',
        'border-[--border]',
        className
      )}
      style={sizeStyle}
    >
      {children}
      
      {/* Resize Handle */}
      <div
        className={cn(
          'absolute z-10 hover:bg-blue-500/50 transition-colors',
          resizeHandlePosition[position],
          isResizing && 'bg-blue-500/50'
        )}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
```

### 1.5 CSS Variables & Theming

```css
/* src/styles/ide-theme.css */

:root {
  /* VS Code-inspired color tokens */
  --ide-background: #1e1e1e;
  --ide-foreground: #cccccc;
  --ide-border: #3c3c3c;
  
  /* Activity Bar */
  --ide-activitybar-bg: #333333;
  --ide-activitybar-fg: #ffffff;
  --ide-activitybar-inactive: #858585;
  --ide-activitybar-badge: #007acc;
  
  /* Side Bar */
  --ide-sidebar-bg: #252526;
  --ide-sidebar-fg: #cccccc;
  --ide-sidebar-header-bg: #383838;
  
  /* Editor */
  --ide-editor-bg: #1e1e1e;
  --ide-editor-fg: #d4d4d4;
  --ide-editor-line-highlight: #2d2d30;
  --ide-editor-selection: #264f78;
  
  /* Panel (Bottom) */
  --ide-panel-bg: #1e1e1e;
  --ide-panel-header-bg: #252526;
  --ide-panel-border: #3c3c3c;
  
  /* Status Bar */
  --ide-statusbar-bg: #007acc;
  --ide-statusbar-fg: #ffffff;
  --ide-statusbar-item-hover: #1f8ad2;
  
  /* Tabs */
  --ide-tab-active-bg: #1e1e1e;
  --ide-tab-inactive-bg: #2d2d30;
  --ide-tab-border: #252526;
  
  /* Input */
  --ide-input-bg: #3c3c3c;
  --ide-input-fg: #cccccc;
  --ide-input-border: #3c3c3c;
  --ide-input-focus-border: #007acc;
  
  /* List/Tree */
  --ide-list-hover-bg: #2a2d2e;
  --ide-list-active-bg: #094771;
  --ide-list-focus-bg: #062f4a;
  
  /* Semantic Colors */
  --ide-error: #f48771;
  --ide-warning: #cca700;
  --ide-info: #75beff;
  --ide-success: #89d185;
}

/* Light theme override */
[data-theme="light"] {
  --ide-background: #ffffff;
  --ide-foreground: #333333;
  --ide-border: #e5e5e5;
  --ide-activitybar-bg: #2c2c2c;
  --ide-sidebar-bg: #f3f3f3;
  --ide-sidebar-fg: #333333;
  --ide-editor-bg: #ffffff;
  --ide-editor-fg: #333333;
  --ide-editor-line-highlight: #f5f5f5;
  --ide-panel-bg: #f3f3f3;
  --ide-statusbar-bg: #007acc;
}
```

---

## Part 1 Summary

This establishes the foundational architecture:

1. **Panel System** - Unified management of all resizable panels
2. **Layout Structure** - VS Code-inspired three-column layout
3. **Context Provider** - Centralized panel state management
4. **Resizable Panels** - Drag-to-resize functionality
5. **Theme System** - VS Code color token approach

**Next Parts will cover:**
- Part 2: Story Explorer implementation
- Part 3: Editor Area enhancements  
- Part 4: Bottom Panel (AI Feedback)
- Part 5: Right Panel (AI Chat)
- Part 6: Command System
- Part 7: Activity Bar & Status Bar
- Part 8: AI Agent Integration
- Part 9: Implementation Timeline
- Part 10: Migration Strategy

---

*Continue to Part 2 for Story Explorer implementation...*
