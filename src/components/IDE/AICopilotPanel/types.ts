/**
 * AI Copilot Panel Types
 * 
 * Type definitions for the VSCode-style AI input panel.
 * Supports multiple modes: Framework, Discuss, Ghostwrite, Agents
 */

// Panel modes
export type CopilotMode = 'framework' | 'discuss' | 'ghostwrite' | 'agents';

export interface AIModel {
  id: string;
  name: string;
  provider: 'openrouter' | 'openai' | 'anthropic' | 'google';
  description?: string;
  maxTokens: number;
  isFree?: boolean;
  icon?: string;
}

export interface CopilotTool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: 'insert' | 'replace' | 'explain' | 'improve' | 'continue' | 'custom';
  prompt?: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  isStreaming?: boolean;
  error?: string;
}

// Alias for backward compatibility
export type Message = CopilotMessage & {
  context?: 'selection' | 'document' | 'character' | 'location' | 'note' | string;
  isEditable?: boolean;
  isError?: boolean;
  isToolCall?: boolean;
  isFrameworkPreview?: boolean;
};

export interface CopilotContext {
  selectedText?: string;
  cursorPosition?: number;
  documentContent?: string;
  chapterTitle?: string;
  characters?: string[];
  projectTitle?: string;
}

// Story framework elements for AI context
export interface StoryCharacter {
  id: string;
  name: string;
  description?: string;
  role?: string;
  traits?: string[];
  notes?: string;
}

export interface StoryLocation {
  id: string;
  name: string;
  description?: string;
  type?: string;
}

export interface StoryNote {
  id: string;
  title: string;
  content: string;
  category?: string;
}

// Chapter outline with beats
export interface ChapterOutline {
  id: string;
  chapterId?: string;
  premise?: string;
  summary?: string;
  povCharacterId?: string;
  characterIds?: string[];
  locationIds?: string[];
  act?: 1 | 2 | 3;
  structureBeat?: string;
  sequenceOrder: number;
  beats: SceneBeat[];
  targetWordCount?: number;
  status: 'draft' | 'outlined' | 'writing' | 'complete';
}

export interface SceneBeat {
  id: string;
  title: string;
  description?: string;
  characters?: string[];
  locationId?: string;
  tensionLevel?: 'low' | 'medium' | 'high' | 'climax';
  wordTarget?: number;
  status: 'planned' | 'writing' | 'complete';
}

// Agent review types
export interface AgentReview {
  id: string;
  agentId: string;
  agentName: string;
  chapterId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'reviewed';
  suggestions: AgentSuggestion[];
  summary?: string;
  score?: number;
}

export interface AgentSuggestion {
  id: string;
  line?: number;
  column?: number;
  originalText: string;
  issue: string;
  suggestion: string;
  severity: 'info' | 'warning' | 'error';
  accepted?: boolean;
  appliedAt?: Date;
}

// Story framework for project
export interface StoryFramework {
  premise?: string;
  genre?: string;
  subgenres?: string[];
  themes?: string[];
  tone?: string;
  targetWordCount?: number;
  targetAudience?: string;
  structureTemplate?: string;
  completedPhases?: string[];
  aiNotes?: string;
}

// Props for the main panel component
export interface AICopilotPanelProps {
  // Mode control
  initialMode?: CopilotMode;
  
  // Document context
  documentContent?: string;
  selectedText?: string;
  cursorPosition?: number;
  
  // Editor callbacks
  onInsertText?: (text: string) => void;
  onReplaceSelection?: (text: string) => void;
  onReplaceDocument?: (text: string) => void;
  
  // Story framework data
  characters?: StoryCharacter[];
  locations?: StoryLocation[];
  notes?: StoryNote[];
  chapterTitle?: string;
  projectTitle?: string;
  projectId?: string;
  storyFramework?: StoryFramework;
  
  // Chapter outline data
  chapterOutlines?: ChapterOutline[];
  currentChapterOutline?: ChapterOutline;
  
  // Framework update callbacks
  onCreateCharacter?: (data: Partial<StoryCharacter>) => Promise<StoryCharacter>;
  onUpdateCharacter?: (id: string, updates: Partial<StoryCharacter>) => Promise<void>;
  onCreateLocation?: (data: Partial<StoryLocation>) => Promise<StoryLocation>;
  onCreateNote?: (data: Partial<StoryNote>) => Promise<StoryNote>;
  onUpdateFramework?: (framework: Partial<StoryFramework>) => Promise<void>;
  
  // Outline callbacks
  onCreateOutline?: (data: Partial<ChapterOutline>) => Promise<ChapterOutline>;
  onUpdateOutline?: (id: string, updates: Partial<ChapterOutline>) => Promise<void>;
  
  // Agent callbacks
  onRunAgent?: (agentId: string, content: string) => Promise<AgentReview>;
  onAcceptSuggestion?: (reviewId: string, suggestionId: string) => Promise<void>;
  onRejectSuggestion?: (reviewId: string, suggestionId: string) => Promise<void>;
  
  // Framework Wizard launcher
  onLaunchFrameworkWizard?: () => void;
  
  // Framework Editor launcher
  onOpenFrameworkEditor?: () => void;
  
  // Whether a framework exists
  hasFramework?: boolean;
  
  className?: string;
}

export const FREE_MODELS: AIModel[] = [
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B',
    provider: 'openrouter',
    description: 'Fast, reliable Meta model',
    maxTokens: 4096,
    isFree: true,
    icon: '🦙',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    provider: 'openrouter',
    description: 'Powerful Meta model for complex writing',
    maxTokens: 8192,
    isFree: true,
    icon: '🦙',
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B',
    provider: 'openrouter',
    description: 'Efficient European model',
    maxTokens: 4096,
    isFree: true,
    icon: '🌊',
  },
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct:free',
    name: 'Mistral Small 24B',
    provider: 'openrouter',
    description: 'Larger Mistral for better quality',
    maxTokens: 8192,
    isFree: true,
    icon: '🌊',
  },
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1',
    provider: 'openrouter',
    description: 'Advanced reasoning model',
    maxTokens: 8192,
    isFree: true,
    icon: '🔮',
  },
  {
    id: 'google/gemma-3-12b-it:free',
    name: 'Gemma 3 12B',
    provider: 'openrouter',
    description: 'Google open model, good quality',
    maxTokens: 8192,
    isFree: true,
    icon: '💎',
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B',
    provider: 'openrouter',
    description: 'Larger Google model for quality',
    maxTokens: 8192,
    isFree: true,
    icon: '💎',
  },
  {
    id: 'qwen/qwen3-4b:free',
    name: 'Qwen3 4B',
    provider: 'openrouter',
    description: 'Fast Qwen model, multilingual',
    maxTokens: 4096,
    isFree: true,
    icon: '🌐',
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b:free',
    name: 'Hermes 3 405B',
    provider: 'openrouter',
    description: 'Massive model for premium quality',
    maxTokens: 8192,
    isFree: true,
    icon: '⚡',
  },
];

export const DEFAULT_MODEL = FREE_MODELS[0];
