import { Editor } from '@tiptap/react'
import { User } from '@supabase/supabase-js'
import { WebSocketStatus } from '@hocuspocus/provider'
import { AIProvider } from '@/lib/ai/types'

// Base editor component props
export interface BaseEditorProps {
  editor: Editor
  className?: string
  disabled?: boolean
}

// Editor user type for collaboration
export interface EditorUser {
  id: string
  name: string
  color: string
  avatar?: string
  cursor?: {
    x: number
    y: number
  }
}

// Analytics data structure
export interface AnalyticsData {
  characters: number
  charactersNoSpaces: number
  words: number
  sentences: number
  paragraphs: number
  readingTime: number
  readabilityScore: number
  averageWordsPerSentence: number
  averageSentencesPerParagraph: number
  mostUsedWords: Array<{ word: string; count: number }>
}

// AI action configuration
export interface AIAction {
  id: string
  name: string
  description: string
  icon: string
  category: 'basic' | 'tone' | 'style' | 'structure'
  provider?: AIProvider
  prompt: (selectedText: string, context?: string) => string
  shortcut?: string
  enabled?: boolean
}

// AI provider option
export interface AIProviderOption {
  id: AIProvider
  name: string
  description: string
  icon: string
  bestFor: string[]
  enabled?: boolean
}

// Color option for formatting
export interface ColorOption {
  name: string
  value: string
  category?: 'text' | 'highlight' | 'background'
}

// Font option
export interface FontOption {
  name: string
  value: string
  category?: 'serif' | 'sans-serif' | 'monospace' | 'cursive'
}

// Component state interfaces
export interface ComponentState {
  isLoading?: boolean
  error?: Error | null
  lastUpdated?: Date
}

export interface AIComponentState extends ComponentState {
  selectedProvider: AIProvider
  isProcessing: boolean
  selectedAction?: AIAction | null
  customPrompt: string
  showSuggestions: boolean
}

export interface FormattingComponentState extends ComponentState {
  activePanel: string | null
  selectedColors: {
    text: string
    highlight: string
    background: string
  }
  selectedFont: FontOption
}

export interface AnalyticsComponentState extends ComponentState {
  isExpanded: boolean
  isAnimating: boolean
  analytics: AnalyticsData
}

// Props interfaces for main components
export interface AIWritingAssistantProps extends BaseEditorProps {
  onActionComplete?: (action: AIAction, result: string) => void
  onError?: (error: Error) => void
  availableProviders?: AIProviderOption[]
  enabledActions?: string[]
}

export interface AdvancedFormattingProps extends BaseEditorProps {
  onFormatApplied?: (format: string, value: any) => void
  availableColors?: ColorOption[]
  availableFonts?: FontOption[]
}

export interface WritingAnalyticsProps extends BaseEditorProps {
  onAnalyticsUpdate?: (analytics: AnalyticsData) => void
  autoUpdate?: boolean
  updateInterval?: number
}

export interface EditorHeaderProps {
  editor?: Editor
  user?: User | null
  characters: number
  words: number
  collabState: WebSocketStatus
  users: EditorUser[]
  isSidebarOpen?: boolean
  toggleSidebar?: () => void
  onSave?: () => Promise<void>
  hasUnsavedChanges?: boolean
  lastSaved?: Date | null
}

// Loading state interfaces
export interface LoadingState {
  isLoading: boolean
  progress?: number
  message?: string
  type?: 'initial' | 'saving' | 'processing' | 'syncing'
}

export interface ErrorState {
  hasError: boolean
  error?: Error
  errorCode?: string
  retryable?: boolean
  onRetry?: () => void
}

// Performance optimization types
export interface PerformanceConfig {
  enableVirtualization?: boolean
  debounceMs?: number
  throttleMs?: number
  maxHistorySize?: number
  enableMemoization?: boolean
}

// Accessibility configuration
export interface AccessibilityConfig {
  enableKeyboardShortcuts?: boolean
  announceChanges?: boolean
  reduceMotion?: boolean
  highContrast?: boolean
  shortcuts?: Record<string, string>
}

// Theme configuration
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto'
  primaryColor?: string
  fontFamily?: string
  fontSize?: number
  spacing?: 'compact' | 'normal' | 'comfortable'
}

// Component configuration interfaces
export interface ComponentConfig {
  performance?: PerformanceConfig
  accessibility?: AccessibilityConfig
  theme?: ThemeConfig
  debug?: boolean
}

// Main editor configuration
export interface EditorConfig extends ComponentConfig {
  collaboration?: {
    enabled: boolean
    provider?: any
    userColor?: string
    userName?: string
  }
  ai?: {
    enabled: boolean
    defaultProvider: AIProvider
    enabledProviders: AIProvider[]
    enableSmartSuggestions: boolean
  }
  analytics?: {
    enabled: boolean
    autoUpdate: boolean
    updateInterval: number
  }
  formatting?: {
    enableAdvanced: boolean
    availableColors: ColorOption[]
    availableFonts: FontOption[]
  }
}

// Event interfaces
export interface EditorEvent {
  type: string
  timestamp: Date
  data?: any
}

export interface AIEvent extends EditorEvent {
  type: 'ai_action_started' | 'ai_action_completed' | 'ai_action_failed' | 'ai_provider_changed'
  provider?: AIProvider
  action?: string
  duration?: number
}

export interface AnalyticsEvent extends EditorEvent {
  type: 'analytics_updated' | 'analytics_exported'
  analytics?: AnalyticsData
}

export interface FormattingEvent extends EditorEvent {
  type: 'format_applied' | 'format_removed'
  format?: string
  value?: any
}

// Hook return types
export interface UseEditorReturn {
  editor: Editor | null
  isLoading: boolean
  error: Error | null
  config: EditorConfig
  updateConfig: (config: Partial<EditorConfig>) => void
}

export interface UseAIAssistantReturn {
  executeAction: (action: AIAction) => Promise<void>
  executeCustomPrompt: (prompt: string) => Promise<void>
  isProcessing: boolean
  error: Error | null
  lastAction: AIAction | null
}

export interface UseFormattingReturn {
  applyFormat: (format: string, value: any) => void
  removeFormat: (format: string) => void
  getCurrentFormats: () => Record<string, any>
  isFormatActive: (format: string) => boolean
}

export interface UseAnalyticsReturn {
  analytics: AnalyticsData
  isCalculating: boolean
  error: Error | null
  recalculate: () => void
  exportData: (format: 'json' | 'csv' | 'txt') => void
}

// Validation schemas (for runtime validation)
export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array'
    required?: boolean
    default?: any
    validator?: (value: any) => boolean
    message?: string
  }
}

export const AI_ACTION_SCHEMA: ValidationSchema = {
  id: { type: 'string', required: true },
  name: { type: 'string', required: true },
  description: { type: 'string', required: true },
  icon: { type: 'string', required: true },
  category: { type: 'string', required: true },
  provider: { type: 'string', required: false },
  prompt: { type: 'object', required: true }
}

export const ANALYTICS_DATA_SCHEMA: ValidationSchema = {
  characters: { type: 'number', required: true, default: 0 },
  words: { type: 'number', required: true, default: 0 },
  sentences: { type: 'number', required: true, default: 0 },
  paragraphs: { type: 'number', required: true, default: 0 },
  readingTime: { type: 'number', required: true, default: 0 },
  readabilityScore: { type: 'number', required: true, default: 0 }
}

// Re-export common types
export type { Editor } from '@tiptap/react'
export type { User } from '@supabase/supabase-js'
export type { WebSocketStatus } from '@hocuspocus/provider'