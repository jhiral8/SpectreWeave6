/**
 * Default Commands
 * 
 * Pre-registered commands for the command palette including
 * AI agents, editor actions, and navigation.
 */

import { Command } from './types';
import { AGENT_CONFIGS, getToolbarAgents, getAllAgents } from '../AIAgents/AgentRegistry';
import type { AgentId } from '../AIAgents/types';

/**
 * AI Agent Commands
 * One command per registered AI agent
 */
export const agentCommands: Command[] = getAllAgents().map(agent => ({
  id: `agent.${agent.id}`,
  label: `AI: ${agent.name}`,
  category: 'agent',
  icon: agent.icon,
  shortcut: agent.shortcut,
  keywords: [
    agent.name.toLowerCase(),
    ...agent.capabilities.map(c => c.toLowerCase().split(' ')).flat(),
    agent.category,
  ],
  description: agent.description,
  execute: async (context) => {
    await context.runAgent(agent.id as AgentId, context.selection || undefined);
    context.closePalette();
  },
}));

/**
 * Quick AI Actions
 * Common AI operations that use specific agents
 */
export const aiCommands: Command[] = [
  {
    id: 'ai.continue',
    label: 'Continue Writing',
    category: 'ai',
    icon: '✍️',
    shortcut: '⌘⇧G',
    keywords: ['continue', 'write', 'generate', 'ghost', 'prose'],
    description: 'Continue the story from current position',
    execute: async (context) => {
      await context.runAgent('ghost-writer', context.previousText);
      context.closePalette();
    },
  },
  {
    id: 'ai.analyze',
    label: 'Analyze Style',
    category: 'ai',
    icon: '📝',
    shortcut: '⌘⇧S',
    keywords: ['analyze', 'style', 'feedback', 'critique', 'review'],
    description: 'Get style feedback on current text',
    execute: async (context) => {
      const content = context.selection || context.previousText;
      await context.runAgent('style-coach', content);
      context.closePalette();
    },
  },
  {
    id: 'ai.dialogue',
    label: 'Generate Dialogue',
    category: 'ai',
    icon: '💬',
    shortcut: '⌘⇧D',
    keywords: ['dialogue', 'conversation', 'talk', 'speak'],
    description: 'Generate character dialogue',
    execute: async (context) => {
      await context.runAgent('dialogue-master', context.selection || context.previousText);
      context.closePalette();
    },
  },
  {
    id: 'ai.plot',
    label: 'Analyze Plot',
    category: 'ai',
    icon: '📊',
    shortcut: '⌘⇧P',
    keywords: ['plot', 'story', 'structure', 'narrative', 'holes'],
    description: 'Check for plot holes and pacing issues',
    execute: async (context) => {
      const content = context.selection || context.previousText;
      await context.runAgent('plot-analyst', content);
      context.closePalette();
    },
  },
  {
    id: 'ai.character',
    label: 'Check Character Consistency',
    category: 'ai',
    icon: '👤',
    keywords: ['character', 'consistency', 'keeper', 'verify'],
    description: 'Verify character details are consistent',
    execute: async (context) => {
      const content = context.selection || context.previousText;
      await context.runAgent('character-keeper', content);
      context.closePalette();
    },
  },
  {
    id: 'ai.world',
    label: 'Check World Consistency',
    category: 'ai',
    icon: '🌍',
    keywords: ['world', 'setting', 'consistency', 'builder'],
    description: 'Verify world-building details',
    execute: async (context) => {
      const content = context.selection || context.previousText;
      await context.runAgent('world-builder', content);
      context.closePalette();
    },
  },
];

/**
 * Editor Commands
 * Text editing and formatting
 */
export const editorCommands: Command[] = [
  {
    id: 'editor.bold',
    label: 'Format: Bold',
    category: 'editor',
    icon: '📝',
    shortcut: '⌘B',
    keywords: ['bold', 'strong', 'format'],
    execute: (context) => {
      // Will be connected to editor
      console.log('Bold command');
      context.closePalette();
    },
  },
  {
    id: 'editor.italic',
    label: 'Format: Italic',
    category: 'editor',
    icon: '📝',
    shortcut: '⌘I',
    keywords: ['italic', 'emphasis', 'format'],
    execute: (context) => {
      console.log('Italic command');
      context.closePalette();
    },
  },
  {
    id: 'editor.heading.chapter',
    label: 'Format: Chapter Heading',
    category: 'editor',
    icon: '📝',
    shortcut: '⌘2',
    keywords: ['heading', 'chapter', 'h2', 'title'],
    execute: (context) => {
      console.log('Chapter heading command');
      context.closePalette();
    },
  },
  {
    id: 'editor.heading.scene',
    label: 'Format: Scene Heading',
    category: 'editor',
    icon: '📝',
    shortcut: '⌘3',
    keywords: ['heading', 'scene', 'h3', 'section'],
    execute: (context) => {
      console.log('Scene heading command');
      context.closePalette();
    },
  },
  {
    id: 'editor.sceneBreak',
    label: 'Insert Scene Break',
    category: 'editor',
    icon: '📝',
    keywords: ['scene', 'break', 'separator', 'divider'],
    description: 'Insert a scene break (***)',
    execute: (context) => {
      context.insertText('\n* * *\n\n');
      context.closePalette();
    },
  },
];

/**
 * View Commands
 * Panel and view management
 */
export const viewCommands: Command[] = [
  {
    id: 'view.storyExplorer',
    label: 'Show Story Explorer',
    category: 'view',
    icon: '📖',
    shortcut: '⌘1',
    keywords: ['story', 'explorer', 'tree', 'manuscript'],
    execute: (context) => {
      context.togglePanel('story-explorer');
      context.closePalette();
    },
  },
  {
    id: 'view.characters',
    label: 'Show Characters Panel',
    category: 'view',
    icon: '👥',
    shortcut: '⌘2',
    keywords: ['characters', 'cast', 'people'],
    execute: (context) => {
      context.togglePanel('characters');
      context.closePalette();
    },
  },
  {
    id: 'view.world',
    label: 'Show World Building',
    category: 'view',
    icon: '🌍',
    shortcut: '⌘3',
    keywords: ['world', 'setting', 'locations'],
    execute: (context) => {
      context.togglePanel('world');
      context.closePalette();
    },
  },
  {
    id: 'view.aiAgents',
    label: 'Show AI Agents',
    category: 'view',
    icon: '🤖',
    shortcut: '⌘5',
    keywords: ['ai', 'agents', 'assistant'],
    execute: (context) => {
      context.togglePanel('ai-agents');
      context.closePalette();
    },
  },
  {
    id: 'view.problems',
    label: 'Show Problems Panel',
    category: 'view',
    icon: '⚠️',
    shortcut: '⌘⇧M',
    keywords: ['problems', 'errors', 'warnings', 'issues'],
    execute: (context) => {
      context.togglePanel('bottom');
      context.closePalette();
    },
  },
  {
    id: 'view.settings',
    label: 'Open Settings',
    category: 'view',
    icon: '⚙️',
    shortcut: '⌘,',
    keywords: ['settings', 'preferences', 'config'],
    execute: (context) => {
      context.togglePanel('settings');
      context.closePalette();
    },
  },
];

/**
 * Navigation Commands
 */
export const navigationCommands: Command[] = [
  {
    id: 'nav.goToChapter',
    label: 'Go to Chapter...',
    category: 'navigation',
    icon: '📍',
    shortcut: '⌘G',
    keywords: ['go', 'chapter', 'navigate', 'jump'],
    description: 'Navigate to a specific chapter',
    execute: (context) => {
      // Would open chapter picker
      console.log('Go to chapter');
      context.closePalette();
    },
  },
  {
    id: 'nav.goToScene',
    label: 'Go to Scene...',
    category: 'navigation',
    icon: '📍',
    shortcut: '⌘⇧G',
    keywords: ['go', 'scene', 'navigate', 'jump'],
    description: 'Navigate to a specific scene',
    execute: (context) => {
      console.log('Go to scene');
      context.closePalette();
    },
  },
  {
    id: 'nav.goToCharacter',
    label: 'Go to Character...',
    category: 'navigation',
    icon: '👤',
    keywords: ['go', 'character', 'person', 'navigate'],
    description: 'Navigate to a character profile',
    execute: (context) => {
      console.log('Go to character');
      context.closePalette();
    },
  },
];

/**
 * All default commands combined
 */
export const defaultCommands: Command[] = [
  ...aiCommands,
  ...agentCommands,
  ...editorCommands,
  ...viewCommands,
  ...navigationCommands,
];
