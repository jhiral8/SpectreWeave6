/**
 * World Building Panel
 * 
 * VSCode Outline-style hierarchical view for story world elements.
 * Manages locations from the story_locations Supabase table.
 * 
 * Now integrated with persistent storage via useIDEProject hook.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Globe,
  MapPin,
  Building2,
  Home,
  Mountain,
  Map,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Search,
  MoreVertical,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Database format (snake_case from Supabase)
interface DBStoryLocation {
  id: string;
  project_id?: string;
  user_id?: string;
  name: string;
  description?: string;
  type: 'city' | 'town' | 'village' | 'building' | 'room' | 'landscape' | 'region' | 'country' | 'world' | 'other';
  parent_id?: string | null;
  attributes?: Record<string, unknown>;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

// UI format
export interface StoryLocation {
  id: string;
  name: string;
  description?: string;
  type: DBStoryLocation['type'];
  parentId?: string | null;
  attributes?: Record<string, unknown>;
  imageUrl?: string;
}

// Normalize DB location to UI location
function normalizeLocation(loc: DBStoryLocation | StoryLocation): StoryLocation {
  if ('parentId' in loc) {
    return loc as StoryLocation;
  }
  const dbLoc = loc as DBStoryLocation;
  return {
    id: dbLoc.id,
    name: dbLoc.name,
    description: dbLoc.description,
    type: dbLoc.type,
    parentId: dbLoc.parent_id,
    attributes: dbLoc.attributes,
    imageUrl: dbLoc.image_url,
  };
}

// Tree node for hierarchical display
interface LocationTreeNode extends StoryLocation {
  children: LocationTreeNode[];
  expanded?: boolean;
}

interface WorldBuildingPanelProps {
  locations?: (DBStoryLocation | StoryLocation)[];
  onCreateLocation?: (data: Partial<StoryLocation>) => Promise<StoryLocation | DBStoryLocation>;
  onUpdateLocation?: (id: string, updates: Partial<StoryLocation>) => Promise<void>;
  onDeleteLocation?: (id: string) => Promise<void>;
  onSelectLocation?: (location: StoryLocation) => void;
  className?: string;
}

const LOCATION_TYPE_ICONS: Record<StoryLocation['type'], React.ReactNode> = {
  world: <Globe className="w-4 h-4" />,
  country: <Map className="w-4 h-4" />,
  region: <Mountain className="w-4 h-4" />,
  city: <Building2 className="w-4 h-4" />,
  town: <Building2 className="w-4 h-4" />,
  village: <Home className="w-4 h-4" />,
  building: <Building2 className="w-4 h-4" />,
  room: <Home className="w-4 h-4" />,
  landscape: <Mountain className="w-4 h-4" />,
  other: <MapPin className="w-4 h-4" />,
};

const LOCATION_TYPES: { value: StoryLocation['type']; label: string }[] = [
  { value: 'world', label: 'World' },
  { value: 'country', label: 'Country' },
  { value: 'region', label: 'Region' },
  { value: 'city', label: 'City' },
  { value: 'town', label: 'Town' },
  { value: 'village', label: 'Village' },
  { value: 'building', label: 'Building' },
  { value: 'room', label: 'Room' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'other', label: 'Other' },
];

export const WorldBuildingPanel: React.FC<WorldBuildingPanelProps> = ({
  locations: rawLocations = [],
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
  onSelectLocation,
  className,
}) => {
  // Normalize locations to UI format
  const locations = useMemo(() => rawLocations.map(normalizeLocation), [rawLocations]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root']));
  
  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<StoryLocation['type']>('city');
  const [newParentId, setNewParentId] = useState<string | null>(null);
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Build hierarchical tree from flat locations
  const locationTree = useMemo(() => {
    const rootNodes: LocationTreeNode[] = [];
    const nodeMap: Record<string, LocationTreeNode> = {};
    
    // First pass: create all nodes
    locations.forEach(loc => {
      nodeMap[loc.id] = { ...loc, children: [], expanded: expandedIds.has(loc.id) };
    });
    
    // Second pass: build hierarchy
    locations.forEach(loc => {
      const node = nodeMap[loc.id];
      if (loc.parentId && nodeMap[loc.parentId]) {
        nodeMap[loc.parentId].children.push(node);
      } else {
        rootNodes.push(node);
      }
    });
    
    // Sort alphabetically
    const sortNodes = (nodes: LocationTreeNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach(n => sortNodes(n.children));
    };
    sortNodes(rootNodes);
    
    return rootNodes;
  }, [locations, expandedIds]);

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

  const handleCreate = async () => {
    if (!newName.trim() || !onCreateLocation) return;
    
    await onCreateLocation({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      type: newType,
      parentId: newParentId,
    });
    
    setNewName('');
    setNewDescription('');
    setNewType('city');
    setNewParentId(null);
    setIsCreating(false);
  };

  const handleStartEdit = (location: StoryLocation) => {
    setEditingId(location.id);
    setEditName(location.name);
    setEditDescription(location.description || '');
  };

  const handleSaveEdit = async (location: StoryLocation) => {
    if (!onUpdateLocation) return;
    
    await onUpdateLocation(location.id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });
    
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteLocation) return;
    if (confirm('Delete this location and all nested locations?')) {
      await onDeleteLocation(id);
    }
  };

  const handleSelect = (location: StoryLocation) => {
    setSelectedId(location.id);
    onSelectLocation?.(location);
  };

  const renderLocationNode = (node: LocationTreeNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedId === node.id;
    const isEditing = editingId === node.id;
    const paddingLeft = depth * 16 + 8;

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-1 py-1.5 px-2 cursor-pointer group',
            'hover:bg-[--ide-list-hover] transition-colors',
            isSelected && 'bg-[--ide-list-active]'
          )}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => handleSelect(node)}
        >
          {/* Expand/collapse icon */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
              className="p-0.5 hover:bg-[--ide-list-hover] rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-[--ide-foreground-muted]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[--ide-foreground-muted]" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* Icon */}
          <span className="text-[--ide-accent]">
            {LOCATION_TYPE_ICONS[node.type] || <MapPin className="w-4 h-4" />}
          </span>

          {/* Name (editable) */}
          {isEditing ? (
            <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 px-1 py-0.5 text-[13px] bg-[--ide-input-bg] border border-[--ide-border] rounded text-[--ide-foreground] focus:outline-none focus:border-[--ide-accent]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(node);
                  if (e.key === 'Escape') setEditingId(null);
                }}
              />
              <button
                onClick={() => handleSaveEdit(node)}
                className="p-1 hover:bg-green-500/20 rounded text-green-400"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="p-1 hover:bg-red-500/20 rounded text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <span className="text-[13px] flex-1 text-[--ide-foreground] truncate">
                {node.name}
              </span>

              {/* Type badge */}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[--ide-input-bg] text-[--ide-foreground-muted] opacity-60">
                {node.type}
              </span>

              {/* Actions (show on hover) */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Create child location
                    setNewParentId(node.id);
                    setIsCreating(true);
                  }}
                  className="p-1 hover:bg-[--ide-list-hover] rounded"
                  title="Add Child Location"
                >
                  <Plus className="w-3 h-3 text-[--ide-foreground-muted]" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(node);
                  }}
                  className="p-1 hover:bg-[--ide-list-hover] rounded"
                  title="Edit"
                >
                  <Edit2 className="w-3 h-3 text-[--ide-foreground-muted]" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(node.id);
                  }}
                  className="p-1 hover:bg-[--ide-list-hover] rounded"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3 text-[--ide-foreground-muted]" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderLocationNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Filter locations by search
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return locationTree;
    
    const query = searchQuery.toLowerCase();
    const filterNodes = (nodes: LocationTreeNode[]): LocationTreeNode[] => {
      return nodes.reduce<LocationTreeNode[]>((acc, node) => {
        const matchesSelf = node.name.toLowerCase().includes(query) ||
                          node.description?.toLowerCase().includes(query);
        const filteredChildren = filterNodes(node.children);
        
        if (matchesSelf || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren, expanded: true });
        }
        return acc;
      }, []);
    };
    
    return filterNodes(locationTree);
  }, [locationTree, searchQuery]);

  return (
    <div className={cn('h-full flex flex-col bg-[--ide-sidebar-bg]', className)}>
      {/* Header */}
      <div className="h-[35px] px-3 flex items-center justify-between border-b border-[--ide-border] shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[--ide-foreground]">
          World Building
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setNewParentId(null);
              setIsCreating(true);
            }}
            className="p-1 hover:bg-[--ide-list-hover] rounded transition-colors"
            title="Add Location"
          >
            <Plus className="w-3.5 h-3.5 text-[--ide-foreground-muted]" />
          </button>
          <button
            className="p-1 hover:bg-[--ide-list-hover] rounded transition-colors"
            title="More Actions"
          >
            <MoreVertical className="w-3.5 h-3.5 text-[--ide-foreground-muted]" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-[--ide-border]">
        <div className="flex items-center gap-2 px-2 py-1 bg-[--ide-input-bg] border border-[--ide-border] rounded">
          <Search className="w-3.5 h-3.5 text-[--ide-foreground-muted]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search locations..."
            className="flex-1 bg-transparent text-[13px] text-[--ide-foreground] focus:outline-none placeholder:text-[--ide-foreground-muted]"
          />
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="px-2 py-2 border-b border-[--ide-border] bg-[--ide-input-bg]/50 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[--ide-accent]" />
            <span className="text-xs font-medium text-[--ide-foreground]">
              New Location
              {newParentId && (
                <span className="text-[--ide-foreground-muted] ml-1">
                  (child of {locations.find(l => l.id === newParentId)?.name})
                </span>
              )}
            </span>
          </div>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Location name..."
            className="w-full px-2 py-1 text-xs bg-[--ide-input-bg] border border-[--ide-border] rounded text-[--ide-foreground] focus:outline-none focus:border-[--ide-accent]"
            autoFocus
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)..."
            rows={2}
            className="w-full px-2 py-1 text-xs bg-[--ide-input-bg] border border-[--ide-border] rounded text-[--ide-foreground] focus:outline-none focus:border-[--ide-accent] resize-none"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as StoryLocation['type'])}
            className="w-full px-2 py-1 text-xs bg-[--ide-input-bg] border border-[--ide-border] rounded text-[--ide-foreground] focus:outline-none focus:border-[--ide-accent]"
          >
            {LOCATION_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setIsCreating(false);
                setNewName('');
                setNewDescription('');
                setNewParentId(null);
              }}
              className="px-2 py-1 text-xs rounded hover:bg-[--ide-hover-bg] text-[--ide-foreground-muted]"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="px-2 py-1 text-xs rounded bg-[--ide-accent] text-white hover:opacity-90 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Tree View */}
      <div className="flex-1 overflow-auto">
        {filteredTree.length > 0 ? (
          <div className="py-1">
            {filteredTree.map(node => renderLocationNode(node))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Globe className="w-12 h-12 text-[--ide-foreground-muted] opacity-20 mb-3" />
            <p className="text-[13px] text-[--ide-foreground-muted]">
              {searchQuery ? 'No locations match your search' : 'No locations yet'}
            </p>
            <p className="text-[11px] text-[--ide-foreground-muted] mt-1 opacity-70">
              Click + to add locations to your world
            </p>
          </div>
        )}
      </div>

      {/* Footer with stats */}
      <div className="h-[25px] px-3 flex items-center justify-between border-t border-[--ide-border] text-[11px] text-[--ide-foreground-muted]">
        <span>
          {locations.length} location{locations.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

export default WorldBuildingPanel;
