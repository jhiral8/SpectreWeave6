/**
 * AI Agent Registry
 * 
 * Central configuration for all AI writing agents in SpectreWeave6.
 * Each agent has specific capabilities, settings, and UI configuration.
 */

import { AgentConfig, AgentId, AgentCategory } from './types';

export const AGENT_CONFIGS: Record<AgentId, AgentConfig> = {
  'ghost-writer': {
    id: 'ghost-writer',
    name: 'Ghost Writer',
    description: 'Continue your story with AI-generated prose',
    icon: '✍️',
    category: 'generation',
    canRunInBackground: false,
    requiresSelection: false,
    maxTokens: 1500,
    temperature: 0.7,
    showInToolbar: true,
    shortcut: '⌘⇧G',
    capabilities: [
      'Continue narrative from cursor position',
      'Match existing voice and style',
      'Maintain character consistency',
      'Follow established plot threads',
      'Generate 200-400 words per request',
    ],
  },

  'style-coach': {
    id: 'style-coach',
    name: 'Style Coach',
    description: 'Analyze and improve your writing style',
    icon: '📝',
    category: 'analysis',
    canRunInBackground: true,
    requiresSelection: false,
    maxTokens: 1000,
    temperature: 0.3,
    showInToolbar: true,
    shortcut: '⌘⇧S',
    capabilities: [
      'Identify passive voice usage',
      'Flag adverb overuse',
      'Detect repetitive sentence structures',
      'Suggest stylistic improvements',
      'Track voice consistency',
      'Analyze readability metrics',
    ],
  },

  'character-keeper': {
    id: 'character-keeper',
    name: 'Character Keeper',
    description: 'Ensure character consistency throughout your story',
    icon: '👤',
    category: 'consistency',
    canRunInBackground: true,
    requiresSelection: false,
    maxTokens: 800,
    temperature: 0.2,
    showInToolbar: false,
    capabilities: [
      'Track character appearances',
      'Verify dialogue attribution',
      'Check physical description consistency',
      'Monitor character arc progression',
      'Flag out-of-character behavior',
    ],
  },

  'plot-analyst': {
    id: 'plot-analyst',
    name: 'Plot Analyst',
    description: 'Analyze narrative structure and coherence',
    icon: '📊',
    category: 'analysis',
    canRunInBackground: false,
    requiresSelection: false,
    maxTokens: 1200,
    temperature: 0.3,
    showInToolbar: true,
    shortcut: '⌘⇧P',
    capabilities: [
      'Identify plot holes',
      'Track story threads',
      'Analyze pacing issues',
      'Check causality chains',
      'Suggest plot improvements',
      'Map narrative arcs',
    ],
  },

  'dialogue-master': {
    id: 'dialogue-master',
    name: 'Dialogue Master',
    description: 'Generate natural, character-appropriate dialogue',
    icon: '💬',
    category: 'generation',
    canRunInBackground: false,
    requiresSelection: false,
    maxTokens: 1000,
    temperature: 0.8,
    showInToolbar: true,
    shortcut: '⌘⇧D',
    capabilities: [
      'Generate dialogue exchanges',
      'Maintain character voice',
      'Add subtext and tension',
      'Balance dialogue with action beats',
      'Create realistic conversation flow',
    ],
  },

  'world-builder': {
    id: 'world-builder',
    name: 'World Builder',
    description: 'Maintain world-building consistency',
    icon: '🌍',
    category: 'consistency',
    canRunInBackground: true,
    requiresSelection: false,
    maxTokens: 800,
    temperature: 0.2,
    showInToolbar: false,
    capabilities: [
      'Track location details',
      'Verify timeline consistency',
      'Check technology/magic system rules',
      'Monitor cultural consistency',
      'Flag anachronisms',
      'Map world elements',
    ],
  },
};

/**
 * Get configuration for a specific agent
 */
export function getAgentConfig(id: AgentId): AgentConfig {
  return AGENT_CONFIGS[id];
}

/**
 * Get all agent configurations as an array
 */
export function getAllAgents(): AgentConfig[] {
  return Object.values(AGENT_CONFIGS);
}

/**
 * Get agents filtered by category
 */
export function getAgentsByCategory(category: AgentCategory): AgentConfig[] {
  return Object.values(AGENT_CONFIGS).filter(agent => agent.category === category);
}

/**
 * Get agents that should appear in the toolbar
 */
export function getToolbarAgents(): AgentConfig[] {
  return Object.values(AGENT_CONFIGS).filter(agent => agent.showInToolbar);
}

/**
 * Get agents that can run in the background
 */
export function getBackgroundAgents(): AgentConfig[] {
  return Object.values(AGENT_CONFIGS).filter(agent => agent.canRunInBackground);
}

/**
 * Get all agent IDs
 */
export function getAgentIds(): AgentId[] {
  return Object.keys(AGENT_CONFIGS) as AgentId[];
}
