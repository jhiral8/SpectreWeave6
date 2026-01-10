'use client';

import React, { ReactNode, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ActivityBar } from './ActivityBar/ActivityBar';
import { StatusBar } from './StatusBar/StatusBar';
import { TitleBar } from './TitleBar';
import { ResizablePanel } from './PanelSystem/ResizablePanel';
import { usePanels } from './PanelSystem/PanelContext';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { Editor } from '@tiptap/react';
import type { LeftPanelView } from './PanelSystem/types';
import type { SidebarViewId } from './PrimarySidebar/types';

/**
 * Map PanelSystem views to PrimarySidebar views
 */
function mapToSidebarView(panelView: LeftPanelView | null): SidebarViewId {
  if (!panelView) return 'explorer';
  
  const viewMap: Record<LeftPanelView, SidebarViewId> = {
    'story-explorer': 'explorer',
    'characters': 'characters',
    'notes': 'explorer',      // Notes can be explorer view
    'world': 'framework',     // World building maps to framework
    'search': 'search',
    'ai-agents': 'aiAgents',
    'settings': 'explorer',   // Settings falls back to explorer
  };
  
  return viewMap[panelView] || 'explorer';
}

interface IDEShellProps {
  children: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  bottomPanel?: ReactNode;
  editor?: Editor | null;
  projectTitle?: string;
  problemCount?: { errors: number; warnings: number };
  aiStatus?: 'idle' | 'working' | 'error';
  isSynced?: boolean;
  isOnline?: boolean;
  /** Callback when command palette should open */
  onCommandPaletteOpen?: () => void;
  /** User information for title bar */
  userInfo?: { name: string; avatar?: string };
}

export const IDEShell: React.FC<IDEShellProps> = ({
  children,
  leftPanel,
  rightPanel,
  bottomPanel,
  editor = null,
  projectTitle = 'Untitled Project',
  problemCount = { errors: 0, warnings: 0 },
  aiStatus = 'idle',
  isSynced = true,
  isOnline = true,
  onCommandPaletteOpen,
  userInfo,
}) => {
  const { layout, setPanelSize, setPanelHeight, togglePanel } = usePanels();

  // Handle command palette keyboard shortcut
  const handleCommandPaletteOpen = useCallback(() => {
    console.log('[IDEShell] Command Palette opened');
    onCommandPaletteOpen?.();
  }, [onCommandPaletteOpen]);

  // Wire global keyboard shortcuts
  useGlobalShortcuts({
    handlers: {
      onCommandPalette: handleCommandPaletteOpen,
      onTogglePrimarySidebar: () => togglePanel('left'),
      onToggleBottomPanel: () => togglePanel('bottom'),
      onToggleRightPanel: () => togglePanel('right'),
      onSave: () => console.log('[IDEShell] Save triggered'),
    },
    enabled: true,
  });

  // Map active panel view to sidebar view
  const activeSidebarView = useMemo(() => {
    return mapToSidebarView(layout.leftPanel.activePanel);
  }, [layout.leftPanel.activePanel]);

  return (
    <div className="ide-shell h-screen w-screen flex flex-col overflow-hidden bg-[var(--ide-bg,#1e1e1e)]">
      {/* Title Bar (topmost) */}
      <TitleBar
        platformName="SpectreWeave"
        onCommandPaletteOpen={handleCommandPaletteOpen}
        userInfo={userInfo}
      />

      {/* Main content area (Activity Bar + Panels + Editor) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar (leftmost) */}
        <ActivityBar 
          problemCount={problemCount.errors + problemCount.warnings}
        />
        
        {/* Left Panel */}
        {leftPanel && (
          <ResizablePanel
            position="left"
            size={layout.leftPanel.width}
            isVisible={layout.leftPanel.isVisible}
            onResize={(size) => setPanelSize('left', size)}
            minSize={200}
            maxSize={500}
          >
            <div className="h-full overflow-hidden flex flex-col">
              {leftPanel}
            </div>
          </ResizablePanel>
        )}
        
        {/* Main Editor Area + Right Panel + Bottom Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Area + Right Panel */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main Editor/Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[--ide-editor-bg]">
              {children}
            </div>
            
            {/* Right Panel */}
            {rightPanel && (
              <ResizablePanel
                position="right"
                size={layout.rightPanel.width}
                isVisible={layout.rightPanel.isVisible}
                onResize={(size) => setPanelSize('right', size)}
                minSize={280}
                maxSize={600}
              >
                <div className="h-full overflow-hidden flex flex-col">
                  {rightPanel}
                </div>
              </ResizablePanel>
            )}
          </div>
          
          {/* Bottom Panel */}
          {bottomPanel && (
            <ResizablePanel
              position="bottom"
              size={layout.bottomPanel.height}
              isVisible={layout.bottomPanel.isVisible}
              onResize={(height) => setPanelHeight(height)}
              minSize={150}
              maxSize={500}
            >
              <div className="h-full overflow-hidden flex flex-col">
                {bottomPanel}
              </div>
            </ResizablePanel>
          )}
        </div>
      </div>
      
      {/* Status Bar (bottom) */}
      <StatusBar
        editor={editor}
        projectTitle={projectTitle}
        problemCount={problemCount}
        aiStatus={aiStatus}
        isSynced={isSynced}
        isOnline={isOnline}
      />
    </div>
  );
};
