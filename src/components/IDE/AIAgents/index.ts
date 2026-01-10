/**
 * AI Agents Module Exports
 * 
 * Central export point for all AI Agent components, hooks, and types.
 */

// Types
export * from './types';

// Registry
export { 
  AGENT_CONFIGS, 
  getAgentConfig, 
  getAllAgents,
  getAgentsByCategory, 
  getToolbarAgents,
  getBackgroundAgents,
  getAgentIds,
} from './AgentRegistry';

// Prompt Builder
export { buildAgentPrompt, formatFullPrompt } from './AgentPromptBuilder';

// Context & Hooks
export { AgentProvider, useAgents, useAgent } from './context/AgentContext';
export { useAgentManager } from './hooks/useAgentManager';

// Production API Integration
export { 
  ProductionAgentProvider, 
  useProductionAgents, 
  useProductionAgent 
} from './ProductionAgentProvider';
export type { ConnectionStatus, ProductionAgentConfig } from './ProductionAgentProvider';

// Connection Status Components
export {
  ConnectionStatusIndicator,
  StatusBarConnectionStatus,
  ConnectionStatusPanel,
} from './ConnectionStatusIndicator';

// Components
export { AIAgentsPanel } from './AIAgentsPanel';
