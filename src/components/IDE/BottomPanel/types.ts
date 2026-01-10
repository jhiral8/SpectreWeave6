// AI Feedback Panel Types

export type ProblemSeverity = 'error' | 'warning' | 'info' | 'suggestion';
export type ProblemType = 
  | 'character-consistency'
  | 'plot-hole'
  | 'timeline-conflict'
  | 'style-issue'
  | 'pacing'
  | 'pov-shift'
  | 'grammar'
  | 'passive-voice'
  | 'adverb-overuse'
  | 'repetition'
  | 'show-dont-tell';

export interface WritingProblem {
  id: string;
  severity: ProblemSeverity;
  type: ProblemType;
  message: string;
  description?: string;
  chapter?: string;
  scene?: string;
  line?: number;
  column?: number;
  position?: { from: number; to: number };
  suggestion?: string;
  fixable?: boolean;
  source: 'ai-analysis' | 'rule-based' | 'user-reported';
}

export interface StoryMetrics {
  wordCount: number;
  chapterCount: number;
  sceneCount: number;
  characterMentions: Record<string, number>;
  pacing: {
    actionPercent: number;
    dialoguePercent: number;
    descriptionPercent: number;
  };
  styleMetrics: {
    passiveVoicePercent: number;
    averageSentenceLength: number;
    adverbDensity: number;
    dialogueTagVariety: number;
  };
}

export interface AIOutputEntry {
  id: string;
  timestamp: Date;
  type: 'generation' | 'analysis' | 'suggestion' | 'thinking';
  content: string;
  metadata?: {
    tokensUsed?: number;
    model?: string;
    duration?: number;
  };
}

export interface AIHistoryEntry {
  id: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  content: string;
  attachments?: { type: string; name: string }[];
}

// Filter and grouping
export type ProblemFilter = 'all' | 'errors' | 'warnings' | 'info' | 'suggestions';
export type GroupBy = 'severity' | 'chapter' | 'type';

// Tab config
export type BottomPanelTab = 'problems' | 'ai-output' | 'story-analysis' | 'history';

export interface TabConfig {
  id: BottomPanelTab;
  label: string;
  icon: string;
  badgeCount?: number;
}
