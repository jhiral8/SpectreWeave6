/**
 * Advanced AI Context for SpectreWeave5
 * 
 * Comprehensive AI state management system that integrates:
 * - Multi-provider AI orchestration
 * - SpectreWeaveAIAlgorithm bridge for advanced features
 * - Real-time smart suggestions
 * - Feedback and analysis systems
 * - Cost optimization and analytics
 * - Session management and history
 * - User preferences and customization
 */

'use client';

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useEffect, 
  useRef,
  ReactNode,
} from 'react';

import { 
  AIProvider, 
  AIRequest, 
  AIResponse, 
  AIContext as AIContextData,
  AIFeedback,
  AISuggestion,
  AIGeneration,
  AIUserPreferences,
  AIServiceState,
  AIEvent,
  AIEventType,
  SmartSuggestionConfig,
  SmartSuggestion,
  AIGenerationOptions,
  AISession,
  AIAnalytics,
  AIRateLimit,
  AICapability,
} from './types';

import { AdvancedAIServiceManager } from './advancedAIServiceManager';
import { 
  SpectreWeaveAIBridge,
  spectreWeaveAIBridge,
  ChapterGenerationRequest,
  ChapterGenerationProgress,
  ChapterGenerationResult,
  StyleProfile,
  NovelFramework,
} from './spectreWeaveAIBridge';

import { 
  RAGSystem,
  ragSystem,
  NovelFramework as LocalNovelFramework,
  SearchOptions,
  SearchResult,
  RelevantContext,
  ContextRetrievalOptions,
} from './ragSystem';

// Enhanced context interface that includes bridge features
interface AdvancedAIContextType {
  // State
  selectedGenre: string | null;
  selectedAuthors: string[];
  customPrompts: AIPrompt[];
  generations: AIGeneration[];
  feedback: AIFeedback[];
  suggestions: AISuggestion[];
  smartSuggestions: SmartSuggestion[];
  isGenerating: boolean;
  generationProgress: number;
  currentSession: AISession | null;
  userPreferences: AIUserPreferences;
  serviceState: AIServiceState | null;
  analytics: AIAnalytics | null;
  suggestionConfig: SmartSuggestionConfig;
  
  // Bridge-specific state
  styleProfiles: StyleProfile[];
  novelFrameworks: NovelFramework[];
  chapterGenerationHistory: any[];
  providerAnalytics: any;
  isConnectedToBridge: boolean;
  bridgeHealth: boolean;
  useGraphRAGContext?: boolean;
  setUseGraphRAGContext?: (enabled: boolean) => void;
  // Chapter generation pipeline visibility
  isChapterGenerating: boolean;
  pipelineView: { name: string; steps: Array<{ role: string; name?: string }> } | null;
  currentAgent: string | null;
  pipelineProgress: number;
  
  // Basic AI Operations
  generateText: (prompt: string, options?: AIGenerationOptions) => Promise<AIResponse<string>>;
  generateStream: (prompt: string, options?: AIGenerationOptions, onChunk?: (chunk: string) => void) => Promise<AIResponse<string>>;
  generateFeedback: (content: string, context?: AIContextData) => Promise<AIFeedback[]>;
  generateSuggestions: (content: string, context?: AIContextData) => Promise<AISuggestion[]>;
  
  // Advanced AI Operations (via bridge)
  generateChapter: (request: ChapterGenerationRequest, novelFrameworkId?: string, onProgress?: (progress: ChapterGenerationProgress) => void) => Promise<ChapterGenerationResult>;
  generateWithStyleProfile: (prompt: string, styleProfileId: string, options?: AIGenerationOptions) => Promise<AIResponse<string>>;
  analyzeTextStyle: (text: string) => Promise<any>;
  
  // Smart Suggestions
  generateSmartSuggestions: (content: string, cursorPosition: number, context: AIContextData) => Promise<SmartSuggestion[]>;
  updateSmartSuggestions: (suggestions: SmartSuggestion[]) => void;
  updateSuggestionConfig: (config: Partial<SmartSuggestionConfig>) => void;
  
  // Session Management
  startSession: (projectId?: string, documentId?: string) => void;
  endSession: () => void;
  
  // History Management
  addGeneration: (generation: AIGeneration) => void;
  clearGenerations: () => void;
  getGenerationHistory: (limit?: number) => AIGeneration[];
  
  // Feedback Management
  addFeedback: (feedback: AIFeedback) => void;
  updateFeedback: (id: string, updates: Partial<AIFeedback>) => void;
  resolveFeedback: (id: string) => void;
  clearFeedback: () => void;
  
  // Suggestion Management
  addSuggestion: (suggestion: AISuggestion) => void;
  applySuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  clearSuggestions: () => void;
  
  // Bridge-specific operations
  createStyleProfile: (name: string, description: string, textSamples: string[]) => Promise<StyleProfile>;
  getStyleProfiles: () => Promise<StyleProfile[]>;
  createNovelFramework: (framework: any) => Promise<NovelFramework>;
  getNovelFrameworks: () => Promise<NovelFramework[]>;
  getChapterGenerationHistory: () => Promise<any[]>;
  getDashboardAnalytics: () => Promise<any>;
  getCostOptimizationRecommendations: () => Promise<any>;
  monitorProviderHealth: () => Promise<any>;
  
  // RAG System Operations
  indexNovelFramework: (framework: LocalNovelFramework) => Promise<any>;
  searchRelevantContext: (query: string, options?: SearchOptions) => Promise<SearchResult[]>;
  getRelevantFrameworkElements: (frameworkId: string, contextQuery: string, options?: ContextRetrievalOptions) => Promise<RelevantContext>;
  removeFrameworkFromIndex: (frameworkId: string) => Promise<any>;
  getRAGStats: () => Promise<any> | any;
  clearRAGIndex: () => Promise<void>;
  
  // Preferences
  updateUserPreferences: (preferences: Partial<AIUserPreferences>) => void;
  
  // Event Handling
  subscribeToEvents: (eventType: AIEventType, callback: (event: AIEvent) => void) => () => void;
  
  // Utility
  getGenrePrompt: (genre: string, authors: string[]) => string;
  getAuthorStylePrompt: (authors: string[]) => string;
  buildContext: (overrides?: Partial<AIContextData>) => AIContextData;
  getAnalytics: () => AIAnalytics | null;
  
  // Provider Management
  getProviderStatus: () => Record<AIProvider, { available: boolean; healthy: boolean }>;
  getProviderAnalytics: () => Promise<any>;
  setPreferredProvider: (provider: AIProvider) => void;
}

export interface AIPrompt {
  id: string;
  name: string;
  description: string;
  prompt: string;
  genre?: string;
  authors?: string[];
  isCustom: boolean;
}

const AdvancedAIContext = createContext<AdvancedAIContextType | undefined>(undefined);

// Default user preferences
const DEFAULT_USER_PREFERENCES: AIUserPreferences = {
  autoSuggest: true,
  suggestionDelay: 500,
  showConfidence: true,
  showCitations: true,
  streamResponses: true,
  saveHistory: true,
  maxHistoryItems: 100,
  preferredTone: 'creative',
  defaultProvider: 'gemini',
};

// Default suggestion config
const DEFAULT_SUGGESTION_CONFIG: SmartSuggestionConfig = {
  enabled: true,
  triggers: [
    { type: 'timer', config: { delay: 2000 } },
    { type: 'punctuation', config: { characters: '.!?' } },
    { type: 'newline' },
  ],
  debounceMs: 300,
  minCharacters: 20,
  maxSuggestions: 3,
  contextWindow: 1000,
};

export function AdvancedAIProvider({ children }: { children: ReactNode }) {
  // Basic state
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [customPrompts, setCustomPrompts] = useState<AIPrompt[]>([]);
  const [generations, setGenerations] = useState<AIGeneration[]>([]);
  const [feedback, setFeedback] = useState<AIFeedback[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentSession, setCurrentSession] = useState<AISession | null>(null);
  const [userPreferences, setUserPreferences] = useState<AIUserPreferences>(DEFAULT_USER_PREFERENCES);
  const [serviceState, setServiceState] = useState<AIServiceState | null>(null);
  const [analytics, setAnalytics] = useState<AIAnalytics | null>(null);
  const [suggestionConfig, setSuggestionConfig] = useState<SmartSuggestionConfig>(DEFAULT_SUGGESTION_CONFIG);
  
  // Bridge-specific state
  const [styleProfiles, setStyleProfiles] = useState<StyleProfile[]>([]);
  const [novelFrameworks, setNovelFrameworks] = useState<NovelFramework[]>([]);
  const [chapterGenerationHistory, setChapterGenerationHistory] = useState<any[]>([]);
  const [providerAnalytics, setProviderAnalytics] = useState<any>(null);
  const [isConnectedToBridge, setIsConnectedToBridge] = useState(false);
  const [bridgeHealth, setBridgeHealth] = useState(false);
  const [useGraphRAGContext, setUseGraphRAGContext] = useState<boolean>(true);
  const [defaultPipelineId, setDefaultPipelineId] = useState<string | undefined>(undefined);
  // Pipeline/progress state
  const [isChapterGenerating, setIsChapterGenerating] = useState<boolean>(false);
  const [pipelineView, setPipelineView] = useState<{ name: string; steps: Array<{ role: string; name?: string }> } | null>(null);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<number>(0);
  
  // Service managers
  const serviceManagerRef = useRef<AdvancedAIServiceManager | null>(null);
  const bridgeRef = useRef<SpectreWeaveAIBridge>(spectreWeaveAIBridge);
  const eventListeners = useRef<Map<AIEventType, Set<(event: AIEvent) => void>>>(new Map());

  // Initialize services on mount
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize Advanced AI Service Manager
        serviceManagerRef.current = new AdvancedAIServiceManager();
        await serviceManagerRef.current.initialize();
        setServiceState(serviceManagerRef.current.getState());

        // Initialize Bridge
        try {
          await bridgeRef.current.initialize();
          setIsConnectedToBridge(true);
          setBridgeHealth(true);
          
          // Load bridge data
          await loadBridgeData();
        } catch (bridgeError) {
          console.warn('Bridge connection failed, continuing with local AI only:', bridgeError);
          setIsConnectedToBridge(false);
          setBridgeHealth(false);
        }

      } catch (error) {
        console.error('Failed to initialize AI services:', error);
      }
    };
    
    initializeServices();
    
    return () => {
      if (serviceManagerRef.current) {
        serviceManagerRef.current.cleanup();
      }
    };
  }, []);

  // Load data from bridge
  const loadBridgeData = async () => {
    if (!isConnectedToBridge) return;

    try {
      const [profiles, frameworks, history, analytics, defaultPipe] = await Promise.all([
        bridgeRef.current.getStyleProfiles().catch(() => []),
        bridgeRef.current.getNovelFrameworks().catch(() => []),
        bridgeRef.current.getChapterGenerationHistory().catch(() => []),
        bridgeRef.current.getProviderAnalytics().catch(() => null),
        fetch('/api/bridge/pipelines/default', { cache: 'no-store' })
          .then(r => r.json())
          .catch(() => ({} as any)),
      ]);

      setStyleProfiles(profiles);
      setNovelFrameworks(frameworks);
      setChapterGenerationHistory(history);
      setProviderAnalytics(analytics);
      if (defaultPipe?.data?.defaultPipelineId) {
        setDefaultPipelineId(defaultPipe.data.defaultPipelineId);
      }
    } catch (error) {
      console.error('Failed to load bridge data:', error);
    }
  };

  // Event handling
  const emitEvent = useCallback((type: AIEventType, data: any) => {
    const event: AIEvent = {
      type,
      data,
      timestamp: new Date(),
    };
    
    const listeners = eventListeners.current.get(type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }, []);

  const subscribeToEvents = useCallback((eventType: AIEventType, callback: (event: AIEvent) => void) => {
    if (!eventListeners.current.has(eventType)) {
      eventListeners.current.set(eventType, new Set());
    }
    eventListeners.current.get(eventType)!.add(callback);
    
    return () => {
      const listeners = eventListeners.current.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }, []);

  // Session management
  const startSession = useCallback((projectId?: string, documentId?: string) => {
    const session: AISession = {
      id: `session_${Date.now()}`,
      userId: 'current-user', // This should come from auth context
      projectId,
      documentId,
      generations: [],
      feedback: [],
      suggestions: [],
      startTime: new Date(),
    };
    setCurrentSession(session);
  }, []);

  const endSession = useCallback(() => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        endTime: new Date(),
      });
    }
  }, [currentSession]);

  // Build AI context data
  const buildContext = useCallback((overrides?: Partial<AIContextData>): AIContextData => {
    return {
      selectedText: '',
      documentContent: '',
      genre: selectedGenre || undefined,
      authorStyles: selectedAuthors,
      previousGenerations: generations.slice(0, 5),
      userPreferences,
      ...overrides,
    };
  }, [selectedGenre, selectedAuthors, generations, userPreferences]);

  // Basic AI Operations
  const generateText = async (prompt: string, options?: AIGenerationOptions): Promise<AIResponse<string>> => {
    if (!serviceManagerRef.current) {
      throw new Error('AI Service Manager not initialized');
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    emitEvent('request.started', { prompt, options });

    try {
      const context = buildContext();
      const response = await serviceManagerRef.current.generateText({
        id: `req_${Date.now()}`,
        type: 'generation',
        prompt,
        context,
        options,
        timestamp: new Date(),
      });

      const generation: AIGeneration = {
        id: `gen_${Date.now()}`,
        prompt,
        response: response.content || '',
        provider: response.provider,
        model: response.model,
        context,
        options,
        usage: response.usage,
        timestamp: new Date(),
      };

      addGeneration(generation);
      setGenerationProgress(100);
      emitEvent('request.completed', { response });

      return response as AIResponse<string>;
    } catch (error) {
      console.error('Content generation failed:', error);
      emitEvent('request.failed', { error });
      throw error;
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const generateStream = async (
    prompt: string, 
    options?: AIGenerationOptions, 
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse<string>> => {
    if (!serviceManagerRef.current) {
      throw new Error('AI Service Manager not initialized');
    }

    return serviceManagerRef.current.streamText({
      id: `req_${Date.now()}`,
      type: 'generation',
      prompt,
      options: { ...options, stream: true },
      timestamp: new Date(),
    });
  };

  const generateFeedback = async (content: string, context?: AIContextData): Promise<AIFeedback[]> => {
    if (!serviceManagerRef.current) {
      throw new Error('AI Service Manager not initialized');
    }

    try {
      const feedbackList = await serviceManagerRef.current.generateFeedback(content, context || buildContext());
      feedbackList.forEach(fb => addFeedback(fb));
      emitEvent('feedback.generated', { feedback: feedbackList });
      return feedbackList;
    } catch (error) {
      console.error('Feedback generation failed:', error);
      throw error;
    }
  };

  const generateSuggestions = async (content: string, context?: AIContextData): Promise<AISuggestion[]> => {
    if (!serviceManagerRef.current) {
      throw new Error('AI Service Manager not initialized');
    }

    try {
      const suggestionList = await serviceManagerRef.current.generateSuggestions(content, context || buildContext());
      suggestionList.forEach(s => addSuggestion(s));
      emitEvent('suggestion.generated', { suggestions: suggestionList });
      return suggestionList;
    } catch (error) {
      console.error('Suggestion generation failed:', error);
      throw error;
    }
  };

  // Bridge Operations
  const generateChapter = async (
    request: ChapterGenerationRequest,
    novelFrameworkId?: string,
    onProgress?: (progress: ChapterGenerationProgress) => void
  ): Promise<ChapterGenerationResult> => {
    if (!isConnectedToBridge) {
      throw new Error('Bridge not connected. Chapter generation requires the SpectreWeaveAIAlgorithm backend.');
    }

    setIsChapterGenerating(true);
    setPipelineProgress(0);
    setCurrentAgent(null);

    // Load pipeline/agents for progress display
    try {
      const res = await fetch('/api/bridge/chapter-generation/agents', { cache: 'no-store' }).catch(() => null as any)
      const payload = res ? await res.json().catch(() => ({})) : {}
      const agents: Array<{ id: string; name: string; role: string }> = payload?.data?.agents || []
      const pipelines: Array<{ id: string; name: string; steps: any[] }> = payload?.data?.pipelines || []
      const chosen = pipelines && pipelines.length > 0 ? pipelines[0] : null
      if (chosen) {
        const steps = (chosen.steps || []).map((s: any) => ({ role: s.role as string, name: (agents.find(a => a.id === s.agentId)?.name) as string | undefined }))
        setPipelineView({ name: chosen.name, steps })
      } else {
        // Fallback default pipeline
        setPipelineView({
          name: 'Default Pipeline',
          steps: [
            { role: 'planner' },
            { role: 'scene_builder' },
            { role: 'dialogue_specialist' },
            { role: 'description_enhancer' },
            { role: 'consistency_editor' },
            { role: 'compiler' },
          ],
        })
      }
    } catch {}

    // Attach default pipeline if not provided
    if (!request.pipelineId && defaultPipelineId) {
      request.pipelineId = defaultPipelineId;
    }

    // Attach per-agent retrieval overrides from selected default pipeline, if available
    try {
      if (!request.perAgentRetrieval) {
        const res = await fetch('/api/bridge/pipelines', { cache: 'no-store' }).catch(() => null as any)
        const payload = res ? await res.json().catch(() => ({})) : {}
        const pipelines: Array<{ id: string; steps: Array<{ role: string; retrieval?: { graphWeight?: number; vectorWeight?: number; categories?: string[]; maxHops?: number } }> }> = payload?.data || []
        const chosen = pipelines && pipelines.length > 0 ? pipelines[0] : null
        if (chosen) {
          const overrides = (chosen.steps || []).map(step => ({
            agent: step.role,
            graphWeight: step.retrieval?.graphWeight,
            vectorWeight: step.retrieval?.vectorWeight,
            categories: step.retrieval?.categories,
            maxHops: step.retrieval?.maxHops,
          }))
          request.perAgentRetrieval = overrides
        }
      }
    } catch {}

    // Optionally enrich request with GraphRAG context
    try {
      if (useGraphRAGContext && novelFrameworkId && request.chapterGoal) {
        const hybridRes = await fetch('/api/bridge/graphrag/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: request.chapterGoal, options: { frameworkId: novelFrameworkId, limit: 10 } }),
        })
        if (hybridRes.ok) {
          const hybridPayload = await hybridRes.json().catch(() => ({}))
          const nodes = Array.isArray(hybridPayload?.data) ? hybridPayload.data : []
          const contextSnippet = nodes.slice(0, 6).map((n: any) => `- [${n.type}] ${n.name}: ${n.description || n.content || ''}`).join('\n')
          request.userInstructions = `${request.userInstructions || ''}\n\nContext (GraphRAG):\n${contextSnippet}`.trim()
        }
      }
    } catch {}

    try {
      return await bridgeRef.current.generateChapter(request, novelFrameworkId, (progress) => {
        setPipelineProgress(progress?.progress ?? 0)
        if (progress?.currentAgent) setCurrentAgent(progress.currentAgent)
        if (onProgress) onProgress(progress)
      });
    } finally {
      setIsChapterGenerating(false);
      setCurrentAgent(null);
      setPipelineProgress(0);
    }
  };

  const generateWithStyleProfile = async (
    prompt: string,
    styleProfileId: string,
    options?: AIGenerationOptions
  ): Promise<AIResponse<string>> => {
    if (!isConnectedToBridge) {
      throw new Error('Bridge not connected. Style profile generation requires the SpectreWeaveAIAlgorithm backend.');
    }

    return bridgeRef.current.generateWithStyleProfile(prompt, styleProfileId, options);
  };

  const analyzeTextStyle = async (text: string): Promise<any> => {
    if (isConnectedToBridge) {
      return bridgeRef.current.analyzeTextStyle(text);
    }
    
    // Fallback to local analysis
    const response = await generateText(
      `Analyze the writing style of the following text and provide insights about genre, tone, complexity, and techniques used: "${text}"`,
      { temperature: 0.3, maxTokens: 500 }
    );

    return {
      genre: 'general',
      style_attributes: {
        sentence_length: 'medium',
        vocabulary_complexity: 'moderate',
        tone: 'neutral',
        dialogue_ratio: 'medium',
        descriptive_language: 'moderate',
      },
      writing_techniques: ['standard'],
      suggested_improvements: ['Analysis generated locally'],
      raw_analysis: response.content,
    };
  };

  // Smart Suggestions
  const generateSmartSuggestions = async (
    content: string,
    cursorPosition: number,
    context: AIContextData
  ): Promise<SmartSuggestion[]> => {
    if (isConnectedToBridge) {
      return bridgeRef.current.generateSmartSuggestions(content, cursorPosition, context);
    }
    
    if (!serviceManagerRef.current) {
      return [];
    }

    return serviceManagerRef.current.generateSmartSuggestions(content, cursorPosition, context);
  };

  const updateSmartSuggestions = useCallback((newSuggestions: SmartSuggestion[]) => {
    setSmartSuggestions(newSuggestions);
  }, []);

  const updateSuggestionConfig = useCallback((config: Partial<SmartSuggestionConfig>) => {
    setSuggestionConfig(prev => ({ ...prev, ...config }));
  }, []);

  // History Management
  const addGeneration = (generation: AIGeneration) => {
    setGenerations(prev => {
      const updated = [generation, ...prev];
      if (updated.length > userPreferences.maxHistoryItems) {
        return updated.slice(0, userPreferences.maxHistoryItems);
      }
      return updated;
    });
    
    if (currentSession) {
      setCurrentSession(prev => ({
        ...prev!,
        generations: [...prev!.generations, generation],
      }));
    }
  };

  const clearGenerations = () => {
    setGenerations([]);
  };

  const getGenerationHistory = (limit?: number) => {
    return limit ? generations.slice(0, limit) : generations;
  };

  // Feedback Management
  const addFeedback = useCallback((feedbackItem: AIFeedback) => {
    setFeedback(prev => [...prev, feedbackItem]);
    if (currentSession) {
      setCurrentSession(prev => ({
        ...prev!,
        feedback: [...prev!.feedback, feedbackItem],
      }));
    }
  }, [currentSession]);

  const updateFeedback = useCallback((id: string, updates: Partial<AIFeedback>) => {
    setFeedback(prev => 
      prev.map(fb => fb.id === id ? { ...fb, ...updates } : fb)
    );
  }, []);

  const resolveFeedback = useCallback((id: string) => {
    updateFeedback(id, { resolved: true });
  }, [updateFeedback]);

  const clearFeedback = useCallback(() => {
    setFeedback([]);
  }, []);

  // Suggestion Management
  const addSuggestion = useCallback((suggestion: AISuggestion) => {
    setSuggestions(prev => [...prev, suggestion]);
    if (currentSession) {
      setCurrentSession(prev => ({
        ...prev!,
        suggestions: [...prev!.suggestions, suggestion],
      }));
    }
  }, [currentSession]);

  const applySuggestion = useCallback((id: string) => {
    setSuggestions(prev => 
      prev.map(s => s.id === id ? { ...s, applied: true } : s)
    );
  }, []);

  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Bridge-specific operations
  const createStyleProfile = async (name: string, description: string, textSamples: string[]): Promise<StyleProfile> => {
    if (!isConnectedToBridge) {
      throw new Error('Bridge not connected');
    }

    const profile = await bridgeRef.current.createStyleProfile(name, description, textSamples);
    setStyleProfiles(prev => [...prev, profile]);
    return profile;
  };

  const getStyleProfiles = async (): Promise<StyleProfile[]> => {
    if (!isConnectedToBridge) {
      return styleProfiles;
    }

    const profiles = await bridgeRef.current.getStyleProfiles();
    setStyleProfiles(profiles);
    return profiles;
  };

  const createNovelFramework = async (framework: any): Promise<NovelFramework> => {
    if (!isConnectedToBridge) {
      throw new Error('Bridge not connected');
    }

    const newFramework = await bridgeRef.current.createNovelFramework(framework);
    setNovelFrameworks(prev => [...prev, newFramework]);
    return newFramework;
  };

  const getNovelFrameworks = async (): Promise<NovelFramework[]> => {
    if (!isConnectedToBridge) {
      return novelFrameworks;
    }

    const frameworks = await bridgeRef.current.getNovelFrameworks();
    setNovelFrameworks(frameworks);
    return frameworks;
  };

  const getChapterGenerationHistory = async (): Promise<any[]> => {
    if (!isConnectedToBridge) {
      return chapterGenerationHistory;
    }

    const history = await bridgeRef.current.getChapterGenerationHistory();
    setChapterGenerationHistory(history);
    return history;
  };

  const getDashboardAnalytics = async (): Promise<any> => {
    if (!isConnectedToBridge) {
      return null;
    }

    return bridgeRef.current.getDashboardAnalytics();
  };

  const getCostOptimizationRecommendations = async (): Promise<any> => {
    if (!isConnectedToBridge) {
      return { recommendations: [], total_recommendations: 0 };
    }

    return bridgeRef.current.getCostOptimizationRecommendations();
  };

  const monitorProviderHealth = async (): Promise<any> => {
    if (isConnectedToBridge) {
      return bridgeRef.current.monitorProviderHealth();
    }

    if (serviceManagerRef.current) {
      return serviceManagerRef.current.healthCheck();
    }

    return {};
  };

  // User preferences
  const updateUserPreferences = useCallback((preferences: Partial<AIUserPreferences>) => {
    setUserPreferences(prev => ({ ...prev, ...preferences }));
  }, []);

  // Analytics
  const getAnalytics = useCallback((): AIAnalytics | null => {
    if (serviceManagerRef.current) {
      return serviceManagerRef.current.getAnalytics();
    }
    return analytics;
  }, [analytics]);

  // Provider Management
  const getProviderStatus = useCallback(() => {
    const status: Record<AIProvider, { available: boolean; healthy: boolean }> = {
      azure: { available: false, healthy: false },
      gemini: { available: false, healthy: false },
      databricks: { available: false, healthy: false },
      openai: { available: false, healthy: false },
      anthropic: { available: false, healthy: false },
      local: { available: false, healthy: false },
    };

    if (serviceState) {
      Object.entries(serviceState.providers).forEach(([provider, state]) => {
        status[provider as AIProvider] = {
          available: state.available,
          healthy: state.healthy,
        };
      });
    }

    return status;
  }, [serviceState]);

  const getProviderAnalytics = async () => {
    if (isConnectedToBridge) {
      const analytics = await bridgeRef.current.getProviderAnalytics();
      setProviderAnalytics(analytics);
      return analytics;
    }
    return providerAnalytics;
  };

  const setPreferredProvider = useCallback((provider: AIProvider) => {
    updateUserPreferences({ defaultProvider: provider });
  }, [updateUserPreferences]);

  // RAG System Operations
  const indexNovelFrameworkLocal = async (framework: LocalNovelFramework): Promise<any> => {
    try {
      // Try bridge first if connected
      if (isConnectedToBridge) {
        return await bridgeRef.current.indexNovelFramework(framework);
      }
      
      // Use local RAG system
      return await ragSystem.indexNovelFramework(framework);
    } catch (error) {
      console.error('Framework indexing failed:', error);
      throw error;
    }
  };

  const searchRelevantContextLocal = async (query: string, options?: SearchOptions): Promise<SearchResult[]> => {
    try {
      // Try bridge first if connected
      if (isConnectedToBridge && options?.frameworkId) {
        const bridgeResults = await bridgeRef.current.searchRelevantContext(query, {
          frameworkId: options.frameworkId,
          categories: options.categories,
          limit: options.limit,
          threshold: options.threshold,
        });
        
        // Convert bridge results to local format
        return bridgeResults.map(result => ({
          id: result.id,
          similarity: result.similarity,
          relevanceScore: result.relevance_score,
          category: result.category as any,
          type: result.type,
          metadata: { category: result.category as any, type: result.type } as any,
          content: result.content,
          tokenCount: result.token_count,
          excerpt: result.content?.substring(0, 150) + '...',
        }));
      }
      
      // Use local RAG system
      return await ragSystem.searchRelevantContext(query, options || {});
    } catch (error) {
      console.error('Context search failed:', error);
      throw error;
    }
  };

  const getRelevantFrameworkElementsLocal = async (
    frameworkId: string, 
    contextQuery: string, 
    options?: ContextRetrievalOptions
  ): Promise<RelevantContext> => {
    try {
      // Try bridge first if connected
      if (isConnectedToBridge) {
        const bridgeResults = await bridgeRef.current.getRelevantFrameworkElements(frameworkId, contextQuery, {
          maxTokens: options?.maxTokens,
          prioritizeCategories: options?.prioritizeCategories,
          includeThemes: options?.includeThemes,
        });
        
        // Convert bridge results to local format
        return {
          plotElements: bridgeResults.plot_elements.map((el: any) => ({ ...el, tokenCount: el.token_count || 0 })),
          characters: bridgeResults.characters.map((el: any) => ({ ...el, tokenCount: el.token_count || 0 })),
          worldElements: bridgeResults.world_elements.map((el: any) => ({ ...el, tokenCount: el.token_count || 0 })),
          themes: bridgeResults.themes.map((el: any) => ({ ...el, tokenCount: el.token_count || 0 })),
          scenes: [],
          dialogue: [],
          totalTokens: bridgeResults.total_tokens,
          relevanceScores: bridgeResults.relevance_scores,
          contextQuality: 0.8, // Default quality for bridge results
        };
      }
      
      // Use local RAG system
      return await ragSystem.getRelevantFrameworkElements(frameworkId, contextQuery, options || {});
    } catch (error) {
      console.error('Framework element retrieval failed:', error);
      throw error;
    }
  };

  const removeFrameworkFromIndexLocal = async (frameworkId: string): Promise<any> => {
    try {
      // Try bridge first if connected
      if (isConnectedToBridge) {
        return await bridgeRef.current.removeFrameworkFromIndex(frameworkId);
      }
      
      // Use local RAG system
      return await ragSystem.removeFrameworkFromIndex(frameworkId);
    } catch (error) {
      console.error('Framework removal failed:', error);
      throw error;
    }
  };

  const getRAGStatsLocal = (): Promise<any> | any => {
    if (isConnectedToBridge) {
      return bridgeRef.current.getRAGStats();
    }
    
    // Use local RAG system
    return ragSystem.getVectorStoreStats();
  };

  const clearRAGIndexLocal = async (): Promise<void> => {
    try {
      // Only works with local RAG system
      await ragSystem.clearVectorStore();
    } catch (error) {
      console.error('RAG index clearing failed:', error);
      throw error;
    }
  };

  // Utility functions
  const getGenrePrompt = (genre: string, authors: string[]): string => {
    const genrePrompts: { [key: string]: string } = {
      'sci-fi': 'Write science fiction with technological innovation, futuristic concepts, and exploration of human nature.',
      'mystery': 'Create a mystery with clever clues, logical deduction, and satisfying revelations.',
      'romance': 'Craft a romance with emotional depth, authentic relationships, and character growth.',
      'historical': 'Write historical fiction with period authenticity, rich detail, and compelling characters.',
      'contemporary': 'Create contemporary fiction that reflects modern life, current issues, and relatable characters.',
      'fantasy': 'Write fantasy with imaginative world-building, magical elements, and epic storytelling.',
      'thriller': 'Create a thriller with suspense, high stakes, and page-turning tension.',
      'horror': 'Write horror with atmospheric dread, psychological tension, and frightening elements.',
    };

    return genrePrompts[genre] || 'Write a compelling story in the specified genre.';
  };

  const getAuthorStylePrompt = (authors: string[]): string => {
    if (authors.length === 0) return '';
    
    const authorPrompts = authors.map(author => `Emulate the writing style of ${author}`).join('; ');
    return `Writing style: ${authorPrompts}`;
  };

  const value: AdvancedAIContextType = {
    // State
    selectedGenre,
    selectedAuthors,
    customPrompts,
    generations,
    feedback,
    suggestions,
    smartSuggestions,
    isGenerating,
    generationProgress,
    currentSession,
    userPreferences,
    serviceState,
    analytics,
    suggestionConfig,
    styleProfiles,
    novelFrameworks,
    chapterGenerationHistory,
    providerAnalytics,
    isConnectedToBridge,
    bridgeHealth,
    useGraphRAGContext,
    setUseGraphRAGContext,
    // Expose toggle via preferences
    
    // Basic AI Operations
    generateText,
    generateStream,
    generateFeedback,
    generateSuggestions,
    
    // Advanced AI Operations
    generateChapter,
    generateWithStyleProfile,
    analyzeTextStyle,
    
    // Smart Suggestions
    generateSmartSuggestions,
    updateSmartSuggestions,
    updateSuggestionConfig,
    
    // Session Management
    startSession,
    endSession,
    
    // History Management
    addGeneration,
    clearGenerations,
    getGenerationHistory,
    
    // Feedback Management
    addFeedback,
    updateFeedback,
    resolveFeedback,
    clearFeedback,
    
    // Suggestion Management
    addSuggestion,
    applySuggestion,
    dismissSuggestion,
    clearSuggestions,
    
    // Bridge Operations
    createStyleProfile,
    getStyleProfiles,
    createNovelFramework,
    getNovelFrameworks,
    getChapterGenerationHistory,
    getDashboardAnalytics,
    getCostOptimizationRecommendations,
    monitorProviderHealth,
    
    // RAG System Operations
    indexNovelFramework: indexNovelFrameworkLocal,
    searchRelevantContext: searchRelevantContextLocal,
    getRelevantFrameworkElements: getRelevantFrameworkElementsLocal,
    removeFrameworkFromIndex: removeFrameworkFromIndexLocal,
    getRAGStats: getRAGStatsLocal,
    clearRAGIndex: clearRAGIndexLocal,
    
    // Preferences
    updateUserPreferences,
    
    // Event Handling
    subscribeToEvents,
    
    // Utility
    getGenrePrompt,
    getAuthorStylePrompt,
    buildContext,
    getAnalytics,
    
    // Provider Management
    getProviderStatus,
    getProviderAnalytics,
    setPreferredProvider,
  };

  return (
    <AdvancedAIContext.Provider value={value}>
      {children}
    </AdvancedAIContext.Provider>
  );
}

export function useAdvancedAI() {
  const context = useContext(AdvancedAIContext);
  if (context === undefined) {
    throw new Error('useAdvancedAI must be used within an AdvancedAIProvider');
  }
  return context;
}

// Export both the advanced and backward-compatible hooks
export { useAdvancedAI as useAIContext };