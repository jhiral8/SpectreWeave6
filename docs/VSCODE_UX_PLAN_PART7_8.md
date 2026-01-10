# Part 7: Activity Bar & Status Bar + Part 8: AI Agent System

> **Purpose**: Implement VS Code-style Activity Bar and Status Bar, plus the specialized AI agent infrastructure.

---

## 7.1 Activity Bar Overview

The Activity Bar is the leftmost vertical icon strip in VS Code. For SpectreWeave6:

```
┌────┐
│ 📖 │ ← Story Explorer (manuscript, chapters)
├────┤
│ 👤 │ ← Characters
├────┤
│ 🌍 │ ← World Building
├────┤
│ 🔍 │ ← Search
├────┤
│ 🤖 │ ← AI Agents
├────┤
│    │
│    │ (spacer)
│    │
├────┤
│ ⚙️ │ ← Settings
└────┘
```

---

## 7.2 Activity Bar Component

```typescript
// src/components/IDE/ActivityBar/ActivityBar.tsx

'use client';

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Users,
  Globe,
  Search,
  Bot,
  Settings,
  Sparkles,
} from 'lucide-react';
import { ActivityBarItem } from './ActivityBarItem';
import { usePanels } from '../PanelSystem/PanelContext';
import { Badge } from './Badge';
import { useWritingProblems } from '../BottomPanel/hooks/useWritingProblems';
import { useEditorContext } from '@/components/BlockEditor/context/UnifiedEditorContext';

interface ActivityItem {
  id: string;
  icon: React.ElementType;
  label: string;
  panel: string; // Which panel this opens
  badge?: number | 'dot';
  badgeColor?: string;
}

export const ActivityBar: React.FC = () => {
  const { layout, setActivePanel, togglePanel } = usePanels();
  const { activeEditor } = useEditorContext();
  const { problems } = useWritingProblems(activeEditor);
  
  const errorCount = problems.filter(p => p.severity === 'error').length;

  const topItems: ActivityItem[] = [
    {
      id: 'story-explorer',
      icon: BookOpen,
      label: 'Story Explorer',
      panel: 'story-explorer',
    },
    {
      id: 'characters',
      icon: Users,
      label: 'Characters',
      panel: 'characters',
    },
    {
      id: 'world',
      icon: Globe,
      label: 'World Building',
      panel: 'world',
    },
    {
      id: 'search',
      icon: Search,
      label: 'Search',
      panel: 'search',
    },
    {
      id: 'ai-agents',
      icon: Bot,
      label: 'AI Agents',
      panel: 'ai-agents',
      badge: errorCount > 0 ? errorCount : undefined,
      badgeColor: errorCount > 0 ? 'error' : undefined,
    },
  ];

  const bottomItems: ActivityItem[] = [
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      panel: 'settings',
    },
  ];

  const handleItemClick = useCallback((item: ActivityItem) => {
    if (layout.leftPanel.activePanel === item.panel) {
      // Toggle off if clicking active panel
      togglePanel(item.panel as any);
    } else {
      setActivePanel('left', item.panel as any);
    }
  }, [layout.leftPanel.activePanel, setActivePanel, togglePanel]);

  return (
    <div className={cn(
      'activity-bar flex flex-col w-12 h-full',
      'bg-[--ide-activitybar-bg] border-r border-[--ide-border]'
    )}>
      {/* Top items */}
      <div className="flex-1 flex flex-col py-2">
        {topItems.map((item) => (
          <ActivityBarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={layout.leftPanel.activePanel === item.panel}
            badge={item.badge}
            badgeColor={item.badgeColor}
            onClick={() => handleItemClick(item)}
          />
        ))}
      </div>
      
      {/* Bottom items */}
      <div className="flex flex-col py-2 border-t border-[--ide-border]">
        {bottomItems.map((item) => (
          <ActivityBarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={layout.leftPanel.activePanel === item.panel}
            onClick={() => handleItemClick(item)}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## 7.3 Activity Bar Item Component

```typescript
// src/components/IDE/ActivityBar/ActivityBarItem.tsx

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ActivityBarItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  badge?: number | 'dot';
  badgeColor?: 'error' | 'warning' | 'info';
  onClick: () => void;
}

export const ActivityBarItem: React.FC<ActivityBarItemProps> = ({
  icon: Icon,
  label,
  isActive,
  badge,
  badgeColor,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-12 h-12 flex items-center justify-center',
        'transition-colors group',
        isActive
          ? 'text-[--ide-activitybar-fg]'
          : 'text-[--ide-activitybar-inactive] hover:text-[--ide-activitybar-fg]'
      )}
      title={label}
    >
      {/* Active indicator */}
      {isActive && (
        <div className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2',
          'w-0.5 h-6 bg-[--ide-activitybar-fg]'
        )} />
      )}
      
      {/* Icon */}
      <Icon className="w-6 h-6" />
      
      {/* Badge */}
      {badge !== undefined && (
        <div className={cn(
          'absolute top-2 right-2',
          badge === 'dot'
            ? 'w-2 h-2 rounded-full'
            : 'min-w-[16px] h-4 px-1 rounded-full text-[10px] font-medium flex items-center justify-center',
          badgeColor === 'error' && 'bg-[--ide-error] text-white',
          badgeColor === 'warning' && 'bg-[--ide-warning] text-black',
          badgeColor === 'info' && 'bg-[--ide-info] text-white',
          !badgeColor && 'bg-[--ide-activitybar-badge] text-white'
        )}>
          {badge !== 'dot' && badge}
        </div>
      )}
      
      {/* Tooltip */}
      <div className={cn(
        'absolute left-full ml-2 px-2 py-1 rounded',
        'bg-[--ide-input-bg] text-[--ide-foreground] text-xs whitespace-nowrap',
        'opacity-0 group-hover:opacity-100 pointer-events-none',
        'transition-opacity z-50'
      )}>
        {label}
      </div>
    </button>
  );
};
```

---

## 7.4 Status Bar Component

```typescript
// src/components/IDE/StatusBar/StatusBar.tsx

'use client';

import React, { useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import {
  FileText,
  AlertCircle,
  AlertTriangle,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Bot,
  Sparkles,
  Type,
  Clock,
} from 'lucide-react';
import { useEditorContext } from '@/components/BlockEditor/context/UnifiedEditorContext';
import { useWritingProblems } from '../BottomPanel/hooks/useWritingProblems';
import { usePanels } from '../PanelSystem/PanelContext';

interface StatusBarProps {
  editor: Editor | null;
  project: any;
  user: any;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  editor,
  project,
  user,
}) => {
  const { problems } = useWritingProblems(editor);
  const { togglePanel } = usePanels();
  
  // Calculate stats
  const stats = useMemo(() => {
    if (!editor) return { words: 0, chars: 0, lines: 0 };
    
    const text = editor.getText();
    return {
      words: text.split(/\s+/).filter(w => w.length > 0).length,
      chars: text.length,
      lines: text.split('\n').length,
    };
  }, [editor]);
  
  // Get cursor position
  const cursorPosition = useMemo(() => {
    if (!editor) return { line: 1, col: 1 };
    
    const { $from } = editor.state.selection;
    const doc = editor.state.doc;
    
    let line = 1;
    let col = 1;
    let pos = 0;
    
    doc.descendants((node, nodePos) => {
      if (nodePos >= $from.pos) return false;
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        line++;
        col = 1;
      }
      pos = nodePos;
    });
    
    col = $from.pos - pos;
    
    return { line, col };
  }, [editor]);
  
  // Problem counts
  const errorCount = problems.filter(p => p.severity === 'error').length;
  const warningCount = problems.filter(p => p.severity === 'warning').length;
  
  // Sync status (mock for now)
  const isSynced = true;
  const isOnline = true;
  const aiStatus = 'idle'; // 'idle' | 'working' | 'error'

  return (
    <div className={cn(
      'status-bar h-6 flex items-center px-2',
      'bg-[--ide-statusbar-bg] text-[--ide-statusbar-fg]',
      'text-xs select-none'
    )}>
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Branch/Project indicator */}
        <StatusBarItem 
          icon={FileText}
          label={project?.title || 'Untitled'}
          onClick={() => {/* Show project info */}}
        />
        
        {/* Problems indicator */}
        <StatusBarItem
          icon={errorCount > 0 ? AlertCircle : AlertTriangle}
          label={`${errorCount} ${warningCount}`}
          onClick={() => togglePanel('ai-feedback')}
          className={errorCount > 0 ? 'text-[--ide-error]' : undefined}
        />
      </div>
      
      {/* Center section - spacer */}
      <div className="flex-1" />
      
      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* AI Status */}
        <StatusBarItem
          icon={aiStatus === 'working' ? Sparkles : Bot}
          label={aiStatus === 'working' ? 'AI Writing...' : 'AI Ready'}
          className={cn(
            aiStatus === 'working' && 'animate-pulse',
            aiStatus === 'error' && 'text-[--ide-error]'
          )}
        />
        
        {/* Word count */}
        <StatusBarItem
          icon={Type}
          label={`${stats.words.toLocaleString()} words`}
          onClick={() => {/* Show detailed stats */}}
        />
        
        {/* Cursor position */}
        <StatusBarItem
          label={`Ln ${cursorPosition.line}, Col ${cursorPosition.col}`}
          onClick={() => {/* Show go to line */}}
        />
        
        {/* Sync status */}
        <StatusBarItem
          icon={isSynced ? Cloud : CloudOff}
          label={isSynced ? 'Synced' : 'Saving...'}
          className={!isSynced ? 'animate-pulse' : undefined}
        />
        
        {/* Online status */}
        <StatusBarItem
          icon={isOnline ? Wifi : WifiOff}
          className={!isOnline ? 'text-[--ide-warning]' : undefined}
        />
      </div>
    </div>
  );
};

// Individual status bar item
interface StatusBarItemProps {
  icon?: React.ElementType;
  label?: string;
  onClick?: () => void;
  className?: string;
}

const StatusBarItem: React.FC<StatusBarItemProps> = ({
  icon: Icon,
  label,
  onClick,
  className,
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-1 px-1.5 py-0.5 rounded',
      'hover:bg-[--ide-statusbar-item-hover] transition-colors',
      onClick ? 'cursor-pointer' : 'cursor-default',
      className
    )}
  >
    {Icon && <Icon className="w-3.5 h-3.5" />}
    {label && <span>{label}</span>}
  </button>
);
```

---

# Part 8: AI Agent System

## 8.1 AI Agent Architecture

SpectreWeave6 features specialized AI agents for different writing tasks:

| Agent | Purpose | Trigger |
|-------|---------|---------|
| **Ghost Writer** | Generate prose continuation | Cmd+Shift+C |
| **Style Coach** | Analyze and improve style | Auto / On-demand |
| **Character Keeper** | Maintain character consistency | Background |
| **Plot Analyst** | Check narrative coherence | On-demand |
| **Dialogue Master** | Generate natural dialogue | On-demand |
| **World Builder** | Maintain world consistency | Background |

---

## 8.2 Agent Registry and Types

```typescript
// src/components/IDE/AIAgents/types.ts

export type AgentId = 
  | 'ghost-writer'
  | 'style-coach'
  | 'character-keeper'
  | 'plot-analyst'
  | 'dialogue-master'
  | 'world-builder';

export type AgentStatus = 'idle' | 'working' | 'success' | 'error';

export interface AgentConfig {
  id: AgentId;
  name: string;
  description: string;
  icon: string;
  category: 'generation' | 'analysis' | 'consistency';
  
  // Execution settings
  canRunInBackground: boolean;
  requiresSelection: boolean;
  maxTokens: number;
  temperature: number;
  
  // UI settings
  showInToolbar: boolean;
  shortcut?: string;
  
  // Capabilities
  capabilities: string[];
}

export interface AgentTask {
  id: string;
  agentId: AgentId;
  status: AgentStatus;
  input: AgentInput;
  output?: AgentOutput;
  startTime: Date;
  endTime?: Date;
  error?: string;
  progress?: number;
}

export interface AgentInput {
  type: 'selection' | 'cursor' | 'chapter' | 'document';
  content: string;
  context: {
    chapter?: string;
    scene?: string;
    characters?: string[];
    previousText?: string;
    followingText?: string;
  };
  parameters?: Record<string, any>;
}

export interface AgentOutput {
  type: 'text' | 'suggestion' | 'analysis' | 'problems';
  content: string;
  metadata?: {
    tokensUsed?: number;
    model?: string;
    confidence?: number;
  };
  actions?: AgentAction[];
}

export interface AgentAction {
  id: string;
  label: string;
  type: 'insert' | 'replace' | 'append' | 'navigate';
  payload: any;
}
```

---

## 8.3 Agent Registry

```typescript
// src/components/IDE/AIAgents/AgentRegistry.ts

import { AgentConfig, AgentId } from './types';

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
    shortcut: 'Cmd+Shift+C',
    capabilities: [
      'Continue narrative from cursor position',
      'Match existing voice and style',
      'Maintain character consistency',
      'Follow plot threads',
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
    shortcut: 'Cmd+Shift+S',
    capabilities: [
      'Identify passive voice usage',
      'Flag adverb overuse',
      'Detect repetitive sentence structures',
      'Suggest stylistic improvements',
      'Track voice consistency',
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
    capabilities: [
      'Identify plot holes',
      'Track story threads',
      'Analyze pacing',
      'Check causality chain',
      'Suggest plot improvements',
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
    shortcut: 'Cmd+Shift+D',
    capabilities: [
      'Generate dialogue exchanges',
      'Maintain character voice',
      'Add subtext and tension',
      'Balance dialogue with action',
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
      'Verify time consistency',
      'Check technology/magic rules',
      'Monitor cultural consistency',
      'Flag anachronisms',
    ],
  },
};

export function getAgentConfig(id: AgentId): AgentConfig {
  return AGENT_CONFIGS[id];
}

export function getAgentsByCategory(category: string): AgentConfig[] {
  return Object.values(AGENT_CONFIGS).filter(a => a.category === category);
}

export function getToolbarAgents(): AgentConfig[] {
  return Object.values(AGENT_CONFIGS).filter(a => a.showInToolbar);
}
```

---

## 8.4 Agent Manager Hook

```typescript
// src/components/IDE/AIAgents/hooks/useAgentManager.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
  AgentId, 
  AgentTask, 
  AgentInput, 
  AgentOutput,
  AgentStatus,
} from '../types';
import { getAgentConfig, AGENT_CONFIGS } from '../AgentRegistry';
import { useAI } from '@/hooks/useAI';

interface UseAgentManagerConfig {
  manuscriptEditor: Editor | null;
  frameworkEditor: Editor | null;
}

interface UseAgentManagerReturn {
  // State
  activeTasks: AgentTask[];
  taskHistory: AgentTask[];
  
  // Actions
  runAgent: (agentId: AgentId, input?: Partial<AgentInput>) => Promise<AgentOutput | null>;
  cancelTask: (taskId: string) => void;
  clearHistory: () => void;
  
  // Queries
  isAgentRunning: (agentId: AgentId) => boolean;
  getAgentStatus: (agentId: AgentId) => AgentStatus;
}

export const useAgentManager = ({
  manuscriptEditor,
  frameworkEditor,
}: UseAgentManagerConfig): UseAgentManagerReturn => {
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([]);
  const [taskHistory, setTaskHistory] = useState<AgentTask[]>([]);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  
  const { generateText, generateTextStream } = useAI({ provider: 'gemini' });

  // Build input from editor state
  const buildInput = useCallback((
    agentId: AgentId,
    customInput?: Partial<AgentInput>
  ): AgentInput => {
    const config = getAgentConfig(agentId);
    const editor = manuscriptEditor;
    
    if (!editor) {
      return {
        type: 'document',
        content: '',
        context: {},
        ...customInput,
      };
    }
    
    const { selection, doc } = editor.state;
    const { $from, $to } = selection;
    const selectedText = doc.textBetween($from.pos, $to.pos);
    const hasSelection = selectedText.length > 0;
    
    // Get surrounding context
    const beforeStart = Math.max(0, $from.pos - 1000);
    const afterEnd = Math.min(doc.nodeSize - 2, $to.pos + 500);
    const previousText = doc.textBetween(beforeStart, $from.pos);
    const followingText = doc.textBetween($to.pos, afterEnd);
    
    // Extract chapter/scene from framework
    let chapter = '';
    let scene = '';
    doc.descendants((node, pos) => {
      if (pos > $from.pos) return false;
      if (node.type.name === 'heading') {
        if (node.attrs.level === 2) chapter = node.textContent;
        if (node.attrs.level === 3) scene = node.textContent;
      }
    });
    
    // Extract characters from framework editor
    const characters: string[] = [];
    if (frameworkEditor) {
      const fwText = frameworkEditor.getText();
      const charMatches = fwText.match(/Character:\s*([^\n]+)/gi);
      charMatches?.forEach(m => {
        characters.push(m.replace(/Character:\s*/i, '').trim());
      });
    }
    
    return {
      type: hasSelection ? 'selection' : 'cursor',
      content: hasSelection ? selectedText : previousText.slice(-500),
      context: {
        chapter,
        scene,
        characters,
        previousText: previousText.slice(-300),
        followingText: followingText.slice(0, 200),
      },
      ...customInput,
    };
  }, [manuscriptEditor, frameworkEditor]);

  // Build prompt for agent
  const buildPrompt = useCallback((agentId: AgentId, input: AgentInput): string => {
    const config = getAgentConfig(agentId);
    
    let systemPrompt = '';
    let userPrompt = '';
    
    switch (agentId) {
      case 'ghost-writer':
        systemPrompt = `You are Ghost Writer, an expert fiction author assistant.
Your task is to continue the story seamlessly from where the author left off.
Match the existing voice, style, and tone exactly.
Maintain character consistency and follow established plot threads.
Write vivid, engaging prose with strong sensory details.`;
        
        userPrompt = `Continue this story naturally:

${input.context.previousText}

[Continue from here, writing approximately 200-300 words]`;
        break;
        
      case 'style-coach':
        systemPrompt = `You are Style Coach, an expert editor and writing instructor.
Analyze writing for style issues and provide constructive feedback.
Focus on: passive voice, adverb overuse, repetition, sentence variety, clarity.
Be specific and provide examples from the text.`;
        
        userPrompt = `Analyze this text for style improvements:

"""
${input.content}
"""

Provide specific, actionable feedback.`;
        break;
        
      case 'character-keeper':
        systemPrompt = `You are Character Keeper, ensuring character consistency.
Track physical descriptions, personality traits, speech patterns, and behaviors.
Flag any inconsistencies with established character information.`;
        
        userPrompt = `Check character consistency in this passage:

Known characters: ${input.context.characters?.join(', ') || 'None established'}

Passage:
"""
${input.content}
"""

Report any character inconsistencies.`;
        break;
        
      case 'dialogue-master':
        systemPrompt = `You are Dialogue Master, expert at crafting natural dialogue.
Create conversations that reveal character, advance plot, and feel authentic.
Include subtext, tension, and character-specific voice.
Balance dialogue with action beats and description.`;
        
        userPrompt = `Write dialogue for this scene:

Setting: ${input.context.chapter} - ${input.context.scene}
Characters involved: ${input.context.characters?.join(', ') || 'Unknown'}

Context: ${input.context.previousText}

Write a dialogue exchange that fits naturally here.`;
        break;
        
      case 'plot-analyst':
        systemPrompt = `You are Plot Analyst, expert at narrative structure.
Identify plot holes, pacing issues, and story inconsistencies.
Analyze cause-effect chains and character motivations.
Suggest improvements while respecting the author's vision.`;
        
        userPrompt = `Analyze the plot of this chapter:

${input.content}

Identify any plot issues, inconsistencies, or areas for improvement.`;
        break;
        
      case 'world-builder':
        systemPrompt = `You are World Builder, guardian of world consistency.
Track locations, timelines, rules, and cultural details.
Flag any inconsistencies with established world-building.
Ensure internal logic is maintained.`;
        
        userPrompt = `Check world-building consistency:

${input.content}

Report any world-building inconsistencies or contradictions.`;
        break;
    }
    
    return `${systemPrompt}\n\n${userPrompt}`;
  }, []);

  // Run an agent
  const runAgent = useCallback(async (
    agentId: AgentId,
    customInput?: Partial<AgentInput>
  ): Promise<AgentOutput | null> => {
    const config = getAgentConfig(agentId);
    const input = buildInput(agentId, customInput);
    
    const taskId = `${agentId}-${Date.now()}`;
    const task: AgentTask = {
      id: taskId,
      agentId,
      status: 'working',
      input,
      startTime: new Date(),
    };
    
    setActiveTasks(prev => [...prev, task]);
    
    const abortController = new AbortController();
    abortControllersRef.current.set(taskId, abortController);
    
    try {
      const prompt = buildPrompt(agentId, input);
      
      const response = await generateText(prompt, {
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        signal: abortController.signal,
      });
      
      const output: AgentOutput = {
        type: config.category === 'generation' ? 'text' : 'analysis',
        content: response,
        metadata: {
          model: 'gemini-pro',
          tokensUsed: response.length / 4, // Rough estimate
        },
        actions: config.category === 'generation' ? [
          {
            id: 'insert',
            label: 'Insert at Cursor',
            type: 'insert',
            payload: response,
          },
          {
            id: 'replace',
            label: 'Replace Selection',
            type: 'replace',
            payload: response,
          },
        ] : undefined,
      };
      
      const completedTask: AgentTask = {
        ...task,
        status: 'success',
        output,
        endTime: new Date(),
      };
      
      setActiveTasks(prev => prev.filter(t => t.id !== taskId));
      setTaskHistory(prev => [completedTask, ...prev.slice(0, 49)]);
      
      return output;
    } catch (error: any) {
      const failedTask: AgentTask = {
        ...task,
        status: 'error',
        error: error.message || 'Unknown error',
        endTime: new Date(),
      };
      
      setActiveTasks(prev => prev.filter(t => t.id !== taskId));
      setTaskHistory(prev => [failedTask, ...prev.slice(0, 49)]);
      
      return null;
    } finally {
      abortControllersRef.current.delete(taskId);
    }
  }, [buildInput, buildPrompt, generateText]);

  // Cancel a running task
  const cancelTask = useCallback((taskId: string) => {
    const controller = abortControllersRef.current.get(taskId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(taskId);
    }
    setActiveTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setTaskHistory([]);
  }, []);

  // Query helpers
  const isAgentRunning = useCallback((agentId: AgentId): boolean => {
    return activeTasks.some(t => t.agentId === agentId);
  }, [activeTasks]);

  const getAgentStatus = useCallback((agentId: AgentId): AgentStatus => {
    const activeTask = activeTasks.find(t => t.agentId === agentId);
    if (activeTask) return activeTask.status;
    
    const lastTask = taskHistory.find(t => t.agentId === agentId);
    if (lastTask) return lastTask.status;
    
    return 'idle';
  }, [activeTasks, taskHistory]);

  return {
    activeTasks,
    taskHistory,
    runAgent,
    cancelTask,
    clearHistory,
    isAgentRunning,
    getAgentStatus,
  };
};
```

---

## 8.5 AI Agents Panel

```typescript
// src/components/IDE/AIAgents/AIAgentsPanel.tsx

'use client';

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Bot, 
  Play, 
  Square, 
  History, 
  Sparkles,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { AGENT_CONFIGS, getAgentsByCategory } from './AgentRegistry';
import { AgentConfig, AgentTask, AgentStatus } from './types';
import { useAgentManager } from './hooks/useAgentManager';
import { useEditorContext } from '@/components/BlockEditor/context/UnifiedEditorContext';

export const AIAgentsPanel: React.FC = () => {
  const { manuscriptEditor, frameworkEditor } = useEditorContext();
  
  const {
    activeTasks,
    taskHistory,
    runAgent,
    cancelTask,
    isAgentRunning,
    getAgentStatus,
  } = useAgentManager({
    manuscriptEditor,
    frameworkEditor,
  });

  const handleRunAgent = useCallback(async (agentId: string) => {
    await runAgent(agentId as any);
  }, [runAgent]);

  const generationAgents = getAgentsByCategory('generation');
  const analysisAgents = getAgentsByCategory('analysis');
  const consistencyAgents = getAgentsByCategory('consistency');

  return (
    <div className="ai-agents-panel h-full flex flex-col">
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-3',
        'border-b border-[--ide-border]'
      )}>
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[--ide-activitybar-badge]" />
          <span className="font-medium text-sm">AI Agents</span>
        </div>
        {activeTasks.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-[--ide-info]">
            <Loader2 className="w-3 h-3 animate-spin" />
            {activeTasks.length} running
          </span>
        )}
      </div>
      
      {/* Agent Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Generation Agents */}
        <AgentCategory
          title="✍️ Generation"
          description="Create new content"
          agents={generationAgents}
          isAgentRunning={isAgentRunning}
          getAgentStatus={getAgentStatus}
          onRun={handleRunAgent}
          onCancel={cancelTask}
        />
        
        {/* Analysis Agents */}
        <AgentCategory
          title="📊 Analysis"
          description="Analyze and improve"
          agents={analysisAgents}
          isAgentRunning={isAgentRunning}
          getAgentStatus={getAgentStatus}
          onRun={handleRunAgent}
          onCancel={cancelTask}
        />
        
        {/* Consistency Agents */}
        <AgentCategory
          title="🔍 Consistency"
          description="Background checking"
          agents={consistencyAgents}
          isAgentRunning={isAgentRunning}
          getAgentStatus={getAgentStatus}
          onRun={handleRunAgent}
          onCancel={cancelTask}
        />
      </div>
      
      {/* Task History */}
      {taskHistory.length > 0 && (
        <div className={cn(
          'border-t border-[--ide-border] p-4',
          'max-h-[200px] overflow-y-auto'
        )}>
          <div className="flex items-center gap-2 mb-2">
            <History className="w-3.5 h-3.5 text-[--ide-activitybar-inactive]" />
            <span className="text-xs font-medium text-[--ide-activitybar-inactive]">
              Recent Tasks
            </span>
          </div>
          <div className="space-y-1">
            {taskHistory.slice(0, 5).map((task) => (
              <TaskHistoryItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Agent Category Component
interface AgentCategoryProps {
  title: string;
  description: string;
  agents: AgentConfig[];
  isAgentRunning: (id: string) => boolean;
  getAgentStatus: (id: string) => AgentStatus;
  onRun: (id: string) => void;
  onCancel: (id: string) => void;
}

const AgentCategory: React.FC<AgentCategoryProps> = ({
  title,
  description,
  agents,
  isAgentRunning,
  getAgentStatus,
  onRun,
  onCancel,
}) => (
  <div>
    <h3 className="text-xs font-medium text-[--ide-foreground] mb-1">{title}</h3>
    <p className="text-[10px] text-[--ide-activitybar-inactive] mb-3">{description}</p>
    <div className="space-y-2">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          isRunning={isAgentRunning(agent.id)}
          status={getAgentStatus(agent.id)}
          onRun={() => onRun(agent.id)}
          onCancel={() => onCancel(agent.id)}
        />
      ))}
    </div>
  </div>
);

// Agent Card Component
interface AgentCardProps {
  agent: AgentConfig;
  isRunning: boolean;
  status: AgentStatus;
  onRun: () => void;
  onCancel: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isRunning,
  status,
  onRun,
  onCancel,
}) => (
  <div className={cn(
    'flex items-center gap-3 p-3 rounded-lg',
    'bg-[--ide-input-bg] border border-[--ide-border]',
    'hover:border-[--ide-activitybar-badge] transition-colors'
  )}>
    <span className="text-xl">{agent.icon}</span>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[--ide-foreground]">
          {agent.name}
        </span>
        <StatusIndicator status={status} />
      </div>
      <p className="text-[10px] text-[--ide-activitybar-inactive] truncate">
        {agent.description}
      </p>
      {agent.shortcut && (
        <kbd className="text-[10px] text-[--ide-activitybar-inactive]">
          {agent.shortcut}
        </kbd>
      )}
    </div>
    
    <button
      onClick={isRunning ? onCancel : onRun}
      className={cn(
        'p-2 rounded',
        'transition-colors',
        isRunning
          ? 'bg-[--ide-error]/20 text-[--ide-error] hover:bg-[--ide-error]/30'
          : 'bg-[--ide-activitybar-badge] text-white hover:opacity-90'
      )}
    >
      {isRunning ? (
        <Square className="w-4 h-4" />
      ) : (
        <Play className="w-4 h-4" />
      )}
    </button>
  </div>
);

// Status Indicator
const StatusIndicator: React.FC<{ status: AgentStatus }> = ({ status }) => {
  if (status === 'idle') return null;
  
  const config = {
    working: { icon: Loader2, color: 'text-[--ide-info]', animate: true },
    success: { icon: CheckCircle, color: 'text-[--ide-success]', animate: false },
    error: { icon: XCircle, color: 'text-[--ide-error]', animate: false },
  }[status];
  
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <Icon className={cn(
      'w-3 h-3',
      config.color,
      config.animate && 'animate-spin'
    )} />
  );
};

// Task History Item
const TaskHistoryItem: React.FC<{ task: AgentTask }> = ({ task }) => {
  const agent = AGENT_CONFIGS[task.agentId];
  const duration = task.endTime 
    ? Math.round((task.endTime.getTime() - task.startTime.getTime()) / 1000)
    : null;
  
  return (
    <div className={cn(
      'flex items-center gap-2 text-xs',
      'text-[--ide-activitybar-inactive]'
    )}>
      <span>{agent?.icon}</span>
      <span className="flex-1 truncate">{agent?.name}</span>
      <StatusIndicator status={task.status} />
      {duration !== null && (
        <span>{duration}s</span>
      )}
    </div>
  );
};
```

---

## Part 7 & 8 Summary

### Activity Bar:
- Vertical icon strip on far left
- Quick access to major panels
- Badge indicators for problems
- Tooltip on hover

### Status Bar:
- Project/document name
- Problem count (errors/warnings)
- Word count
- Cursor position
- AI status
- Sync status
- Online indicator

### AI Agent System:
- **6 specialized agents** for different tasks
- **Agent Registry** with capabilities and settings
- **Agent Manager hook** for execution control
- **Real-time status tracking**
- **Task history**
- **Streaming support** for generation
- **Abort capability** for long tasks

---

*Continue to Parts 9-10 for Implementation Timeline and Migration Strategy...*
