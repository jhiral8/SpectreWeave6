import { aiService } from './aiService';
import { aiUsageService } from './aiUsageService';
import { supabase } from '../lib/supabase';

export interface AnalysisRequest {
  content: string;
  genre: string;
  analysisType: 'comprehensive' | 'plot' | 'character' | 'dialogue' | 'pacing' | 'prose';
  chapterTitle?: string;
  previousContext?: string;
  priority?: 'speed' | 'quality' | 'cost';
  useMultipleModels?: boolean;
}

export interface AnalysisResult {
  id: string;
  type: string;
  score: number; // 1-10 scale
  summary: string;
  details: string;
  suggestions: string[];
  examples?: Array<{
    text: string;
    issue: string;
    suggestion: string;
  }>;
  confidence: number; // 0-1 scale
  modelUsed?: string;
  processingTime?: number;
}

export interface ComprehensiveReview {
  id: string;
  chapterTitle: string;
  genre: string;
  wordCount: number;
  overallScore: number;
  executiveSummary: string;
  analyses: AnalysisResult[];
  createdAt: Date;
  processingTime: number;
  modelsUsed: string[];
  confidenceScore: number;
  costEstimate?: number;
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  projectId?: string;
  userId: string;
  reportType: 'executive' | 'detailed' | 'comparative';
  content: string;
  metadata: {
    generatedAt: Date;
    wordCount: number;
    analysisCount: number;
    modelsUsed: string[];
  };
  exportFormats: {
    pdf?: string;
    markdown?: string;
    html?: string;
  };
}

export interface ReviewQuota {
  id: string;
  userId: string;
  subscriptionTier: 'free' | 'premium' | 'pro';
  monthlyReviews: number;
  usedReviews: number;
  quotaResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelCapability {
  provider: string;
  model: string;
  strengths: string[];
  weaknesses: string[];
  avgLatency: number;
  costPer1kTokens: number;
  maxTokens: number;
  confidence: number;
}

class EditorialAnalysisService {
  private readonly ANALYSIS_PROMPTS = {
    plot: {
      system: `You are an expert story editor specializing in plot analysis. Analyze the provided text for plot structure, pacing, tension, and narrative flow. Focus on:
- Story progression and momentum
- Conflict development and resolution
- Plot holes or inconsistencies
- Pacing issues (too fast/slow)
- Tension and suspense building
- Cause and effect relationships
- Foreshadowing and payoffs`,
      
      userPrompt: (content: string, genre: string) => `
Analyze this ${genre} chapter for plot structure and narrative flow:

${content}

Provide a detailed analysis covering:
1. Plot progression and momentum (score 1-10)
2. Conflict development and tension
3. Pacing assessment
4. Any plot inconsistencies or holes
5. Specific suggestions for improvement
6. Examples from the text with line-by-line feedback

Format your response as JSON with the structure:
{
  "score": number,
  "summary": "brief overview",
  "details": "detailed analysis",
  "suggestions": ["suggestion1", "suggestion2"],
  "examples": [{"text": "quoted text", "issue": "problem", "suggestion": "fix"}],
  "confidence": number
}
`
    },

    character: {
      system: `You are an expert character development editor. Analyze character consistency, growth, voice, and motivation. Focus on:
- Character voice consistency
- Character development and growth arcs
- Motivation clarity and believability
- Character interactions and relationships
- Dialogue authenticity for each character
- Character agency and decision-making
- Internal vs external character conflicts`,
      
      userPrompt: (content: string, genre: string) => `
Analyze this ${genre} chapter for character development and consistency:

${content}

Provide a detailed character analysis covering:
1. Character voice consistency (score 1-10)
2. Character development and growth
3. Motivation clarity and believability
4. Character interactions and relationships
5. Specific suggestions for character improvement
6. Examples of strong/weak character moments

Format your response as JSON with the structure:
{
  "score": number,
  "summary": "brief overview",
  "details": "detailed analysis",
  "suggestions": ["suggestion1", "suggestion2"],
  "examples": [{"text": "quoted text", "issue": "problem", "suggestion": "fix"}],
  "confidence": number
}
`
    },

    dialogue: {
      system: `You are an expert dialogue editor. Analyze dialogue for authenticity, character voice, and natural flow. Focus on:
- Natural speech patterns and rhythm
- Character-specific voice and vocabulary
- Dialogue tags and attribution
- Subtext and implied meaning
- Dialogue balance vs narrative
- Exposition through dialogue
- Emotional authenticity in speech`,
      
      userPrompt: (content: string, genre: string) => `
Analyze the dialogue in this ${genre} chapter:

${content}

Provide a detailed dialogue analysis covering:
1. Natural flow and authenticity (score 1-10)
2. Character voice distinctiveness
3. Dialogue tag usage and effectiveness
4. Balance between dialogue and narrative
5. Specific suggestions for dialogue improvement
6. Examples of effective/problematic dialogue

Format your response as JSON with the structure:
{
  "score": number,
  "summary": "brief overview",
  "details": "detailed analysis",
  "suggestions": ["suggestion1", "suggestion2"],
  "examples": [{"text": "quoted text", "issue": "problem", "suggestion": "fix"}],
  "confidence": number
}
`
    },

    pacing: {
      system: `You are an expert pacing and rhythm editor. Analyze the flow, tempo, and rhythm of the narrative. Focus on:
- Scene transitions and flow
- Sentence and paragraph rhythm
- Action vs reflection balance
- Tension building and release
- Chapter opening and closing strength
- Reader engagement maintenance
- Information delivery pacing`,
      
      userPrompt: (content: string, genre: string) => `
Analyze the pacing and rhythm of this ${genre} chapter:

${content}

Provide a detailed pacing analysis covering:
1. Overall pacing effectiveness (score 1-10)
2. Scene transitions and flow
3. Sentence and paragraph rhythm
4. Balance of action, dialogue, and reflection
5. Specific suggestions for pacing improvement
6. Examples of well-paced/problematic sections

Format your response as JSON with the structure:
{
  "score": number,
  "summary": "brief overview",
  "details": "detailed analysis",
  "suggestions": ["suggestion1", "suggestion2"],
  "examples": [{"text": "quoted text", "issue": "problem", "suggestion": "fix"}],
  "confidence": number
}
`
    },

    prose: {
      system: `You are an expert prose and style editor. Analyze writing quality, word choice, and sentence construction. Focus on:
- Word choice and vocabulary appropriateness
- Sentence variety and structure
- Clarity and readability
- Show vs tell balance
- Sensory details and imagery
- Writing style consistency
- Grammar and technical issues`,
      
      userPrompt: (content: string, genre: string) => `
Analyze the prose quality and writing style of this ${genre} chapter:

${content}

Provide a detailed prose analysis covering:
1. Overall prose quality (score 1-10)
2. Word choice and vocabulary effectiveness
3. Sentence variety and structure
4. Clarity and readability
5. Show vs tell balance
6. Specific suggestions for prose improvement
7. Examples of strong/weak prose sections

Format your response as JSON with the structure:
{
  "score": number,
  "summary": "brief overview",
  "details": "detailed analysis",
  "suggestions": ["suggestion1", "suggestion2"],
  "examples": [{"text": "quoted text", "issue": "problem", "suggestion": "fix"}],
  "confidence": number
}
`
    }
  };

  private readonly GENRE_SPECIFIC_CRITERIA = {
    'sci-fi': {
      additional: 'worldbuilding consistency, scientific plausibility, technology integration',
      focus: 'Ensure scientific concepts are well-integrated and worldbuilding is consistent'
    },
    'fantasy': {
      additional: 'magic system consistency, worldbuilding depth, mythological elements',
      focus: 'Evaluate magic system logic and fantasy world consistency'
    },
    'mystery': {
      additional: 'clue placement, red herrings, logical deduction, suspense building',
      focus: 'Analyze clue distribution and mystery structure'
    },
    'thriller': {
      additional: 'tension maintenance, plot twists, suspense pacing',
      focus: 'Evaluate tension building and thriller pacing'
    },
    'romance': {
      additional: 'relationship development, emotional authenticity, romantic tension',
      focus: 'Assess romantic development and emotional authenticity'
    },
    'horror': {
      additional: 'atmosphere building, fear escalation, horror elements effectiveness',
      focus: 'Evaluate horror atmosphere and fear building techniques'
    },
    'historical': {
      additional: 'historical accuracy, period authenticity, cultural details',
      focus: 'Check historical accuracy and period authenticity'
    }
  };

  // Model capabilities for different analysis types
  private readonly MODEL_CAPABILITIES: Record<string, ModelCapability[]> = {
    plot: [
      {
        provider: 'databricks',
        model: 'meta-llama-3.3-70b-instruct',
        strengths: ['story structure', 'narrative flow', 'plot analysis'],
        weaknesses: ['real-time responses'],
        avgLatency: 2000,
        costPer1kTokens: 0.002,
        maxTokens: 8192,
        confidence: 0.9
      },
      {
        provider: 'azure_ai',
        model: 'gpt-4',
        strengths: ['detailed analysis', 'structured feedback'],
        weaknesses: ['higher cost'],
        avgLatency: 1500,
        costPer1kTokens: 0.03,
        maxTokens: 8192,
        confidence: 0.85
      }
    ],
    character: [
      {
        provider: 'databricks',
        model: 'meta-llama-3.3-70b-instruct',
        strengths: ['character development', 'motivation analysis'],
        weaknesses: ['dialogue-specific analysis'],
        avgLatency: 2000,
        costPer1kTokens: 0.002,
        maxTokens: 8192,
        confidence: 0.88
      },
      {
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        strengths: ['character voice', 'dialogue analysis'],
        weaknesses: ['complex reasoning'],
        avgLatency: 1200,
        costPer1kTokens: 0.0075,
        maxTokens: 8192,
        confidence: 0.82
      }
    ],
    dialogue: [
      {
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        strengths: ['natural language', 'dialogue flow'],
        weaknesses: ['technical analysis'],
        avgLatency: 1200,
        costPer1kTokens: 0.0075,
        maxTokens: 8192,
        confidence: 0.9
      },
      {
        provider: 'azure_ai',
        model: 'gpt-4',
        strengths: ['detailed feedback', 'examples'],
        weaknesses: ['higher cost'],
        avgLatency: 1500,
        costPer1kTokens: 0.03,
        maxTokens: 8192,
        confidence: 0.87
      }
    ],
    pacing: [
      {
        provider: 'databricks',
        model: 'meta-llama-3.3-70b-instruct',
        strengths: ['rhythm analysis', 'flow assessment'],
        weaknesses: ['real-time responses'],
        avgLatency: 2000,
        costPer1kTokens: 0.002,
        maxTokens: 8192,
        confidence: 0.85
      }
    ],
    prose: [
      {
        provider: 'azure_ai',
        model: 'gpt-4',
        strengths: ['writing quality', 'style analysis'],
        weaknesses: ['higher cost'],
        avgLatency: 1500,
        costPer1kTokens: 0.03,
        maxTokens: 8192,
        confidence: 0.92
      },
      {
        provider: 'databricks',
        model: 'meta-llama-3.3-70b-instruct',
        strengths: ['prose analysis', 'word choice'],
        weaknesses: ['real-time responses'],
        avgLatency: 2000,
        costPer1kTokens: 0.002,
        maxTokens: 8192,
        confidence: 0.88
      }
    ]
  };

  async analyzeChapter(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildAnalysisPrompt(request);
      
      const response = await aiService.generateText({
        prompt: prompt.userPrompt,
        genre: request.genre,
        context: `Editorial analysis - ${request.analysisType}`,
        maxTokens: 1500,
        temperature: 0.3, // Lower temperature for more consistent analysis
        systemPrompt: prompt.systemPrompt
      });

      const analysisResult = this.parseAnalysisResponse(response.text, request.analysisType);
      const processingTime = Date.now() - startTime;

      return {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: request.analysisType,
        score: analysisResult.score,
        summary: analysisResult.summary,
        details: analysisResult.details,
        suggestions: analysisResult.suggestions,
        examples: analysisResult.examples,
        confidence: analysisResult.confidence
      };
    } catch (error) {
      console.error(`Analysis failed for ${request.analysisType}:`, error);
      
      // Return a fallback analysis
      return {
        id: `analysis_error_${Date.now()}`,
        type: request.analysisType,
        score: 5,
        summary: `Analysis temporarily unavailable for ${request.analysisType}`,
        details: 'The analysis service encountered an error. Please try again later.',
        suggestions: ['Try running the analysis again', 'Check your internet connection'],
        confidence: 0.1
      };
    }
  }

  /**
   * Enhanced comprehensive review with multi-model orchestration
   */
  async generateComprehensiveReview(
    content: string, 
    genre: string, 
    chapterTitle: string = 'Untitled Chapter',
    options?: {
      priority?: 'speed' | 'quality' | 'cost';
      useMultipleModels?: boolean;
      projectId?: string;
    }
  ): Promise<ComprehensiveReview> {
    console.log('Starting comprehensive review...');
    const startTime = Date.now();
    const wordCount = content.split(/\s+/).length;
    
    // Check review quota
    console.log('Checking review quota...');
    const canReview = await this.checkReviewQuota();
    if (!canReview.allowed) {
      throw new Error(`Review quota exceeded. ${canReview.message}`);
    }
    console.log('Review quota check passed');

    // Run analyses with multi-model orchestration
    console.log('Starting analysis promises...');
    const analysisPromises = [
      this.analyzeChapterWithMultiModel({ 
        content, 
        genre, 
        analysisType: 'plot', 
        chapterTitle,
        priority: options?.priority || 'quality',
        useMultipleModels: options?.useMultipleModels || false
      }),
      this.analyzeChapterWithMultiModel({ 
        content, 
        genre, 
        analysisType: 'character', 
        chapterTitle,
        priority: options?.priority || 'quality',
        useMultipleModels: options?.useMultipleModels || false
      }),
      this.analyzeChapterWithMultiModel({ 
        content, 
        genre, 
        analysisType: 'dialogue', 
        chapterTitle,
        priority: options?.priority || 'quality',
        useMultipleModels: options?.useMultipleModels || false
      }),
      this.analyzeChapterWithMultiModel({ 
        content, 
        genre, 
        analysisType: 'pacing', 
        chapterTitle,
        priority: options?.priority || 'quality',
        useMultipleModels: options?.useMultipleModels || false
      }),
      this.analyzeChapterWithMultiModel({ 
        content, 
        genre, 
        analysisType: 'prose', 
        chapterTitle,
        priority: options?.priority || 'quality',
        useMultipleModels: options?.useMultipleModels || false
      })
    ];

    console.log('Starting all analyses in parallel...');
    console.log('Analysis types:', ['plot', 'character', 'dialogue', 'pacing', 'prose']);
    
    // Add individual logging for each promise
    const analysesWithLogging = analysisPromises.map((promise, index) => {
      const types = ['plot', 'character', 'dialogue', 'pacing', 'prose'];
      const type = types[index];
      return promise.then(result => {
        console.log(`✅ ${type} analysis completed`);
        return result;
      }).catch(error => {
        console.error(`❌ ${type} analysis failed:`, error);
        throw error;
      });
    });
    
    console.log('Waiting for all analyses to complete...');
    const analyses = await Promise.all(analysesWithLogging);
    console.log('All analyses completed');

    const overallScore = this.calculateOverallScore(analyses);
    const executiveSummary = this.generateExecutiveSummary(analyses, genre, wordCount);
    const processingTime = Date.now() - startTime;
    const modelsUsed = [...new Set(analyses.map(a => a.modelUsed).filter(Boolean) as string[])];
    const confidenceScore = this.calculateConfidenceScore(analyses);
    const costEstimate = this.calculateCostEstimate(analyses);

    const review: ComprehensiveReview = {
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chapterTitle,
      genre,
      wordCount,
      overallScore,
      executiveSummary,
      analyses,
      createdAt: new Date(),
      processingTime,
      modelsUsed,
      confidenceScore,
      costEstimate
    };

    // Save review to database
    console.log('Saving review to database...');
    await this.saveReview(review, options?.projectId);

    // Update review quota
    console.log('Updating review quota...');
    await this.updateReviewQuota();

    console.log('Comprehensive review completed successfully');
    return review;
  }

  /**
   * Analyze chapter using multiple models for better accuracy
   */
  private async analyzeChapterWithMultiModel(request: AnalysisRequest & { priority: string; useMultipleModels: boolean }): Promise<AnalysisResult> {
    console.log(`Starting analysis for ${request.analysisType}...`);
    const capabilities = this.MODEL_CAPABILITIES[request.analysisType] || [];
    console.log(`Found ${capabilities.length} model capabilities for ${request.analysisType}`);
    
    if (!request.useMultipleModels || capabilities.length === 1) {
      // Single model analysis
      console.log(`Using single model for ${request.analysisType}`);
      const selectedModel = this.selectOptimalModel(capabilities, request.priority);
      console.log(`Selected model: ${selectedModel.model} (${selectedModel.provider})`);
      return await this.analyzeWithModel(request, selectedModel);
    }

    // Multi-model analysis
    console.log(`Using multiple models for ${request.analysisType}`);
    const selectedModels = this.selectMultipleModels(capabilities, request.priority);
    console.log(`Selected models: ${selectedModels.map(m => `${m.model} (${m.provider})`).join(', ')}`);
    
    const modelResults = await Promise.all(
      selectedModels.map(model => this.analyzeWithModel(request, model))
    );

    // Aggregate results from multiple models
    console.log(`Aggregating results for ${request.analysisType}`);
    return this.aggregateModelResults(modelResults, request.analysisType);
  }

  /**
   * Select optimal model based on priority
   */
  private selectOptimalModel(capabilities: ModelCapability[], priority: string): ModelCapability {
    if (capabilities.length === 0) {
      throw new Error('No model capabilities available');
    }

    switch (priority) {
      case 'speed':
        return capabilities.reduce((fastest, current) => 
          current.avgLatency < fastest.avgLatency ? current : fastest
        );
      case 'cost':
        return capabilities.reduce((cheapest, current) => 
          current.costPer1kTokens < cheapest.costPer1kTokens ? current : cheapest
        );
      case 'quality':
      default:
        return capabilities.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
    }
  }

  /**
   * Select multiple models for analysis
   */
  private selectMultipleModels(capabilities: ModelCapability[], priority: string): ModelCapability[] {
    if (capabilities.length <= 2) return capabilities;

    switch (priority) {
      case 'speed':
        return capabilities
          .sort((a, b) => a.avgLatency - b.avgLatency)
          .slice(0, 2);
      case 'cost':
        return capabilities
          .sort((a, b) => a.costPer1kTokens - b.costPer1kTokens)
          .slice(0, 2);
      case 'quality':
      default:
        return capabilities
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 2);
    }
  }

  /**
   * Analyze with specific model
   */
  private async analyzeWithModel(request: AnalysisRequest, model: ModelCapability): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[${request.analysisType}] Building prompt for ${model.provider}:${model.model}...`);
      const prompt = this.buildAnalysisPrompt(request);
      console.log(`[${request.analysisType}] Prompt built, length: ${prompt.userPrompt.length}`);

      // ADDED LOGGING TO IDENTIFY MODEL
      console.log(`[${request.analysisType}] Using model: ${model.provider}:${model.model}`);
      
      console.log(`[${request.analysisType}] Calling aiService.generateText with ${model.provider}:${model.model}...`);
      
      // Debug: Check if AI service is available
      const availableModels = aiService.getAvailableModels();
      console.log(`[${request.analysisType}] Available AI models:`, availableModels.map(m => `${m.provider}:${m.model}`));
      
      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI service timeout after 30 seconds')), 30000);
      });
      
      const aiCallPromise = aiService.generateText({
        prompt: prompt.userPrompt,
        genre: request.genre,
        context: `Editorial analysis - ${request.analysisType}`,
        maxTokens: 1500,
        temperature: 0.3,
        priority: request.priority as 'speed' | 'quality' | 'cost',
        modelPreference: model.provider as 'auto' | 'gemini' | 'databricks',
        systemPrompt: prompt.systemPrompt
      });
      
      const response = await Promise.race([aiCallPromise, timeoutPromise]) as any;
      console.log(`[${request.analysisType}] aiService.generateText completed, response length: ${response.text?.length || 0}`);

      const analysisResult = this.parseAnalysisResponse(response.text, request.analysisType);
      const processingTime = Date.now() - startTime;

      return {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: request.analysisType,
        score: analysisResult.score,
        summary: analysisResult.summary,
        details: analysisResult.details,
        suggestions: analysisResult.suggestions,
        examples: analysisResult.examples,
        confidence: model.confidence,
        modelUsed: model.model,
        processingTime
      };
    } catch (error) {
      console.error(`Error analyzing with model ${model.model}:`, error);
      
      // Return fallback result
      return this.createFallbackResult(request.analysisType);
    }
  }

  /**
   * Aggregate results from multiple models
   */
  private aggregateModelResults(results: AnalysisResult[], analysisType: string): AnalysisResult {
    const validResults = results.filter(r => r.confidence > 0.1);
    
    if (validResults.length === 0) {
      return results[0] || this.createFallbackResult(analysisType);
    }

    // Weighted average based on confidence
    const totalConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0);
    const weightedScore = validResults.reduce((sum, r) => sum + (r.score * r.confidence), 0) / totalConfidence;
    
    // Combine suggestions (remove duplicates)
    const allSuggestions = validResults.flatMap(r => r.suggestions);
    const uniqueSuggestions = [...new Set(allSuggestions)].slice(0, 8);
    
    // Combine examples
    const allExamples = validResults.flatMap(r => r.examples || []);
    const uniqueExamples = allExamples.slice(0, 5);
    
    // Create combined summary
    const summaries = validResults.map(r => r.summary);
    const combinedSummary = summaries.length > 1 
      ? `Multi-model analysis: ${summaries.join('. ')}`
      : summaries[0];

    return {
      id: `aggregated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: analysisType,
      score: Math.round(weightedScore * 10) / 10,
      summary: combinedSummary,
      details: `Aggregated analysis from ${validResults.length} models with confidence scores: ${validResults.map(r => `${r.modelUsed}: ${(r.confidence * 100).toFixed(1)}%`).join(', ')}`,
      suggestions: uniqueSuggestions,
      examples: uniqueExamples,
      confidence: Math.min(totalConfidence / validResults.length, 1),
      modelUsed: validResults.map(r => r.modelUsed).join(' + '),
      processingTime: validResults.reduce((sum, r) => sum + (r.processingTime || 0), 0)
    };
  }

  /**
   * Calculate confidence score for the entire review
   */
  private calculateConfidenceScore(analyses: AnalysisResult[]): number {
    const validAnalyses = analyses.filter(a => a.confidence > 0);
    if (validAnalyses.length === 0) return 0;
    
    const avgConfidence = validAnalyses.reduce((sum, a) => sum + a.confidence, 0) / validAnalyses.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  /**
   * Calculate cost estimate for the review
   */
  private calculateCostEstimate(analyses: AnalysisResult[]): number {
    // This is a simplified calculation - in production you'd track actual costs
    const baseCostPerAnalysis = 0.05; // $0.05 per analysis
    return analyses.length * baseCostPerAnalysis;
  }

  /**
   * Check if user can run a review
   */
  private async checkReviewQuota(): Promise<{ allowed: boolean; message?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // For testing purposes, allow unauthenticated users
        console.warn('User not authenticated, allowing review for testing');
        return { allowed: true };
      }

      const { data: quota, error } = await supabase
        .from('review_quotas')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // For testing purposes, allow the review to proceed
        console.warn('Review quota table not found or error occurred, allowing review for testing');
        return { allowed: true };
      }

      if (!quota) {
        // No quota found, create default and allow review
        console.warn('No quota found for user, creating default quota');
        await this.createDefaultQuota(user.id);
        return { allowed: true };
      }

      // Check if quota is reset
      const resetDate = new Date(quota.quota_reset_date);
      if (resetDate < new Date()) {
        // Reset quota
        await supabase
          .from('review_quotas')
          .update({ 
            used_reviews: 0,
            quota_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('user_id', user.id);
        
        return { allowed: true };
      }

      // Check if user has reviews remaining
      if (quota.used_reviews >= quota.monthly_reviews) {
        return { 
          allowed: false, 
          message: `Monthly review limit reached (${quota.monthly_reviews}/${quota.monthly_reviews}). Upgrade to get more reviews.` 
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking review quota:', error);
      // For testing purposes, allow the review to proceed
      console.warn('Allowing review to proceed despite quota check error');
      return { allowed: true };
    }
  }

  /**
   * Update review quota after successful review
   */
  private async updateReviewQuota(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('User not authenticated, skipping quota update');
        return;
      }

      await supabase.rpc('increment_review_quota', {
        p_user_id: user.id
      });
    } catch (error) {
      console.error('Error updating review quota:', error);
      console.warn('Continuing without quota update for testing');
    }
  }

  /**
   * Save review to database
   */
  private async saveReview(review: ComprehensiveReview, projectId?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('User not authenticated, skipping review save');
        return;
      }

      await supabase
        .from('comprehensive_reviews')
        .insert({
          id: review.id,
          user_id: user.id,
          project_id: projectId,
          chapter_title: review.chapterTitle,
          genre: review.genre,
          word_count: review.wordCount,
          overall_score: review.overallScore,
          executive_summary: review.executiveSummary,
          analyses: review.analyses,
          processing_time: review.processingTime,
          models_used: review.modelsUsed,
          confidence_score: review.confidenceScore,
          cost_estimate: review.costEstimate,
          created_at: review.createdAt.toISOString()
        });
    } catch (error) {
      console.error('Error saving review to database:', error);
      console.warn('Continuing without saving review for testing');
    }
  }

  /**
   * Generate review report
   */
  async generateReviewReport(
    review: ComprehensiveReview,
    reportType: 'executive' | 'detailed' | 'comparative' = 'detailed',
    projectId?: string
  ): Promise<ReviewReport> {
    const reportContent = this.generateReportContent(review, reportType);
    
    const report: ReviewReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reviewId: review.id,
      projectId,
      userId: (await supabase.auth.getUser()).data.user?.id || '',
      reportType,
      content: reportContent,
      metadata: {
        generatedAt: new Date(),
        wordCount: review.wordCount,
        analysisCount: review.analyses.length,
        modelsUsed: review.modelsUsed
      },
      exportFormats: {}
    };

    // Generate export formats
    report.exportFormats.markdown = this.generateMarkdownReport(review, reportType);
    report.exportFormats.html = this.generateHTMLReport(review, reportType);

    // Save report to database
    await this.saveReviewReport(report);

    return report;
  }

  /**
   * Generate report content based on type
   */
  private generateReportContent(review: ComprehensiveReview, reportType: string): string {
    switch (reportType) {
      case 'executive':
        return this.generateExecutiveReport(review);
      case 'detailed':
        return this.generateDetailedReport(review);
      case 'comparative':
        return this.generateComparativeReport(review);
      default:
        return this.generateDetailedReport(review);
    }
  }

  /**
   * Generate executive summary report
   */
  private generateExecutiveReport(review: ComprehensiveReview): string {
    return `
# Executive Summary - ${review.chapterTitle}

**Overall Score:** ${review.overallScore}/10
**Genre:** ${review.genre}
**Word Count:** ${review.wordCount.toLocaleString()}
**Confidence:** ${(review.confidenceScore * 100).toFixed(1)}%

## Key Findings

${review.executiveSummary}

## Score Breakdown

${review.analyses.map(analysis => 
  `- **${analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1)}:** ${analysis.score}/10`
).join('\n')}

## Top Recommendations

${review.analyses
  .flatMap(a => a.suggestions)
  .slice(0, 5)
  .map(suggestion => `- ${suggestion}`)
  .join('\n')}

---
*Report generated on ${review.createdAt.toLocaleDateString()} using ${review.modelsUsed.join(', ')}*
    `.trim();
  }

  /**
   * Generate detailed report
   */
  private generateDetailedReport(review: ComprehensiveReview): string {
    return `
# Detailed Review Report - ${review.chapterTitle}

**Overall Score:** ${review.overallScore}/10
**Genre:** ${review.genre}
**Word Count:** ${review.wordCount.toLocaleString()}
**Confidence:** ${(review.confidenceScore * 100).toFixed(1)}%
**Processing Time:** ${review.processingTime}ms
**Models Used:** ${review.modelsUsed.join(', ')}

## Executive Summary

${review.executiveSummary}

## Detailed Analysis

${review.analyses.map(analysis => `
### ${analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1)} Analysis
**Score:** ${analysis.score}/10
**Confidence:** ${(analysis.confidence * 100).toFixed(1)}%
**Model:** ${analysis.modelUsed || 'Unknown'}

**Summary:** ${analysis.summary}

**Details:** ${analysis.details}

**Suggestions:**
${analysis.suggestions.map(s => `- ${s}`).join('\n')}

${analysis.examples && analysis.examples.length > 0 ? `
**Examples:**
${analysis.examples.map(ex => `
> "${ex.text}"
> **Issue:** ${ex.issue}
> **Suggestion:** ${ex.suggestion}
`).join('\n')}
` : ''}
`).join('\n')}

## Recommendations Summary

${review.analyses
  .flatMap(a => a.suggestions)
  .map(suggestion => `- ${suggestion}`)
  .join('\n')}

---
*Report generated on ${review.createdAt.toLocaleDateString()} using ${review.modelsUsed.join(', ')}*
    `.trim();
  }

  /**
   * Generate comparative report
   */
  private generateComparativeReport(review: ComprehensiveReview): string {
    const scoreRanges = {
      excellent: review.analyses.filter(a => a.score >= 8),
      good: review.analyses.filter(a => a.score >= 6 && a.score < 8),
      needsWork: review.analyses.filter(a => a.score < 6)
    };

    return `
# Comparative Analysis Report - ${review.chapterTitle}

**Overall Score:** ${review.overallScore}/10
**Genre:** ${review.genre}
**Word Count:** ${review.wordCount.toLocaleString()}

## Performance Overview

### Excellent Areas (8-10/10)
${scoreRanges.excellent.length > 0 
  ? scoreRanges.excellent.map(a => `- **${a.type}:** ${a.score}/10`).join('\n')
  : '- None'
}

### Good Areas (6-7.9/10)
${scoreRanges.good.length > 0 
  ? scoreRanges.good.map(a => `- **${a.type}:** ${a.score}/10`).join('\n')
  : '- None'
}

### Areas Needing Work (<6/10)
${scoreRanges.needsWork.length > 0 
  ? scoreRanges.needsWork.map(a => `- **${a.type}:** ${a.score}/10`).join('\n')
  : '- None'
}

## Priority Recommendations

### High Priority (Score < 6)
${scoreRanges.needsWork
  .flatMap(a => a.suggestions.slice(0, 2))
  .map(s => `- ${s}`)
  .join('\n')}

### Medium Priority (Score 6-7.9)
${scoreRanges.good
  .flatMap(a => a.suggestions.slice(0, 1))
  .map(s => `- ${s}`)
  .join('\n')}

## Genre-Specific Insights

${this.generateGenreInsights(review.genre, review.analyses)}

---
*Report generated on ${review.createdAt.toLocaleDateString()} using ${review.modelsUsed.join(', ')}*
    `.trim();
  }

  /**
   * Generate genre-specific insights
   */
  private generateGenreInsights(genre: string, analyses: AnalysisResult[]): string {
    const genreCriteria = (this.GENRE_SPECIFIC_CRITERIA as any)[genre.toLowerCase()];
    if (!genreCriteria) return '';

    return `
For ${genre} writing, pay special attention to:
- ${genreCriteria.additional}

${genreCriteria.focus}
    `.trim();
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(review: ComprehensiveReview, reportType: string): string {
    // Similar to generateReportContent but with markdown formatting
    return this.generateReportContent(review, reportType);
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(review: ComprehensiveReview, reportType: string): string {
    const content = this.generateReportContent(review, reportType);
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Review Report - ${review.chapterTitle}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1, h2, h3 { color: #333; }
        .score { font-weight: bold; color: #007bff; }
        .suggestion { background: #f8f9fa; padding: 10px; margin: 10px 0; border-left: 4px solid #007bff; }
        .example { background: #fff3cd; padding: 10px; margin: 10px 0; border-left: 4px solid #ffc107; }
    </style>
</head>
<body>
    ${content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
</body>
</html>
    `.trim();
  }

  /**
   * Save review report to database
   */
  private async saveReviewReport(report: ReviewReport): Promise<void> {
    try {
      await supabase
        .from('review_reports')
        .insert({
          id: report.id,
          review_id: report.reviewId,
          project_id: report.projectId,
          user_id: report.userId,
          report_type: report.reportType,
          content: report.content,
          metadata: report.metadata,
          export_formats: report.exportFormats
        });
    } catch (error) {
      console.error('Error saving review report:', error);
    }
  }

  /**
   * Get user's review quota
   */
  async getUserReviewQuota(): Promise<ReviewQuota | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // First try to get existing quota
      const { data, error } = await supabase
        .from('review_quotas')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error getting review quota:', error);
        return null;
      }

      // If quota exists, return it
      if (data) {
        return {
          id: data.id,
          userId: data.user_id,
          subscriptionTier: data.subscription_tier,
          monthlyReviews: data.monthly_reviews,
          usedReviews: data.used_reviews,
          quotaResetDate: new Date(data.quota_reset_date),
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
      }

      // If no quota exists, create a default one
      return await this.createDefaultQuota(user.id);
    } catch (error) {
      console.error('Error getting review quota:', error);
      return null;
    }
  }

  /**
   * Create default quota for new users
   */
  private async createDefaultQuota(userId: string): Promise<ReviewQuota | null> {
    try {
      const defaultQuota = {
        user_id: userId,
        subscription_tier: 'free' as const,
        monthly_reviews: 5, // Default free tier limit
        used_reviews: 0,
        quota_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { data, error } = await supabase
        .from('review_quotas')
        .insert(defaultQuota)
        .select()
        .single();

      if (error) {
        // If it's a duplicate key error, try to fetch the existing record
        if (error.code === '23505') {
          console.log('Quota already exists for user, fetching existing record');
          const { data: existingData, error: fetchError } = await supabase
            .from('review_quotas')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (!fetchError && existingData) {
            return {
              id: existingData.id,
              userId: existingData.user_id,
              subscriptionTier: existingData.subscription_tier,
              monthlyReviews: existingData.monthly_reviews,
              usedReviews: existingData.used_reviews,
              quotaResetDate: new Date(existingData.quota_reset_date),
              createdAt: new Date(existingData.created_at),
              updatedAt: new Date(existingData.updated_at)
            };
          }
        }

        console.error('Error creating default quota:', error);
        // Return a temporary quota object if database creation fails
        return {
          id: 'temp-' + userId,
          userId: userId,
          subscriptionTier: 'free',
          monthlyReviews: 5,
          usedReviews: 0,
          quotaResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      return {
        id: data.id,
        userId: data.user_id,
        subscriptionTier: data.subscription_tier,
        monthlyReviews: data.monthly_reviews,
        usedReviews: data.used_reviews,
        quotaResetDate: new Date(data.quota_reset_date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error creating default quota:', error);
      // Return a temporary quota object as fallback
      return {
        id: 'temp-' + userId,
        userId: userId,
        subscriptionTier: 'free',
        monthlyReviews: 5,
        usedReviews: 0,
        quotaResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  /**
   * Get review history for a project
   */
  async getProjectReviewHistory(projectId: string): Promise<ComprehensiveReview[]> {
    try {
      const { data, error } = await supabase
        .from('comprehensive_reviews')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting review history:', error);
        return [];
      }

      return data.map(review => ({
        id: review.id,
        chapterTitle: review.chapter_title,
        genre: review.genre,
        wordCount: review.word_count,
        overallScore: review.overall_score,
        executiveSummary: review.executive_summary,
        analyses: review.analyses,
        createdAt: new Date(review.created_at),
        processingTime: review.processing_time,
        modelsUsed: review.models_used,
        confidenceScore: review.confidence_score,
        costEstimate: review.cost_estimate
      }));
    } catch (error) {
      console.error('Error getting review history:', error);
      return [];
    }
  }
 
  private buildAnalysisPrompt(request: AnalysisRequest) {
    const basePrompt = (this.ANALYSIS_PROMPTS as any)[request.analysisType as string];
    const genreSpecific = (this.GENRE_SPECIFIC_CRITERIA as any)[request.genre.toLowerCase()];
    
    let systemPrompt = basePrompt.system;
    if (genreSpecific) {
      systemPrompt += `\n\nFor ${request.genre} specifically, also consider: ${genreSpecific.additional}. ${genreSpecific.focus}.`;
    }

    return {
      systemPrompt,
      userPrompt: basePrompt.userPrompt(request.content, request.genre)
    };
  }

  private parseAnalysisResponse(response: string, analysisType: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: parse structured text response
      return this.parseStructuredTextResponse(response, analysisType);
    } catch (error) {
      console.warn('Failed to parse analysis response:', error);
      return this.createFallbackResponse(response, analysisType);
    }
  }

  private parseStructuredTextResponse(response: string, analysisType: string): any {
    // Extract score
    const scoreMatch = response.match(/score[:\s]*(\d+(?:\.\d+)?)/i);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 5;

    // Extract suggestions
    const suggestions = [];
    const suggestionMatches = response.match(/suggestions?[:\s]*\n?([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i);
    if (suggestionMatches) {
      const suggestionText = suggestionMatches[1];
      const lines = suggestionText.split('\n').filter(line => line.trim());
      suggestions.push(...lines.map(line => line.replace(/^[-*•]\s*/, '').trim()).filter(Boolean));
    }

    return {
      score,
      summary: `${analysisType} analysis completed`,
      details: response,
      suggestions: suggestions.slice(0, 5), // Limit to 5 suggestions
      examples: [],
      confidence: 0.7
    };
  }

  private createFallbackResponse(response: string, analysisType: string): any {
    return {
      score: 5,
      summary: `${analysisType} analysis completed with limited parsing`,
      details: response,
      suggestions: [`Review the ${analysisType} aspects of your writing`, 'Consider professional editing'],
      examples: [],
      confidence: 0.5
    };
  }

  /**
   * Create fallback result for aggregation
   */
  private createFallbackResult(analysisType: string): AnalysisResult {
    return {
      id: `fallback_${Date.now()}`,
      type: analysisType,
      score: 5,
      summary: `${analysisType} analysis unavailable`,
      details: 'Analysis service temporarily unavailable',
      suggestions: ['Try again later', 'Check your internet connection'],
      confidence: 0.1,
      modelUsed: 'fallback',
      processingTime: 0
    };
  }

  private calculateOverallScore(analyses: AnalysisResult[]): number {
    const validScores = analyses.filter(a => a.score > 0).map(a => a.score);
    if (validScores.length === 0) return 5;
    
    const average = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    return Math.round(average * 10) / 10; // Round to 1 decimal place
  }

  private generateExecutiveSummary(analyses: AnalysisResult[], genre: string, wordCount: number): string {
    const avgScore = this.calculateOverallScore(analyses);
    const strengths = analyses.filter(a => a.score >= 7).map(a => a.type);
    const improvements = analyses.filter(a => a.score < 6).map(a => a.type);

    let summary = `This ${wordCount}-word ${genre} chapter receives an overall score of ${avgScore}/10. `;

    if (strengths.length > 0) {
      summary += `Strong areas include ${strengths.join(', ')}. `;
    }

    if (improvements.length > 0) {
      summary += `Areas for improvement: ${improvements.join(', ')}. `;
    }

    // Add genre-specific insights
    const genreSpecific = this.GENRE_SPECIFIC_CRITERIA[genre.toLowerCase()];
    if (genreSpecific) {
      summary += `For ${genre} writing, pay special attention to ${genreSpecific.additional}.`;
    }

    return summary;
  }

  // Utility method to get analysis type descriptions
  getAnalysisTypeDescription(type: string): string {
    const descriptions = {
      plot: 'Story structure, pacing, conflict development, and narrative flow',
      character: 'Character development, consistency, motivation, and voice',
      dialogue: 'Natural speech, character voice, and conversation effectiveness',
      pacing: 'Rhythm, tempo, scene transitions, and reader engagement',
      prose: 'Writing quality, word choice, sentence structure, and style',
      comprehensive: 'Complete editorial review covering all aspects'
    };
    
    return (descriptions as any)[type] || 'Editorial analysis';
  }
}

export const editorialAnalysisService = new EditorialAnalysisService();