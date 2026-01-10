// Ghost Text Types
// Inline AI suggestions that appear as semi-transparent text

export interface GhostTextSuggestion {
  // Unique ID
  id: string;
  // The suggested text
  text: string;
  // Position where it should appear
  position: number;
  // Source agent
  agentId?: string;
  // Confidence score (0-1)
  confidence?: number;
  // Timestamp
  createdAt: number;
}

export interface GhostTextState {
  // Current visible suggestion
  currentSuggestion: GhostTextSuggestion | null;
  // Is a suggestion being generated?
  isGenerating: boolean;
  // Queue of pending suggestions
  queue: GhostTextSuggestion[];
  // Settings
  settings: GhostTextSettings;
}

export interface GhostTextSettings {
  // Is ghost text enabled?
  enabled: boolean;
  // Delay before showing suggestion (ms)
  delay: number;
  // Minimum characters typed before triggering
  minChars: number;
  // Auto-trigger on pause?
  autoTrigger: boolean;
  // Trigger phrases (e.g., "..." or incomplete sentences)
  triggerPhrases: string[];
}

export const DEFAULT_GHOST_TEXT_SETTINGS: GhostTextSettings = {
  enabled: true,
  delay: 1000,
  minChars: 10,
  autoTrigger: true,
  triggerPhrases: ['...', '—', 'and then', 'suddenly', 'but'],
};

// Actions for ghost text
export type GhostTextAction =
  | { type: 'ACCEPT' }           // Tab to accept
  | { type: 'ACCEPT_WORD' }      // Ctrl+Right to accept one word
  | { type: 'DISMISS' }          // Escape to dismiss
  | { type: 'NEXT' }             // Alt+] for next suggestion
  | { type: 'PREVIOUS' }         // Alt+[ for previous suggestion
  | { type: 'TRIGGER' }          // Manually trigger generation
  | { type: 'SET_SUGGESTION'; suggestion: GhostTextSuggestion }
  | { type: 'CLEAR' };
