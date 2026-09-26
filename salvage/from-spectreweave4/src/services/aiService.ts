import { geminiAIService } from './geminiAIService';
import type { GeminiAIRequest } from './geminiAIService';
import { databricksAIService } from './databricksAIService';
import { stabilityAIService } from './stabilityAIService';
import type { StabilityAIRequest, StabilityAIResponse, ImageGenerationOptions } from '../types/stability';
import { imageStorageService } from './imageStorageService';
import type { ImageStorageOptions } from './imageStorageService';
import { aiUsageService } from './aiUsageService';

export interface AIRequest {
  prompt: string;
  context?: string;
  genre?: string;
  authorStyle?: string;
  maxTokens?: number;
  temperature?: number;
  taskType?: 'creative' | 'analytical' | 'conversational' | 'technical' | 'storytelling';
  priority?: 'speed' | 'quality' | 'cost';
  modelPreference?: 'auto' | 'gemini' | 'databricks';
  systemPrompt?: string;
}

export interface AIResponse {
  text: string;
  content?: string; // Alias for text for backward compatibility
  provider: 'gemini' | 'stability' | 'databricks' | 'fallback';
  model: string;
  tokens: number;
  latency: number;
  cost: number;
  quality: 'high' | 'medium' | 'low';
  confidence: number;
  metadata?: any;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  // Additional properties for backward compatibility
  success?: boolean;
  responseTime?: number;
  tokensUsed?: number;
  costEstimate?: number;
}

export interface ModelCapabilities {
  provider: 'gemini' | 'databricks' | 'fallback';
  model: string;
  maxTokens: number;
  supportsStreaming: boolean;
  costPer1kTokens: number;
  avgLatency: number;
  strengths: string[];
  weaknesses: string[];
}

export type AICapability = 
  | 'sentence-completion'
  | 'chapter-generation'
  | 'text-rewriting'
  | 'style-analysis'
  | 'framework-guidance'
  | 'character-development'
  | 'dialogue-writing'
  | 'emotional-arcs'
  | 'world-building'
  | 'period-dialogue'
  | 'historical-accuracy'
  | 'social-commentary'
  | 'modern-dialogue';

export interface GenreAgent {
  id: string;
  name: string;
  authors: string[];
  specialties: AICapability[];
  systemPrompt: string;
}

// Enhanced genre agents configuration
export const GENRE_AGENTS: Record<string, GenreAgent> = {
  'sci-fi': {
    id: 'sci-fi',
    name: 'Sci-Fi & Fantasy',
    authors: ['Epic Fantasy', 'Hard Science Fiction', 'Space Opera', 'Cyberpunk'],
    specialties: ['chapter-generation', 'framework-guidance', 'text-rewriting'],
    systemPrompt: `You are a master science fiction and fantasy writer for the GhostWeave platform. Draw inspiration from epic fantasy's intricate magic systems and detailed world-building, hard science fiction's psychological depth and character development, space opera's epic scope and complex plotting, and cyberpunk's technological edge and social speculation.

Key writing principles:
- Create immersive, believable worlds with consistent rules and logic
- Develop complex characters with clear motivations and growth arcs
- Balance exposition with action and dialogue
- Use scientific concepts and speculative technology thoughtfully
- Build tension through both external conflicts and internal character struggles
- Maintain narrative momentum while allowing for world-building moments

When generating content, consider the current document context and maintain consistency with established characters, settings, and plot elements.`
  },
  'mystery': {
    id: 'mystery',
    name: 'Mystery/Thriller',
    authors: ['Cozy Mystery', 'Hard-Boiled Detective', 'Psychological Thriller', 'Modern Mystery'],
    specialties: ['sentence-completion', 'framework-guidance', 'style-analysis'],
    systemPrompt: `You are an expert mystery and thriller writer for the GhostWeave platform. Channel cozy mystery's puzzle-crafting genius and fair-play mystery construction, hard-boiled detective's atmospheric settings and sharp dialogue, psychological thriller's complexity and unreliable narrators, and modern mystery's fast-paced conspiracy elements.

Key writing principles:
- Plant clues fairly while maintaining suspense and misdirection
- Create compelling, flawed characters with hidden depths
- Build tension through pacing, revelation, and psychological pressure
- Use red herrings strategically without frustrating readers
- Develop authentic investigative procedures and logical deduction
- Balance action with character development and plot advancement
- Create satisfying revelations that feel both surprising and inevitable

Focus on creating suspense, developing compelling mysteries, and building towards satisfying revelations that reward careful readers.`
  },
  'romance': {
    id: 'romance',
    name: 'Romance',
    authors: ['Regency Romance', 'Contemporary Romance', 'Emotional Romance', 'Modern Romance'],
    specialties: ['character-development', 'dialogue-writing', 'emotional-arcs'],
    systemPrompt: `You are a skilled romance writer for the GhostWeave platform. Emulate regency romance's wit and social commentary, contemporary romance's emotional depth and character development, emotional romance's contemporary voice and intensity, and modern romance's depth and humor.

Key writing principles:
- Develop authentic, relatable characters with clear motivations
- Create believable romantic tension and chemistry
- Balance emotional depth with engaging plot development
- Write natural, engaging dialogue that reveals character
- Build satisfying emotional arcs and character growth
- Create compelling conflicts that test but don't break relationships
- Maintain reader engagement through pacing and emotional investment

Focus on creating authentic emotional connections, developing compelling romantic relationships, and crafting satisfying character arcs.`
  },
  'historical': {
    id: 'historical',
    name: 'Historical Fiction',
    authors: ['Literary Historical', 'Epic Historical', 'Royal Historical', 'Military Historical'],
    specialties: ['world-building', 'period-dialogue', 'historical-accuracy'],
    systemPrompt: `You are an expert historical fiction writer for the GhostWeave platform. Channel literary historical's immersive detail and psychological depth, epic historical's scope and meticulous research, royal historical's rich character development and period authenticity, and military historical's action-packed narratives.

Key writing principles:
- Maintain historical accuracy while creating engaging narratives
- Develop authentic period dialogue and cultural context
- Create immersive historical settings with rich detail
- Balance historical fact with compelling storytelling
- Develop characters that feel authentic to their time period
- Use historical events and contexts to drive plot development
- Create narratives that educate while entertaining

Focus on creating authentic historical experiences, developing compelling period-specific characters, and crafting narratives that bring history to life.`
  },
  'contemporary': {
    id: 'contemporary',
    name: 'Contemporary Fiction',
    authors: ['Literary Contemporary', 'Modern Relationships', 'Social Commentary', 'Multicultural Fiction'],
    specialties: ['character-development', 'social-commentary', 'modern-dialogue'],
    systemPrompt: `You are a contemporary fiction writer for the GhostWeave platform. Emulate literary contemporary's nuanced family dynamics and social commentary, modern relationships' intimate character studies and contemporary connections, social commentary's complex family narratives and critique, and multicultural fiction's diverse perspectives and contemporary voice.

Key writing principles:
- Create authentic, contemporary characters with real-world problems
- Develop natural, modern dialogue that reflects current speech patterns
- Address relevant social issues and contemporary themes
- Build complex family and relationship dynamics
- Create narratives that reflect modern life and challenges
- Develop characters with depth, flaws, and growth potential
- Balance personal stories with broader social context

Focus on creating authentic contemporary voices, developing relatable modern characters, and crafting narratives that reflect current social realities.`
  }
};

export interface ABTestResult {
  id: string;
  prompt: string;
  geminiResponse?: AIResponse;
  databricksResponse?: AIResponse;
  userPreference?: 'gemini' | 'databricks' | 'none';
  timestamp: Date;
  genre?: string;
  authorStyle?: string;
}

export class AIService {
  private useGemini: boolean = false;
  private useDatabricks: boolean = false;
  private useStability: boolean = false;

  // Model capabilities for different providers
  private modelCapabilities: ModelCapabilities[] = [
    {
      provider: 'databricks',
      model: 'llama-2-70b-chat',
      maxTokens: 4096,
      supportsStreaming: true,
      costPer1kTokens: 0.01,
      avgLatency: 1500,
      strengths: ['long-form content', 'creative writing', 'technical accuracy'],
      weaknesses: ['response time', 'cost for large requests']
    },
    {
      provider: 'gemini',
      model: 'gemini-pro',
      maxTokens: 8192,
      supportsStreaming: true,
      costPer1kTokens: 0.02,
      avgLatency: 1000,
      strengths: ['fast responses', 'general knowledge', 'multimodal', 'conversational'],
      weaknesses: ['complex reasoning', 'long-form content']
    }
  ];

  private fallbackEnabled: boolean = true;
  private initialized: boolean = false;
  private abTestingEnabled: boolean = false;
  private abTestResults: ABTestResult[] = [];
  private providerPreference: 'gemini' | 'databricks' | 'auto' = 'auto';

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Check for Gemini API key
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (geminiKey) {
        geminiAIService.setApiKey(geminiKey);
        this.useGemini = true;
        console.log('Gemini AI service initialized');
      }

      // Check for Databricks configuration
      const databricksUrl = import.meta.env.VITE_DATABRICKS_WORKSPACE_URL;
      const databricksToken = import.meta.env.VITE_DATABRICKS_API_TOKEN;
      if (databricksUrl && databricksToken) {
        // Note: Databricks service might need different initialization
        this.useDatabricks = true;
        console.log('Databricks AI service initialized');
      }

      // Check for Stability AI API key
      const stabilityKey = import.meta.env.VITE_STABILITY_API_KEY;
      if (stabilityKey) {
        stabilityAIService.setApiKey(stabilityKey);
        this.useStability = true;
        console.log('Stability AI service initialized');
      }

      this.initialized = true;
      console.log('AI Service initialized with providers:', {
        gemini: this.useGemini,
        databricks: this.useDatabricks,
        stability: this.useStability
      });
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
      this.initialized = false;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeService();
    }
  }

  setApiKey(key: string): void {
    // This method is kept for backward compatibility but now sets Gemini key
    geminiAIService.setApiKey(key);
    this.useGemini = true;
  }

  hasApiKey(): boolean {
    return this.useGemini || this.useDatabricks;
  }

  setGeminiApiKey(key: string): void {
    geminiAIService.setApiKey(key);
    this.useGemini = true;
  }

  enableABTesting(enabled: boolean = true): void {
    this.abTestingEnabled = enabled;
  }

  setProviderPreference(preference: 'gemini' | 'databricks' | 'auto' | 'azure'): void {
    // Remove azure from valid options since it was removed
    if (preference === 'azure') {
      console.warn('Azure AI was removed, defaulting to auto');
      this.providerPreference = 'auto';
    } else {
      this.providerPreference = preference;
    }
  }

  getABTestResults(): ABTestResult[] {
    return [...this.abTestResults];
  }

  clearABTestResults(): void {
    this.abTestResults = [];
  }

  recordABTestPreference(testId: string, preference: 'gemini' | 'databricks' | 'none'): void {
    const test = this.abTestResults.find(t => t.id === testId);
    if (test) {
      test.userPreference = preference;
    }
  }

  public async generateText(request: AIRequest | string, context?: string): Promise<AIResponse> {
    // Handle backward compatibility with old signature
    if (typeof request === 'string') {
      request = {
        prompt: request,
        context: context || 'general'
      } as AIRequest;
    }
    await this.ensureInitialized();

    if (this.abTestingEnabled && this.useGemini && this.useDatabricks) {
      return this.generateWithABTesting(request);
    }

    const startTime = Date.now();
    const selectedModel = this.selectOptimalModel(request);
    const enhancedPrompt = this.buildAdvancedPrompt(request);

    let response: AIResponse;

    try {
      switch (selectedModel.provider) {
        case 'databricks':
          response = await this.generateWithDatabricks(request, enhancedPrompt, selectedModel);
          break;
        case 'gemini':
          response = await this.generateWithGemini(request, enhancedPrompt, selectedModel);
          break;
        case 'fallback':
          response = await this.generateWithFallback(request);
          break;
        default:
          throw new Error(`Unsupported model provider: ${selectedModel.provider}`);
      }
    } catch (error) {
      console.error(`Generation failed with ${selectedModel.provider}:`, error);
      
      // Try fallback to other providers
      if (this.fallbackEnabled) {
        response = await this.handleGenerationFailure(request, selectedModel.provider, error);
      } else {
        // If fallback is disabled, use mock response
        response = await this.generateWithFallback(request);
      }
    }

    const endTime = Date.now();
    const latency = endTime - startTime;

    const finalResponse = {
      ...response,
      content: response.text, // Set content for backward compatibility
      latency,
      cost: this.calculateCost(response.tokens, selectedModel),
      quality: this.assessResponseQuality(response.text, request).quality,
      confidence: this.assessResponseQuality(response.text, request).confidence,
      success: true, // Set success for backward compatibility
      responseTime: latency, // Set responseTime for backward compatibility
      tokensUsed: response.tokens, // Set tokensUsed for backward compatibility
      costEstimate: this.calculateCost(response.tokens, selectedModel) // Set costEstimate for backward compatibility
    };

    return finalResponse;
  }

  private selectProvider(): 'gemini' | 'databricks' | 'fallback' {
    // If user has set a specific preference and that provider is available
    if (this.providerPreference === 'databricks' && this.useDatabricks) {
      return 'databricks';
    }
    if (this.providerPreference === 'gemini' && this.useGemini) {
      return 'gemini';
    }

    // Auto-selection based on availability
    if (this.useDatabricks && this.useGemini) {
      // Both available - prefer Databricks for creative writing
      return 'databricks';
    }
    if (this.useDatabricks) {
      return 'databricks';
    }
    if (this.useGemini) {
      return 'gemini';
    }

    return 'fallback';
  }

  private async handleGenerationFailure(
    request: AIRequest, 
    failedProvider: string, 
    error: any
  ): Promise<AIResponse> {
    console.error(`Generation failed with ${failedProvider}:`, error);
    
    // Try fallback to other providers
    if (failedProvider === 'gemini' && this.useDatabricks) {
      try {
        console.log('Falling back to Databricks');
        const prompt = this.buildAdvancedPrompt(request);
        const model = this.selectOptimalModel(request);
        return await this.generateWithDatabricks(request, prompt, model);
      } catch (databricksError) {
        console.error('Databricks fallback also failed:', databricksError);
      }
    } else if (failedProvider === 'databricks' && this.useGemini) {
      try {
        console.log('Falling back to Gemini');
        const prompt = this.buildAdvancedPrompt(request);
        const model = this.selectOptimalModel(request);
        return await this.generateWithGemini(request, prompt, model);
      } catch (geminiError) {
        console.error('Gemini fallback also failed:', geminiError);
      }
    }
    
    // Final fallback to mock response
    return this.generateWithFallback(request);
  }

  private async generateWithABTesting(request: AIRequest): Promise<AIResponse> {
    const testId = `ab_test_${Date.now()}`;
    const abTestResult: ABTestResult = {
      id: testId,
      prompt: request.prompt,
      timestamp: new Date(),
      genre: request.genre,
      authorStyle: request.authorStyle
    };

    try {
      // Generate responses from both providers in parallel
      const [geminiResult, databricksResult] = await Promise.allSettled([
        this.generateWithGemini(request, this.buildAdvancedPrompt(request), this.modelCapabilities[1]),
        this.generateWithDatabricks(request, this.buildAdvancedPrompt(request), this.modelCapabilities[0])
      ]);

      if (geminiResult.status === 'fulfilled') {
        abTestResult.geminiResponse = geminiResult.value;
      }
      if (databricksResult.status === 'fulfilled') {
        abTestResult.databricksResponse = databricksResult.value;
      }

      this.abTestResults.push(abTestResult);

      // For now, return Gemini response if available, otherwise Databricks
      if (geminiResult.status === 'fulfilled') {
        return abTestResult.geminiResponse!;
      } else if (databricksResult.status === 'fulfilled') {
        return abTestResult.databricksResponse!;
      } else {
        throw new Error('Both providers failed in A/B test');
      }
    } catch (error) {
      console.error('A/B testing failed:', error);
      return this.generateWithFallback(request);
    }
  }

  private async generateWithDatabricks(request: AIRequest, prompt: string, model: ModelCapabilities): Promise<AIResponse> {
    try {
      const startTime = Date.now();
      const result = await databricksAIService.generateText(prompt, {
        maxTokens: request.maxTokens || model.maxTokens,
        temperature: request.temperature || 0.7
      });
      const endTime = Date.now();

      return {
        text: result,
        provider: 'databricks',
        model: model.model,
        tokens: this.estimateTokens(result),
        latency: endTime - startTime,
        cost: this.calculateCost(this.estimateTokens(result), model),
        quality: 'high',
        confidence: 0.9,
        usage: {
          promptTokens: this.estimateTokens(prompt),
          completionTokens: this.estimateTokens(result),
          totalTokens: this.estimateTokens(prompt) + this.estimateTokens(result)
        }
      };
    } catch (error) {
      console.error('Databricks generation failed:', error);
      throw error; // Re-throw to trigger fallback handling
    }
  }

  private async generateWithGemini(request: AIRequest, prompt: string, model: ModelCapabilities): Promise<AIResponse> {
    try {
      const startTime = Date.now();
      const geminiRequest: GeminiAIRequest = {
        prompt: prompt,
        genre: request.genre,
        authorStyle: request.authorStyle,
        context: request.context,
        maxTokens: request.maxTokens,
        temperature: request.temperature
      };

      const result = await geminiAIService.generateText(geminiRequest);
      const endTime = Date.now();

      return {
        text: result.content,
        provider: 'gemini',
        model: model.model,
        tokens: this.estimateTokens(result.content),
        latency: endTime - startTime,
        cost: this.calculateCost(this.estimateTokens(result.content), model),
        quality: 'high',
        confidence: 0.9,
        usage: result.usage
      };
    } catch (error) {
      console.error('Gemini generation failed:', error);
      throw error; // Re-throw to trigger fallback handling
    }
  }

  private async generateWithFallback(request: AIRequest): Promise<AIResponse> {
    const mockResponse = this.generateMockResponse(request);
    const tokens = this.estimateTokens(mockResponse);

    return {
      text: mockResponse,
      provider: 'fallback',
      model: 'mock-model',
      tokens,
      latency: 100,
      cost: 0,
      quality: 'medium',
      confidence: 0.5,
      usage: {
        promptTokens: this.estimateTokens(request.prompt),
        completionTokens: tokens,
        totalTokens: this.estimateTokens(request.prompt) + tokens
      }
    };
  }

  private buildPrompt(request: AIRequest): string {
    let prompt = request.prompt;
    
    if (request.context) {
      prompt = `Context: ${request.context}\n\n${prompt}`;
    }
    
    if (request.genre) {
      const genreAgent = this.getGenreAgent(request.genre);
      if (genreAgent) {
        prompt = `${genreAgent.systemPrompt}\n\n${prompt}`;
      }
    }
    
    return prompt;
  }

  private buildAdvancedPrompt(request: AIRequest): string {
    let prompt = this.buildPrompt(request);
    
    if (request.authorStyle) {
      prompt += `\n\nWrite in the style of: ${request.authorStyle}`;
    }
    
    if (request.taskType) {
      const taskInstructions = this.getTaskInstructions(request.taskType);
      prompt += `\n\n${taskInstructions}`;
    }
    
    return prompt;
  }

  private getGenreInstructions(genre: string): string {
    const genreAgent = this.getGenreAgent(genre);
    return genreAgent ? genreAgent.systemPrompt : '';
  }

  private getTaskInstructions(taskType: string): string {
    const instructions: Record<string, string> = {
      'creative': 'Focus on creative and imaginative content with vivid descriptions and engaging narrative.',
      'analytical': 'Provide detailed analysis with clear reasoning and supporting evidence.',
      'conversational': 'Write in a natural, conversational tone that feels personal and engaging.',
      'technical': 'Use precise technical language and provide clear, structured explanations.',
      'storytelling': 'Create compelling narratives with strong character development and plot progression.'
    };
    return instructions[taskType] || '';
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private generateMockResponse(request: AIRequest): string {
    const genre = request.genre || 'general';
    const mockResponses: Record<string, string> = {
      'sci-fi': `The story continued with a sense of wonder and technological marvel. The characters navigated through the complex world, their decisions shaping the future of humanity.`,
      'mystery': `The investigation deepened as new clues emerged, each revelation bringing the truth closer to the surface while maintaining the suspense that kept readers engaged.`,
      'romance': `The connection between the characters grew stronger, their emotions deepening as they faced challenges together, building toward a satisfying resolution.`,
      'historical': `The historical setting came alive with authentic details, transporting readers to a different time while maintaining the human drama that transcends eras.`,
      'contemporary': `The modern story unfolded with relatable characters facing contemporary challenges, their struggles and triumphs reflecting the complexities of today's world.`,
      'general': `The narrative flowed naturally, engaging readers with compelling characters and a well-structured plot that maintained interest throughout.`
    };
    
    return mockResponses[genre] || mockResponses['general'];
  }

  private inferCapability(prompt: string): AICapability {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('chapter') || lowerPrompt.includes('scene')) {
      return 'chapter-generation';
    }
    if (lowerPrompt.includes('rewrite') || lowerPrompt.includes('edit')) {
      return 'text-rewriting';
    }
    if (lowerPrompt.includes('style') || lowerPrompt.includes('tone')) {
      return 'style-analysis';
    }
    if (lowerPrompt.includes('framework') || lowerPrompt.includes('outline')) {
      return 'framework-guidance';
    }
    
    return 'sentence-completion';
  }

  async generateTextStream(request: AIRequest, onChunk: (chunk: string) => void): Promise<AIResponse> {
    await this.ensureInitialized();

    const startTime = Date.now();
    const selectedModel = this.selectOptimalModel(request);
    const enhancedPrompt = this.buildAdvancedPrompt(request);

    let response: AIResponse;
    let error: any;

    try {
      const provider = this.selectProvider();
      
      switch (provider) {
        case 'gemini':
          response = await this.generateStreamWithGemini(request, onChunk);
          break;
        case 'databricks':
          response = await this.generateStreamWithDatabricks(request, onChunk);
          break;
        default:
          throw new Error(`Unsupported streaming provider: ${provider}`);
      }
    } catch (err) {
      error = err;
      console.error(`Streaming generation failed:`, err);
      response = await this.generateStreamFallback(request, onChunk);
    }

    if (error && this.fallbackEnabled) {
      response = await this.handleStreamingFailure(request, selectedModel.provider, onChunk, error);
    }

    const endTime = Date.now();
    const latency = endTime - startTime;

    return {
      ...response,
      latency,
      cost: this.calculateCost(response.tokens, selectedModel),
      quality: this.assessResponseQuality(response.text, request).quality,
      confidence: this.assessResponseQuality(response.text, request).confidence
    };
  }

  private async generateStreamWithDatabricks(request: AIRequest, onChunk: (chunk: string) => void): Promise<AIResponse> {
    const startTime = Date.now();
    const result = await databricksAIService.generateText(this.buildAdvancedPrompt(request), {
      maxTokens: request.maxTokens || 2048,
      temperature: request.temperature || 0.7
    });
    const endTime = Date.now();

    // Simulate streaming by sending the result in chunks
    const words = result.split(' ');
    for (let i = 0; i < words.length; i++) {
      onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return {
      text: result,
      provider: 'databricks',
      model: 'llama-2-70b-chat',
      tokens: this.estimateTokens(result),
      latency: endTime - startTime,
      cost: this.calculateCost(this.estimateTokens(result), this.modelCapabilities[0]),
      quality: 'high',
      confidence: 0.9,
      usage: {
        promptTokens: this.estimateTokens(this.buildAdvancedPrompt(request)),
        completionTokens: this.estimateTokens(result),
        totalTokens: this.estimateTokens(this.buildAdvancedPrompt(request)) + this.estimateTokens(result)
      }
    };
  }

  private async generateStreamWithGemini(request: AIRequest, onChunk: (chunk: string) => void): Promise<AIResponse> {
    const startTime = Date.now();
    const geminiRequest: GeminiAIRequest = {
      prompt: this.buildAdvancedPrompt(request),
      genre: request.genre,
      authorStyle: request.authorStyle,
      context: request.context,
      maxTokens: request.maxTokens || 2048,
      temperature: request.temperature || 0.7
    };

    const result = await geminiAIService.streamGeneration(geminiRequest, onChunk);
    const endTime = Date.now();

    return {
      text: result.content,
      provider: 'gemini',
      model: 'gemini-pro',
      tokens: this.estimateTokens(result.content),
      latency: endTime - startTime,
      cost: this.calculateCost(this.estimateTokens(result.content), this.modelCapabilities[1]),
      quality: 'high',
      confidence: 0.9,
      usage: result.usage
    };
  }

  private async handleStreamingFailure(
    request: AIRequest, 
    failedProvider: string, 
    onChunk: (chunk: string) => void,
    error: any
  ): Promise<AIResponse> {
    console.error(`Streaming generation failed with ${failedProvider}:`, error);
    
    // Try alternative provider first
    if (failedProvider === 'gemini' && this.useDatabricks) {
      try {
        console.log('Falling back to Databricks streaming');
        return await this.generateStreamWithDatabricks(request, onChunk);
      } catch (databricksError) {
        console.error('Databricks streaming fallback also failed:', databricksError);
      }
    } else if (failedProvider === 'databricks' && this.useGemini) {
      try {
        console.log('Falling back to Gemini streaming');
        return await this.generateStreamWithGemini(request, onChunk);
      } catch (geminiError) {
        console.error('Gemini streaming fallback also failed:', geminiError);
      }
    }
    
    // Final fallback to mock streaming
    return this.generateStreamFallback(request, onChunk);
  }

  private async generateStreamFallback(request: AIRequest, onChunk: (chunk: string) => void): Promise<AIResponse> {
    const mockResponse = this.generateMockResponse(request);
    const words = mockResponse.split(' ');
    
    // Simulate streaming by sending words one by one
    for (let i = 0; i < words.length; i++) {
      onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between words
    }
    
    const tokens = this.estimateTokens(mockResponse);
    
    return {
      text: mockResponse,
      provider: 'fallback',
      model: 'mock-model',
      tokens,
      latency: 100,
      cost: 0,
      quality: 'medium',
      confidence: 0.5,
      usage: {
        promptTokens: this.estimateTokens(request.prompt),
        completionTokens: tokens,
        totalTokens: this.estimateTokens(request.prompt) + tokens
      }
    };
  }

  public async healthCheck(): Promise<{
    databricks: boolean;
    gemini: boolean;
    stability: boolean;
    azure: boolean;
    fallback: boolean;
    models: ModelCapabilities[];
  }> {
    await this.ensureInitialized();

    const healthResults = {
      databricks: false,
      gemini: false,
      stability: false,
      azure: false, // Azure AI was removed, always false
      fallback: true, // Fallback is always available
      models: this.getAvailableModels()
    };

    try {
      if (this.useDatabricks) {
        healthResults.databricks = await databricksAIService.healthCheck();
      }
    } catch (error) {
      console.error('Databricks health check failed:', error);
    }

    try {
      if (this.useGemini) {
        healthResults.gemini = await geminiAIService.healthCheck();
      }
    } catch (error) {
      console.error('Gemini health check failed:', error);
    }

    try {
      if (this.useStability) {
        healthResults.stability = await stabilityAIService.healthCheck();
      }
    } catch (error) {
      console.error('Stability health check failed:', error);
    }

    return healthResults;
  }

  public getAvailableModels(): ModelCapabilities[] {
    const availableModels = this.modelCapabilities.filter(model => {
      switch (model.provider) {
        case 'gemini': return this.useGemini;
        case 'databricks': return this.useDatabricks;
        default: return false;
      }
    });
    
    // If no models are available, return a fallback model
    if (availableModels.length === 0) {
      return [{
        provider: 'fallback',
        model: 'mock-model',
        maxTokens: 1000,
        supportsStreaming: false,
        costPer1kTokens: 0,
        avgLatency: 100,
        strengths: ['always available'],
        weaknesses: ['mock responses only']
      }];
    }
    
    return availableModels;
  }

  getGenreAgent(genreId: string): GenreAgent | null {
    return GENRE_AGENTS[genreId] || null;
  }

  getAllGenres(): GenreAgent[] {
    return Object.values(GENRE_AGENTS);
  }

  async generateImage(request: StabilityAIRequest): Promise<StabilityAIResponse> {
    if (!this.useStability) {
      throw new Error('Stability AI service not available');
    }
    return stabilityAIService.generateImage(request);
  }

  async generateBookCover(options: ImageGenerationOptions & { title: string }): Promise<StabilityAIResponse> {
    if (!this.useStability) {
      throw new Error('Stability AI service not available');
    }
    return stabilityAIService.generateBookCover(options);
  }

  async generateChapterHeader(options: ImageGenerationOptions & { title: string }): Promise<StabilityAIResponse> {
    if (!this.useStability) {
      throw new Error('Stability AI service not available');
    }
    return stabilityAIService.generateChapterHeader(options);
  }

  async generateSceneIllustration(options: ImageGenerationOptions): Promise<StabilityAIResponse> {
    if (!this.useStability) {
      throw new Error('Stability AI service not available');
    }
    return stabilityAIService.generateSceneIllustration(options);
  }

  generateImagePromptFromContent(content: string, genre?: string, type: 'cover' | 'chapter-header' | 'scene-illustration' = 'scene-illustration'): string {
    return stabilityAIService.generateImagePromptFromContent(content, genre, type);
  }

  hasStabilityAI(): boolean {
    return this.useStability;
  }

  get stabilityAIService() {
    return stabilityAIService;
  }

  setStabilityApiKey(key: string): void {
    stabilityAIService.setApiKey(key);
    this.useStability = true;
  }

  private selectOptimalModel(request: AIRequest): ModelCapabilities {
    const availableModels = this.getAvailableModels();
    
    if (availableModels.length === 0) {
      console.warn('No AI models available, using fallback');
      // Return a fallback model instead of throwing
      return {
        provider: 'fallback',
        model: 'mock-model',
        maxTokens: 1000,
        supportsStreaming: false,
        costPer1kTokens: 0,
        avgLatency: 100,
        strengths: ['always available'],
        weaknesses: ['mock responses only']
      };
    }

    // If user has a specific preference and it's available
    if (request.modelPreference && request.modelPreference !== 'auto') {
      const preferredModel = availableModels.find(m => m.provider === request.modelPreference);
      if (preferredModel) {
        return preferredModel;
      }
    }

    // Auto-selection based on request characteristics
    const capability = this.inferCapability(request.prompt);
    const isLongForm = request.prompt.length > 1000 || (request.maxTokens && request.maxTokens > 2000);
    const isCreative = request.genre === 'sci-fi' || request.genre === 'romance' || request.taskType === 'creative';

    // Prefer Databricks for long-form creative content
    if (isLongForm && isCreative) {
      const databricksModel = availableModels.find(m => m.provider === 'databricks');
      if (databricksModel) {
        return databricksModel;
      }
    }

    // Prefer Gemini for fast responses and general tasks
    const geminiModel = availableModels.find(m => m.provider === 'gemini');
    if (geminiModel) {
      return geminiModel;
    }

    // Fallback to first available model
    return availableModels[0];
  }

  private assessResponseQuality(response: string, request: AIRequest): { quality: 'high' | 'medium' | 'low', confidence: number } {
    // Simple quality assessment based on response characteristics
    const wordCount = response.split(' ').length;
    const hasProperStructure = response.includes('.') && response.length > 50;
    const matchesGenre = request.genre ? this.checkGenreAlignment(response, request.genre) : true;
    
    let quality: 'high' | 'medium' | 'low' = 'medium';
    let confidence = 0.5;

    if (wordCount > 100 && hasProperStructure && matchesGenre) {
      quality = 'high';
      confidence = 0.8;
    } else if (wordCount > 50 && hasProperStructure) {
      quality = 'medium';
      confidence = 0.6;
    } else {
      quality = 'low';
      confidence = 0.3;
    }

    return { quality, confidence };
  }

  private checkGenreAlignment(response: string, genre: string): boolean {
    const genreKeywords: Record<string, string[]> = {
      'sci-fi': ['technology', 'future', 'space', 'scientific', 'advanced'],
      'mystery': ['clue', 'investigation', 'suspense', 'mystery', 'detective'],
      'romance': ['love', 'relationship', 'emotion', 'heart', 'passion'],
      'historical': ['history', 'past', 'period', 'ancient', 'traditional'],
      'contemporary': ['modern', 'current', 'today', 'present', 'contemporary']
    };

    const keywords = genreKeywords[genre] || [];
    const responseLower = response.toLowerCase();
    return keywords.some(keyword => responseLower.includes(keyword));
  }

  private calculateCost(tokens: number, model: ModelCapabilities): number {
    return (tokens / 1000) * model.costPer1kTokens;
  }

  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

// Export singleton instance
export const aiService = new AIService(); 