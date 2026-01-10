// IDE Components
export { IDEShell } from './IDEShell';
export { ActivityBar } from './ActivityBar/ActivityBar';
export { ActivityBarItem } from './ActivityBar/ActivityBarItem';
export { StatusBar } from './StatusBar/StatusBar';
export { RightPanelContent } from './RightPanelContent';

// Panel System
export { PanelProvider, usePanels } from './PanelSystem/PanelContext';
export { ResizablePanel } from './PanelSystem/ResizablePanel';
export type {
  PanelLayout,
  PanelPosition,
  LeftPanelView,
  RightPanelView,
  BottomPanelView,
  PanelState,
  LeftPanelState,
  RightPanelState,
  BottomPanelState,
} from './PanelSystem/types';

// Theme System
export { ThemeProvider, useTheme, THEMES } from './Theme/ThemeProvider';
export { ThemePicker } from './Theme/ThemePicker';
export type { ThemeId, ThemeConfig } from './Theme/ThemeProvider';

// Story Explorer
export { StoryExplorer } from './StoryExplorer/StoryExplorer';
export { StoryTree, TreeEmptyState, TreeLoadingSkeleton } from './StoryExplorer/StoryTree';
export { StoryTreeNode } from './StoryExplorer/StoryTreeNode';
export type { 
  StoryNode, 
  StoryNodeType, 
  StoryNodeMetadata, 
  AISuggestion,
  ExplorerTab,
} from './StoryExplorer/types';

// Bottom Panel (AI Feedback)
export { BottomPanel } from './BottomPanel/BottomPanel';
export { ProblemsPanel } from './BottomPanel/ProblemsPanel';
export type {
  WritingProblem,
  ProblemSeverity,
  ProblemType,
  StoryMetrics,
  BottomPanelTab,
} from './BottomPanel/types';

// Editor Tabs
export { EditorTabs } from './EditorTabs/EditorTabs';
export type { EditorTab, EditorTabsState } from './EditorTabs/types';

// AI Agents
export { 
  AIAgentsPanel,
  AgentProvider,
  useAgents,
  useAgent,
  AGENT_CONFIGS,
  getAgentConfig,
  getAllAgents,
  getAgentsByCategory,
  getToolbarAgents,
  // Production API Integration
  ProductionAgentProvider,
  useProductionAgents,
  useProductionAgent,
  // Connection Status
  ConnectionStatusIndicator,
  ConnectionStatusPanel,
} from './AIAgents';

// Agent Reviews
export { AgentReviewsPanel } from './AgentReviews';

export type {
  AgentId,
  AgentStatus,
  AgentCategory,
  AgentConfig,
  AgentTask,
  AgentInput,
  AgentOutput,
  AgentContext,
  AgentProblem,
} from './AIAgents/types';
export type { 
  ConnectionStatus, 
  ProductionAgentConfig 
} from './AIAgents/ProductionAgentProvider';

// Command Palette
export { 
  CommandPalette, 
  commandRegistry,
  defaultCommands,
} from './CommandPalette';
export type { 
  Command, 
  CommandContext, 
  CommandCategory 
} from './CommandPalette/types';

// Keyboard Shortcuts
export {
  shortcutManager,
  useKeyboardShortcuts,
  AGENT_SHORTCUTS,
  PANEL_SHORTCUTS,
  DEFAULT_SHORTCUTS,
  formatKeyBinding,
  matchesBinding,
} from './KeyboardShortcuts';
export type {
  KeyBinding,
  KeyModifier,
  ShortcutContext,
  ShortcutDisplay,
} from './KeyboardShortcuts/types';

// Ghost Text
export {
  useGhostText,
  GhostTextOverlay,
  InlineGhostText,
  StreamingGhostText,
  DEFAULT_GHOST_TEXT_SETTINGS,
} from './GhostText';
export type {
  GhostTextSuggestion,
  GhostTextState,
  GhostTextSettings,
} from './GhostText/types';

// Editor Integration
export {
  useEditorAgentContext,
  AgentResultActions,
  AgentResultPanel,
  InlineSuggestion,
} from './EditorIntegration';
export type {
  EditorSelection,
  EditorCursor,
  EditorContent,
  SurroundingContext,
  StoryContext,
  EditorContextSnapshot,
} from './EditorIntegration/types';

// AI Writing Surface
export { AIWritingSurface } from './AIWritingSurface';

// World Building
export { WorldBuildingPanel } from './WorldBuilding';
export type { StoryLocation } from './WorldBuilding';

// Notes Panel
export { NotesPanel } from './Notes';
export type { StoryNote } from './Notes';

// VS Code Copilot Panel (New VS Code-style AI Chat)
export {
  VSCodeCopilotPanel,
  VSCodeCopilotWrapper,
  CopilotHeader,
  ContextChips,
  ChatMessage,
  ChatMessages,
  ChatInput,
} from './VSCodeCopilot';
export type {
  ChatRole,
  CopilotTab,
  ContextChipType,
  ContextChip,
  ChatMessageData,
  AgentOption,
} from './VSCodeCopilot/types';
// AI Copilot Panel (AI Cowriter)
export { 
  AICopilotPanel,
  AICowriterPanel
} from './AICopilotPanel';
export type { 
  AIModel, 
  CopilotTool,
  CopilotContext,
  CopilotMessage
} from './AICopilotPanel/types';

// Framework Wizard
export { FrameworkWizard } from './FrameworkWizard';

// Framework Editor
export { FrameworkEditor } from './FrameworkEditor';
export type { FrameworkData } from './FrameworkEditor';

// Story Framework Builder
export { FrameworkBuilder } from './FrameworkBuilder';

// Outline Builder
export { OutlineBuilder } from './OutlineBuilder';
