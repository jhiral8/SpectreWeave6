'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Globe,
  MapPin,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Building,
  Mountain,
  Home,
} from 'lucide-react';

export interface StoryLocation {
  id: string;
  name: string;
  type: 'city' | 'building' | 'landscape' | 'room' | 'region' | 'other';
  description: string;
  details?: string;
  parentId?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface WorldBuildingPanelProps {
  locations: StoryLocation[];
  onCreateLocation?: (location: Omit<StoryLocation, 'id'>) => void;
  onUpdateLocation?: (id: string, updates: Partial<StoryLocation>) => void;
  onDeleteLocation?: (id: string) => void;
  onSelectLocation?: (location: StoryLocation) => void;
  className?: string;
}

const LOCATION_TYPES = [
  { value: 'region', label: 'Region', icon: Globe },
  { value: 'city', label: 'City', icon: Building },
  { value: 'building', label: 'Building', icon: Home },
  { value: 'room', label: 'Room', icon: Home },
  { value: 'landscape', label: 'Landscape', icon: Mountain },
  { value: 'other', label: 'Other', icon: MapPin },
] as const;

function getLocationIcon(type: StoryLocation['type']) {
  const config = LOCATION_TYPES.find(t => t.value === type);
  return config?.icon || MapPin;
}

export function WorldBuildingPanel({
  locations = [],
  onCreateLocation,
  onDeleteLocation,
  onSelectLocation,
  className,
}: WorldBuildingPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newLocation, setNewLocation] = useState<Partial<StoryLocation>>({
    name: '',
    type: 'city',
    description: '',
  });

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCreate = useCallback(() => {
    if (!newLocation.name?.trim() || !onCreateLocation) return;
    onCreateLocation({
      name: newLocation.name.trim(),
      type: newLocation.type || 'city',
      description: newLocation.description || '',
    });
    setNewLocation({ name: '', type: 'city', description: '' });
    setIsCreating(false);
  }, [newLocation, onCreateLocation]);

  const handleDelete = useCallback((id: string) => {
    if (onDeleteLocation && confirm('Delete this location?')) {
      onDeleteLocation(id);
    }
  }, [onDeleteLocation]);

  const rootLocations = locations.filter(l => !l.parentId);
  const childrenMap = locations.reduce((acc, loc) => {
    if (loc.parentId) {
      if (!acc[loc.parentId]) acc[loc.parentId] = [];
      acc[loc.parentId].push(loc);
    }
    return acc;
  }, {} as Record<string, StoryLocation[]>);

  const renderLocation = (location: StoryLocation, depth = 0) => {
    const Icon = getLocationIcon(location.type);
    const children = childrenMap[location.id] || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(location.id);

    return (
      <div key={location.id}>
        <div
          className={cn(
            'group flex items-center gap-2 px-2 py-1.5 cursor-pointer',
            'hover:bg-[--vsc-list-hover-bg] rounded',
            'text-[--vsc-sidebar-fg] text-sm'
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => onSelectLocation?.(location)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpanded(location.id); }}
              className="p-0.5 hover:bg-[--vsc-list-hover-bg] rounded"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          ) : <span className="w-4" />}
          <Icon className="w-4 h-4 text-[--vsc-icon-fg] flex-shrink-0" />
          <span className="flex-1 truncate">{location.name}</span>
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(location.id); }}
              className="p-1 hover:bg-red-500/20 rounded text-red-400"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && <div>{children.map(child => renderLocation(child, depth + 1))}</div>}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[--vsc-panel-border]">
        <div className="flex items-center gap-2 text-xs font-medium uppercase text-[--vsc-sidebar-fg] opacity-80">
          <Globe className="w-4 h-4" />
          <span>World Building</span>
        </div>
        <button onClick={() => setIsCreating(true)} className="p-1 hover:bg-[--vsc-list-hover-bg] rounded" title="Add Location">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {isCreating && (
        <div className="p-3 border-b border-[--vsc-panel-border] bg-[--vsc-input-bg]">
          <input
            type="text"
            placeholder="Location name..."
            value={newLocation.name || ''}
            onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-2 py-1 text-sm bg-[--vsc-input-bg] border border-[--vsc-input-border] rounded focus:border-[--vsc-focus-border] outline-none"
            autoFocus
          />
          <select
            value={newLocation.type || 'city'}
            onChange={(e) => setNewLocation(prev => ({ ...prev, type: e.target.value as StoryLocation['type'] }))}
            className="w-full mt-2 px-2 py-1 text-sm bg-[--vsc-input-bg] border border-[--vsc-input-border] rounded"
          >
            {LOCATION_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
          <textarea
            placeholder="Description..."
            value={newLocation.description || ''}
            onChange={(e) => setNewLocation(prev => ({ ...prev, description: e.target.value }))}
            className="w-full mt-2 px-2 py-1 text-sm bg-[--vsc-input-bg] border border-[--vsc-input-border] rounded resize-none"
            rows={2}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setIsCreating(false)} className="px-2 py-1 text-xs hover:bg-[--vsc-list-hover-bg] rounded">Cancel</button>
            <button onClick={handleCreate} disabled={!newLocation.name?.trim()} className="px-2 py-1 text-xs bg-[--vsc-button-bg] hover:bg-[--vsc-button-hover-bg] rounded disabled:opacity-50">Create</button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto py-1">
        {locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[--vsc-sidebar-fg] opacity-60 px-4 text-center">
            <Globe className="w-8 h-8 mb-2" />
            <p className="text-sm">No locations yet</p>
            <p className="text-xs mt-1">Create locations to build your world</p>
          </div>
        ) : rootLocations.map(loc => renderLocation(loc))}
      </div>
    </div>
  );
}

export default WorldBuildingPanel;
