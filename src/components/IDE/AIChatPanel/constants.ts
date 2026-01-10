/**
 * AI Chat Panel Constants
 *
 * Quick actions and configuration for the Ghost Writer panel.
 */

import {
  Wand2,
  MessageSquare,
  Sparkles,
  RefreshCw,
  FileText,
  Zap,
} from 'lucide-react';
import type { QuickAction } from './types';

/**
 * Default quick actions for the Ghost Writer panel
 */
export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'continue',
    label: 'Continue',
    icon: Wand2,
    prompt:
      'Continue writing from where I left off, maintaining the same voice, tone, and style. Keep the narrative flowing naturally.',
  },
  {
    id: 'improve',
    label: 'Improve',
    icon: Sparkles,
    prompt:
      'Review my selected text and suggest improvements for clarity, flow, and impact while preserving my voice.',
    requiresSelection: true,
  },
  {
    id: 'rephrase',
    label: 'Rephrase',
    icon: RefreshCw,
    prompt:
      'Rephrase the selected text to express the same meaning in a different way, keeping the tone consistent.',
    requiresSelection: true,
  },
  {
    id: 'dialogue',
    label: 'Dialogue',
    icon: MessageSquare,
    prompt:
      'Help me write dialogue for this scene. Consider the characters involved and the emotional context.',
  },
  {
    id: 'describe',
    label: 'Describe',
    icon: FileText,
    prompt:
      'Write a vivid description for this scene, focusing on sensory details that immerse the reader.',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    icon: Zap,
    prompt:
      'Brainstorm ideas for what could happen next in this story. Give me 3-5 creative directions.',
  },
];

/**
 * Starter actions shown in the welcome state
 */
export const STARTER_ACTIONS: QuickAction[] = [
  QUICK_ACTIONS[0], // Continue
  QUICK_ACTIONS[3], // Dialogue
  QUICK_ACTIONS[4], // Describe
  QUICK_ACTIONS[5], // Brainstorm
];

/**
 * Default placeholder for chat input
 */
export const INPUT_PLACEHOLDER = 'Ask the Ghost Writer...';

/**
 * Panel title
 */
export const PANEL_TITLE = 'Ghost Writer';

/**
 * Welcome message for empty state
 */
export const WELCOME_MESSAGE = {
  title: 'Welcome to Ghost Writer',
  description:
    "I'm your AI writing assistant. I can help you continue your story, write dialogue, describe scenes, and brainstorm ideas. How can I help you today?",
};

/**
 * Generation indicator text
 */
export const GENERATING_TEXT = 'Writing...';

/**
 * Context bar labels
 */
export const CONTEXT_LABELS = {
  chapter: 'Chapter',
  scene: 'Scene',
  characters: 'Characters',
  noContext: 'No context detected',
};

/**
 * Action button labels
 */
export const ACTION_LABELS = {
  insert: 'Insert',
  copy: 'Copy',
  copied: 'Copied!',
  regenerate: 'Regenerate',
  send: 'Send',
  clear: 'Clear chat',
  settings: 'Settings',
};

/**
 * Timing constants (in ms)
 */
export const TIMING = {
  /** Debounce for context updates */
  contextDebounce: 500,
  /** Duration to show "Copied!" feedback */
  copiedFeedback: 2000,
  /** Auto-scroll delay after new message */
  autoScrollDelay: 100,
};

/**
 * Size limits
 */
export const LIMITS = {
  /** Max characters per message content */
  maxMessageLength: 50000,
  /** Max characters for selected text context */
  maxSelectedText: 10000,
  /** Word count threshold for "long message" collapse */
  longMessageThreshold: 500,
};
