'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { StoryNode } from './types';
import { StoryTreeNode } from './StoryTreeNode';

interface StoryTreeProps {
  nodes: StoryNode[];
  expandedNodes: Set<string>;
  selectedNode: string | null;
  onToggleExpand: (nodeId: string) => void;
  onSelect: (node: StoryNode) => void;
  onRename: (nodeId: string, newName: string) => void;
  onDelete: (nodeId: string) => void;
  onContextMenu?: (node: StoryNode, position: { x: number; y: number }) => void;
  depth?: number;
  className?: string;
}

export const StoryTree: React.FC<StoryTreeProps> = ({
  nodes,
  expandedNodes,
  selectedNode,
  onToggleExpand,
  onSelect,
  onRename,
  onDelete,
  onContextMenu,
  depth = 0,
  className,
}) => {
  if (nodes.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn('story-tree', className)} 
      role={depth === 0 ? 'tree' : 'group'}
    >
      {nodes.map((node) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;

        return (
          <div key={node.id}>
            <StoryTreeNode
              node={node}
              depth={depth}
              isExpanded={isExpanded}
              isSelected={selectedNode === node.id}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onContextMenu={onContextMenu}
            />
            
            {/* Render children recursively */}
            {hasChildren && isExpanded && (
              <StoryTree
                nodes={node.children!}
                expandedNodes={expandedNodes}
                selectedNode={selectedNode}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
                onRename={onRename}
                onDelete={onDelete}
                onContextMenu={onContextMenu}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Empty state component
interface EmptyStateProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
}

export const TreeEmptyState: React.FC<EmptyStateProps> = ({ 
  message, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-center px-4">
      <p className="text-sm text-[--ide-activitybar-inactive] mb-3">{message}</p>
      <button
        onClick={onAction}
        className={cn(
          'px-3 py-1.5 text-sm rounded',
          'bg-[--ide-activitybar-badge] text-white',
          'hover:opacity-90 transition-opacity'
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
};

// Loading skeleton
export const TreeLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-1 p-2">
      {[...Array(5)].map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-2 h-7 px-2"
          style={{ paddingLeft: (i % 3) * 12 + 8 }}
        >
          <div className="w-4 h-4 rounded bg-[--ide-border] animate-pulse" />
          <div 
            className="h-3 rounded bg-[--ide-border] animate-pulse"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        </div>
      ))}
    </div>
  );
};
