/**
 * SpectreWeave5 AI System - Complete Export
 * 
 * Comprehensive AI architecture including:
 * - Enhanced type system
 * - Multi-provider service management
 * - Agent orchestration bridge
 * - Context-aware state management
 * - Smart suggestions engine
 * - RAG system with semantic search
 * - AI-powered writing blocks
 * - Analytics and monitoring
 */

// Core Types
export * from './types';

// Advanced AI Service Manager
export { 
  AdvancedAIServiceManager,
  advancedAIServiceManager 
} from './advancedAIServiceManager';

// SpectreWeave AI Bridge
export { 
  SpectreWeaveAIBridge,
  spectreWeaveAIBridge 
} from './spectreWeaveAIBridge';
export type {
  ChapterGenerationRequest,
  ChapterGenerationProgress,
  ChapterGenerationResult,
  StyleProfile,
  NovelFramework,
  ProviderAnalytics,
} from './spectreWeaveAIBridge';

// Advanced AI Context
export { 
  AdvancedAIProvider,
  useAdvancedAI,
  useAIContext 
} from './advancedAIContext';
export type { AIPrompt } from './advancedAIContext';

// RAG System
export { 
  RAGSystem,
  ragSystem 
} from './ragSystem';
export type {
  VectorEmbedding,
  VectorStoreEntry,
  VectorMetadata,
  SearchOptions,
  SearchResult,
  ContextRetrievalOptions,
  RelevantContext,
  NovelFramework as LocalNovelFramework,
} from './ragSystem';

// Analytics and Monitoring
export { 
  AIAnalyticsAndMonitoring,
  aiAnalyticsAndMonitoring 
} from './aiAnalyticsAndMonitoring';
export type {
  AIMetrics,
  PerformanceStats,
  CostAnalytics,
  UsageAnalytics,
  HealthStatus,
  AIAlert,
  MonitoringConfig,
} from './aiAnalyticsAndMonitoring';

// Hooks
export { useAdvancedSmartSuggestions } from '../hooks/useAdvancedSmartSuggestions';
export type {
  UseAdvancedSmartSuggestionsOptions,
  UseAdvancedSmartSuggestionsReturn,
} from '../hooks/useAdvancedSmartSuggestions';

// Components
export {
  AuthorStyleBlock,
  CharacterProfileBlock,
  AIFeedbackBlock,
  AIWritingAssistantPanel,
} from '../components/ai/AIWritingBlocks';

// Re-export commonly used types for convenience
export type {
  AIProvider,
  AIRequest,
  AIResponse,
  AIContext,
  AIFeedback,
  AISuggestion,
  SmartSuggestion,
  AIGeneration,
  AIUserPreferences,
  AISession,
  AIAnalytics,
  AICapability,
  AIGenerationOptions,
  SmartSuggestionConfig,
  SuggestionTrigger,
} from './types';