/**
 * SpectreWeave AI Bridge Service
 * 
 * This service bridges SpectreWeave5 (Next.js/TypeScript) with the 
 * SpectreWeaveAIAlgorithm (Node.js/JavaScript) backend system.
 * 
 * Features:
 * - Agent orchestration for chapter generation
 * - Multi-provider AI routing with intelligent selection
 * - Style profile management and generation
 * - Novel framework and context management
 * - Real-time progress tracking
 * - Cost optimization and analytics
 * - Error handling and recovery
 */

import {
  AIProvider,
  AIRequest,
  AIResponse,
  AIContext,
  AIFeedback,
  AISuggestion,
  SmartSuggestion,
  AIGeneration,
  AIAnalytics,
  AIUserPreferences,
  AISession,
  AIEvent,
  AIEventType,
  AIServiceState,
  AIGenerationOptions,
} from './types';

// Bridge-specific types that match the backend system
interface ChapterGenerationRequest {
  chapterGoal: string;
  targetWordCount?: number;
  styleProfileId?: string;
  novelFrameworkId?: string;
  userInstructions?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  genre?: string;
  tone?: string;
  pipelineId?: string;
  // Optional per-agent retrieval weighting overrides provided by UI
  perAgentRetrieval?: Array<{
    agent: string; // e.g., 'planner', 'scene_builder'
    graphWeight?: number; // 0-1
    vectorWeight?: number; // 0-1
    categories?: string[];
    maxHops?: number;
  }>;
}

interface ChapterGenerationProgress {
  stage: 'initialization' | 'agent_execution' | 'completion';
  progress: number; // 0-100
  message: string;
  currentAgent: string | null;
  estimatedTimeRemaining: number | null;
}

interface ChapterGenerationResult {
  final_chapter: string;
  word_count: number;
  scenes_compiled: number;
  quality_score: number;
  compilation_notes: string[];
  orchestration_metadata: {
    execution_id: string;
    pipeline_version: string;
    agents_executed: string[];
    total_execution_time: number;
    total_tokens_used: number;
    total_cost: number;
    errors_encountered: number;
  };
}

interface StyleProfile {
  id: string;
  fingerprint: string;
  writers: { id: string; name: string }[];
  capabilities: { name: string; strength: number }[];
  created_at: string;
  updated_at: string;
}

interface NovelFramework {
  id: string;
  title: string;
  genre: string;
  setting: string;
  main_character: string;
  framework_summary: string;
  characters: Array<{
    id: string;
    name: string;
    role: string;
    description: string;
    personality_traits: string[];
    background: string;
  }>;
  world_elements: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface ProviderAnalytics {
  [providerName: string]: {
    provider_info: {
      name: string;
      capabilities: string[];
      context_limit: number;
      cost_per_token: number;
    };
    performance: {
      total_requests: number;
      successful_requests: number;
      failed_requests: number;
      success_rate: number;
      health_score: number;
      average_response_time: number;
      last_used: string | null;
    };
    usage: {
      total_tokens: number;
      total_cost: number;
      daily_cost: number;
      daily_requests: number;
      average_tokens_per_request: number;
      average_cost_per_request: number;
    };
  };
}

// Default bridge base resolves to Next proxy when available
const DEFAULT_BRIDGE_BASE = process.env.NEXT_PUBLIC_BRIDGE_BASE || '/api/bridge';

export class SpectreWeaveAIBridge {
  private baseUrl: string;
  private apiKey?: string;
  private eventListeners: Map<AIEventType, Set<(event: AIEvent) => void>>;
  private isInitialized: boolean = false;

  constructor(baseUrl: string = DEFAULT_BRIDGE_BASE, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.eventListeners = new Map();
  }

  /**
   * Initialize the bridge connection
   */
  async initialize(): Promise<void> {
    try {
      const response = await this.makeRequest('GET', '/health');
      if (response.status === 'healthy') {
        this.isInitialized = true;
        this.emitEvent('provider.statusChange', {
          message: 'SpectreWeave AI Bridge initialized successfully',
          healthy: true,
        });
      } else {
        throw new Error('Backend system is not healthy');
      }
    } catch (error) {
      console.error('Failed to initialize SpectreWeave AI Bridge:', error);
      throw error;
    }
  }

  /**
   * Generate a complete chapter using the multi-agent system
   */
  async generateChapter(
    request: ChapterGenerationRequest,
    novelFrameworkId?: string,
    onProgress?: (progress: ChapterGenerationProgress) => void
  ): Promise<ChapterGenerationResult> {
    this.ensureInitialized();

    try {
      this.emitEvent('request.started', { request, type: 'chapter_generation' });

      // Start chapter generation
      const response = await this.makeRequest('POST', '/chapter-generation/generate', {
        ...request,
        novel_framework_id: novelFrameworkId,
        pipeline_id: request.pipelineId,
        perAgentRetrieval: request.perAgentRetrieval,
        // Hint to backend to execute via LangGraph and fuse RAG+GraphRAG per step
        execution_engine: 'langgraph',
        retrieval_mode: 'hybrid',
      });

      const { generation_id } = response;

      // Poll for progress if callback provided
      if (onProgress) {
        await this.pollProgress(generation_id, onProgress);
      }

      // Get final result
      const result = await this.makeRequest('GET', `/chapter-generation/${generation_id}/result`);

      this.emitEvent('request.completed', { result, generation_id });
      return result;

    } catch (error) {
      this.emitEvent('request.failed', { error });
      throw error;
    }
  }

  /**
   * Generate text using intelligent provider selection
   */
  async generateText(
    prompt: string,
    options: AIGenerationOptions = {},
    taskRequirements?: {
      capability?: string;
      maxCost?: number;
      maxResponseTime?: number;
      contextLength?: number;
      prioritizeSpeed?: boolean;
      prioritizeCost?: boolean;
      prioritizeQuality?: boolean;
    }
  ): Promise<AIResponse<string>> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('POST', '/ai/generate-intelligent', {
        prompt,
        options,
        task_requirements: taskRequirements,
      });

      return {
        id: `res_${Date.now()}`,
        requestId: `req_${Date.now()}`,
        success: true,
        content: response.text,
        provider: response.provider as AIProvider,
        model: response.model,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens || response.usage.input_tokens || 0,
          completionTokens: response.usage.completion_tokens || response.usage.output_tokens || 0,
          totalTokens: response.usage.total_tokens || 0,
          cost: response.cost,
          latency: response.generation_time,
        } : undefined,
        metadata: {
          confidence: response.selection_info?.selection_score ? response.selection_info.selection_score / 100 : undefined,
          alternatives: response.selection_info?.alternatives?.map((alt: any) => alt.provider),
        },
        timestamp: new Date(),
      };

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate text with style profile
   */
  async generateWithStyleProfile(
    prompt: string,
    styleProfileId: string,
    options: AIGenerationOptions = {}
  ): Promise<AIResponse<string>> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('POST', '/style-profiles/generate', {
        prompt,
        style_profile_id: styleProfileId,
          options: {
            length: options.maxTokens ? (options.maxTokens < 500 ? 'short' : options.maxTokens > 1200 ? 'long' : 'medium') : 'medium',
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 1000,
          },
      });

      return {
        id: `res_${Date.now()}`,
        requestId: `req_${Date.now()}`,
        success: response.success,
        content: response.data.generated_text,
        provider: response.data.metadata.provider as AIProvider,
        model: response.data.metadata.model,
        usage: {
          promptTokens: 0, // Not provided by backend
          completionTokens: 0,
          totalTokens: response.data.metadata.tokens_used || 0,
          cost: 0,
          latency: response.data.metadata.generation_time,
        },
          metadata: {
            citations: undefined,
          },
        timestamp: new Date(),
      };

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Analyze text style
   */
  async analyzeTextStyle(text: string): Promise<{
    genre: string;
    style_attributes: {
      sentence_length: string;
      vocabulary_complexity: string;
      tone: string;
      dialogue_ratio: string;
      descriptive_language: string;
    };
    writing_techniques: string[];
    suggested_improvements: string[];
  }> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('POST', '/ai/analyze-style', {
        text,
      });

      return response.data;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get available AI providers and their status
   */
  async getProviderAnalytics(): Promise<ProviderAnalytics> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', '/ai/provider-analytics');
      return response;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get cost optimization recommendations
   */
  async getCostOptimizationRecommendations(): Promise<{
    recommendations: any[];
    total_recommendations: number;
    categories: Record<string, number>;
  }> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', '/ai/cost-optimization');
      return response;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Monitor provider health
   */
  async monitorProviderHealth(): Promise<Record<string, {
    healthy: boolean;
    response_time: number | null;
    timestamp: string;
    error: string | null;
  }>> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', '/ai/provider-health');
      return response;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new style profile
   */
  async createStyleProfile(
    name: string,
    description: string,
    textSamples: string[]
  ): Promise<StyleProfile> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('POST', '/style-profiles', {
        name,
        description,
        text_samples: textSamples,
      });

      return response.data;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all style profiles
   */
  async getStyleProfiles(): Promise<StyleProfile[]> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', '/style-profiles');
      return response.data;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a novel framework
   */
  async createNovelFramework(framework: {
    title: string;
    genre: string;
    setting: string;
    main_character: string;
    framework_summary: string;
    characters: Array<{
      name: string;
      role: string;
      description: string;
      personality_traits: string[];
      background: string;
    }>;
    world_elements: Array<{
      name: string;
      type: string;
      description: string;
    }>;
  }): Promise<NovelFramework> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('POST', '/novel-framework', framework);
      return response.data;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all novel frameworks
   */
  async getNovelFrameworks(): Promise<NovelFramework[]> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', '/novel-framework');
      return response.data;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get chapter generation history
   */
  async getChapterGenerationHistory(): Promise<Array<{
    id: string;
    chapter_goal: string;
    status: string;
    word_count: number;
    quality_score: number;
    total_cost: number;
    created_at: string;
  }>> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', '/chapter-generation/history');
      return response.data;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(): Promise<{
    total_chapters_generated: number;
    total_cost: number;
    average_quality_score: number;
    provider_usage: Record<string, number>;
    recent_generations: any[];
    cost_trends: any[];
  }> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', '/dashboard/analytics');
      return response.data;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * RAG System Operations
   */

  /**
   * Index a novel framework for semantic search
   */
  async indexNovelFramework(framework: any): Promise<{
    framework_id: string;
    indexed_elements: number;
    categories: Record<string, number>;
    errors: string[];
  }> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('POST', '/rag/index-framework', {
        framework,
      });

      return response.data;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search for relevant context using RAG system
   */
  async searchRelevantContext(
    query: string,
    options: {
      frameworkId?: string;
      categories?: string[];
      limit?: number;
      threshold?: number;
    } = {}
  ): Promise<Array<{
    id: string;
    similarity: number;
    category: string;
    type: string;
    content: string;
    token_count: number;
    relevance_score: number;
  }>> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('POST', '/rag/search', {
        query,
        options,
      });

      return response.data;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get relevant framework elements for context-aware generation
   */
  async getRelevantFrameworkElements(
    frameworkId: string,
    contextQuery: string,
    options: {
      maxTokens?: number;
      prioritizeCategories?: string[];
      includeThemes?: boolean;
    } = {}
  ): Promise<{
    plot_elements: any[];
    characters: any[];
    world_elements: any[];
    themes: any[];
    total_tokens: number;
    relevance_scores: Record<string, number>;
  }> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('POST', '/rag/relevant-elements', {
        framework_id: frameworkId,
        context_query: contextQuery,
        options,
      });

      return response.data;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Remove framework from RAG index
   */
  async removeFrameworkFromIndex(frameworkId: string): Promise<{
    framework_id: string;
    removed_elements: number;
  }> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('DELETE', `/rag/framework/${frameworkId}`);
      return response.data;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get RAG system statistics
   */
  async getRAGStats(): Promise<{
    total_vectors: number;
    categories: Record<string, number>;
    frameworks: Record<string, number>;
  }> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', '/rag/stats');
      return response.data;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate smart suggestions for real-time writing assistance
   */
  async generateSmartSuggestions(
    content: string,
    cursorPosition: number,
    context: AIContext
  ): Promise<SmartSuggestion[]> {
    this.ensureInitialized();

    try {
      // Extract surrounding text
      const surroundingText = this.extractSurroundingText(content, cursorPosition, 500);
      
      const response = await this.generateText(
        `Continue or enhance this text naturally: ${surroundingText}[CURSOR]`,
        {
          temperature: 0.8,
          maxTokens: 150,
        },
        {
          capability: 'creative',
          prioritizeSpeed: true,
        }
      );

      // Parse response into suggestions
      const suggestions = this.parseSmartSuggestionResponse(response.content || '');
      
        return suggestions.map((item, index) => ({
        id: `smart_${Date.now()}_${index}`,
        type: item.type || 'completion',
        text: item.text,
        displayText: item.text.substring(0, 50) + '...',
        confidence: item.confidence || 0.7,
          provider: (response.provider as any) as 'azure' | 'gemini' | 'databricks' | 'openai' | 'anthropic' | 'local',
        metadata: item.metadata,
      }));

    } catch (error) {
      console.error('Failed to generate smart suggestions:', error);
      return [];
    }
  }

  /**
   * Generate AI feedback for content
   */
  async generateFeedback(content: string, context: AIContext): Promise<AIFeedback[]> {
    this.ensureInitialized();

    try {
      const response = await this.generateText(
        this.buildFeedbackPrompt(content, context),
        {
          temperature: 0.3,
          format: 'json',
        },
        {
          capability: 'analytical',
          prioritizeQuality: true,
        }
      );

      const feedbackData = this.parseFeedbackResponse(response.content || '');
      
      return feedbackData.map((item, index) => ({
        id: `feedback_${Date.now()}_${index}`,
        type: item.type,
        content: item.content,
        severity: item.severity || 'suggestion',
        position: item.position,
        suggestions: item.suggestions,
        resolved: false,
        timestamp: new Date(),
      }));

    } catch (error) {
      console.error('Failed to generate feedback:', error);
      return [];
    }
  }

  /**
   * Event subscription
   */
  subscribeToEvents(eventType: AIEventType, callback: (event: AIEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);
    
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Private helper methods
   */

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('SpectreWeave AI Bridge not initialized. Call initialize() first.');
    }
  }

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private async pollProgress(
    generationId: string,
    onProgress: (progress: ChapterGenerationProgress) => void
  ): Promise<void> {
    const pollInterval = 2000; // 2 seconds
    const timeout = 600000; // 10 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const response = await this.makeRequest('GET', `/chapter-generation/${generationId}/status`);
        
        if (response.status === 'completed') {
          onProgress({
            stage: 'completion',
            progress: 100,
            message: 'Chapter generation completed successfully',
            currentAgent: null,
            estimatedTimeRemaining: 0,
          });
          break;
        } else if (response.status === 'failed') {
          throw new Error(response.error || 'Generation failed');
        } else if (response.status === 'running' && response.progress) {
          onProgress(response.progress);
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        console.error('Error polling progress:', error);
        break;
      }
    }
  }

  private handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    
    return new Error(typeof error === 'string' ? error : 'Unknown error occurred');
  }

  private emitEvent(type: AIEventType, data: any): void {
    const event: AIEvent = {
      type,
      data,
      timestamp: new Date(),
    };
    
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  private extractSurroundingText(content: string, position: number, radius: number): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(content.length, position + radius);
    return content.substring(start, end);
  }

  private parseSmartSuggestionResponse(response: string): any[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [{
        type: 'completion',
        text: response.trim(),
        confidence: 0.7,
      }];
    } catch (error) {
      return [{
        type: 'completion',
        text: response.trim(),
        confidence: 0.5,
      }];
    }
  }

  private buildFeedbackPrompt(content: string, context: AIContext): string {
    const genre = context.genre ? `Genre: ${context.genre}\n` : '';
    const style = context.authorStyles?.length ? `Style: ${context.authorStyles.join(', ')}\n` : '';
    
    return `Analyze the following text and provide feedback in JSON format.
${genre}${style}

Text to analyze:
"""
${content}
"""

Provide feedback as a JSON array with the following structure:
[
  {
    "type": "grammar|style|consistency|pacing|character|plot|dialogue|description",
    "content": "Description of the issue or suggestion",
    "severity": "info|suggestion|warning|error",
    "position": { "start": 0, "end": 0 },
    "suggestions": ["suggestion 1", "suggestion 2"]
  }
]`;
  }

  private parseFeedbackResponse(response: string): any[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Failed to parse feedback response:', error);
      return [];
    }
  }
}

// Export singleton instance
export const spectreWeaveAIBridge = new SpectreWeaveAIBridge();

// Export types for external use
export type {
  ChapterGenerationRequest,
  ChapterGenerationProgress,
  ChapterGenerationResult,
  StyleProfile,
  NovelFramework,
  ProviderAnalytics,
};