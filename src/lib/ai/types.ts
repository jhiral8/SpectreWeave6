/**
 * Comprehensive TypeScript types for AI service integrations
 * Supports Azure AI, Gemini, Databricks, and Stability AI
 */

// Base AI Provider Types
export type AIProvider = 'azure' | 'gemini' | 'databricks' | 'openai' | 'anthropic' | 'local' | 'aifoundry'
export type ImageProvider = 'stability'
export type SupportedProvider = AIProvider | ImageProvider

// AI Capabilities
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

// Provider Configuration
export interface AIProviderConfig {
  id: AIProvider;
  name: string;
  enabled: boolean;
  capabilities: AICapability[];
  config?: Record<string, any>;
}

// Request Types
export type AIRequestType = 
  | 'completion'
  | 'generation'
  | 'editing'
  | 'feedback'
  | 'suggestion'
  | 'analysis'
  | 'research'
  | 'image';

// Message Interface for Chat Completions
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: number
}

// Base Configuration Interfaces
export interface BaseAIConfig {
  timeout?: number
  retries?: number
}

export interface AzureAIConfig extends BaseAIConfig {
  endpoint: string
  apiKey: string
  deployment: string
  apiVersion: string
}

export interface GeminiConfig extends BaseAIConfig {
  apiKey: string
  model: string
}

export interface DatabricksConfig extends BaseAIConfig {
  workspaceUrl: string
  modelName: string
  apiToken: string
}

export interface StabilityConfig extends BaseAIConfig {
  apiKey: string
}

export interface AIFoundryConfig extends BaseAIConfig {
  apiKey: string
  endpoint: string
  model: string
  apiVersion?: string
}

// Request Interfaces
export interface AIGenerationOptions {
  maxTokens?: number
  temperature?: number
  topP?: number
  topK?: number
  presencePenalty?: number
  frequencyPenalty?: number
  stopSequences?: string[]
  genre?: string
  authorStyle?: string
  tone?: 'formal' | 'casual' | 'creative' | 'technical' | 'academic'
  format?: 'text' | 'markdown' | 'html' | 'json'
  stream?: boolean
}

export interface AIRequest {
  id: string
  type: AIRequestType
  prompt: string
  context?: AIContext
  options?: AIGenerationOptions
  metadata?: Record<string, any>
  timestamp: Date
  provider?: AIProvider
}

export interface ChatCompletionRequest {
  messages: ChatMessage[]
  provider?: AIProvider
  options?: AIGenerationOptions
}

export interface ImageGenerationOptions {
  width?: number
  height?: number
  steps?: number
  seed?: number
  cfgScale?: number
  samples?: number
}

export interface ImageRequest {
  prompt: string
  provider?: ImageProvider
  options?: ImageGenerationOptions
}

export interface ImageAnalysisRequest {
  imageData: string
  prompt: string
  provider?: 'gemini'
}

export interface ImageEditRequest {
  imageData: string
  prompt: string
  provider?: ImageProvider
  options?: {
    strength?: number
    steps?: number
  }
}

// Response Interfaces
export interface AIResponse<T = string> {
  id: string
  requestId: string
  success: boolean
  content?: T
  data?: T  // Backward compatibility
  error?: AIError
  usage?: TokenUsage
  provider: SupportedProvider
  model: string
  metadata?: AIResponseMetadata
  timestamp: Date
}

export interface AIResponseMetadata {
  confidence?: number
  quality?: 'high' | 'medium' | 'low'
  alternatives?: string[]
  citations?: AICitation[]
  warnings?: string[]
}

export interface AICitation {
  text: string
  source: string
  url?: string
  confidence: number
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost?: number
  latency?: number
}

export interface StreamResponse {
  stream: ReadableStream
  provider: SupportedProvider
  requestId?: string
}

// Error Types
export interface AIError {
  code: string
  message: string
  provider: SupportedProvider
  details?: Record<string, any>
  retryable?: boolean
}

export class AIServiceError extends Error {
  public readonly code: string
  public readonly provider: SupportedProvider
  public readonly details?: Record<string, any>
  public readonly retryable: boolean

  constructor(error: AIError) {
    super(error.message)
    this.name = 'AIServiceError'
    this.code = error.code
    this.provider = error.provider
    this.details = error.details
    this.retryable = error.retryable ?? false
  }
}

// Service Interface Types
export interface IAIService {
  generateText(request: AIRequest): Promise<AIResponse<string>>
  streamText(request: AIRequest): Promise<StreamResponse>
  getChatCompletion(request: ChatCompletionRequest): Promise<AIResponse<string>>
  validateConfig(): boolean
}

export interface IImageService {
  generateImage(request: ImageRequest): Promise<AIResponse<string>>
  analyzeImage(request: ImageAnalysisRequest): Promise<AIResponse<string>>
  editImage(request: ImageEditRequest): Promise<AIResponse<string>>
  validateConfig(): boolean
}

// API Route Types
export interface APIRequest<T = any> {
  body: T
  headers: Record<string, string>
  user?: {
    id: string
    email: string
  }
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  requestId?: string
}

// Rate Limiting Types
export interface RateLimit {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: any) => string
}

export interface RateLimitStatus {
  remaining: number
  reset: number
  limit: number
}

// Configuration Validation Types
export interface ConfigValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ProviderStatus {
  provider: SupportedProvider
  available: boolean
  lastChecked: number
  error?: string
}

// Client Hook Types
export interface UseAIOptions {
  provider?: AIProvider
  defaultOptions?: AIGenerationOptions
  enableStreaming?: boolean
  onError?: (error: AIServiceError) => void
  onSuccess?: (response: AIResponse) => void
}

export interface UseAIReturn {
  generateText: (prompt: string, options?: AIGenerationOptions) => Promise<AIResponse<string>>
  streamText: (prompt: string, options?: AIGenerationOptions) => Promise<StreamResponse>
  getChatCompletion: (messages: ChatMessage[], options?: AIGenerationOptions) => Promise<AIResponse<string>>
  isLoading: boolean
  error: AIServiceError | null
  lastResponse: AIResponse | null
}

export interface UseImageAIReturn {
  generateImage: (prompt: string, options?: ImageGenerationOptions) => Promise<AIResponse<string>>
  analyzeImage: (imageData: string, prompt: string) => Promise<AIResponse<string>>
  editImage: (imageData: string, prompt: string, options?: { strength?: number; steps?: number }) => Promise<AIResponse<string>>
  isLoading: boolean
  error: AIServiceError | null
  lastResponse: AIResponse | null
}

// Cost Management Types
export interface CostEstimate {
  provider: SupportedProvider
  estimatedCost: number
  currency: string
  breakdown: {
    inputTokens: number
    outputTokens: number
    inputCost: number
    outputCost: number
  }
}

export interface UsageTracking {
  totalRequests: number
  totalTokens: number
  totalCost: number
  byProvider: Record<SupportedProvider, {
    requests: number
    tokens: number
    cost: number
  }>
}

// ============================================================================
// ENHANCED AI ARCHITECTURE TYPES - Phase 3.5 Migration
// ============================================================================

// AI Context Types for Advanced Writing Assistance
export interface AIContext {
  documentId?: string
  projectId?: string
  selectedText?: string
  surroundingText?: string
  documentContent?: string
  genre?: string
  authorStyles?: string[]
  characters?: AICharacter[]
  plotPoints?: AIPlotPoint[]
  worldBuilding?: AIWorldElement[]
  previousGenerations?: AIGeneration[]
  userPreferences?: AIUserPreferences
}

export interface AICharacter {
  id: string
  name: string
  description: string
  traits: string[]
  relationships: { characterId: string; relationship: string }[]
  arc?: string
}

export interface AIPlotPoint {
  id: string
  title: string
  description: string
  chapter?: number
  resolved: boolean
  importance: 'major' | 'minor' | 'subplot'
}

export interface AIWorldElement {
  id: string
  name: string
  type: 'location' | 'technology' | 'culture' | 'magic' | 'politics' | 'other'
  description: string
  relevantChapters?: number[]
}

// AI Feedback System Types
export interface AIFeedback {
  id: string
  type: AIFeedbackType
  content: string
  severity: 'info' | 'suggestion' | 'warning' | 'error'
  position?: AIPosition
  suggestions?: string[]
  metadata?: Record<string, any>
  resolved: boolean
  timestamp: Date
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
  | 'factual'

export interface AIPosition {
  start: number
  end: number
  line?: number
  column?: number
}

// AI Suggestion System Types
export interface AISuggestion {
  id: string
  type: AISuggestionType
  text: string
  reason: string
  confidence: number
  position?: AIPosition
  alternatives?: string[]
  applied: boolean
  timestamp: Date
}

export type AISuggestionType = 
  | 'completion'
  | 'alternative'
  | 'enhancement'
  | 'correction'
  | 'expansion'
  | 'simplification'

// Smart Suggestions System Types
export interface SmartSuggestionConfig {
  enabled: boolean
  triggers: SuggestionTrigger[]
  debounceMs: number
  minCharacters: number
  maxSuggestions: number
  contextWindow: number
}

export interface SuggestionTrigger {
  type: 'timer' | 'punctuation' | 'newline' | 'selection' | 'explicit'
  config?: Record<string, any>
}

export interface SmartSuggestion {
  id: string
  type: 'completion' | 'rephrase' | 'expand' | 'summarize' | 'continue'
  text: string
  displayText?: string
  confidence: number
  provider: AIProvider
  metadata?: Record<string, any>
}

// AI Generation History
export interface AIGeneration {
  id: string
  prompt: string
  response: string
  provider: AIProvider
  model: string
  context?: AIContext
  options?: AIGenerationOptions
  usage?: TokenUsage
  rating?: number
  tags?: string[]
  timestamp: Date
}

// AI User Preferences
export interface AIUserPreferences {
  defaultProvider?: AIProvider
  defaultModel?: string
  autoSuggest: boolean
  suggestionDelay: number
  showConfidence: boolean
  showCitations: boolean
  streamResponses: boolean
  saveHistory: boolean
  maxHistoryItems: number
  preferredTone?: AIGenerationOptions['tone']
  blockedProviders?: AIProvider[]
}

// AI Session Management
export interface AISession {
  id: string
  userId: string
  projectId?: string
  documentId?: string
  generations: AIGeneration[]
  feedback: AIFeedback[]
  suggestions: AISuggestion[]
  startTime: Date
  endTime?: Date
  metadata?: Record<string, any>
}

// AI Analytics and Monitoring
export interface AIAnalytics {
  totalGenerations: number
  totalTokensUsed: number
  totalCost: number
  averageLatency: number
  providerUsage: Record<AIProvider, number>
  featureUsage: Record<AICapability, number>
  userSatisfaction?: number
  errorRate: number
}

// AI Service State Management
export interface AIServiceState {
  initialized: boolean
  providers: Record<AIProvider, AIProviderState>
  activeRequests: Map<string, AIRequest>
  requestQueue: AIRequest[]
  cache: Map<string, AIResponse>
  rateLimits: Map<AIProvider, AIRateLimit>
}

export interface AIProviderState {
  available: boolean
  healthy: boolean
  lastHealthCheck: Date
  activeModels: string[]
  error?: AIError
}

export interface AIRateLimit {
  requestsPerMinute: number
  requestsRemaining: number
  resetsAt: Date
  tokensPerMinute?: number
  tokensRemaining?: number
}

// AI Event System for Real-time Updates
export interface AIEvent {
  type: AIEventType
  data: any
  timestamp: Date
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
  | 'cache.miss'

// AI Model Configuration
export interface AIModelConfig {
  provider: AIProvider
  modelId: string
  displayName: string
  capabilities: AICapability[]
  contextWindow: number
  maxOutputTokens: number
  costPer1kTokens: {
    input: number
    output: number
  }
  supportedLanguages?: string[]
  specializations?: string[]
}

// Enhanced Hook Types
export interface UseSmartSuggestionsOptions {
  editor: any  // TipTap Editor instance
  enabled?: boolean
  debounceMs?: number
  minCharacters?: number
  maxSuggestions?: number
}

export interface UseSmartSuggestionsReturn {
  triggerSuggestions: () => void
  clearSuggestions: () => void
  toggleSmartSuggestions: () => void
  isEnabled: boolean
}

// Type Guards and Utilities
export const isAIError = (response: any): response is AIError => {
  return response && typeof response.code === 'string' && typeof response.message === 'string'
}

export const isAIResponse = (response: any): response is AIResponse => {
  return response && typeof response.id === 'string' && (typeof response.content === 'string' || typeof response.data === 'string')
}

export const hasStreamingCapability = (provider: AIProviderConfig): boolean => {
  return provider.capabilities.includes('streaming')
}

// Advanced Service Interfaces
export interface IAdvancedAIService extends IAIService {
  generateFeedback(content: string, context: AIContext): Promise<AIFeedback[]>
  generateSuggestions(content: string, context: AIContext): Promise<AISuggestion[]>
  generateSmartSuggestions(content: string, position: number, context: AIContext): Promise<SmartSuggestion[]>
  healthCheck(): Promise<Record<AIProvider, boolean>>
  getAnalytics(): AIAnalytics
}

// Circuit Breaker Pattern Types
export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failureCount: number
  lastFailureTime?: Date
  nextAttempt?: Date
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeout: number
  monitoringPeriod: number
}