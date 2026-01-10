/**
 * Panel System Types
 * Defines the structure for VS Code-style panel management
 */

export type PanelPosition = 'left' | 'right' | 'bottom' | 'editor';

export type LeftPanelView = 
  | 'story-explorer'
  | 'characters'
  | 'notes'
  | 'world'
  | 'search'
  | 'ai-agents'
  | 'settings';

export type RightPanelView = 
  | 'ai-chat'
  | 'outline'
  | 'references';

export type BottomPanelView = 
  | 'ai-feedback'
  | 'problems'
  | 'output'
  | 'terminal';

export interface PanelState {
  isVisible: boolean;
  width?: number;  // For left/right panels
  height?: number; // For bottom panel
  activePanel: string | null;
}

export interface LeftPanelState extends PanelState {
  activePanel: LeftPanelView | null;
  width: number;
}

export interface RightPanelState extends PanelState {
  activePanel: RightPanelView | null;
  width: number;
}

export interface BottomPanelState extends PanelState {
  activePanel: BottomPanelView | null;
  height: number;
}

export interface PanelLayout {
  leftPanel: LeftPanelState;
  rightPanel: RightPanelState;
  bottomPanel: BottomPanelState;
}

export const DEFAULT_PANEL_LAYOUT: PanelLayout = {
  leftPanel: {
    isVisible: true,
    width: 280,
    activePanel: 'story-explorer',
  },
  rightPanel: {
    isVisible: true,
    width: 350,
    activePanel: 'ai-chat',
  },
  bottomPanel: {
    isVisible: false,
    height: 250,
    activePanel: null,
  },
};

export const PANEL_CONSTRAINTS = {
  left: {
    min: 200,
    max: 500,
    default: 280,
  },
  right: {
    min: 280,
    max: 600,
    default: 350,
  },
  bottom: {
    min: 150,
    max: 500,
    default: 250,
  },
};
