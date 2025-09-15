/**
 * RAG (Retrieval-Augmented Generation) System Type Definitions
 * 
 * Comprehensive types for vector storage, semantic search, context management,
 * and novel framework indexing for intelligent writing assistance.
 */

// ============================================================================
// Core Vector Storage Types
// ============================================================================

export interface VectorData {
  id: string
  vector: number[]
  metadata: VectorMetadata
  content: string
  timestamp: number
}

export interface VectorMetadata {
  category: 'plot' | 'character' | 'world' | 'theme' | 'general'
  type: string
  frameworkId?: string
  elementId?: string
  names?: string[]
  keywords?: string[]
  [key: string]: any
}

export interface VectorSearchOptions {
  limit?: number
  category?: string | string[]
  threshold?: number
  frameworkId?: string
  includeContent?: boolean
}

export interface VectorSearchResult {
  id: string
  similarity: number
  category: string
  type: string
  metadata: VectorMetadata
  content: string
  tokenCount: number
  relevanceScore: number
}

// ============================================================================
// Novel Framework Types
// ============================================================================

export interface NovelFramework {
  id: string
  title: string
  plotSummary?: string
  characters: Character[]
  worldElements: WorldElement[]
  themes?: string[]
  metadata?: {
    genre?: string
    targetLength?: number
    writingStyle?: string
    [key: string]: any
  }
}

export interface Character {
  id: string
  name: string
  description: string
  personalityTraits?: string[]
  relationships?: Relationship[]
  characterArc?: string
  backstory?: string
  dialogue_style?: string
  motivations?: string[]
  conflicts?: string[]
}

export interface Relationship {
  characterId: string
  relationshipType: string
  description: string
}

export interface WorldElement {
  id: string
  type: 'location' | 'culture' | 'technology' | 'magic_system' | 'history' | 'organization' | 'artifact' | 'other'
  name: string
  description: string
  properties?: Record<string, any>
  connections?: string[] // IDs of related world elements
}

// ============================================================================
// Context Management Types
// ============================================================================

export interface ContextRequest {
  query: string
  agentType?: AgentType
  maxTokens?: number
  prioritizeCategories?: string[]
  includeThemes?: boolean
  frameworkId?: string
}

export interface ContextResponse {
  plotElements: ContextElement[]
  characters: ContextElement[]
  worldElements: ContextElement[]
  themes: string[]
  totalTokens: number
  relevanceScores: {
    plot: number
    character: number
    world: number
  }
  truncated?: boolean
  warnings?: string[]
}

export interface ContextElement {
  id: string
  content: string
  relevanceScore: number
  tokenCount: number
  category: string
  type: string
  metadata: VectorMetadata
}

export type AgentType = 
  | 'planner'
  | 'scene_builder' 
  | 'dialogue_specialist'
  | 'description_enhancer'
  | 'consistency_editor'
  | 'compiler'
  | 'general'

export interface AgentContextPriorities {
  frameworkWeight: number
  charactersWeight: number
  worldWeight: number
  previousChaptersWeight: number
}

// ============================================================================
// Embedding Service Types
// ============================================================================

export interface EmbeddingProvider {
  name: 'openai' | 'cohere' | 'local' | 'simulated'
  model?: string
  apiKey?: string
  baseUrl?: string
}

export interface EmbeddingRequest {
  text: string
  provider?: EmbeddingProvider
  options?: {
    maxLength?: number
    model?: string
    [key: string]: any
  }
}

export interface EmbeddingResponse {
  embedding: number[]
  usage?: {
    tokens: number
    cost?: number
  }
  model?: string
  provider: string
}

// ============================================================================
// RAG System Configuration
// ============================================================================

export interface RAGSystemConfig {
  vectorStore: {
    type: 'memory' | 'pinecone' | 'weaviate' | 'qdrant'
    config?: Record<string, any>
  }
  embedding: {
    provider: EmbeddingProvider
    dimension: number
    model: string
  }
  search: {
    defaultThreshold: number
    defaultLimit: number
    enableKeywordBoost: boolean
    enableCategoryBoost: boolean
  }
  context: {
    maxTokensDefault: number
    truncationStrategy: 'hard' | 'sentence' | 'paragraph'
    agentPriorities: Record<AgentType, AgentContextPriorities>
  }
}

// ============================================================================
// RAG System Operations
// ============================================================================

export interface IndexingResult {
  frameworkId: string
  indexedElements: number
  categories: {
    plot: number
    character: number
    world: number
    theme: number
  }
  errors: string[]
  processingTime: number
}

export interface SemanticSearchRequest {
  query: string
  options?: VectorSearchOptions
}

export interface VectorStoreStats {
  totalVectors: number
  categories: Record<string, number>
  frameworks: string[]
  memoryUsage?: {
    approximate: string
    vectors: number
    metadata: number
  }
  lastUpdated: number
}

// ============================================================================
// Enhanced AI Generation Types
// ============================================================================

export interface RAGEnhancedRequest {
  prompt: string
  context?: ContextResponse
  provider?: string
  options?: {
    temperature?: number
    maxTokens?: number
    includeContext?: boolean
    contextWeight?: number
  }
}

export interface RAGEnhancedResponse {
  content: string
  contextUsed: {
    plot: number
    characters: number
    world: number
    themes: number
  }
  relevanceScore: number
  metadata: {
    provider: string
    model: string
    tokensUsed: number
    contextTokens: number
    generationTokens: number
  }
}

// ============================================================================
// Smart Suggestions Types
// ============================================================================

export interface SmartSuggestion {
  text: string
  confidence: number
  category: 'plot' | 'character' | 'world' | 'dialogue' | 'description' | 'general'
  reasoning?: string
  contextElements?: string[] // IDs of relevant context elements
  metadata?: {
    trigger: 'manual' | 'auto' | 'punctuation' | 'newline' | 'timer'
    relevanceScore: number
  }
}

export interface SuggestionTrigger {
  type: 'punctuation' | 'newline' | 'timer' | 'manual' | 'wordCount'
  enabled: boolean
  config?: {
    delay?: number // for timer
    minWords?: number // for wordCount
    punctuation?: string[] // for punctuation
  }
}

export interface SuggestionConfig {
  enabled: boolean
  maxSuggestions: number
  triggers: SuggestionTrigger[]
  contextOptions: {
    maxTokens: number
    includeThemes: boolean
    prioritizeRecent: boolean
  }
  filterOptions: {
    minConfidence: number
    categories: string[]
  }
}

// ============================================================================
// Error Types
// ============================================================================

export class RAGSystemError extends Error {
  code: string
  details?: any

  constructor(message: string, code: string, details?: any) {
    super(message)
    this.name = 'RAGSystemError'
    this.code = code
    this.details = details
  }
}

export interface RAGErrorInfo {
  code: string
  message: string
  details?: any
  timestamp: number
  context?: {
    operation: string
    frameworkId?: string
    query?: string
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export interface TokenEstimate {
  content: string
  estimatedTokens: number
  method: 'character_count' | 'word_count' | 'tiktoken' | 'api_estimate'
}

export interface SimilarityScore {
  similarity: number
  keywordBonus: number
  categoryBonus: number
  finalScore: number
}

// ============================================================================
// Event Types for Real-time Updates
// ============================================================================

export interface RAGSystemEvent {
  type: 'indexing_started' | 'indexing_progress' | 'indexing_complete' | 'search_performed' | 'context_generated' | 'error_occurred'
  timestamp: number
  data: any
}

export interface IndexingProgressEvent extends RAGSystemEvent {
  type: 'indexing_progress'
  data: {
    frameworkId: string
    processed: number
    total: number
    currentElement: string
    errors: string[]
  }
}

// ============================================================================
// React Hook Types
// ============================================================================

export interface UseRAGSystemResult {
  // State
  isIndexing: boolean
  searchResults: VectorSearchResult[]
  vectorStoreStats: VectorStoreStats | null
  
  // Operations
  indexFramework: (framework: NovelFramework) => Promise<IndexingResult>
  searchContent: (query: string, options?: VectorSearchOptions) => Promise<VectorSearchResult[]>
  getRelevantContext: (request: ContextRequest) => Promise<ContextResponse>
  clearVectorStore: () => Promise<void>
  
  // Enhanced AI
  generateWithRAG: (request: RAGEnhancedRequest) => Promise<RAGEnhancedResponse>
  
  // Utils
  estimateTokens: (content: string) => TokenEstimate
  
  // Error state
  error: RAGErrorInfo | null
}

export interface UseSemanticSearchResult {
  // State
  query: string
  results: VectorSearchResult[]
  isSearching: boolean
  searchHistory: string[]
  
  // Operations
  search: (query: string, options?: VectorSearchOptions) => Promise<void>
  clearResults: () => void
  clearHistory: () => void
  
  // Filters
  categoryFilter: string[]
  setCategoryFilter: (categories: string[]) => void
  thresholdFilter: number
  setThresholdFilter: (threshold: number) => void
}

export interface UseRAGEnhancedSuggestionsResult {
  // State
  suggestions: SmartSuggestion[]
  isGenerating: boolean
  config: SuggestionConfig
  
  // Operations
  triggerSuggestions: (context?: string) => Promise<void>
  acceptSuggestion: (suggestion: SmartSuggestion) => void
  dismissSuggestion: (index: number) => void
  clearSuggestions: () => void
  updateConfig: (config: Partial<SuggestionConfig>) => void
  
  // Context
  currentContext: ContextResponse | null
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Core types are already exported above via individual export statements
}

// Default configuration
export const DEFAULT_RAG_CONFIG: RAGSystemConfig = {
  vectorStore: {
    type: 'memory'
  },
  embedding: {
    provider: { name: 'simulated' },
    dimension: 1536,
    model: 'text-embedding-ada-002'
  },
  search: {
    defaultThreshold: 0.7,
    defaultLimit: 10,
    enableKeywordBoost: true,
    enableCategoryBoost: true
  },
  context: {
    maxTokensDefault: 2000,
    truncationStrategy: 'sentence',
    agentPriorities: {
      planner: {
        frameworkWeight: 0.6,
        charactersWeight: 0.3,
        worldWeight: 0.1,
        previousChaptersWeight: 0.0
      },
      scene_builder: {
        frameworkWeight: 0.3,
        charactersWeight: 0.4,
        worldWeight: 0.3,
        previousChaptersWeight: 0.0
      },
      dialogue_specialist: {
        frameworkWeight: 0.1,
        charactersWeight: 0.7,
        worldWeight: 0.1,
        previousChaptersWeight: 0.1
      },
      description_enhancer: {
        frameworkWeight: 0.2,
        charactersWeight: 0.2,
        worldWeight: 0.5,
        previousChaptersWeight: 0.1
      },
      consistency_editor: {
        frameworkWeight: 0.4,
        charactersWeight: 0.3,
        worldWeight: 0.2,
        previousChaptersWeight: 0.1
      },
      compiler: {
        frameworkWeight: 0.3,
        charactersWeight: 0.3,
        worldWeight: 0.2,
        previousChaptersWeight: 0.2
      },
      general: {
        frameworkWeight: 0.4,
        charactersWeight: 0.3,
        worldWeight: 0.2,
        previousChaptersWeight: 0.1
      }
    }
  }
}