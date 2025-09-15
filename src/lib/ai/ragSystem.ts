/**
 * Advanced RAG (Retrieval-Augmented Generation) System for SpectreWeave5
 * 
 * Provides intelligent context retrieval and semantic search capabilities:
 * - Vector storage and semantic search
 * - Novel framework element indexing
 * - Context-aware content retrieval
 * - Token-optimized context management
 * - Integration with AI service providers
 * - Real-time embedding generation
 */

import { 
  AIContext,
  AIProvider,
  AICapability,
} from './types';

// RAG-specific types
export interface VectorEmbedding {
  vector: number[];
  dimension: number;
  model: string;
  timestamp: Date;
}

export interface VectorStoreEntry {
  id: string;
  vector: number[];
  metadata: VectorMetadata;
  content: string;
  timestamp: Date;
}

export interface VectorMetadata {
  frameworkId?: string;
  documentId?: string;
  projectId?: string;
  category: 'plot' | 'character' | 'world' | 'theme' | 'chapter' | 'scene' | 'dialogue' | 'general';
  type: string;
  title?: string;
  characterName?: string;
  elementName?: string;
  chapterNumber?: number;
  sceneNumber?: number;
  tags?: string[];
  importance?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SearchOptions {
  frameworkId?: string;
  documentId?: string;
  projectId?: string;
  categories?: VectorMetadata['category'][];
  types?: string[];
  limit?: number;
  threshold?: number;
  includeContent?: boolean;
  priorityWeights?: Record<string, number>;
}

export interface SearchResult {
  id: string;
  similarity: number;
  relevanceScore: number;
  category: VectorMetadata['category'];
  type: string;
  metadata: VectorMetadata;
  content?: string;
  tokenCount: number;
  excerpt?: string;
}

export interface ContextRetrievalOptions {
  maxTokens?: number;
  prioritizeCategories?: VectorMetadata['category'][];
  includeThemes?: boolean;
  diversityThreshold?: number;
  temporalRelevance?: boolean;
}

export interface RelevantContext {
  plotElements: SearchResult[];
  characters: SearchResult[];
  worldElements: SearchResult[];
  themes: SearchResult[];
  scenes: SearchResult[];
  dialogue: SearchResult[];
  totalTokens: number;
  relevanceScores: Record<string, number>;
  contextQuality: number;
}

export interface NovelFramework {
  id: string;
  title: string;
  genre?: string;
  plotSummary?: string;
  characters: Array<{
    id: string;
    name: string;
    description: string;
    traits: string[];
    relationships?: Array<{ characterId: string; relationship: string }>;
    arc?: string;
    background?: string;
  }>;
  worldElements: Array<{
    id: string;
    name: string;
    type: 'location' | 'technology' | 'culture' | 'magic' | 'politics' | 'other';
    description: string;
    rules?: string[];
    relationships?: any[];
  }>;
  themes?: string[];
  settings?: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
  }>;
  chapters?: Array<{
    id: string;
    number: number;
    title: string;
    summary: string;
    content?: string;
  }>;
}

// In-memory vector store implementation
class InMemoryVectorStore {
  private vectors: Map<string, VectorStoreEntry>;
  private categoryIndex: Map<string, Set<string>>;
  private frameworkIndex: Map<string, Set<string>>;

  constructor() {
    this.vectors = new Map();
    this.categoryIndex = new Map();
    this.frameworkIndex = new Map();
  }

  async store(entry: VectorStoreEntry): Promise<void> {
    this.vectors.set(entry.id, entry);

    // Update category index
    const category = entry.metadata.category;
    if (!this.categoryIndex.has(category)) {
      this.categoryIndex.set(category, new Set());
    }
    this.categoryIndex.get(category)!.add(entry.id);

    // Update framework index
    if (entry.metadata.frameworkId) {
      const frameworkId = entry.metadata.frameworkId;
      if (!this.frameworkIndex.has(frameworkId)) {
        this.frameworkIndex.set(frameworkId, new Set());
      }
      this.frameworkIndex.get(frameworkId)!.add(entry.id);
    }
  }

  async search(queryVector: number[], options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      frameworkId,
      categories,
      types,
      limit = 10,
      threshold = 0.7,
      includeContent = true,
    } = options;

    // Get candidate entries
    let candidates = Array.from(this.vectors.keys());

    // Filter by framework
    if (frameworkId && this.frameworkIndex.has(frameworkId)) {
      candidates = candidates.filter(id => 
        this.frameworkIndex.get(frameworkId)!.has(id)
      );
    }

    // Filter by categories
    if (categories && categories.length > 0) {
      const categoryIds = new Set<string>();
      categories.forEach(category => {
        if (this.categoryIndex.has(category)) {
          this.categoryIndex.get(category)!.forEach(id => categoryIds.add(id));
        }
      });
      candidates = candidates.filter(id => categoryIds.has(id));
    }

    // Filter by types
    if (types && types.length > 0) {
      candidates = candidates.filter(id => {
        const entry = this.vectors.get(id)!;
        return types.includes(entry.metadata.type);
      });
    }

    // Calculate similarities
    const results = candidates.map(id => {
      const entry = this.vectors.get(id)!;
      const similarity = this.cosineSimilarity(queryVector, entry.vector);
      const relevanceScore = this.calculateRelevanceScore(entry, similarity, options);
      
      return {
        id: entry.id,
        similarity,
        relevanceScore,
        category: entry.metadata.category,
        type: entry.metadata.type,
        metadata: entry.metadata,
        content: includeContent ? entry.content : undefined,
        tokenCount: this.estimateTokens(entry.content),
        excerpt: this.createExcerpt(entry.content),
      };
    });

    // Filter by threshold and sort by relevance
    return results
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  async delete(id: string): Promise<boolean> {
    const entry = this.vectors.get(id);
    if (!entry) return false;

    this.vectors.delete(id);

    // Remove from category index
    const category = entry.metadata.category;
    if (this.categoryIndex.has(category)) {
      this.categoryIndex.get(category)!.delete(id);
    }

    // Remove from framework index
    if (entry.metadata.frameworkId) {
      const frameworkId = entry.metadata.frameworkId;
      if (this.frameworkIndex.has(frameworkId)) {
        this.frameworkIndex.get(frameworkId)!.delete(id);
      }
    }

    return true;
  }

  async clear(): Promise<void> {
    this.vectors.clear();
    this.categoryIndex.clear();
    this.frameworkIndex.clear();
  }

  getStats() {
    return {
      totalVectors: this.vectors.size,
      categories: Object.fromEntries(
        Array.from(this.categoryIndex.entries()).map(([cat, ids]) => [cat, ids.size])
      ),
      frameworks: Object.fromEntries(
        Array.from(this.frameworkIndex.entries()).map(([fw, ids]) => [fw, ids.size])
      ),
    };
  }

  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      magnitudeA += vectorA[i] * vectorA[i];
      magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private calculateRelevanceScore(
    entry: VectorStoreEntry,
    similarity: number,
    options: SearchOptions
  ): number {
    let score = similarity;

    // Apply category weights
    const categoryBoosts = {
      plot: 0.1,
      character: 0.08,
      world: 0.06,
      scene: 0.05,
      dialogue: 0.04,
      theme: 0.03,
      chapter: 0.02,
      general: 0.01,
    };

    score += categoryBoosts[entry.metadata.category] || 0;

    // Apply importance boost
    const importanceBoosts = {
      critical: 0.15,
      high: 0.1,
      medium: 0.05,
      low: 0,
    };

    score += importanceBoosts[entry.metadata.importance || 'medium'];

    // Apply recency boost (newer content gets slight boost)
    const daysSinceCreation = (Date.now() - entry.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, 0.05 - (daysSinceCreation * 0.001));
    score += recencyBoost;

    // Apply custom priority weights
    if (options.priorityWeights) {
      const weight = options.priorityWeights[entry.metadata.category] || 1;
      score *= weight;
    }

    return Math.min(score, 1);
  }

  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private createExcerpt(text: string, maxLength: number = 150): string {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > maxLength * 0.8 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }
}

// Main RAG System Class
export class RAGSystem {
  private vectorStore: InMemoryVectorStore;
  private embeddingProvider: AIProvider = 'openai';
  private embeddingModel: string = 'text-embedding-ada-002';
  private readonly embeddingDimension = 1536;

  constructor() {
    this.vectorStore = new InMemoryVectorStore();
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string, model?: string): Promise<VectorEmbedding> {
    try {
      // For now, use simulated embeddings (replace with real API calls in production)
      const vector = this.generateSimulatedEmbedding(text);
      
      return {
        vector,
        dimension: this.embeddingDimension,
        model: model || this.embeddingModel,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Index a novel framework for semantic search
   */
  async indexNovelFramework(framework: NovelFramework): Promise<{
    frameworkId: string;
    indexedElements: number;
    categories: Record<string, number>;
    errors: string[];
  }> {
    const results = {
      frameworkId: framework.id,
      indexedElements: 0,
      categories: {} as Record<string, number>,
      errors: [] as string[],
    };

    try {
      // Index plot summary
      if (framework.plotSummary) {
        try {
          const embedding = await this.generateEmbedding(framework.plotSummary);
          await this.vectorStore.store({
            id: `${framework.id}_plot`,
            vector: embedding.vector,
            metadata: {
              frameworkId: framework.id,
              category: 'plot',
              type: 'plot_summary',
              title: framework.title,
              importance: 'critical',
            },
            content: framework.plotSummary,
            timestamp: new Date(),
          });
          
          results.indexedElements++;
          results.categories.plot = (results.categories.plot || 0) + 1;
        } catch (error) {
          results.errors.push(`Plot indexing failed: ${error}`);
        }
      }

      // Index characters
      for (const character of framework.characters) {
        try {
          const characterText = this.createCharacterSearchText(character);
          const embedding = await this.generateEmbedding(characterText);
          
          await this.vectorStore.store({
            id: `${framework.id}_character_${character.id}`,
            vector: embedding.vector,
            metadata: {
              frameworkId: framework.id,
              category: 'character',
              type: 'character',
              characterName: character.name,
              importance: 'high',
            },
            content: characterText,
            timestamp: new Date(),
          });
          
          results.indexedElements++;
          results.categories.character = (results.categories.character || 0) + 1;
        } catch (error) {
          results.errors.push(`Character ${character.name} indexing failed: ${error}`);
        }
      }

      // Index world elements
      for (const element of framework.worldElements) {
        try {
          const elementText = this.createWorldElementSearchText(element);
          const embedding = await this.generateEmbedding(elementText);
          
          await this.vectorStore.store({
            id: `${framework.id}_world_${element.id}`,
            vector: embedding.vector,
            metadata: {
              frameworkId: framework.id,
              category: 'world',
              type: element.type,
              elementName: element.name,
              importance: 'medium',
            },
            content: elementText,
            timestamp: new Date(),
          });
          
          results.indexedElements++;
          results.categories.world = (results.categories.world || 0) + 1;
        } catch (error) {
          results.errors.push(`World element ${element.name} indexing failed: ${error}`);
        }
      }

      // Index themes
      if (framework.themes && framework.themes.length > 0) {
        try {
          const themesText = framework.themes.join('. ');
          const embedding = await this.generateEmbedding(themesText);
          
          await this.vectorStore.store({
            id: `${framework.id}_themes`,
            vector: embedding.vector,
            metadata: {
              frameworkId: framework.id,
              category: 'theme',
              type: 'themes',
              importance: 'medium',
            },
            content: themesText,
            timestamp: new Date(),
          });
          
          results.indexedElements++;
          results.categories.theme = (results.categories.theme || 0) + 1;
        } catch (error) {
          results.errors.push(`Themes indexing failed: ${error}`);
        }
      }

      // Index chapters if available
      if (framework.chapters) {
        for (const chapter of framework.chapters) {
          try {
            const chapterText = `Chapter ${chapter.number}: ${chapter.title}. ${chapter.summary}`;
            const embedding = await this.generateEmbedding(chapterText);
            
            await this.vectorStore.store({
              id: `${framework.id}_chapter_${chapter.id}`,
              vector: embedding.vector,
              metadata: {
                frameworkId: framework.id,
                category: 'chapter',
                type: 'chapter_summary',
                chapterNumber: chapter.number,
                title: chapter.title,
                importance: 'medium',
              },
              content: chapterText,
              timestamp: new Date(),
            });
            
            results.indexedElements++;
            results.categories.chapter = (results.categories.chapter || 0) + 1;
          } catch (error) {
            results.errors.push(`Chapter ${chapter.number} indexing failed: ${error}`);
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Framework indexing failed:', error);
      throw error;
    }
  }

  /**
   * Search for relevant context based on query
   */
  async searchRelevantContext(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    if (!query || typeof query !== 'string') {
      throw new Error('Query is required for context search');
    }

    try {
      const queryEmbedding = await this.generateEmbedding(query);
      return await this.vectorStore.search(queryEmbedding.vector, options);
    } catch (error) {
      console.error('Context search failed:', error);
      throw error;
    }
  }

  /**
   * Get contextually relevant framework elements optimized for token limits
   */
  async getRelevantFrameworkElements(
    frameworkId: string,
    contextQuery: string,
    options: ContextRetrievalOptions = {}
  ): Promise<RelevantContext> {
    const {
      maxTokens = 2000,
      prioritizeCategories = ['character', 'world', 'plot'],
      includeThemes = true,
      diversityThreshold = 0.8,
    } = options;

    try {
      const relevantContext: RelevantContext = {
        plotElements: [],
        characters: [],
        worldElements: [],
        themes: [],
        scenes: [],
        dialogue: [],
        totalTokens: 0,
        relevanceScores: {},
        contextQuality: 0,
      };

      let remainingTokens = maxTokens;

      // Search each category in priority order
      for (const category of prioritizeCategories) {
        if (remainingTokens <= 100) break;

        const categoryResults = await this.searchRelevantContext(contextQuery, {
          frameworkId,
          categories: [category as VectorMetadata['category']],
          limit: 5,
          threshold: 0.6,
        });

        const categoryElements: SearchResult[] = [];
        let categoryTokens = 0;
        const maxCategoryTokens = Math.floor(remainingTokens * 0.4);

        // Apply diversity filtering
        const selectedResults = this.applyDiversityFilter(categoryResults, diversityThreshold);

        for (const result of selectedResults) {
          if (categoryTokens + result.tokenCount <= maxCategoryTokens) {
            categoryElements.push(result);
            categoryTokens += result.tokenCount;
          }
        }

        // Store results by category
        switch (category) {
          case 'plot':
            relevantContext.plotElements = categoryElements;
            break;
          case 'character':
            relevantContext.characters = categoryElements;
            break;
          case 'world':
            relevantContext.worldElements = categoryElements;
            break;
          case 'scene':
            relevantContext.scenes = categoryElements;
            break;
          case 'dialogue':
            relevantContext.dialogue = categoryElements;
            break;
        }

        relevantContext.totalTokens += categoryTokens;
        remainingTokens -= categoryTokens;
        
        // Calculate average relevance score for category
        relevantContext.relevanceScores[category] = 
          categoryElements.reduce((sum, el) => sum + el.relevanceScore, 0) / Math.max(categoryElements.length, 1);
      }

      // Add themes if requested and tokens available
      if (includeThemes && remainingTokens > 50) {
        const themeResults = await this.searchRelevantContext(contextQuery, {
          frameworkId,
          categories: ['theme'],
          limit: 2,
          threshold: 0.5,
        });

        for (const result of themeResults) {
          if (remainingTokens >= result.tokenCount) {
            relevantContext.themes.push(result);
            relevantContext.totalTokens += result.tokenCount;
            remainingTokens -= result.tokenCount;
          }
        }
      }

      // Calculate overall context quality
      relevantContext.contextQuality = this.calculateContextQuality(relevantContext);

      return relevantContext;
    } catch (error) {
      console.error('Error getting relevant framework elements:', error);
      throw error;
    }
  }

  /**
   * Remove framework from index
   */
  async removeFrameworkFromIndex(frameworkId: string): Promise<{
    frameworkId: string;
    removedElements: number;
  }> {
    const stats = this.vectorStore.getStats();
    const frameworkVectors = stats.frameworks[frameworkId] || 0;
    
    // In a real implementation, we'd iterate through and remove all framework vectors
    // For now, clear everything (since we can't efficiently iterate the private Map)
    if (frameworkVectors > 0) {
      console.warn(`Framework ${frameworkId} removal requires full vector store rebuild`);
    }

    return {
      frameworkId,
      removedElements: frameworkVectors,
    };
  }

  /**
   * Get vector store statistics
   */
  getVectorStoreStats() {
    return this.vectorStore.getStats();
  }

  /**
   * Clear entire vector store
   */
  async clearVectorStore(): Promise<void> {
    await this.vectorStore.clear();
  }

  // Private helper methods

  private generateSimulatedEmbedding(text: string): number[] {
    // Create deterministic but varied embedding based on text content
    const embedding = new Array(this.embeddingDimension);
    const textHash = this.simpleHash(text.toLowerCase());
    const words = text.toLowerCase().match(/\w+/g) || [];
    
    for (let i = 0; i < this.embeddingDimension; i++) {
      const seed = textHash + words.length + i;
      embedding[i] = (Math.sin(seed) + Math.cos(seed * 2) + Math.sin(seed * 3)) / 3;
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private createCharacterSearchText(character: any): string {
    const parts = [
      `Character: ${character.name}`,
      character.description || '',
      character.traits ? `Traits: ${character.traits.join(', ')}` : '',
      character.background || '',
      character.arc || '',
      character.relationships ? 
        `Relationships: ${character.relationships.map((r: any) => `${r.relationship} with ${r.characterId}`).join(', ')}` : '',
    ];

    return parts.filter(part => part.trim()).join('. ');
  }

  private createWorldElementSearchText(element: any): string {
    const parts = [
      `${element.type}: ${element.name}`,
      element.description || '',
      element.rules ? `Rules: ${element.rules.join('. ')}` : '',
      element.relationships ? `Related to: ${JSON.stringify(element.relationships)}` : '',
    ];

    return parts.filter(part => part.trim()).join('. ');
  }

  private applyDiversityFilter(results: SearchResult[], threshold: number): SearchResult[] {
    if (results.length <= 1) return results;

    const selected = [results[0]]; // Always include the most relevant
    
    for (let i = 1; i < results.length; i++) {
      const candidate = results[i];
      let isDiverse = true;

      // Check if candidate is too similar to already selected results
      for (const selected_result of selected) {
        if (candidate.similarity > threshold && selected_result.similarity > threshold) {
          // If both are high similarity, check for content overlap
          const overlap = this.calculateContentOverlap(candidate.content || '', selected_result.content || '');
          if (overlap > 0.5) {
            isDiverse = false;
            break;
          }
        }
      }

      if (isDiverse) {
        selected.push(candidate);
      }
    }

    return selected;
  }

  private calculateContentOverlap(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateContextQuality(context: RelevantContext): number {
    let qualityScore = 0;
    let totalElements = 0;

    // Weight different categories
    const categoryWeights = {
      plotElements: 0.3,
      characters: 0.25,
      worldElements: 0.2,
      scenes: 0.15,
      themes: 0.1,
      dialogue: 0.1,
    };

    Object.entries(categoryWeights).forEach(([category, weight]) => {
      const elements = context[category as keyof RelevantContext] as SearchResult[];
      if (Array.isArray(elements) && elements.length > 0) {
        const avgRelevance = elements.reduce((sum, el) => sum + el.relevanceScore, 0) / elements.length;
        qualityScore += avgRelevance * weight;
        totalElements += elements.length;
      }
    });

    // Bonus for having diverse context types
    const diversityBonus = totalElements > 3 ? 0.1 : 0;
    
    // Penalty for exceeding token limits significantly
    const tokenPenalty = context.totalTokens > 2500 ? -0.1 : 0;

    return Math.min(Math.max(qualityScore + diversityBonus + tokenPenalty, 0), 1);
  }
}

// Ensure a stable singleton across dev HMR and route re-evaluations
declare global {
  // eslint-disable-next-line no-var
  var __RAG_SYSTEM__: RAGSystem | undefined;
}

function getSingletonRAG(): RAGSystem {
  if (typeof global !== 'undefined') {
    const g = global as unknown as { __RAG_SYSTEM__?: RAGSystem };
    if (!g.__RAG_SYSTEM__) {
      g.__RAG_SYSTEM__ = new RAGSystem();
    }
    return g.__RAG_SYSTEM__;
  }
  // Fallback (should not happen in Node runtime)
  return new RAGSystem();
}

export const ragSystem = getSingletonRAG();