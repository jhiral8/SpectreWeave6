/**
 * Comprehensive AI-related TypeScript interfaces for SpectreWeave
 */

// Core AI Types
export interface AIProvider {
  id: 'gemini' | 'databricks' | 'stability' | 'openai' | 'anthropic' | 'local';
  name: string;
  enabled: boolean;
  capabilities: AICapability[];
  config?: Record<string, any>;
}

export type AICapability = 
  | 'text-generation'
  | 'text-completion'
  | 'text-editing'
  | 'summarization'
  | 'translation'
  | 'sentiment-analysis'
  | 'entity-extraction'
  | 'question-answering'
  | 'image-generation'
  | 'embedding'
  | 'classification'
  | 'code-generation'
  | 'style-transfer'
  | 'grammar-correction'
  | 'fact-checking'
  | 'research'
  | 'streaming';

// AI Request/Response Types
export interface AIRequest {
  id: string;
  type: AIRequestType;
  prompt: string;
  context?: AIContext;
  options?: AIRequestOptions;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export type AIRequestType = 
  | 'completion'
  | 'generation'
  | 'editing'
  | 'feedback'
  | 'suggestion'
  | 'analysis'
  | 'research'
  | 'image';

export interface AIRequestOptions {
  provider?: AIProvider['id'];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  stream?: boolean;
  genre?: string;
  authorStyle?: string;
  tone?: 'formal' | 'casual' | 'creative' | 'technical' | 'academic';
  format?: 'text' | 'markdown' | 'html' | 'json';
}

export interface AIResponse {
  id: string;
  requestId: string;
  content: string;
  provider: AIProvider['id'];
  model: string;
  usage?: AIUsage;
  metadata?: AIResponseMetadata;
  timestamp: Date;
  error?: AIError;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
  latency?: number;
}

export interface AIResponseMetadata {
  confidence?: number;
  quality?: 'high' | 'medium' | 'low';
  alternatives?: string[];
  citations?: AICitation[];
  warnings?: string[];
}

export interface AICitation {
  text: string;
  source: string;
  url?: string;
  confidence: number;
}

export interface AIError {
  code: string;
  message: string;
  provider?: AIProvider['id'];
  retryable?: boolean;
}

// AI Context Types
export interface AIContext {
  documentId?: string;
  projectId?: string;
  selectedText?: string;
  surroundingText?: string;
  documentContent?: string;
  genre?: string;
  authorStyles?: string[];
  characters?: AICharacter[];
  plotPoints?: AIPlotPoint[];
  worldBuilding?: AIWorldElement[];
  previousGenerations?: AIGeneration[];
  userPreferences?: AIUserPreferences;
}

export interface AICharacter {
  id: string;
  name: string;
  description: string;
  traits: string[];
  relationships: { characterId: string; relationship: string }[];
  arc?: string;
}

export interface AIPlotPoint {
  id: string;
  title: string;
  description: string;
  chapter?: number;
  resolved: boolean;
  importance: 'major' | 'minor' | 'subplot';
}

export interface AIWorldElement {
  id: string;
  name: string;
  type: 'location' | 'technology' | 'culture' | 'magic' | 'politics' | 'other';
  description: string;
  relevantChapters?: number[];
}

// AI Feedback Types
export interface AIFeedback {
  id: string;
  type: AIFeedbackType;
  content: string;
  severity: 'info' | 'suggestion' | 'warning' | 'error';
  position?: AIPosition;
  suggestions?: string[];
  metadata?: Record<string, any>;
  resolved: boolean;
  timestamp: Date;
}

export type AIFeedbackType = 
  | 'grammar'
  | 'style'
  | 'consistency'
  | 'pacing'
  | 'character'
  | 'plot'
  | 'dialogue'
  | 'description'
  | 'research'
  | 'factual';

export interface AIPosition {
  start: number;
  end: number;
  line?: number;
  column?: number;
}

// AI Suggestion Types
export interface AISuggestion {
  id: string;
  type: AISuggestionType;
  text: string;
  reason: string;
  confidence: number;
  position?: AIPosition;
  alternatives?: string[];
  applied: boolean;
  timestamp: Date;
}

export type AISuggestionType = 
  | 'completion'
  | 'alternative'
  | 'enhancement'
  | 'correction'
  | 'expansion'
  | 'simplification';

// AI Generation History
export interface AIGeneration {
  id: string;
  prompt: string;
  response: string;
  provider: AIProvider['id'];
  model: string;
  context?: AIContext;
  options?: AIRequestOptions;
  usage?: AIUsage;
  rating?: number;
  tags?: string[];
  timestamp: Date;
}

// AI User Preferences
export interface AIUserPreferences {
  defaultProvider?: AIProvider['id'];
  defaultModel?: string;
  autoSuggest: boolean;
  suggestionDelay: number;
  showConfidence: boolean;
  showCitations: boolean;
  streamResponses: boolean;
  saveHistory: boolean;
  maxHistoryItems: number;
  preferredTone?: AIRequestOptions['tone'];
  blockedProviders?: AIProvider['id'][];
}

// AI Session Types
export interface AISession {
  id: string;
  userId: string;
  projectId?: string;
  documentId?: string;
  generations: AIGeneration[];
  feedback: AIFeedback[];
  suggestions: AISuggestion[];
  startTime: Date;
  endTime?: Date;
  metadata?: Record<string, any>;
}

// AI Analytics Types
export interface AIAnalytics {
  totalGenerations: number;
  totalTokensUsed: number;
  totalCost: number;
  averageLatency: number;
  providerUsage: Record<AIProvider['id'], number>;
  featureUsage: Record<AICapability, number>;
  userSatisfaction?: number;
  errorRate: number;
}

// AI Model Configuration
export interface AIModelConfig {
  provider: AIProvider['id'];
  modelId: string;
  displayName: string;
  capabilities: AICapability[];
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kTokens: {
    input: number;
    output: number;
  };
  supportedLanguages?: string[];
  specializations?: string[];
}

// AI Service State
export interface AIServiceState {
  initialized: boolean;
  providers: Record<AIProvider['id'], AIProviderState>;
  activeRequests: Map<string, AIRequest>;
  requestQueue: AIRequest[];
  cache: Map<string, AIResponse>;
  rateLimits: Map<AIProvider['id'], AIRateLimit>;
}

export interface AIProviderState {
  available: boolean;
  healthy: boolean;
  lastHealthCheck: Date;
  activeModels: string[];
  error?: AIError;
}

export interface AIRateLimit {
  requestsPerMinute: number;
  requestsRemaining: number;
  resetsAt: Date;
  tokensPerMinute?: number;
  tokensRemaining?: number;
}

// AI Event Types for real-time updates
export interface AIEvent {
  type: AIEventType;
  data: any;
  timestamp: Date;
}

export type AIEventType = 
  | 'request.started'
  | 'request.completed'
  | 'request.failed'
  | 'stream.chunk'
  | 'stream.completed'
  | 'suggestion.generated'
  | 'feedback.generated'
  | 'provider.statusChange'
  | 'rateLimit.warning'
  | 'cache.hit'
  | 'cache.miss';

// Smart Suggestions System Types
export interface SmartSuggestionConfig {
  enabled: boolean;
  triggers: SuggestionTrigger[];
  debounceMs: number;
  minCharacters: number;
  maxSuggestions: number;
  contextWindow: number;
}

export interface SuggestionTrigger {
  type: 'timer' | 'punctuation' | 'newline' | 'selection' | 'explicit';
  config?: Record<string, any>;
}

export interface SmartSuggestion {
  id: string;
  type: 'completion' | 'rephrase' | 'expand' | 'summarize' | 'continue';
  text: string;
  displayText?: string;
  confidence: number;
  provider: AIProvider['id'];
  metadata?: Record<string, any>;
}

// Export type guards
export const isAIError = (response: any): response is AIError => {
  return response && typeof response.code === 'string' && typeof response.message === 'string';
};

export const isAIResponse = (response: any): response is AIResponse => {
  return response && typeof response.id === 'string' && typeof response.content === 'string';
};

export const hasStreamingCapability = (provider: AIProvider): boolean => {
  return provider.capabilities.includes('streaming');
};