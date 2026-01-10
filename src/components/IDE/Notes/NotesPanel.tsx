'use client';

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Edit2,
  Search,
  FolderOpen,
  Tag,
  Lightbulb,
  Map,
  Users,
  Bookmark,
  X,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Database format (snake_case from Supabase)
interface DBStoryNote {
  id: string;
  project_id?: string;
  user_id?: string;
  title: string;
  content: string;
  category: 'research' | 'plot' | 'character' | 'world' | 'theme' | 'other';
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

// UI format (camelCase for component use)
export interface StoryNote {
  id: string;
  title: string;
  content: string;
  category: 'research' | 'plot' | 'character' | 'world' | 'theme' | 'other';
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Normalize DB note to UI note
function normalizeNote(note: DBStoryNote | StoryNote): StoryNote {
  // Check if it's already UI format
  if ('createdAt' in note && note.createdAt instanceof Date) {
    return note as StoryNote;
  }
  
  const dbNote = note as DBStoryNote;
  // Handle legacy 'worldbuilding' category - cast to string for comparison
  const rawCategory = dbNote.category as string;
  const category = rawCategory === 'worldbuilding' ? 'world' : dbNote.category;
  
  return {
    id: dbNote.id,
    title: dbNote.title,
    content: dbNote.content,
    category: category as StoryNote['category'],
    tags: dbNote.tags,
    createdAt: dbNote.created_at ? new Date(dbNote.created_at) : undefined,
    updatedAt: dbNote.updated_at ? new Date(dbNote.updated_at) : undefined,
  };
}

interface NotesPanelProps {
  notes?: (DBStoryNote | StoryNote)[];
  onCreateNote?: (note: Partial<StoryNote>) => Promise<StoryNote | DBStoryNote>;
  onUpdateNote?: (id: string, updates: Partial<StoryNote>) => Promise<void>;
  onDeleteNote?: (id: string) => Promise<void>;
  onSelectNote?: (note: StoryNote) => void;
}

const CATEGORIES = [
  { id: 'research', label: 'Research', icon: Lightbulb, color: 'text-yellow-400' },
  { id: 'plot', label: 'Plot', icon: Map, color: 'text-blue-400' },
  { id: 'character', label: 'Character', icon: Users, color: 'text-purple-400' },
  { id: 'world', label: 'World', icon: FolderOpen, color: 'text-green-400' },
  { id: 'theme', label: 'Theme', icon: Bookmark, color: 'text-pink-400' },
  { id: 'other', label: 'Other', icon: FileText, color: 'text-gray-400' },
] as const;

export function NotesPanel({ 
  notes: rawNotes = [], 
  onCreateNote, 
  onUpdateNote, 
  onDeleteNote,
  onSelectNote 
}: NotesPanelProps) {
  // Normalize notes to UI format
  const notes = useMemo(() => rawNotes.map(normalizeNote), [rawNotes]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['research', 'plot']));
  
  // New note form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<StoryNote['category']>('research');
  
  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleCreate = async () => {
    if (!newTitle.trim() || !onCreateNote) return;
    
    await onCreateNote({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
    });
    
    setNewTitle('');
    setNewContent('');
    setNewCategory('research');
    setIsCreating(false);
    
    // Expand the category we just added to
    setExpandedCategories(prev => new Set([...prev, newCategory]));
  };

  const handleStartEdit = (note: StoryNote) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (note: StoryNote) => {
    if (!onUpdateNote) return;
    
    await onUpdateNote(note.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
    });
    
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteNote) return;
    if (confirm('Delete this note?')) {
      await onDeleteNote(id);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    if (selectedCategory && note.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Group notes by category
  const notesByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = filteredNotes.filter(n => n.category === cat.id);
    return acc;
  }, {} as Record<string, StoryNote[]>);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-[35px] px-3 flex items-center justify-between border-b border-[--ide-border]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[--ide-foreground-secondary]">
          Research & Notes
        </span>
        <button 
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-[--ide-list-hover] rounded"
          title="New Note"
        >
          <Plus className="w-4 h-4 text-[--ide-foreground-secondary]" />
        </button>
      </div>
      
      {/* Search */}
      <div className="px-2 py-2 border-b border-[--ide-border]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[--ide-foreground-muted]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-7 pr-2 py-1 text-xs bg-[--ide-input-bg] border border-[--ide-border] rounded focus:border-[--ide-accent] focus:outline-none"
          />
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="p-3 border-b border-[--ide-border] space-y-2 bg-[--ide-accent]/5">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note title"
            className="w-full px-2 py-1.5 text-sm bg-[--ide-input-bg] border border-[--ide-border] rounded focus:border-[--ide-accent] focus:outline-none"
            autoFocus
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write your note here... Research, ideas, plot points, character details..."
            rows={4}
            className="w-full px-2 py-1.5 text-sm bg-[--ide-input-bg] border border-[--ide-border] rounded focus:border-[--ide-accent] focus:outline-none resize-none"
          />
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setNewCategory(cat.id as StoryNote['category'])}
                className={cn(
                  'px-2 py-1 text-[10px] rounded flex items-center gap-1 border',
                  newCategory === cat.id
                    ? 'bg-[--ide-accent] text-white border-[--ide-accent]'
                    : 'border-[--ide-border] text-[--ide-foreground-secondary] hover:bg-[--ide-hover-bg]'
                )}
              >
                <cat.icon className="w-3 h-3" />
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button 
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="flex-1 px-2 py-1.5 text-xs bg-[--ide-accent] text-white rounded hover:bg-[--ide-accent-hover] disabled:opacity-50"
            >
              Create Note
            </button>
            <button 
              onClick={() => setIsCreating(false)}
              className="flex-1 px-2 py-1.5 text-xs border border-[--ide-border] rounded hover:bg-[--ide-hover-bg]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-auto">
        {notes.length === 0 && !isCreating ? (
          <div className="text-center py-8 px-4">
            <FileText className="w-10 h-10 mx-auto mb-3 text-[--ide-foreground-muted] opacity-20" />
            <p className="text-sm text-[--ide-foreground-muted] mb-1">No notes yet</p>
            <p className="text-xs text-[--ide-foreground-muted] mb-4">
              Store research, plot ideas, character details, and more
            </p>
            <button 
              onClick={() => setIsCreating(true)}
              className="text-xs text-[--ide-accent] hover:underline"
            >
              Create your first note
            </button>
          </div>
        ) : (
          <div className="py-1">
            {CATEGORIES.map(category => {
              const categoryNotes = notesByCategory[category.id] || [];
              if (categoryNotes.length === 0 && searchQuery) return null;
              
              const isExpanded = expandedCategories.has(category.id);
              const CategoryIcon = category.icon;
              
              return (
                <div key={category.id}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full px-2 py-1.5 flex items-center gap-1.5 hover:bg-[--ide-list-hover] text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[--ide-foreground-muted]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[--ide-foreground-muted]" />
                    )}
                    <CategoryIcon className={cn('w-3.5 h-3.5', category.color)} />
                    <span className="text-xs font-medium text-[--ide-foreground]">
                      {category.label}
                    </span>
                    <span className="text-[10px] text-[--ide-foreground-muted] ml-auto">
                      {categoryNotes.length}
                    </span>
                  </button>
                  
                  {/* Notes in Category */}
                  {isExpanded && (
                    <div className="pl-4">
                      {categoryNotes.length === 0 ? (
                        <div className="px-2 py-2 text-[10px] text-[--ide-foreground-muted] italic">
                          No notes in this category
                        </div>
                      ) : (
                        categoryNotes.map(note => (
                          <div
                            key={note.id}
                            className="group relative"
                          >
                            {editingId === note.id ? (
                              // Edit Mode
                              <div className="p-2 space-y-2 bg-[--ide-accent]/5 border-l-2 border-[--ide-accent]">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full px-2 py-1 text-xs bg-[--ide-input-bg] border border-[--ide-border] rounded"
                                  autoFocus
                                />
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  rows={3}
                                  className="w-full px-2 py-1 text-xs bg-[--ide-input-bg] border border-[--ide-border] rounded resize-none"
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleSaveEdit(note)}
                                    className="px-2 py-1 text-[10px] bg-green-600 text-white rounded flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" /> Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-2 py-1 text-[10px] border border-[--ide-border] rounded flex items-center gap-1"
                                  >
                                    <X className="w-3 h-3" /> Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View Mode
                              <div
                                onClick={() => onSelectNote?.(note)}
                                className="px-2 py-1.5 cursor-pointer hover:bg-[--ide-list-hover] rounded-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-[--ide-foreground] truncate">
                                    {note.title}
                                  </span>
                                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleStartEdit(note); }}
                                      className="p-1 hover:bg-[--ide-hover-bg] rounded"
                                    >
                                      <Edit2 className="w-3 h-3 text-[--ide-foreground-muted]" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                                      className="p-1 hover:bg-[--ide-hover-bg] rounded"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-400" />
                                    </button>
                                  </div>
                                </div>
                                {note.content && (
                                  <p className="text-[10px] text-[--ide-foreground-muted] mt-0.5 line-clamp-2">
                                    {note.content}
                                  </p>
                                )}
                                {note.tags && note.tags.length > 0 && (
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    {note.tags.map(tag => (
                                      <span 
                                        key={tag}
                                        className="px-1 py-0.5 text-[9px] bg-[--ide-border] rounded"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotesPanel;
