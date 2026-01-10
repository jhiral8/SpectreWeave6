/**
 * AI Agent Types for SpectreWeave6
 * 
 * Defines the type system for AI writing agents that assist with:
 * - Content generation (Ghost Writer, Dialogue Master)
 * - Style analysis (Style Coach)
 * - Consistency checking (Character Keeper, World Builder, Plot Analyst)
 */

export type AgentId =
  | 'ghost-writer'
  | 'style-coach'
  | 'character-keeper'
  | 'plot-analyst'
  | 'dialogue-master'
  | 'world-builder';

export type AgentStatus = 'idle' | 'working' | 'success' | 'error';

export type AgentCategory = 'generation' | 'analysis' | 'consistency';

export interface AgentConfig {
  id: AgentId;
  name: string;
  description: string;
  icon: string;
  category: AgentCategory;
  
  // Execution settings
  canRunInBackground: boolean;
  requiresSelection: boolean;
  maxTokens: number;
  temperature: number;
  
  // UI settings
  showInToolbar: boolean;
  shortcut?: string;
  
  // Capabilities (shown in tooltip)
  capabilities: string[];
}

export interface AgentTask {
  id: string;
  agentId: AgentId;
  status: AgentStatus;
  input: AgentInput;
  output?: AgentOutput;
  startTime: Date;
  endTime?: Date;
  error?: string;
  progress?: number;
}

export interface AgentInput {
  type: 'selection' | 'cursor' | 'chapter' | 'document';
  content: string;
  context: AgentContext;
  parameters?: Record<string, unknown>;
}

export interface AgentContext {
  /** Current chapter title */
  chapter?: string;
  /** Current scene title */
  scene?: string;
  /** Known characters in the story */
  characters?: string[];
  /** Text before the cursor/selection (for context) */
  previousText?: string;
  /** Text after the cursor/selection */
  followingText?: string;
  /** Word count of selected/target content */
  wordCount?: number;
  /** Document title */
  documentTitle?: string;
}

export type AgentOutputType = 'text' | 'suggestion' | 'analysis' | 'problems';

export interface AgentOutput {
  type: AgentOutputType;
  content: string;
  metadata?: AgentOutputMetadata;
  actions?: AgentAction[];
  problems?: AgentProblem[];
}

export interface AgentOutputMetadata {
  tokensUsed?: number;
  model?: string;
  confidence?: number;
  processingTime?: number;
}

export interface AgentAction {
  id: string;
  label: string;
  type: 'insert' | 'replace' | 'append' | 'navigate' | 'dismiss' | 'copy' | 'apply';
  payload: unknown;
  icon?: string;
}

export interface AgentProblem {
  id: string;
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  message: string;
  description?: string;
  location?: {
    start: number;
    end: number;
    line?: number;
  };
  suggestions?: string[];
}

// Event types for agent lifecycle
export type AgentEventType = 
  | 'agent:start'
  | 'agent:progress'
  | 'agent:complete'
  | 'agent:error'
  | 'agent:cancel';

export interface AgentEvent {
  type: AgentEventType;
  task: AgentTask;
  timestamp: Date;
}

// Callback types
export type OnAgentStart = (task: AgentTask) => void;
export type OnAgentProgress = (task: AgentTask, progress: number) => void;
export type OnAgentComplete = (task: AgentTask, output: AgentOutput) => void;
export type OnAgentError = (task: AgentTask, error: string) => void;
