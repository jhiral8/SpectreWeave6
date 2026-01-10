'use client';

/**
 * VS Code Copilot Chat Types
 * Styling matching VS Code's Copilot Chat panel
 */

export type ChatRole = 'user' | 'assistant' | 'system';

export type CopilotTab = 'chat' | 'edits' | 'agent';

export type ContextChipType = 
  | 'file'       // Current file
  | 'selection'  // Selected text
  | 'character'  // Story character
  | 'scene'      // Current scene
  | 'chapter'    // Current chapter
  | 'framework'  // Story framework
  | 'custom';    // Custom context

export interface ContextChip {
  id: string;
  type: ContextChipType;
  label: string;
  content: string;
  icon?: string;
}

export interface ChatMessageData {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  /** Context chips attached to this message */
  context?: ContextChip[];
  /** Whether message is currently streaming */
  isStreaming?: boolean;
  /** Error message if failed */
  error?: string;
  /** Code blocks in the message */
  codeBlocks?: CodeBlock[];
  /** Agent that generated this (for assistant messages) */
  agent?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

export interface AgentOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  capabilities?: string[];
}

export interface CopilotHeaderProps {
  /** Active tab */
  activeTab: CopilotTab;
  /** Tab change handler */
  onTabChange: (tab: CopilotTab) => void;
  /** Selected agent */
  selectedAgent?: AgentOption;
  /** Agent options */
  agents?: AgentOption[];
  /** Agent change handler */
  onAgentChange?: (agent: AgentOption) => void;
  /** New chat handler */
  onNewChat?: () => void;
}

export interface ContextChipsProps {
  /** Available context chips */
  chips: ContextChip[];
  /** Selected chips */
  selectedChips: string[];
  /** Toggle chip selection */
  onToggleChip: (chipId: string) => void;
  /** Add new chip */
  onAddChip?: () => void;
}

export interface ChatMessageProps {
  message: ChatMessageData;
  /** Copy message content */
  onCopy?: (content: string) => void;
  /** Regenerate response */
  onRegenerate?: (messageId: string) => void;
  /** Insert code into editor */
  onInsertCode?: (code: string) => void;
}

export interface ChatMessagesProps {
  messages: ChatMessageData[];
  isLoading?: boolean;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  onInsertCode?: (code: string) => void;
}

/** AI Model option */
export interface AIModelOption {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

/** Chat mode option */
export type ChatMode = 'ask' | 'edit' | 'agent';

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onAttach?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  /** Current chat mode */
  mode?: ChatMode;
  /** Mode change handler */
  onModeChange?: (mode: ChatMode) => void;
  /** Available models */
  models?: AIModelOption[];
  /** Selected model */
  selectedModel?: AIModelOption;
  /** Model change handler */
  onModelChange?: (model: AIModelOption) => void;
  /** Selected agent */
  selectedAgent?: AgentOption;
  /** Agent change handler */
  onAgentChange?: (agent: AgentOption) => void;
  /** Available agents */
  agents?: AgentOption[];
}

export interface VSCodeCopilotPanelProps {
  /** Initial messages */
  initialMessages?: ChatMessageData[];
  /** Available context chips */
  contextChips?: ContextChip[];
  /** Available agents */
  agents?: AgentOption[];
  /** Message send handler */
  onSendMessage?: (content: string, context: ContextChip[]) => void;
  /** Code insert handler */
  onInsertCode?: (code: string) => void;
  /** New chat handler */
  onNewChat?: () => void;
  /** Panel class name */
  className?: string;
}

/** Default agents for fiction writing */
export const DEFAULT_AGENTS: AgentOption[] = [
  {
    id: 'copilot',
    name: 'Copilot',
    description: 'General writing assistant',
    icon: 'Sparkles',
    capabilities: ['chat', 'edit', 'explain'],
  },
  {
    id: 'story-architect',
    name: 'Story Architect',
    description: 'Plot and structure expert',
    icon: 'Building',
    capabilities: ['framework', 'outline', 'pacing'],
  },
  {
    id: 'character-coach',
    name: 'Character Coach',
    description: 'Character development specialist',
    icon: 'Users',
    capabilities: ['dialogue', 'motivation', 'arc'],
  },
  {
    id: 'prose-polish',
    name: 'Prose Polish',
    description: 'Style and prose refinement',
    icon: 'Wand2',
    capabilities: ['style', 'voice', 'flow'],
  },
  {
    id: 'continuity-checker',
    name: 'Continuity Checker',
    description: 'Consistency and timeline expert',
    icon: 'CheckCircle',
    capabilities: ['timeline', 'facts', 'consistency'],
  },
];

/** Default context chip types */
export const CONTEXT_CHIP_CONFIG: Record<ContextChipType, { label: string; icon: string; color: string }> = {
  file: { label: 'Current File', icon: 'FileText', color: '#519aba' },
  selection: { label: 'Selection', icon: 'TextSelect', color: '#a074c4' },
  character: { label: 'Character', icon: 'User', color: '#4ec9b0' },
  scene: { label: 'Scene', icon: 'Film', color: '#ce9178' },
  chapter: { label: 'Chapter', icon: 'BookOpen', color: '#569cd6' },
  framework: { label: 'Framework', icon: 'Layers', color: '#dcdcaa' },
  custom: { label: 'Custom', icon: 'Plus', color: '#9cdcfe' },
};
