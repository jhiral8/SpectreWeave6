'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
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
  Clock,
  Edit3,
  MoreHorizontal,
  Bookmark,
  Map,
} from 'lucide-react';

// Get icon for node type
export function getNodeIcon(type: StoryNodeType, isExpanded: boolean = false): React.ElementType {
  switch (type) {
    case 'manuscript':
      return BookOpen;
    case 'part':
      return isExpanded ? FolderOpen : Folder;
    case 'chapter':
      return FileText;
    case 'scene':
      return Edit3;
    case 'character':
      return User;
    case 'character-group':
      return Users;
    case 'location':
      return MapPin;
    case 'location-group':
      return Globe;
    case 'timeline':
      return Clock;
    case 'event':
      return Bookmark;
    case 'note':
      return StickyNote;
    case 'note-folder':
      return isExpanded ? FolderOpen : Folder;
    case 'research':
      return Map;
    case 'style-guide':
      return BookOpen;
    default:
      return FileText;
  }
}

// Get status icon
export function getStatusIcon(status?: 'analyzing' | 'has-issues' | 'approved'): React.ElementType | null {
  switch (status) {
    case 'analyzing':
      return Sparkles;
    case 'has-issues':
      return AlertCircle;
    case 'approved':
      return CheckCircle;
    default:
      return null;
  }
}

// Get status color
export function getStatusColor(status?: 'analyzing' | 'has-issues' | 'approved'): string {
  switch (status) {
    case 'analyzing':
      return 'text-[--ide-info]';
    case 'has-issues':
      return 'text-[--ide-warning]';
    case 'approved':
      return 'text-[--ide-success,#22c55e]';
    default:
      return '';
  }
}

// Get completion status color
export function getCompletionColor(status?: 'draft' | 'in-progress' | 'review' | 'complete'): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-400';
    case 'in-progress':
      return 'bg-blue-400';
    case 'review':
      return 'bg-yellow-400';
    case 'complete':
      return 'bg-green-400';
    default:
      return 'bg-gray-300';
  }
}

interface StoryTreeNodeProps {
  node: StoryNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: (nodeId: string) => void;
  onSelect: (node: StoryNode) => void;
  onRename: (nodeId: string, newName: string) => void;
  onDelete: (nodeId: string) => void;
  onContextMenu?: (node: StoryNode, position: { x: number; y: number }) => void;
}

export const StoryTreeNode: React.FC<StoryTreeNodeProps> = ({
  node,
  depth,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect,
  onRename,
  onDelete,
  onContextMenu,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  
  const hasChildren = node.children && node.children.length > 0;
  const indent = depth * 12 + 8;
  
  // Get appropriate icon
  const Icon = getNodeIcon(node.type, isExpanded);
  const StatusIcon = getStatusIcon(node.aiStatus);
  
  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node);
  }, [node, onSelect]);
  
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Start editing
    setIsEditing(true);
  }, []);
  
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  }, [hasChildren, node.id, onToggleExpand]);
  
  const handleContextMenuClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(node, { x: e.clientX, y: e.clientY });
  }, [node, onContextMenu]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (editValue.trim() && editValue !== node.label) {
          onRename(node.id, editValue.trim());
        }
        setIsEditing(false);
      } else if (e.key === 'Escape') {
        setEditValue(node.label);
        setIsEditing(false);
      }
    } else {
      if (e.key === 'Enter') {
        onSelect(node);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        onDelete(node.id);
      } else if (e.key === 'F2') {
        setIsEditing(true);
      } else if (e.key === 'ArrowLeft' && isExpanded && hasChildren) {
        onToggleExpand(node.id);
      } else if (e.key === 'ArrowRight' && !isExpanded && hasChildren) {
        onToggleExpand(node.id);
      }
    }
  }, [isEditing, editValue, node, isExpanded, hasChildren, onRename, onSelect, onDelete, onToggleExpand]);
  
  const handleBlur = useCallback(() => {
    if (isEditing) {
      if (editValue.trim() && editValue !== node.label) {
        onRename(node.id, editValue.trim());
      }
      setIsEditing(false);
    }
  }, [isEditing, editValue, node.id, node.label, onRename]);

  return (
    <div
      ref={nodeRef}
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenuClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center h-7 pr-2 cursor-pointer group',
        'transition-colors duration-75',
        isSelected 
          ? 'bg-[--ide-list-active-bg] text-[--ide-list-active-fg]' 
          : 'hover:bg-[--ide-list-hover-bg]',
        'focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[--ide-focus-border]'
      )}
      style={{ paddingLeft: indent }}
    >
      {/* Expand/Collapse chevron */}
      <div
        onClick={handleToggle}
        className={cn(
          'w-4 h-4 flex items-center justify-center flex-shrink-0',
          hasChildren ? 'opacity-100' : 'opacity-0'
        )}
      >
        {hasChildren && (
          isExpanded 
            ? <ChevronDown className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />
        )}
      </div>
      
      {/* Icon */}
      <Icon className={cn(
        'w-4 h-4 flex-shrink-0 mr-1.5',
        isSelected ? 'text-[--ide-list-active-fg]' : 'text-[--ide-activitybar-inactive]'
      )} />
      
      {/* Label or Edit Input */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          className={cn(
            'flex-1 h-5 px-1 text-sm rounded-sm',
            'bg-[--ide-input-bg] text-[--ide-input-fg]',
            'border border-[--ide-input-focus-border]',
            'focus:outline-none'
          )}
        />
      ) : (
        <span className="flex-1 text-sm truncate">{node.label}</span>
      )}
      
      {/* Metadata indicators */}
      {!isEditing && (
        <div className="flex items-center gap-1 ml-auto">
          {/* Word count for chapters/scenes */}
          {node.metadata.wordCount !== undefined && (
            <span className="text-[10px] text-[--ide-activitybar-inactive] tabular-nums">
              {node.metadata.wordCount.toLocaleString()}w
            </span>
          )}
          
          {/* Status dot */}
          {node.metadata.status && (
            <div 
              className={cn(
                'w-2 h-2 rounded-full',
                getCompletionColor(node.metadata.status)
              )}
              title={node.metadata.status}
            />
          )}
          
          {/* AI Status */}
          {StatusIcon && (
            <StatusIcon className={cn('w-3.5 h-3.5', getStatusColor(node.aiStatus))} />
          )}
          
          {/* More menu (visible on hover) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu?.(node, { x: e.clientX, y: e.clientY });
            }}
            className={cn(
              'w-5 h-5 flex items-center justify-center rounded',
              'opacity-0 group-hover:opacity-100',
              'hover:bg-[--ide-list-hover-bg] transition-opacity'
            )}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
