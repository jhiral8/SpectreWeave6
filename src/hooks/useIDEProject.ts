/**
 * IDE Project Integration Hook
 * 
 * Connects the IDE shell to the project system, loading story content
 * and syncing editor state with Supabase.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types/database';
import type { StoryNode, StoryNodeType } from '@/components/IDE/StoryExplorer/types';

// Query keys
const QUERY_KEYS = {
  project: (id: string) => ['ide-project', id],
  chapters: (projectId: string) => ['ide-chapters', projectId],
  content: (projectId: string, chapterId?: string) => ['ide-content', projectId, chapterId],
  characters: (projectId: string) => ['ide-characters', projectId],
  notes: (projectId: string) => ['ide-notes', projectId],
  locations: (projectId: string) => ['ide-locations', projectId],
  outlines: (projectId: string) => ['ide-outlines', projectId],
  agentReviews: (projectId: string) => ['ide-agent-reviews', projectId],
} as const;

// Chapter type from database
interface Chapter {
  id: string;
  project_id: string;
  title: string;
  order: number;
  content?: string;
  word_count?: number;
  created_at: string;
  updated_at: string;
}

// Character type from database
interface Character {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  role?: string;
  traits?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Story Note type from database
interface StoryNote {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  category: 'research' | 'plot' | 'character' | 'worldbuilding' | 'theme' | 'other';
  tags?: string[];
  parent_id?: string;
  sort_order?: number;
  is_pinned?: boolean;
  color?: string;
  created_at: string;
  updated_at: string;
}

// Story Location type from database
interface StoryLocation {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'city' | 'town' | 'village' | 'building' | 'room' | 'landscape' | 'region' | 'country' | 'world' | 'other';
  parent_id?: string;
  attributes?: Record<string, unknown>;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// Chapter Outline with scene beats
interface SceneBeat {
  id: string;
  title: string;
  description?: string;
  characters?: string[];
  locationId?: string;
  tensionLevel?: 'low' | 'medium' | 'high' | 'climax';
  wordTarget?: number;
  status: 'planned' | 'writing' | 'complete';
}

interface ChapterOutline {
  id: string;
  project_id: string;
  chapter_id?: string;
  summary?: string;
  beats: SceneBeat[];
  target_word_count?: number;
  status: 'draft' | 'outlined' | 'writing' | 'complete';
  created_at: string;
  updated_at: string;
}

// Agent Review type
interface AgentReview {
  id: string;
  project_id: string;
  chapter_id?: string;
  agent_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  suggestions: Array<{
    id: string;
    type: string;
    severity: string;
    quote?: string;
    issue: string;
    suggestion: string;
  }>;
  summary?: string;
  created_at: string;
  updated_at: string;
}

export interface IDEProjectState {
  project: Project | null;
  chapters: Chapter[];
  characters: Character[];
  notes: StoryNote[];
  locations: StoryLocation[];
  outlines: ChapterOutline[];
  agentReviews: AgentReview[];
  currentChapter: Chapter | null;
  isDirty: boolean;
  lastSavedAt: Date | null;
}

export interface UseIDEProjectOptions {
  projectId: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

export interface UseIDEProjectReturn {
  // State
  state: IDEProjectState;
  isLoading: boolean;
  error: Error | null;
  
  // Navigation
  setCurrentChapter: (chapterId: string | null) => void;
  
  // Story tree
  storyTree: StoryNode[];
  
  // Content operations
  updateContent: (content: string) => void;
  saveContent: () => Promise<void>;
  
  // Chapter operations
  createChapter: (title: string) => Promise<Chapter>;
  updateChapter: (id: string, updates: Partial<Chapter>) => Promise<Chapter>;
  deleteChapter: (id: string) => Promise<void>;
  reorderChapters: (chapterIds: string[]) => Promise<void>;
  
  // Character operations
  createCharacter: (data: Partial<Character>) => Promise<Character>;
  updateCharacter: (id: string, updates: Partial<Character>) => Promise<Character>;
  deleteCharacter: (id: string) => Promise<void>;
  
  // Note operations
  createNote: (data: Partial<StoryNote>) => Promise<StoryNote>;
  updateNote: (id: string, updates: Partial<StoryNote>) => Promise<StoryNote>;
  deleteNote: (id: string) => Promise<void>;
  
  // Location operations
  createLocation: (data: Partial<StoryLocation>) => Promise<StoryLocation>;
  updateLocation: (id: string, updates: Partial<StoryLocation>) => Promise<StoryLocation>;
  deleteLocation: (id: string) => Promise<void>;
  
  // Outline operations
  createOutline: (data: Partial<ChapterOutline>) => Promise<ChapterOutline>;
  updateOutline: (id: string, updates: Partial<ChapterOutline>) => Promise<ChapterOutline>;
  deleteOutline: (id: string) => Promise<void>;
  
  // Agent Review operations
  createAgentReview: (data: Partial<AgentReview>) => Promise<AgentReview>;
  updateAgentReview: (id: string, updates: Partial<AgentReview>) => Promise<AgentReview>;
  deleteAgentReview: (id: string) => Promise<void>;
  
  // Project operations
  updateProject: (updates: Partial<Project>) => Promise<Project>;
  
  // Sync
  refresh: () => void;
  isSyncing: boolean;
}

// API functions
const ideProjectApi = {
  async getProject(id: string): Promise<Project> {
    const supabase = createClient();
    // Try to get the project. If it fails, try a simpler select in case of missing columns
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error loading project:', error);
      // Fallback to basic columns if * fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('projects')
        .select('id, title, description, content, user_id')
        .eq('id', id)
        .single();
        
      if (fallbackError) {
        throw new Error(`Failed to load project: ${fallbackError.message}`);
      }
      return fallbackData as Project;
    }
    return data;
  },
  
  async getChapters(projectId: string): Promise<Chapter[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true });
    
    if (error) {
      // If table doesn't exist (42P01) or column doesn't exist (42703), return empty array
      if (error.code === '42P01' || error.code === '42703') return [];
      console.error('Error loading chapters:', error);
      return [];
    }
    return data || [];
  },
  
  async getCharacters(projectId: string): Promise<Character[]> {
    const supabase = createClient();

    // Query all three tables in parallel
    const [storyCharacters, characterProfiles, legacyCharacters] = await Promise.all([
      supabase
        .from('story_characters')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true }),
      supabase
        .from('character_profiles')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true }),
      supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true }),
    ]);

    // Return the first non-empty, non-error result
    if (!storyCharacters.error && storyCharacters.data && storyCharacters.data.length > 0) {
      return storyCharacters.data;
    }
    if (!characterProfiles.error && characterProfiles.data && characterProfiles.data.length > 0) {
      return characterProfiles.data;
    }
    if (!legacyCharacters.error && legacyCharacters.data && legacyCharacters.data.length > 0) {
      return legacyCharacters.data;
    }

    // If all failed or empty, return empty array
    return [];
  },
  
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update project: ${error.message}`);
    return data;
  },
  
  async createChapter(projectId: string, title: string, order: number): Promise<Chapter> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chapters')
      .insert({ project_id: projectId, title, order, content: '', word_count: 0 })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create chapter: ${error.message}`);
    return data;
  },
  
  async updateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chapters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update chapter: ${error.message}`);
    return data;
  },
  
  async deleteChapter(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete chapter: ${error.message}`);
  },
  
  async createCharacter(projectId: string, data: Partial<Character>): Promise<Character> {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user?.id;

    const { data: char, error } = await supabase
      .from('story_characters')
      .insert({ 
        ...data, 
        project_id: projectId,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create character: ${error.message}`);
    return char;
  },
  
  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('story_characters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update character: ${error.message}`);
    return data;
  },
  
  async deleteCharacter(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('story_characters')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete character: ${error.message}`);
  },
  
  // Notes API
  async getNotes(projectId: string): Promise<StoryNote[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('story_notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) {
      if (error.code === '42P01' || error.code === '42703') return [];
      console.error('Error loading notes:', error);
      return [];
    }
    return data || [];
  },
  
  async createNote(projectId: string, userId: string, data: Partial<StoryNote>): Promise<StoryNote> {
    const supabase = createClient();
    const { data: note, error } = await supabase
      .from('story_notes')
      .insert({ 
        ...data, 
        project_id: projectId,
        user_id: userId,
        title: data.title || 'Untitled Note',
        content: data.content || '',
        category: data.category || 'other'
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create note: ${error.message}`);
    return note;
  },
  
  async updateNote(id: string, updates: Partial<StoryNote>): Promise<StoryNote> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('story_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update note: ${error.message}`);
    return data;
  },
  
  async deleteNote(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('story_notes')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete note: ${error.message}`);
  },
  
  // Locations API
  async getLocations(projectId: string): Promise<StoryLocation[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('story_locations')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });
    
    if (error) {
      if (error.code === '42P01' || error.code === '42703') return [];
      console.error('Error loading locations:', error);
      return [];
    }
    return data || [];
  },
  
  async createLocation(projectId: string, userId: string, data: Partial<StoryLocation>): Promise<StoryLocation> {
    const supabase = createClient();
    const { data: location, error } = await supabase
      .from('story_locations')
      .insert({ 
        ...data, 
        project_id: projectId,
        user_id: userId,
        name: data.name || 'Untitled Location',
        type: data.type || 'other'
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create location: ${error.message}`);
    return location;
  },
  
  async updateLocation(id: string, updates: Partial<StoryLocation>): Promise<StoryLocation> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('story_locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update location: ${error.message}`);
    return data;
  },
  
  async deleteLocation(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('story_locations')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete location: ${error.message}`);
  },
  
  // Outlines API
  async getOutlines(projectId: string): Promise<ChapterOutline[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chapter_outlines')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    
    if (error) {
      if (error.code === '42P01' || error.code === '42703') return [];
      console.error('Error loading outlines:', error);
      return [];
    }
    return data || [];
  },
  
  async createOutline(projectId: string, data: Partial<ChapterOutline>): Promise<ChapterOutline> {
    const supabase = createClient();
    const { data: outline, error } = await supabase
      .from('chapter_outlines')
      .insert({ 
        ...data, 
        project_id: projectId,
        beats: data.beats || [],
        status: data.status || 'draft'
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create outline: ${error.message}`);
    return outline;
  },
  
  async updateOutline(id: string, updates: Partial<ChapterOutline>): Promise<ChapterOutline> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('chapter_outlines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update outline: ${error.message}`);
    return data;
  },
  
  async deleteOutline(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('chapter_outlines')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete outline: ${error.message}`);
  },
  
  // Agent Reviews API
  async getAgentReviews(projectId: string): Promise<AgentReview[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('agent_reviews')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) {
      if (error.code === '42P01' || error.code === '42703') return [];
      console.error('Error loading agent reviews:', error);
      return [];
    }
    return data || [];
  },
  
  async createAgentReview(projectId: string, data: Partial<AgentReview>): Promise<AgentReview> {
    const supabase = createClient();
    const { data: review, error } = await supabase
      .from('agent_reviews')
      .insert({ 
        ...data, 
        project_id: projectId,
        suggestions: data.suggestions || [],
        status: data.status || 'pending'
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create agent review: ${error.message}`);
    return review;
  },
  
  async updateAgentReview(id: string, updates: Partial<AgentReview>): Promise<AgentReview> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('agent_reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update agent review: ${error.message}`);
    return data;
  },
  
  async deleteAgentReview(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('agent_reviews')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete agent review: ${error.message}`);
  },
};

/**
 * Convert chapters and characters to story tree format
 */
function buildStoryTree(
  project: Project | null,
  chapters: Chapter[],
  characters: Character[]
): StoryNode[] {
  if (!project) return [];
  
  const tree: StoryNode[] = [];
  
  // Project root (using manuscript as root type)
  const projectNode: StoryNode = {
    id: project.id,
    label: project.title,
    type: 'manuscript',
    children: [],
    metadata: {
      wordCount: project.word_count,
      status: project.status as 'draft' | 'in-progress' | 'review' | 'complete',
      updatedAt: new Date(project.updated_at),
    },
  };
  
  // Chapters folder
  if (chapters.length > 0) {
    const chaptersFolder: StoryNode = {
      id: 'chapters-folder',
      label: 'Chapters',
      type: 'part',
      children: chapters.map(chapter => ({
        id: chapter.id,
        label: chapter.title,
        type: 'chapter' as StoryNodeType,
        metadata: {
          wordCount: chapter.word_count,
          updatedAt: new Date(chapter.updated_at),
        },
      })),
      isExpanded: true,
      metadata: {},
    };
    projectNode.children!.push(chaptersFolder);
  }
  
  // Characters folder
  if (characters.length > 0) {
    const charactersFolder: StoryNode = {
      id: 'characters-folder',
      label: 'Characters',
      type: 'character-group',
      children: characters.map(char => ({
        id: char.id,
        label: char.name,
        type: 'character' as StoryNodeType,
        metadata: {
          synopsis: char.description,
          traits: char.traits,
          role: char.role as 'protagonist' | 'antagonist' | 'supporting' | 'minor' | undefined,
        },
      })),
      isExpanded: true,
      metadata: {},
    };
    projectNode.children!.push(charactersFolder);
  }
  
  // Notes folder (placeholder)
  const notesFolder: StoryNode = {
    id: 'notes-folder',
    label: 'Notes',
    type: 'note-folder',
    children: [],
    metadata: {},
  };
  projectNode.children!.push(notesFolder);
  
  tree.push(projectNode);
  
  return tree;
}

export function useIDEProject(options: UseIDEProjectOptions): UseIDEProjectReturn {
  const { projectId, autoSave = true, autoSaveInterval = 30000 } = options;
  
  const queryClient = useQueryClient();
  
  // Local state
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [pendingContent, setPendingContent] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  // Queries
  const projectQuery = useQuery({
    queryKey: QUERY_KEYS.project(projectId),
    queryFn: () => ideProjectApi.getProject(projectId),
    enabled: !!projectId,
  });
  
  const chaptersQuery = useQuery({
    queryKey: QUERY_KEYS.chapters(projectId),
    queryFn: () => ideProjectApi.getChapters(projectId),
    enabled: !!projectId,
  });
  
  const charactersQuery = useQuery({
    queryKey: QUERY_KEYS.characters(projectId),
    queryFn: () => ideProjectApi.getCharacters(projectId),
    enabled: !!projectId,
  });
  
  const notesQuery = useQuery({
    queryKey: QUERY_KEYS.notes(projectId),
    queryFn: () => ideProjectApi.getNotes(projectId),
    enabled: !!projectId,
  });
  
  const locationsQuery = useQuery({
    queryKey: QUERY_KEYS.locations(projectId),
    queryFn: () => ideProjectApi.getLocations(projectId),
    enabled: !!projectId,
  });
  
  const outlinesQuery = useQuery({
    queryKey: QUERY_KEYS.outlines(projectId),
    queryFn: () => ideProjectApi.getOutlines(projectId),
    enabled: !!projectId,
  });
  
  const agentReviewsQuery = useQuery({
    queryKey: QUERY_KEYS.agentReviews(projectId),
    queryFn: () => ideProjectApi.getAgentReviews(projectId),
    enabled: !!projectId,
  });
  
  // Mutations
  const updateProjectMutation = useMutation({
    mutationFn: (updates: Partial<Project>) => ideProjectApi.updateProject(projectId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(projectId) });
    },
  });
  
  const createChapterMutation = useMutation({
    mutationFn: (title: string) => {
      const nextOrder = (chaptersQuery.data?.length || 0) + 1;
      return ideProjectApi.createChapter(projectId, title, nextOrder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chapters(projectId) });
    },
  });
  
  const updateChapterMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Chapter> }) =>
      ideProjectApi.updateChapter(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chapters(projectId) });
      setLastSavedAt(new Date());
      setIsDirty(false);
    },
  });
  
  const deleteChapterMutation = useMutation({
    mutationFn: (id: string) => ideProjectApi.deleteChapter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chapters(projectId) });
      if (currentChapterId === deleteChapterMutation.variables) {
        setCurrentChapterId(null);
      }
    },
  });
  
  const createCharacterMutation = useMutation({
    mutationFn: (data: Partial<Character>) => ideProjectApi.createCharacter(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.characters(projectId) });
    },
  });
  
  const updateCharacterMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Character> }) =>
      ideProjectApi.updateCharacter(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.characters(projectId) });
    },
  });
  
  const deleteCharacterMutation = useMutation({
    mutationFn: (id: string) => ideProjectApi.deleteCharacter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.characters(projectId) });
    },
  });
  
  // Note mutations
  const createNoteMutation = useMutation({
    mutationFn: (data: Partial<StoryNote>) => {
      const userId = projectQuery.data?.user_id || '';
      return ideProjectApi.createNote(projectId, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes(projectId) });
    },
  });
  
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<StoryNote> }) =>
      ideProjectApi.updateNote(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes(projectId) });
    },
  });
  
  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => ideProjectApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes(projectId) });
    },
  });
  
  // Location mutations
  const createLocationMutation = useMutation({
    mutationFn: (data: Partial<StoryLocation>) => {
      const userId = projectQuery.data?.user_id || '';
      return ideProjectApi.createLocation(projectId, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations(projectId) });
    },
  });
  
  const updateLocationMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<StoryLocation> }) =>
      ideProjectApi.updateLocation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations(projectId) });
    },
  });
  
  const deleteLocationMutation = useMutation({
    mutationFn: (id: string) => ideProjectApi.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations(projectId) });
    },
  });
  
  // Outline mutations
  const createOutlineMutation = useMutation({
    mutationFn: (data: Partial<ChapterOutline>) => ideProjectApi.createOutline(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.outlines(projectId) });
    },
  });
  
  const updateOutlineMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ChapterOutline> }) =>
      ideProjectApi.updateOutline(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.outlines(projectId) });
    },
  });
  
  const deleteOutlineMutation = useMutation({
    mutationFn: (id: string) => ideProjectApi.deleteOutline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.outlines(projectId) });
    },
  });
  
  // Agent review mutations
  const createAgentReviewMutation = useMutation({
    mutationFn: (data: Partial<AgentReview>) => ideProjectApi.createAgentReview(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agentReviews(projectId) });
    },
  });
  
  const updateAgentReviewMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AgentReview> }) =>
      ideProjectApi.updateAgentReview(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agentReviews(projectId) });
    },
  });
  
  const deleteAgentReviewMutation = useMutation({
    mutationFn: (id: string) => ideProjectApi.deleteAgentReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agentReviews(projectId) });
    },
  });
  
  // Current chapter
  const currentChapter = useMemo(() => {
    if (!currentChapterId) return null;
    return chaptersQuery.data?.find(c => c.id === currentChapterId) || null;
  }, [currentChapterId, chaptersQuery.data]);
  
  // Story tree
  const storyTree = useMemo(() => {
    return buildStoryTree(
      projectQuery.data || null,
      chaptersQuery.data || [],
      charactersQuery.data || []
    );
  }, [projectQuery.data, chaptersQuery.data, charactersQuery.data]);
  
  // State
  const state: IDEProjectState = {
    project: projectQuery.data || null,
    chapters: chaptersQuery.data || [],
    characters: charactersQuery.data || [],
    notes: notesQuery.data || [],
    locations: locationsQuery.data || [],
    outlines: outlinesQuery.data || [],
    agentReviews: agentReviewsQuery.data || [],
    currentChapter,
    isDirty,
    lastSavedAt,
  };
  
  // Content operations
  const updateContent = useCallback((content: string) => {
    setPendingContent(content);
    setIsDirty(true);
  }, []);
  
  const saveContent = useCallback(async () => {
    if (!currentChapterId || pendingContent === null) return;
    
    const wordCount = pendingContent.trim().split(/\s+/).filter(Boolean).length;
    
    await updateChapterMutation.mutateAsync({
      id: currentChapterId,
      updates: {
        content: pendingContent,
        word_count: wordCount,
      },
    });
    
    setPendingContent(null);
  }, [currentChapterId, pendingContent, updateChapterMutation]);
  
  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !isDirty || !currentChapterId) return;
    
    const timer = setTimeout(() => {
      saveContent();
    }, autoSaveInterval);
    
    return () => clearTimeout(timer);
  }, [autoSave, autoSaveInterval, isDirty, currentChapterId, saveContent]);
  
  // Chapter operations
  const setCurrentChapter = useCallback((chapterId: string | null) => {
    // Save current chapter before switching
    if (isDirty && currentChapterId) {
      saveContent();
    }
    setCurrentChapterId(chapterId);
    setPendingContent(null);
    setIsDirty(false);
  }, [isDirty, currentChapterId, saveContent]);
  
  const createChapter = useCallback(async (title: string) => {
    return createChapterMutation.mutateAsync(title);
  }, [createChapterMutation]);
  
  const updateChapter = useCallback(async (id: string, updates: Partial<Chapter>) => {
    return updateChapterMutation.mutateAsync({ id, updates });
  }, [updateChapterMutation]);
  
  const deleteChapter = useCallback(async (id: string) => {
    await deleteChapterMutation.mutateAsync(id);
  }, [deleteChapterMutation]);
  
  const reorderChapters = useCallback(async (chapterIds: string[]) => {
    // Update order for all chapters
    const updates = chapterIds.map((id, index) => 
      ideProjectApi.updateChapter(id, { order: index + 1 })
    );
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chapters(projectId) });
  }, [projectId, queryClient]);
  
  // Character operations
  const createCharacter = useCallback(async (data: Partial<Character>) => {
    return createCharacterMutation.mutateAsync(data);
  }, [createCharacterMutation]);
  
  const updateCharacter = useCallback(async (id: string, updates: Partial<Character>) => {
    return updateCharacterMutation.mutateAsync({ id, updates });
  }, [updateCharacterMutation]);
  
  const deleteCharacter = useCallback(async (id: string) => {
    await deleteCharacterMutation.mutateAsync(id);
  }, [deleteCharacterMutation]);
  
  // Note operations
  const createNote = useCallback(async (data: Partial<StoryNote>) => {
    return createNoteMutation.mutateAsync(data);
  }, [createNoteMutation]);
  
  const updateNote = useCallback(async (id: string, updates: Partial<StoryNote>) => {
    return updateNoteMutation.mutateAsync({ id, updates });
  }, [updateNoteMutation]);
  
  const deleteNote = useCallback(async (id: string) => {
    await deleteNoteMutation.mutateAsync(id);
  }, [deleteNoteMutation]);
  
  // Location operations
  const createLocation = useCallback(async (data: Partial<StoryLocation>) => {
    return createLocationMutation.mutateAsync(data);
  }, [createLocationMutation]);
  
  const updateLocation = useCallback(async (id: string, updates: Partial<StoryLocation>) => {
    return updateLocationMutation.mutateAsync({ id, updates });
  }, [updateLocationMutation]);
  
  const deleteLocation = useCallback(async (id: string) => {
    await deleteLocationMutation.mutateAsync(id);
  }, [deleteLocationMutation]);
  
  // Outline operations
  const createOutline = useCallback(async (data: Partial<ChapterOutline>) => {
    return createOutlineMutation.mutateAsync(data);
  }, [createOutlineMutation]);
  
  const updateOutline = useCallback(async (id: string, updates: Partial<ChapterOutline>) => {
    return updateOutlineMutation.mutateAsync({ id, updates });
  }, [updateOutlineMutation]);
  
  const deleteOutline = useCallback(async (id: string) => {
    await deleteOutlineMutation.mutateAsync(id);
  }, [deleteOutlineMutation]);
  
  // Agent review operations
  const createAgentReview = useCallback(async (data: Partial<AgentReview>) => {
    return createAgentReviewMutation.mutateAsync(data);
  }, [createAgentReviewMutation]);
  
  const updateAgentReview = useCallback(async (id: string, updates: Partial<AgentReview>) => {
    return updateAgentReviewMutation.mutateAsync({ id, updates });
  }, [updateAgentReviewMutation]);
  
  const deleteAgentReview = useCallback(async (id: string) => {
    await deleteAgentReviewMutation.mutateAsync(id);
  }, [deleteAgentReviewMutation]);
  
  // Project operations
  const updateProject = useCallback(async (updates: Partial<Project>) => {
    return updateProjectMutation.mutateAsync(updates);
  }, [updateProjectMutation]);
  
  // Refresh all data
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.project(projectId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chapters(projectId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.characters(projectId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes(projectId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.locations(projectId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.outlines(projectId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agentReviews(projectId) });
  }, [queryClient, projectId]);
  
  const isLoading = projectQuery.isLoading || chaptersQuery.isLoading || charactersQuery.isLoading || notesQuery.isLoading || locationsQuery.isLoading || outlinesQuery.isLoading || agentReviewsQuery.isLoading;
  const isSyncing = updateChapterMutation.isPending || updateProjectMutation.isPending;
  const error = projectQuery.error || chaptersQuery.error || charactersQuery.error || notesQuery.error || locationsQuery.error || outlinesQuery.error || agentReviewsQuery.error;
  
  return {
    state,
    isLoading,
    error: error as Error | null,
    setCurrentChapter,
    storyTree,
    updateContent,
    saveContent,
    createChapter,
    updateChapter,
    deleteChapter,
    reorderChapters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    createNote,
    updateNote,
    deleteNote,
    createLocation,
    updateLocation,
    deleteLocation,
    createOutline,
    updateOutline,
    deleteOutline,
    createAgentReview,
    updateAgentReview,
    deleteAgentReview,
    updateProject,
    refresh,
    isSyncing,
  };
}

export default useIDEProject;
