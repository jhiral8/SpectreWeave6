'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { TreeNode } from './types';

interface FileTreeProps {
  nodes: TreeNode[];
  onSelect?: (nodeId: string) => void;
  onToggle?: (nodeId: string) => void;
}

/**
 * File Tree Component
 * 
 * VS Code-style file tree with expandable folders.
 * Adapted for fiction: Chapters → Scenes hierarchy.
 * 
 * ┌─────────────────────────────────────┐
 * │ ▼ My Novel                         │
 * │   ▼ Chapter 1                      │
 * │     Scene 1.1                      │
 * │     Scene 1.2                      │
 * │   ▶ Chapter 2                      │
 * │   ▶ Chapter 3                      │
 * └─────────────────────────────────────┘
 */
export const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  onSelect,
  onToggle,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(nodes.filter(n => n.isExpanded).map(n => n.id))
  );

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
    onToggle?.(nodeId);
  }, [onToggle]);

  const renderNode = (node: TreeNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isFolder = node.type === 'folder' || node.type === 'chapter';

    return (
      <div key={node.id}>
        <div
          className={cn(
            'vscode-tree-node',
            'flex items-center h-[22px]',
            'cursor-pointer select-none',
            'hover:bg-[var(--ide-hover-bg,#2a2d2e)]',
            node.isActive && 'bg-[var(--ide-accent-transparent,#094771)]',
            'group'
          )}
          style={{ paddingLeft: `${8 + node.depth * 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            onSelect?.(node.id);
          }}
          role="treeitem"
          aria-expanded={hasChildren ? isExpanded : undefined}
        >
          {/* Expand/Collapse Chevron or Spacer */}
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-3 h-3 text-[var(--ide-foreground-muted,#c5c5c5)]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[var(--ide-foreground-muted,#c5c5c5)]" />
              )
            ) : null}
          </span>

          {/* File/Folder Icon */}
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center mr-1">
            <TreeIcon type={node.type} isExpanded={isExpanded} />
          </span>

          {/* Label */}
          <span
            className={cn(
              'flex-1 truncate text-[13px]',
              'text-[var(--ide-foreground,#cccccc)]',
              node.isModified && 'italic'
            )}
          >
            {node.label}
          </span>

          {/* Modified Indicator */}
          {node.isModified && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-current mr-2" />
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div role="group">
            {node.children!.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (nodes.length === 0) {
    return (
      <div className="px-4 py-2 text-[12px] text-[var(--ide-foreground-muted,#8b8b8b)]">
        No files in workspace
      </div>
    );
  }

  return (
    <div className="vscode-file-tree" role="tree">
      {nodes.map(node => renderNode(node))}
    </div>
  );
};

/**
 * Tree node icon based on type
 */
const TreeIcon: React.FC<{ type: TreeNode['type']; isExpanded?: boolean }> = ({ type, isExpanded }) => {
  const iconClass = "w-4 h-4";
  
  if (type === 'folder') {
    return isExpanded ? (
      <svg className={iconClass} viewBox="0 0 16 16" fill="#dcb67a">
        <path d="M1.5 14h13l.5-.5v-8l-.5-.5H7.71l-1-1H1.5l-.5.5v9l.5.5zm0-9h4.29l1 1H14v7H2V5h-.5z"/>
      </svg>
    ) : (
      <svg className={iconClass} viewBox="0 0 16 16" fill="#dcb67a">
        <path d="M14.5 3H7.71l-1-1H1.5l-.5.5v11l.5.5h13l.5-.5v-10l-.5-.5zm-.5 10H2V4h3.29l1 1H14v8z"/>
      </svg>
    );
  }

  if (type === 'chapter') {
    return (
      <svg className={iconClass} viewBox="0 0 16 16" fill="#519aba">
        <path d="M14.5 2h-13l-.5.5v11l.5.5h13l.5-.5v-11l-.5-.5zm-.5 11H2V3h12v10zM4 6h8v1H4V6zm0 3h8v1H4V9z"/>
      </svg>
    );
  }

  if (type === 'scene') {
    return (
      <svg className={iconClass} viewBox="0 0 16 16" fill="#a074c4">
        <path d="M13.71 4.29l-3-3L10 1H4L3 2v12l1 1h9l1-1V5l-.29-.71zM13 14H4V2h5v4h4v8zm-3-9V2l3 3h-3z"/>
      </svg>
    );
  }

  // Default file icon
  return (
    <svg className={iconClass} viewBox="0 0 16 16" fill="#c5c5c5">
      <path d="M13.71 4.29l-3-3L10 1H4L3 2v12l1 1h9l1-1V5l-.29-.71zM13 14H4V2h5v4h4v8zm-3-9V2l3 3h-3z"/>
    </svg>
  );
};

export default FileTree;
