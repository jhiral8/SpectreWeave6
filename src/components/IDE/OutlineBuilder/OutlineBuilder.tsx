'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { List, Plus, Trash2, ChevronRight, ChevronDown, GripVertical } from 'lucide-react';

export interface OutlineItem {
  id: string;
  title: string;
  description?: string;
  type: 'act' | 'chapter' | 'scene' | 'beat';
  children?: OutlineItem[];
  order: number;
}

interface OutlineBuilderProps {
  outline: OutlineItem[];
  onUpdate?: (outline: OutlineItem[]) => void;
  onSelectItem?: (item: OutlineItem) => void;
  className?: string;
}

export function OutlineBuilder({
  outline = [],
  onUpdate,
  onSelectItem,
  className,
}: OutlineBuilderProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', type: 'chapter' as OutlineItem['type'] });

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCreate = useCallback(() => {
    if (!newItem.title.trim() || !onUpdate) return;
    const item: OutlineItem = {
      id: `outline-${Date.now()}`,
      title: newItem.title.trim(),
      type: newItem.type,
      order: outline.length,
    };
    onUpdate([...outline, item]);
    setNewItem({ title: '', type: 'chapter' });
    setIsCreating(false);
  }, [newItem, outline, onUpdate]);

  const handleDelete = useCallback((id: string) => {
    if (!onUpdate) return;
    onUpdate(outline.filter(item => item.id !== id));
  }, [outline, onUpdate]);

  const renderItem = (item: OutlineItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds.has(item.id);

    return (
      <div key={item.id}>
        <div
          className={cn(
            'group flex items-center gap-2 px-2 py-1.5 cursor-pointer',
            'hover:bg-[--vsc-list-hover-bg] rounded',
            'text-[--vsc-sidebar-fg] text-sm'
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => onSelectItem?.(item)}
        >
          <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 cursor-grab" />
          {hasChildren ? (
            <button onClick={(e) => { e.stopPropagation(); toggleExpanded(item.id); }} className="p-0.5">
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          ) : <span className="w-4" />}
          <span className="text-xs px-1.5 py-0.5 rounded bg-[--vsc-badge-bg] text-[--vsc-badge-fg]">{item.type}</span>
          <span className="flex-1 truncate">{item.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
            className="hidden group-hover:block p-1 hover:bg-red-500/20 rounded text-red-400"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        {hasChildren && isExpanded && <div>{item.children!.map(child => renderItem(child, depth + 1))}</div>}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[--vsc-panel-border]">
        <div className="flex items-center gap-2 text-xs font-medium uppercase text-[--vsc-sidebar-fg] opacity-80">
          <List className="w-4 h-4" />
          <span>Outline Builder</span>
        </div>
        <button onClick={() => setIsCreating(true)} className="p-1 hover:bg-[--vsc-list-hover-bg] rounded">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {isCreating && (
        <div className="p-3 border-b border-[--vsc-panel-border] bg-[--vsc-input-bg]">
          <input
            type="text"
            placeholder="Title..."
            value={newItem.title}
            onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-2 py-1 text-sm bg-[--vsc-input-bg] border border-[--vsc-input-border] rounded"
            autoFocus
          />
          <select
            value={newItem.type}
            onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value as OutlineItem['type'] }))}
            className="w-full mt-2 px-2 py-1 text-sm bg-[--vsc-input-bg] border border-[--vsc-input-border] rounded"
          >
            <option value="act">Act</option>
            <option value="chapter">Chapter</option>
            <option value="scene">Scene</option>
            <option value="beat">Beat</option>
          </select>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setIsCreating(false)} className="px-2 py-1 text-xs">Cancel</button>
            <button onClick={handleCreate} disabled={!newItem.title.trim()} className="px-2 py-1 text-xs bg-[--vsc-button-bg] rounded disabled:opacity-50">Create</button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto py-1">
        {outline.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[--vsc-sidebar-fg] opacity-60 px-4 text-center">
            <List className="w-8 h-8 mb-2" />
            <p className="text-sm">No outline items</p>
            <p className="text-xs mt-1">Build your story structure</p>
          </div>
        ) : outline.map(item => renderItem(item))}
      </div>
    </div>
  );
}

export default OutlineBuilder;
