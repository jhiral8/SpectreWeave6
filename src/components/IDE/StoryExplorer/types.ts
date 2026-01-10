// Story Explorer Types
// Based on VS Code's file explorer, adapted for narrative structure

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
  | 'style-guide'
  | 'framework';

export type ExplorerTab = 'manuscript' | 'characters' | 'world' | 'notes';

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
  createdAt?: Date;
  updatedAt?: Date;
  
  // Manuscript/Chapter/Scene specific
  wordCount?: number;
  targetWordCount?: number;
  status?: 'draft' | 'in-progress' | 'review' | 'complete';
  position?: number; // For editor navigation
  synopsis?: string;
  
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

// Tree actions
export type NodeAction = 
  | 'select'
  | 'expand'
  | 'collapse'
  | 'rename'
  | 'delete'
  | 'duplicate'
  | 'move'
  | 'navigate';

export interface DragItem {
  id: string;
  type: StoryNodeType;
  parentId?: string;
  index: number;
}

export interface DropTarget {
  id: string;
  position: 'before' | 'after' | 'inside';
}

// Explorer tab config
export interface ExplorerTabConfig {
  id: ExplorerTab;
  label: string;
  icon: string;
  emptyMessage: string;
  createLabel: string;
  createType: StoryNodeType;
}

export const EXPLORER_TAB_CONFIGS: ExplorerTabConfig[] = [
  { 
    id: 'manuscript', 
    label: 'Manuscript', 
    icon: '📖',
    emptyMessage: 'No chapters yet',
    createLabel: 'Create Chapter',
    createType: 'chapter',
  },
  { 
    id: 'characters', 
    label: 'Characters', 
    icon: '👥',
    emptyMessage: 'No characters defined',
    createLabel: 'Create Character',
    createType: 'character',
  },
  { 
    id: 'world', 
    label: 'World', 
    icon: '🌍',
    emptyMessage: 'No locations defined',
    createLabel: 'Create Location',
    createType: 'location',
  },
  { 
    id: 'notes', 
    label: 'Notes', 
    icon: '📝',
    emptyMessage: 'No notes yet',
    createLabel: 'Create Note',
    createType: 'note',
  },
];
