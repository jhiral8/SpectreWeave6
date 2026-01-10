# Part 2: Story Explorer (Left Panel)

> **Purpose**: Replace the current Framework Editor with a VS Code-style file explorer, but for story elements instead of files.

---

## 2.1 Story Explorer Overview

The Story Explorer transforms the flat Framework surface into a hierarchical, navigable tree structure that gives writers instant access to all story elements.

### Design Goals

1. **Familiar UX** - Same interaction patterns as VS Code's Explorer
2. **Story-Centric** - Organized by narrative elements, not files
3. **Actionable** - Right-click menus, drag-drop reordering
4. **AI-Aware** - Shows AI suggestions inline, character appearances
5. **Real-time Sync** - Updates as you write in the manuscript

---

## 2.2 Tree Structure Definition

```typescript
// src/components/IDE/StoryExplorer/types.ts

export type StoryNodeType = 
  | 'manuscript'
  | 'part'
  | 'chapter'
  | 'scene'
  | 'character'
  | 'character-group'
  | 'location'
  | 'location-group'
  | 'timeline'
  | 'event'
  | 'note'
  | 'note-folder'
  | 'research'
  | 'style-guide';

export interface StoryNode {
  id: string;
  type: StoryNodeType;
  label: string;
  icon?: string;
  children?: StoryNode[];
  isExpanded?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
  
  // Metadata varies by type
  metadata: StoryNodeMetadata;
  
  // Relationships to other nodes
  linkedNodes?: string[];
  
  // AI-related
  aiSuggestions?: AISuggestion[];
  aiStatus?: 'analyzing' | 'has-issues' | 'approved';
}

export interface StoryNodeMetadata {
  // Common
  createdAt: Date;
  updatedAt: Date;
  
  // Manuscript/Chapter/Scene specific
  wordCount?: number;
  targetWordCount?: number;
  status?: 'draft' | 'in-progress' | 'review' | 'complete';
  position?: number; // For editor navigation
  
  // Character specific
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  firstAppearance?: string; // Chapter ID
  appearances?: string[]; // Scene IDs where character appears
  traits?: string[];
  
  // Location specific
  locationType?: 'interior' | 'exterior' | 'abstract';
  scenesSet?: string[]; // Scene IDs set in this location
  
  // Timeline/Event specific
  timelinePosition?: number;
  date?: string;
  involvedCharacters?: string[];
  
  // Note specific
  noteType?: 'idea' | 'research' | 'todo' | 'reference';
  tags?: string[];
}

export interface AISuggestion {
  id: string;
  type: 'consistency' | 'development' | 'pacing' | 'style';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
}
```

---

## 2.3 Story Explorer Component

```typescript
// src/components/IDE/StoryExplorer/StoryExplorer.tsx

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { StoryTree } from './StoryTree';
import { StoryExplorerHeader } from './StoryExplorerHeader';
import { StoryExplorerToolbar } from './StoryExplorerToolbar';
import { useStoryStructure } from './hooks/useStoryStructure';
import { useStoryExplorerActions } from './hooks/useStoryExplorerActions';
import { usePanels } from '../PanelSystem/PanelContext';
import { StoryNode } from './types';

// Tab definitions
type ExplorerTab = 'manuscript' | 'characters' | 'world' | 'notes';

const EXPLORER_TABS: { id: ExplorerTab; label: string; icon: string }[] = [
  { id: 'manuscript', label: 'Manuscript', icon: '📖' },
  { id: 'characters', label: 'Characters', icon: '👥' },
  { id: 'world', label: 'World', icon: '🌍' },
  { id: 'notes', label: 'Notes', icon: '📝' },
];

interface StoryExplorerProps {
  project: Project | null;
  className?: string;
}

export const StoryExplorer: React.FC<StoryExplorerProps> = ({
  project,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<ExplorerTab>('manuscript');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Get story structure from the framework editor/context
  const { 
    manuscriptTree, 
    charactersTree, 
    worldTree, 
    notesTree,
    refreshStructure,
    isLoading,
  } = useStoryStructure(project);
  
  // Actions for story nodes
  const {
    handleNodeSelect,
    handleNodeExpand,
    handleNodeCollapse,
    handleNodeRename,
    handleNodeDelete,
    handleNodeMove,
    handleNodeCreate,
    handleNavigateToPosition,
  } = useStoryExplorerActions();

  // Get current tree based on active tab
  const currentTree = useMemo(() => {
    switch (activeTab) {
      case 'manuscript': return manuscriptTree;
      case 'characters': return charactersTree;
      case 'world': return worldTree;
      case 'notes': return notesTree;
      default: return manuscriptTree;
    }
  }, [activeTab, manuscriptTree, charactersTree, worldTree, notesTree]);

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return currentTree;
    return filterTreeBySearch(currentTree, searchQuery);
  }, [currentTree, searchQuery]);

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
        handleNodeCollapse(nodeId);
      } else {
        next.add(nodeId);
        handleNodeExpand(nodeId);
      }
      return next;
    });
  }, [handleNodeExpand, handleNodeCollapse]);

  const handleSelect = useCallback((node: StoryNode) => {
    setSelectedNode(node.id);
    handleNodeSelect(node);
    
    // If it's a manuscript element with a position, navigate to it
    if (node.type === 'chapter' || node.type === 'scene') {
      if (node.metadata.position !== undefined) {
        handleNavigateToPosition(node.metadata.position);
      }
    }
  }, [handleNodeSelect, handleNavigateToPosition]);

  return (
    <div className={cn('story-explorer flex flex-col h-full', className)}>
      {/* Header with project name */}
      <StoryExplorerHeader 
        projectName={project?.title || 'Untitled Project'}
        onRefresh={refreshStructure}
      />
      
      {/* Tab Bar */}
      <div className="flex border-b border-[--ide-border] bg-[--ide-sidebar-header-bg]">
        {EXPLORER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 px-3 py-2 text-xs font-medium transition-colors',
              'hover:bg-[--ide-list-hover-bg]',
              activeTab === tab.id
                ? 'text-[--ide-foreground] border-b-2 border-[--ide-activitybar-badge]'
                : 'text-[--ide-activitybar-inactive]'
            )}
            title={tab.label}
          >
            <span className="mr-1">{tab.icon}</span>
            <span className="hidden lg:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Search */}
      <div className="p-2 border-b border-[--ide-border]">
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full px-2 py-1 text-sm rounded',
            'bg-[--ide-input-bg] text-[--ide-input-fg]',
            'border border-[--ide-input-border]',
            'focus:border-[--ide-input-focus-border] focus:outline-none'
          )}
        />
      </div>
      
      {/* Toolbar */}
      <StoryExplorerToolbar 
        activeTab={activeTab}
        onCreateNode={handleNodeCreate}
        onExpandAll={() => {/* expand all nodes */}}
        onCollapseAll={() => setExpandedNodes(new Set())}
      />
      
      {/* Tree View */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-5 h-5 border-2 border-[--ide-activitybar-badge] border-t-transparent rounded-full" />
          </div>
        ) : filteredTree.length === 0 ? (
          <EmptyState tab={activeTab} onAction={handleNodeCreate} />
        ) : (
          <StoryTree
            nodes={filteredTree}
            expandedNodes={expandedNodes}
            selectedNode={selectedNode}
            onToggleExpand={handleToggleExpand}
            onSelect={handleSelect}
            onRename={handleNodeRename}
            onDelete={handleNodeDelete}
            onMove={handleNodeMove}
          />
        )}
      </div>
    </div>
  );
};

// Helper to filter tree by search query
function filterTreeBySearch(nodes: StoryNode[], query: string): StoryNode[] {
  const lowerQuery = query.toLowerCase();
  
  return nodes.reduce<StoryNode[]>((acc, node) => {
    const matchesQuery = node.label.toLowerCase().includes(lowerQuery);
    const filteredChildren = node.children 
      ? filterTreeBySearch(node.children, query) 
      : [];
    
    if (matchesQuery || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children,
        isExpanded: filteredChildren.length > 0 ? true : node.isExpanded,
      });
    }
    
    return acc;
  }, []);
}

// Empty state component
const EmptyState: React.FC<{ tab: ExplorerTab; onAction: (type: string) => void }> = ({ 
  tab, 
  onAction 
}) => {
  const config = {
    manuscript: {
      message: 'No chapters yet',
      action: 'Create Chapter',
      type: 'chapter',
    },
    characters: {
      message: 'No characters defined',
      action: 'Create Character',
      type: 'character',
    },
    world: {
      message: 'No locations defined',
      action: 'Create Location',
      type: 'location',
    },
    notes: {
      message: 'No notes yet',
      action: 'Create Note',
      type: 'note',
    },
  };
  
  const { message, action, type } = config[tab];
  
  return (
    <div className="flex flex-col items-center justify-center h-32 text-center px-4">
      <p className="text-sm text-[--ide-activitybar-inactive] mb-3">{message}</p>
      <button
        onClick={() => onAction(type)}
        className={cn(
          'px-3 py-1.5 text-sm rounded',
          'bg-[--ide-activitybar-badge] text-white',
          'hover:opacity-90 transition-opacity'
        )}
      >
        {action}
      </button>
    </div>
  );
};
```

---

## 2.4 Story Tree Component

```typescript
// src/components/IDE/StoryExplorer/StoryTree.tsx

'use client';

import React, { useCallback, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { StoryNode, StoryNodeType } from './types';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Users, 
  User, 
  MapPin, 
  Globe, 
  StickyNote,
  Folder,
  FolderOpen,
  BookOpen,
  Sparkles,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { StoryNodeContextMenu } from './StoryNodeContextMenu';

interface StoryTreeProps {
  nodes: StoryNode[];
  expandedNodes: Set<string>;
  selectedNode: string | null;
  onToggleExpand: (nodeId: string) => void;
  onSelect: (node: StoryNode) => void;
  onRename: (nodeId: string, newName: string) => void;
  onDelete: (nodeId: string) => void;
  onMove: (nodeId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  depth?: number;
}

export const StoryTree: React.FC<StoryTreeProps> = ({
  nodes,
  expandedNodes,
  selectedNode,
  onToggleExpand,
  onSelect,
  onRename,
  onDelete,
  onMove,
  depth = 0,
}) => {
  return (
    <ul className="story-tree-list" role="tree">
      {nodes.map((node) => (
        <StoryTreeNode
          key={node.id}
          node={node}
          depth={depth}
          isExpanded={expandedNodes.has(node.id)}
          isSelected={selectedNode === node.id}
          expandedNodes={expandedNodes}
          selectedNode={selectedNode}
          onToggleExpand={onToggleExpand}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          onMove={onMove}
        />
      ))}
    </ul>
  );
};

interface StoryTreeNodeProps {
  node: StoryNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  expandedNodes: Set<string>;
  selectedNode: string | null;
  onToggleExpand: (nodeId: string) => void;
  onSelect: (node: StoryNode) => void;
  onRename: (nodeId: string, newName: string) => void;
  onDelete: (nodeId: string) => void;
  onMove: (nodeId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
}

const StoryTreeNode: React.FC<StoryTreeNodeProps> = ({
  node,
  depth,
  isExpanded,
  isSelected,
  expandedNodes,
  selectedNode,
  onToggleExpand,
  onSelect,
  onRename,
  onDelete,
  onMove,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.label);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLLIElement>(null);
  
  const hasChildren = node.children && node.children.length > 0;
  const indent = depth * 16;
  
  // Get appropriate icon
  const Icon = getNodeIcon(node.type, isExpanded);
  const StatusIcon = getStatusIcon(node.aiStatus);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node);
  }, [node, onSelect]);
  
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // For manuscript elements, navigate; for others, start editing
    if (node.type === 'chapter' || node.type === 'scene') {
      // Navigation handled by onSelect
    } else {
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [node.type]);
  
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  }, [hasChildren, node.id, onToggleExpand]);
  
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);
  
  const handleRenameSubmit = useCallback(() => {
    if (editValue.trim() && editValue !== node.label) {
      onRename(node.id, editValue.trim());
    }
    setIsEditing(false);
  }, [editValue, node.id, node.label, onRename]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(node.label);
      setIsEditing(false);
    }
  }, [handleRenameSubmit, node.label]);
  
  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  }, [node.id]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== node.id) {
      onMove(draggedId, node.id, 'inside');
    }
  }, [node.id, onMove]);

  return (
    <li
      ref={nodeRef}
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      className="story-tree-node"
    >
      <div
        className={cn(
          'flex items-center py-1 px-2 cursor-pointer',
          'hover:bg-[--ide-list-hover-bg]',
          isSelected && 'bg-[--ide-list-active-bg]',
          'transition-colors'
        )}
        style={{ paddingLeft: indent + 8 }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Expand/Collapse Toggle */}
        <span 
          className={cn(
            'w-4 h-4 flex items-center justify-center flex-shrink-0',
            !hasChildren && 'invisible'
          )}
          onClick={handleToggle}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </span>
        
        {/* Node Icon */}
        <Icon className={cn('w-4 h-4 mr-2 flex-shrink-0', getIconColor(node.type))} />
        
        {/* Label or Edit Input */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
            className={cn(
              'flex-1 px-1 py-0.5 text-sm',
              'bg-[--ide-input-bg] text-[--ide-input-fg]',
              'border border-[--ide-input-focus-border]',
              'rounded focus:outline-none'
            )}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate text-[--ide-sidebar-fg]">
            {node.label}
          </span>
        )}
        
        {/* Metadata badges */}
        {node.metadata.wordCount !== undefined && (
          <span className="text-xs text-[--ide-activitybar-inactive] ml-2">
            {formatWordCount(node.metadata.wordCount)}
          </span>
        )}
        
        {/* Status indicator */}
        {node.metadata.status && (
          <StatusBadge status={node.metadata.status} />
        )}
        
        {/* AI Status indicator */}
        {StatusIcon && (
          <StatusIcon className={cn('w-3 h-3 ml-1', getAIStatusColor(node.aiStatus))} />
        )}
      </div>
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <StoryTree
          nodes={node.children!}
          depth={depth + 1}
          expandedNodes={expandedNodes}
          selectedNode={selectedNode}
          onToggleExpand={onToggleExpand}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          onMove={onMove}
        />
      )}
      
      {/* Context Menu */}
      {contextMenu && (
        <StoryNodeContextMenu
          node={node}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onRename={() => {
            setContextMenu(null);
            setIsEditing(true);
          }}
          onDelete={() => {
            setContextMenu(null);
            onDelete(node.id);
          }}
        />
      )}
    </li>
  );
};

// Helper functions
function getNodeIcon(type: StoryNodeType, isExpanded: boolean) {
  const icons: Record<StoryNodeType, any> = {
    manuscript: BookOpen,
    part: isExpanded ? FolderOpen : Folder,
    chapter: FileText,
    scene: FileText,
    character: User,
    'character-group': Users,
    location: MapPin,
    'location-group': Globe,
    timeline: BookOpen,
    event: Sparkles,
    note: StickyNote,
    'note-folder': isExpanded ? FolderOpen : Folder,
    research: FileText,
    'style-guide': FileText,
  };
  return icons[type] || FileText;
}

function getIconColor(type: StoryNodeType): string {
  const colors: Partial<Record<StoryNodeType, string>> = {
    chapter: 'text-blue-400',
    scene: 'text-green-400',
    character: 'text-purple-400',
    'character-group': 'text-purple-300',
    location: 'text-yellow-400',
    'location-group': 'text-yellow-300',
    note: 'text-gray-400',
    event: 'text-orange-400',
  };
  return colors[type] || 'text-[--ide-sidebar-fg]';
}

function getStatusIcon(status?: string) {
  if (!status) return null;
  switch (status) {
    case 'has-issues': return AlertCircle;
    case 'approved': return CheckCircle;
    case 'analyzing': return Sparkles;
    default: return null;
  }
}

function getAIStatusColor(status?: string): string {
  switch (status) {
    case 'has-issues': return 'text-[--ide-warning]';
    case 'approved': return 'text-[--ide-success]';
    case 'analyzing': return 'text-[--ide-info] animate-pulse';
    default: return '';
  }
}

function formatWordCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-500',
    'in-progress': 'bg-blue-500',
    review: 'bg-yellow-500',
    complete: 'bg-green-500',
  };
  
  return (
    <span 
      className={cn(
        'w-2 h-2 rounded-full ml-2',
        colors[status] || 'bg-gray-500'
      )}
      title={status}
    />
  );
};
```

---

## 2.5 Hook: useStoryStructure

```typescript
// src/components/IDE/StoryExplorer/hooks/useStoryStructure.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { StoryNode } from '../types';
import { useEditorContext } from '@/components/BlockEditor/context/UnifiedEditorContext';

interface UseStoryStructureReturn {
  manuscriptTree: StoryNode[];
  charactersTree: StoryNode[];
  worldTree: StoryNode[];
  notesTree: StoryNode[];
  refreshStructure: () => void;
  isLoading: boolean;
}

export const useStoryStructure = (project: any): UseStoryStructureReturn => {
  const { manuscriptEditor, frameworkEditor } = useEditorContext();
  const [isLoading, setIsLoading] = useState(true);
  const [manuscriptTree, setManuscriptTree] = useState<StoryNode[]>([]);
  const [charactersTree, setCharactersTree] = useState<StoryNode[]>([]);
  const [worldTree, setWorldTree] = useState<StoryNode[]>([]);
  const [notesTree, setNotesTree] = useState<StoryNode[]>([]);

  // Extract manuscript structure from headings in the editor
  const extractManuscriptStructure = useCallback((editor: Editor | null): StoryNode[] => {
    if (!editor) return [];
    
    const doc = editor.state.doc;
    const nodes: StoryNode[] = [];
    let currentPart: StoryNode | null = null;
    let currentChapter: StoryNode | null = null;
    let chapterCounter = 0;
    let sceneCounter = 0;
    
    doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const level = node.attrs.level;
        const text = node.textContent || '';
        
        if (level === 1) {
          // Part level
          currentPart = {
            id: `part-${pos}`,
            type: 'part',
            label: text || 'Untitled Part',
            children: [],
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              position: pos,
              wordCount: 0,
            },
          };
          nodes.push(currentPart);
          currentChapter = null;
          chapterCounter = 0;
        } else if (level === 2) {
          // Chapter level
          chapterCounter++;
          sceneCounter = 0;
          
          const chapter: StoryNode = {
            id: `chapter-${pos}`,
            type: 'chapter',
            label: text || `Chapter ${chapterCounter}`,
            children: [],
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              position: pos,
              wordCount: countWordsUntilNextHeading(doc, pos, 2),
              status: 'draft',
            },
          };
          
          if (currentPart) {
            currentPart.children!.push(chapter);
          } else {
            nodes.push(chapter);
          }
          currentChapter = chapter;
        } else if (level === 3 && currentChapter) {
          // Scene level
          sceneCounter++;
          
          const scene: StoryNode = {
            id: `scene-${pos}`,
            type: 'scene',
            label: text || `Scene ${sceneCounter}`,
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              position: pos,
              wordCount: countWordsUntilNextHeading(doc, pos, 3),
              status: 'draft',
            },
          };
          
          currentChapter.children!.push(scene);
        }
      }
    });
    
    return nodes;
  }, []);

  // Extract characters from framework editor
  const extractCharacters = useCallback((editor: Editor | null): StoryNode[] => {
    if (!editor) return [];
    
    const doc = editor.state.doc;
    const characters: StoryNode[] = [];
    
    // Look for character-related content in the framework
    // This parses the structured framework content
    doc.descendants((node) => {
      // Look for character profile blocks or specific patterns
      if (node.type.name === 'characterProfileBlock') {
        characters.push({
          id: node.attrs.id || `char-${characters.length}`,
          type: 'character',
          label: node.attrs.name || 'Unnamed Character',
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            role: node.attrs.role,
            traits: node.attrs.traits || [],
          },
        });
      }
      
      // Also parse plain text patterns like "## Character: Name"
      if (node.type.name === 'heading' && node.textContent) {
        const charMatch = node.textContent.match(/^(?:Character|👤)\s*[:]\s*(.+)/i);
        if (charMatch) {
          characters.push({
            id: `char-${characters.length}`,
            type: 'character',
            label: charMatch[1].trim(),
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }
    });
    
    // Group characters if we have many
    if (characters.length > 5) {
      return [
        {
          id: 'main-characters',
          type: 'character-group',
          label: 'Main Characters',
          children: characters.filter(c => 
            c.metadata.role === 'protagonist' || c.metadata.role === 'antagonist'
          ),
          metadata: { createdAt: new Date(), updatedAt: new Date() },
        },
        {
          id: 'supporting-characters',
          type: 'character-group',
          label: 'Supporting Characters',
          children: characters.filter(c => 
            c.metadata.role !== 'protagonist' && c.metadata.role !== 'antagonist'
          ),
          metadata: { createdAt: new Date(), updatedAt: new Date() },
        },
      ];
    }
    
    return characters;
  }, []);

  // Extract world-building elements
  const extractWorld = useCallback((editor: Editor | null): StoryNode[] => {
    if (!editor) return [];
    
    const doc = editor.state.doc;
    const locations: StoryNode[] = [];
    
    doc.descendants((node) => {
      if (node.type.name === 'heading' && node.textContent) {
        // Look for location patterns
        const locMatch = node.textContent.match(/^(?:Location|Setting|🌍|📍)\s*[:]\s*(.+)/i);
        if (locMatch) {
          locations.push({
            id: `loc-${locations.length}`,
            type: 'location',
            label: locMatch[1].trim(),
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }
    });
    
    return locations;
  }, []);

  // Extract notes
  const extractNotes = useCallback((editor: Editor | null): StoryNode[] => {
    // For now, return empty - notes could come from a separate store
    // or from specific note blocks in the framework
    return [];
  }, []);

  // Refresh all structures
  const refreshStructure = useCallback(() => {
    setIsLoading(true);
    
    setManuscriptTree(extractManuscriptStructure(manuscriptEditor));
    setCharactersTree(extractCharacters(frameworkEditor));
    setWorldTree(extractWorld(frameworkEditor));
    setNotesTree(extractNotes(frameworkEditor));
    
    setIsLoading(false);
  }, [
    manuscriptEditor, 
    frameworkEditor,
    extractManuscriptStructure,
    extractCharacters,
    extractWorld,
    extractNotes,
  ]);

  // Initial extraction and update on editor changes
  useEffect(() => {
    refreshStructure();
    
    // Listen for editor updates
    const handleManuscriptUpdate = () => {
      setManuscriptTree(extractManuscriptStructure(manuscriptEditor));
    };
    
    const handleFrameworkUpdate = () => {
      setCharactersTree(extractCharacters(frameworkEditor));
      setWorldTree(extractWorld(frameworkEditor));
    };
    
    manuscriptEditor?.on('update', handleManuscriptUpdate);
    frameworkEditor?.on('update', handleFrameworkUpdate);
    
    return () => {
      manuscriptEditor?.off('update', handleManuscriptUpdate);
      frameworkEditor?.off('update', handleFrameworkUpdate);
    };
  }, [manuscriptEditor, frameworkEditor, refreshStructure, extractManuscriptStructure, extractCharacters, extractWorld]);

  return {
    manuscriptTree,
    charactersTree,
    worldTree,
    notesTree,
    refreshStructure,
    isLoading,
  };
};

// Helper to count words until next heading of same or higher level
function countWordsUntilNextHeading(doc: any, startPos: number, level: number): number {
  let wordCount = 0;
  let foundStart = false;
  
  doc.descendants((node: any, pos: number) => {
    if (pos === startPos) {
      foundStart = true;
      return;
    }
    
    if (!foundStart) return;
    
    // Stop at next heading of same or higher level
    if (node.type.name === 'heading' && node.attrs.level <= level) {
      return false;
    }
    
    // Count words in text nodes
    if (node.isText && node.text) {
      wordCount += node.text.split(/\s+/).filter((w: string) => w.length > 0).length;
    }
  });
  
  return wordCount;
}
```

---

## 2.6 Context Menu Component

```typescript
// src/components/IDE/StoryExplorer/StoryNodeContextMenu.tsx

'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { StoryNode } from './types';
import {
  Edit3,
  Trash2,
  Copy,
  Clipboard,
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  Sparkles,
} from 'lucide-react';

interface StoryNodeContextMenuProps {
  node: StoryNode;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export const StoryNodeContextMenu: React.FC<StoryNodeContextMenuProps> = ({
  node,
  position,
  onClose,
  onRename,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 200),
    y: Math.min(position.y, window.innerHeight - 300),
  };

  const menuItems = getMenuItemsForNode(node, { onRename, onDelete, onClose });

  return (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-50 min-w-[180px] py-1 rounded-md shadow-lg',
        'bg-[--ide-sidebar-bg] border border-[--ide-border]'
      )}
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {menuItems.map((item, index) => (
        item.type === 'separator' ? (
          <div key={index} className="h-px my-1 bg-[--ide-border]" />
        ) : (
          <button
            key={index}
            onClick={item.onClick}
            disabled={item.disabled}
            className={cn(
              'w-full px-3 py-1.5 text-sm text-left flex items-center gap-2',
              'hover:bg-[--ide-list-hover-bg] transition-colors',
              item.disabled && 'opacity-50 cursor-not-allowed',
              item.danger && 'text-[--ide-error]'
            )}
          >
            {item.icon && <item.icon className="w-4 h-4" />}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-[--ide-activitybar-inactive]">
                {item.shortcut}
              </span>
            )}
          </button>
        )
      ))}
    </div>
  );
};

interface MenuItem {
  type?: 'separator';
  label?: string;
  icon?: any;
  onClick?: () => void;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
}

function getMenuItemsForNode(
  node: StoryNode, 
  actions: { onRename: () => void; onDelete: () => void; onClose: () => void }
): MenuItem[] {
  const baseItems: MenuItem[] = [
    {
      label: 'Rename',
      icon: Edit3,
      onClick: actions.onRename,
      shortcut: 'F2',
    },
    { type: 'separator' },
  ];

  // Type-specific items
  const typeItems: MenuItem[] = [];

  switch (node.type) {
    case 'chapter':
    case 'scene':
      typeItems.push(
        {
          label: 'Go to Position',
          icon: Eye,
          onClick: () => {
            // Navigate to position in editor
            actions.onClose();
          },
        },
        {
          label: 'Add Scene Below',
          icon: Plus,
          onClick: () => {
            // Add scene
            actions.onClose();
          },
        },
        {
          label: 'Ask AI to Expand',
          icon: Sparkles,
          onClick: () => {
            // Trigger AI expansion
            actions.onClose();
          },
        }
      );
      break;

    case 'character':
      typeItems.push(
        {
          label: 'View Profile',
          icon: Eye,
          onClick: () => actions.onClose(),
        },
        {
          label: 'Find Appearances',
          icon: Eye,
          onClick: () => actions.onClose(),
        },
        {
          label: 'AI Character Analysis',
          icon: Sparkles,
          onClick: () => actions.onClose(),
        }
      );
      break;

    case 'location':
      typeItems.push(
        {
          label: 'View Details',
          icon: Eye,
          onClick: () => actions.onClose(),
        },
        {
          label: 'Find Scenes Here',
          icon: Eye,
          onClick: () => actions.onClose(),
        }
      );
      break;
  }

  const commonItems: MenuItem[] = [
    { type: 'separator' },
    {
      label: 'Copy',
      icon: Copy,
      onClick: () => actions.onClose(),
      shortcut: '⌘C',
    },
    {
      label: 'Cut',
      icon: Clipboard,
      onClick: () => actions.onClose(),
      shortcut: '⌘X',
    },
    { type: 'separator' },
    {
      label: 'Move Up',
      icon: ArrowUp,
      onClick: () => actions.onClose(),
    },
    {
      label: 'Move Down',
      icon: ArrowDown,
      onClick: () => actions.onClose(),
    },
    { type: 'separator' },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: actions.onDelete,
      shortcut: '⌫',
      danger: true,
    },
  ];

  return [...baseItems, ...typeItems, ...commonItems];
}
```

---

## Part 2 Summary

The Story Explorer provides:

1. **Tabbed Navigation** - Manuscript, Characters, World, Notes
2. **Tree View** - Hierarchical display with expand/collapse
3. **Search** - Filter by name across all elements
4. **Drag & Drop** - Reorder chapters, scenes, characters
5. **Context Menus** - Right-click actions per node type
6. **AI Integration** - Status indicators, "Ask AI" options
7. **Live Sync** - Updates as you type in the editor

**Key Files Created:**
- `StoryExplorer.tsx` - Main container
- `StoryTree.tsx` - Recursive tree component
- `useStoryStructure.ts` - Data extraction from editors
- `StoryNodeContextMenu.tsx` - Right-click actions
- `types.ts` - Type definitions

---

*Continue to Part 3 for Main Editor Enhancements...*
