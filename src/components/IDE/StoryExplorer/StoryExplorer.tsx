'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react';
import { StoryTree, TreeEmptyState, TreeLoadingSkeleton } from './StoryTree';
import { StoryNode, ExplorerTab, EXPLORER_TAB_CONFIGS } from './types';

interface StoryExplorerProps {
  projectName?: string;
  className?: string;
  // Data for each tab
  manuscriptTree?: StoryNode[];
  charactersTree?: StoryNode[];
  worldTree?: StoryNode[];
  notesTree?: StoryNode[];
  isLoading?: boolean;
  // Callbacks
  onCreateNode?: (type: string, parentId?: string) => void;
  onSelectNode?: (node: StoryNode) => void;
  onRenameNode?: (nodeId: string, newName: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onRefresh?: () => void;
}

export const StoryExplorer: React.FC<StoryExplorerProps> = ({
  projectName = 'Untitled Project',
  className,
  manuscriptTree = [],
  charactersTree = [],
  worldTree = [],
  notesTree = [],
  isLoading = false,
  onCreateNode,
  onSelectNode,
  onRenameNode,
  onDeleteNode,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<ExplorerTab>('manuscript');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
  
  // Get current tab config
  const currentTabConfig = useMemo(() => 
    EXPLORER_TAB_CONFIGS.find(t => t.id === activeTab) || EXPLORER_TAB_CONFIGS[0],
  [activeTab]);

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback((node: StoryNode) => {
    setSelectedNode(node.id);
    onSelectNode?.(node);
  }, [onSelectNode]);
  
  const handleRename = useCallback((nodeId: string, newName: string) => {
    onRenameNode?.(nodeId, newName);
  }, [onRenameNode]);
  
  const handleDelete = useCallback((nodeId: string) => {
    onDeleteNode?.(nodeId);
  }, [onDeleteNode]);
  
  const handleCreate = useCallback((type?: string) => {
    onCreateNode?.(type || currentTabConfig.createType, selectedNode || undefined);
  }, [onCreateNode, currentTabConfig.createType, selectedNode]);
  
  const handleExpandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collectIds = (nodes: StoryNode[]) => {
      nodes.forEach(node => {
        if (node.children?.length) {
          allIds.add(node.id);
          collectIds(node.children);
        }
      });
    };
    collectIds(currentTree);
    setExpandedNodes(allIds);
  }, [currentTree]);
  
  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  return (
    <div className={cn('story-explorer flex flex-col h-full bg-[--ide-sidebar-bg]', className)}>
      {/* Header - VSCode style compact */}
      <div className={cn(
        'flex items-center justify-between px-3 h-[35px] min-h-[35px]',
        'border-b border-[--ide-border]'
      )}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[--ide-foreground-secondary]">
          Explorer
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onRefresh}
            className={cn(
              'p-1.5 rounded hover:bg-[--ide-list-hover]',
              'text-[--ide-foreground-secondary] hover:text-[--ide-foreground]',
              'transition-colors'
            )}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleCreate()}
            className={cn(
              'p-1.5 rounded hover:bg-[--ide-list-hover]',
              'text-[--ide-foreground-secondary] hover:text-[--ide-foreground]',
              'transition-colors'
            )}
            title={currentTabConfig.createLabel}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            className={cn(
              'p-1.5 rounded hover:bg-[--ide-list-hover]',
              'text-[--ide-foreground-secondary] hover:text-[--ide-foreground]',
              'transition-colors'
            )}
            title="More actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Project Name Section */}
      <div className={cn(
        'flex items-center px-3 h-[22px] min-h-[22px]',
        'text-[11px] font-semibold uppercase tracking-wide',
        'text-[--ide-foreground] bg-[--ide-sidebar-bg]',
        'cursor-pointer hover:bg-[--ide-list-hover]'
      )}>
        <ChevronDown className="w-3 h-3 mr-1" />
        {projectName}
      </div>
      
      {/* Tab Bar */}
      <div className="flex border-b border-[--ide-border]">
        {EXPLORER_TAB_CONFIGS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors',
              'hover:bg-[--ide-list-hover] relative uppercase tracking-wide',
              activeTab === tab.id
                ? 'text-[--ide-foreground]'
                : 'text-[--ide-foreground-secondary]'
            )}
            title={tab.label}
          >
            <span className="mr-1">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {/* Active indicator */}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-[--ide-activitybar-badge]" />
            )}
          </button>
        ))}
      </div>
      
      {/* Search */}
      <div className="p-2 border-b border-[--ide-border]">
        <div className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-sm',
          'bg-[--ide-input-bg] border',
          isSearchFocused 
            ? 'border-[--ide-input-focus]' 
            : 'border-[--ide-input-border]',
          'transition-colors'
        )}>
          <Search className="w-3.5 h-3.5 text-[--ide-activitybar-inactive] flex-shrink-0" />
          <input
            type="text"
            placeholder={`Search ${currentTabConfig.label.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={cn(
              'flex-1 bg-transparent text-sm text-[--ide-input-fg]',
              'placeholder:text-[--ide-activitybar-inactive]',
              'focus:outline-none'
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[--ide-activitybar-inactive] hover:text-[--ide-foreground]"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="flex items-center justify-end px-2 py-1 gap-1 border-b border-[--ide-border]">
        <button
          onClick={handleExpandAll}
          className={cn(
            'p-1 rounded hover:bg-[--ide-list-hover-bg]',
            'text-[--ide-activitybar-inactive] hover:text-[--ide-foreground]',
            'transition-colors'
          )}
          title="Expand All"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleCollapseAll}
          className={cn(
            'p-1 rounded hover:bg-[--ide-list-hover-bg]',
            'text-[--ide-activitybar-inactive] hover:text-[--ide-foreground]',
            'transition-colors'
          )}
          title="Collapse All"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Tree View */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <TreeLoadingSkeleton />
        ) : filteredTree.length === 0 ? (
          <TreeEmptyState 
            message={searchQuery 
              ? `No results for "${searchQuery}"` 
              : currentTabConfig.emptyMessage}
            actionLabel={searchQuery ? 'Clear search' : currentTabConfig.createLabel}
            onAction={searchQuery ? () => setSearchQuery('') : () => handleCreate()}
          />
        ) : (
          <StoryTree
            nodes={filteredTree}
            expandedNodes={expandedNodes}
            selectedNode={selectedNode}
            onToggleExpand={handleToggleExpand}
            onSelect={handleSelect}
            onRename={handleRename}
            onDelete={handleDelete}
            className="py-1"
          />
        )}
      </div>
      
      {/* Footer stats */}
      <div className={cn(
        'flex items-center justify-between px-3 py-1.5',
        'border-t border-[--ide-border]',
        'text-[10px] text-[--ide-activitybar-inactive]'
      )}>
        <span>{countNodes(currentTree)} items</span>
        {searchQuery && <span>{filteredTree.length} matches</span>}
      </div>
    </div>
  );
};

// Helper: Filter tree by search query
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
        isExpanded: filteredChildren.length > 0,
      });
    }
    
    return acc;
  }, []);
}

// Helper: Count all nodes in tree
function countNodes(nodes: StoryNode[]): number {
  return nodes.reduce((count, node) => {
    return count + 1 + (node.children ? countNodes(node.children) : 0);
  }, 0);
}
