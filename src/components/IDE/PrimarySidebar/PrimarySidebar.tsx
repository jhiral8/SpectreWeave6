'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { SidebarHeader } from './SidebarHeader';
import { SidebarSection } from './SidebarSection';
import { OpenEditors } from './OpenEditors';
import { FileTree } from './FileTree';
import { OutlineSection } from './OutlineSection';
import { SearchPanel } from './SearchPanel';
import type { 
  PrimarySidebarProps, 
  SidebarViewId,
  TreeNode,
  OpenEditor,
  OutlineItem 
} from './types';

/**
 * Primary Sidebar Component
 * 
 * VS Code-style sidebar with collapsible sections.
 * Shows different views based on ActivityBar selection.
 * 
 * Layout:
 * ┌─────────────────────────┐
 * │ EXPLORER            ≡ ⋯│  SidebarHeader
 * ├─────────────────────────┤
 * │ ▶ OPEN EDITORS (2)      │  Collapsible section
 * ├─────────────────────────┤
 * │ ▼ MY NOVEL              │  
 * │   ▼ Chapter 1           │  FileTree
 * │     Scene 1.1           │
 * │     Scene 1.2           │
 * │   ▶ Chapter 2           │
 * ├─────────────────────────┤
 * │ ▼ OUTLINE               │
 * │   H1 Introduction       │  OutlineSection
 * │   H2 Background         │
 * └─────────────────────────┘
 */
export const PrimarySidebar: React.FC<PrimarySidebarProps> = ({
  activeView = 'explorer',
  onViewChange,
  width = 250,
  minWidth = 170,
  maxWidth,
  isVisible = true,
  openEditors = [],
  fileTree = [],
  outlineItems = [],
  onFileSelect,
  onEditorClose,
  onOutlineClick,
  onSearch,
}) => {
  // Section collapse states
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    openEditors: false,
    fileTree: false,
    outline: false,
  });

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  // Get view title
  const getViewTitle = (view: SidebarViewId): string => {
    const titles: Record<SidebarViewId, string> = {
      explorer: 'EXPLORER',
      search: 'SEARCH',
      characters: 'CHARACTERS',
      aiAgents: 'AI AGENTS',
      framework: 'FRAMEWORK',
      outline: 'OUTLINE',
    };
    return titles[view];
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      className={cn(
        'vscode-sidebar',
        'h-full flex flex-col',
        'bg-[var(--ide-bg,#252526)]',
        'text-[var(--ide-foreground,#cccccc)]',
        'border-r border-[var(--ide-border,#3c3c3c)]',
        'overflow-hidden',
        'select-none'
      )}
      style={{ 
        width: `${width}px`,
        minWidth: `${minWidth}px`,
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
      }}
      role="complementary"
      aria-label={`${getViewTitle(activeView)} sidebar`}
    >
      {/* Sidebar Header */}
      <SidebarHeader
        title={getViewTitle(activeView)}
        onCollapseAll={() => {
          setCollapsedSections({
            openEditors: true,
            fileTree: true,
            outline: true,
          });
        }}
        onRefresh={() => {
          // Trigger refresh of content
          console.log('[PrimarySidebar] Refresh requested');
        }}
      />

      {/* Content based on active view */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden vscode-scrollbar">
        {activeView === 'explorer' && (
          <ExplorerView
            openEditors={openEditors}
            fileTree={fileTree}
            outlineItems={outlineItems}
            collapsedSections={collapsedSections}
            onToggleSection={toggleSection}
            onFileSelect={onFileSelect}
            onEditorClose={onEditorClose}
            onOutlineClick={onOutlineClick}
          />
        )}

        {activeView === 'search' && (
          <SearchPanel onSearch={onSearch} />
        )}

        {activeView === 'characters' && (
          <div className="p-4 text-xs text-[var(--ide-foreground-muted)]">
            Characters view coming soon...
          </div>
        )}

        {activeView === 'aiAgents' && (
          <div className="p-4 text-xs text-[var(--ide-foreground-muted)]">
            AI Agents view coming soon...
          </div>
        )}

        {activeView === 'framework' && (
          <div className="p-4 text-xs text-[var(--ide-foreground-muted)]">
            Framework view coming soon...
          </div>
        )}

        {activeView === 'outline' && (
          <OutlineSection
            items={outlineItems}
            isCollapsed={false}
            onToggle={() => {}}
            onItemClick={onOutlineClick}
          />
        )}
      </div>
    </aside>
  );
};

/**
 * Explorer View - Default sidebar content
 */
interface ExplorerViewProps {
  openEditors: OpenEditor[];
  fileTree: TreeNode[];
  outlineItems: OutlineItem[];
  collapsedSections: Record<string, boolean>;
  onToggleSection: (section: string) => void;
  onFileSelect?: (fileId: string) => void;
  onEditorClose?: (editorId: string) => void;
  onOutlineClick?: (position: number) => void;
}

const ExplorerView: React.FC<ExplorerViewProps> = ({
  openEditors,
  fileTree,
  outlineItems,
  collapsedSections,
  onToggleSection,
  onFileSelect,
  onEditorClose,
  onOutlineClick,
}) => {
  return (
    <>
      {/* Open Editors Section */}
      {openEditors.length > 0 && (
        <SidebarSection
          title="OPEN EDITORS"
          isCollapsed={collapsedSections.openEditors}
          onToggle={() => onToggleSection('openEditors')}
          badge={openEditors.filter(e => e.isModified).length || undefined}
        >
          <OpenEditors
            editors={openEditors}
            onSelect={onFileSelect}
            onClose={onEditorClose}
          />
        </SidebarSection>
      )}

      {/* File Tree Section */}
      <SidebarSection
        title="MY NOVEL"
        isCollapsed={collapsedSections.fileTree}
        onToggle={() => onToggleSection('fileTree')}
        actions={[
          {
            id: 'newFile',
            icon: 'FilePlus',
            label: 'New File',
            onClick: () => console.log('New file'),
          },
          {
            id: 'newFolder',
            icon: 'FolderPlus',
            label: 'New Folder',
            onClick: () => console.log('New folder'),
          },
          {
            id: 'refresh',
            icon: 'RefreshCw',
            label: 'Refresh',
            onClick: () => console.log('Refresh'),
          },
        ]}
      >
        <FileTree
          nodes={fileTree}
          onSelect={onFileSelect}
        />
      </SidebarSection>

      {/* Outline Section */}
      {outlineItems.length > 0 && (
        <SidebarSection
          title="OUTLINE"
          isCollapsed={collapsedSections.outline}
          onToggle={() => onToggleSection('outline')}
        >
          <OutlineSection
            items={outlineItems}
            isCollapsed={false}
            onToggle={() => {}}
            onItemClick={onOutlineClick}
          />
        </SidebarSection>
      )}
    </>
  );
};

export default PrimarySidebar;
