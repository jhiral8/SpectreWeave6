'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ActivityBar } from './ActivityBar/ActivityBar';
import { StatusBar } from './StatusBar/StatusBar';
import { ResizablePanel } from './PanelSystem/ResizablePanel';
import { usePanels } from './PanelSystem/PanelContext';
import { Editor } from '@tiptap/react';

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
}) => {
  const { layout, setPanelSize, setPanelHeight } = usePanels();

  return (
    <div className="ide-shell h-screen w-screen flex flex-col overflow-hidden bg-[--ide-background]">
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
