export interface GhostTextSuggestion {
  id: string;
  text: string;
  confidence: number;
}

export interface GhostTextState {
  isVisible: boolean;
  suggestion: GhostTextSuggestion | null;
  position: { line: number; column: number } | null;
}

export interface GhostTextSettings {
  enabled: boolean;
  delay: number;
  maxLength: number;
}

export const DEFAULT_GHOST_TEXT_SETTINGS: GhostTextSettings = {
  enabled: true,
  delay: 500,
  maxLength: 200,
};
