# Part 4: AI Feedback Panel (Bottom Panel)

> **Purpose**: Transform the existing `WritingFeedback` component into a VS Code-style "Problems" panel that provides real-time AI analysis of writing quality.

---

## 4.1 Bottom Panel Overview

The bottom panel in VS Code contains Problems, Output, Debug Console, and Terminal. For SpectreWeave6, we adapt this to:

| VS Code Tab | SpectreWeave6 Equivalent | Purpose |
|-------------|-------------------------|---------|
| Problems | **Writing Issues** | Style, grammar, consistency errors |
| Output | **AI Output** | AI generation logs, thinking process |
| Debug Console | **Story Analysis** | Narrative coherence, pacing analysis |
| Terminal | **AI Chat History** | Scrollback of AI interactions |

```
┌───────────────────────────────────────────────────────────────────────┐
│ PROBLEMS(12) | AI OUTPUT | STORY ANALYSIS | HISTORY          [─][×] │
├───────────────────────────────────────────────────────────────────────┤
│ 🔴 Chapter 2: Character "Alice" not introduced before use (line 45)  │
│ 🟡 Scene 3: Long sentence detected - consider breaking up (line 89)  │
│ 🔵 Chapter 4: POV shift detected mid-scene (line 156)                │
│ 🟡 General: Passive voice usage high (23%) - target <15%             │
│ ⚪ Suggestion: Add scene break before time jump (line 203)           │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 4.2 Bottom Panel Container

```typescript
// src/components/IDE/BottomPanel/BottomPanel.tsx

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { 
  AlertCircle, 
  Terminal, 
  BookOpen, 
  History,
  ChevronDown,
  ChevronUp,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { ProblemsPanel } from './ProblemsPanel';
import { AIOutputPanel } from './AIOutputPanel';
import { StoryAnalysisPanel } from './StoryAnalysisPanel';
import { AIHistoryPanel } from './AIHistoryPanel';
import { usePanels } from '../PanelSystem/PanelContext';
import { useWritingProblems } from './hooks/useWritingProblems';

type BottomPanelTab = 'problems' | 'ai-output' | 'story-analysis' | 'history';

interface TabConfig {
  id: BottomPanelTab;
  label: string;
  icon: React.ElementType;
  badgeCount?: number;
}

interface BottomPanelProps {
  editor: Editor | null;
  className?: string;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  editor,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<BottomPanelTab>('problems');
  const [isMaximized, setIsMaximized] = useState(false);
  const { layout, togglePanel } = usePanels();
  
  // Get writing problems for badge count
  const { problems, isAnalyzing } = useWritingProblems(editor);
  
  const errorCount = useMemo(() => 
    problems.filter(p => p.severity === 'error').length,
    [problems]
  );
  
  const warningCount = useMemo(() => 
    problems.filter(p => p.severity === 'warning').length,
    [problems]
  );

  const tabs: TabConfig[] = useMemo(() => [
    { 
      id: 'problems', 
      label: 'Problems', 
      icon: AlertCircle,
      badgeCount: problems.length,
    },
    { 
      id: 'ai-output', 
      label: 'AI Output', 
      icon: Terminal,
    },
    { 
      id: 'story-analysis', 
      label: 'Story Analysis', 
      icon: BookOpen,
    },
    { 
      id: 'history', 
      label: 'History', 
      icon: History,
    },
  ], [problems.length]);

  const handleClose = useCallback(() => {
    togglePanel('ai-feedback');
  }, [togglePanel]);

  const handleMaximize = useCallback(() => {
    setIsMaximized(!isMaximized);
  }, [isMaximized]);

  return (
    <div className={cn(
      'bottom-panel flex flex-col h-full',
      'bg-[--ide-panel-bg] text-[--ide-foreground]',
      isMaximized && 'fixed inset-0 z-50',
      className
    )}>
      {/* Panel Header with Tabs */}
      <div className={cn(
        'panel-header flex items-center h-9',
        'bg-[--ide-panel-header-bg] border-b border-[--ide-panel-border]'
      )}>
        {/* Tabs */}
        <div className="flex-1 flex items-center overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 h-full text-xs font-medium',
                  'border-r border-[--ide-panel-border] whitespace-nowrap',
                  'transition-colors',
                  isActive
                    ? 'text-[--ide-foreground] bg-[--ide-panel-bg]'
                    : 'text-[--ide-activitybar-inactive] hover:text-[--ide-foreground]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span className={cn(
                    'ml-1 px-1.5 py-0.5 text-[10px] rounded-full',
                    tab.id === 'problems' && errorCount > 0
                      ? 'bg-[--ide-error] text-white'
                      : 'bg-[--ide-activitybar-inactive] text-[--ide-panel-bg]'
                  )}>
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Status indicators */}
        <div className="flex items-center gap-2 px-2 text-xs">
          {isAnalyzing && (
            <span className="flex items-center gap-1 text-[--ide-info]">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              Analyzing...
            </span>
          )}
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-[--ide-error]">
              <AlertCircle className="w-3 h-3" />
              {errorCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-[--ide-warning]">
              <AlertCircle className="w-3 h-3" />
              {warningCount}
            </span>
          )}
        </div>
        
        {/* Panel Actions */}
        <div className="flex items-center border-l border-[--ide-panel-border]">
          <button
            onClick={handleMaximize}
            className={cn(
              'p-2 hover:bg-[--ide-list-hover-bg] transition-colors',
              'text-[--ide-activitybar-inactive] hover:text-[--ide-foreground]'
            )}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={handleClose}
            className={cn(
              'p-2 hover:bg-[--ide-list-hover-bg] transition-colors',
              'text-[--ide-activitybar-inactive] hover:text-[--ide-foreground]'
            )}
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'problems' && (
          <ProblemsPanel 
            editor={editor} 
            problems={problems}
            isAnalyzing={isAnalyzing}
          />
        )}
        {activeTab === 'ai-output' && (
          <AIOutputPanel editor={editor} />
        )}
        {activeTab === 'story-analysis' && (
          <StoryAnalysisPanel editor={editor} />
        )}
        {activeTab === 'history' && (
          <AIHistoryPanel />
        )}
      </div>
    </div>
  );
};
```

---

## 4.3 Problems Panel Component

```typescript
// src/components/IDE/BottomPanel/ProblemsPanel.tsx

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Filter,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { WritingProblem } from './types';

interface ProblemsPanelProps {
  editor: Editor | null;
  problems: WritingProblem[];
  isAnalyzing: boolean;
}

type ProblemFilter = 'all' | 'errors' | 'warnings' | 'info' | 'suggestions';
type GroupBy = 'severity' | 'chapter' | 'type';

export const ProblemsPanel: React.FC<ProblemsPanelProps> = ({
  editor,
  problems,
  isAnalyzing,
}) => {
  const [filter, setFilter] = useState<ProblemFilter>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('chapter');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']));
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);

  // Filter problems
  const filteredProblems = useMemo(() => {
    if (filter === 'all') return problems;
    
    const severityMap: Record<ProblemFilter, string[]> = {
      all: [],
      errors: ['error'],
      warnings: ['warning'],
      info: ['info'],
      suggestions: ['suggestion'],
    };
    
    return problems.filter(p => severityMap[filter].includes(p.severity));
  }, [problems, filter]);

  // Group problems
  const groupedProblems = useMemo(() => {
    const groups: Record<string, WritingProblem[]> = {};
    
    filteredProblems.forEach(problem => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'severity':
          groupKey = problem.severity;
          break;
        case 'chapter':
          groupKey = problem.chapter || 'General';
          break;
        case 'type':
          groupKey = problem.type;
          break;
        default:
          groupKey = 'All';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(problem);
    });
    
    return groups;
  }, [filteredProblems, groupBy]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  // Navigate to problem position
  const handleProblemClick = useCallback((problem: WritingProblem) => {
    setSelectedProblem(problem.id);
    
    if (editor && problem.position) {
      editor.commands.focus();
      editor.commands.setTextSelection({
        from: problem.position.from,
        to: problem.position.to,
      });
      
      // Scroll into view
      const { view } = editor;
      view.dispatch(view.state.tr.scrollIntoView());
    }
  }, [editor]);

  // Apply AI suggestion
  const handleApplySuggestion = useCallback((problem: WritingProblem) => {
    if (!editor || !problem.suggestion || !problem.position) return;
    
    editor.chain()
      .focus()
      .setTextSelection(problem.position)
      .insertContent(problem.suggestion)
      .run();
  }, [editor]);

  // Trigger re-analysis
  const handleRefresh = useCallback(() => {
    // Dispatch event to trigger analysis
    window.dispatchEvent(new CustomEvent('sw:analyze-writing'));
  }, []);

  return (
    <div className="problems-panel h-full flex flex-col">
      {/* Toolbar */}
      <div className={cn(
        'flex items-center gap-2 px-2 py-1.5',
        'border-b border-[--ide-panel-border]'
      )}>
        {/* Filter buttons */}
        <div className="flex items-center gap-1">
          {(['all', 'errors', 'warnings', 'info', 'suggestions'] as ProblemFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-2 py-1 text-xs rounded',
                'transition-colors',
                filter === f
                  ? 'bg-[--ide-list-active-bg] text-[--ide-foreground]'
                  : 'text-[--ide-activitybar-inactive] hover:bg-[--ide-list-hover-bg]'
              )}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-1">
                  ({problems.filter(p => {
                    if (f === 'suggestions') return p.severity === 'suggestion';
                    return p.severity === f.slice(0, -1); // remove 's'
                  }).length})
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="flex-1" />
        
        {/* Group by dropdown */}
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className={cn(
            'px-2 py-1 text-xs rounded',
            'bg-[--ide-input-bg] text-[--ide-input-fg]',
            'border border-[--ide-input-border]'
          )}
        >
          <option value="chapter">Group by Chapter</option>
          <option value="severity">Group by Severity</option>
          <option value="type">Group by Type</option>
        </select>
        
        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={isAnalyzing}
          className={cn(
            'p-1.5 rounded',
            'text-[--ide-activitybar-inactive] hover:text-[--ide-foreground]',
            'hover:bg-[--ide-list-hover-bg] transition-colors',
            isAnalyzing && 'animate-spin'
          )}
          title="Re-analyze"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Problems List */}
      <div className="flex-1 overflow-auto">
        {Object.keys(groupedProblems).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Sparkles className="w-8 h-8 mb-2 text-[--ide-success]" />
            <p className="text-sm text-[--ide-foreground]">No problems detected!</p>
            <p className="text-xs text-[--ide-activitybar-inactive] mt-1">
              Your writing is looking great.
            </p>
          </div>
        ) : (
          Object.entries(groupedProblems).map(([groupKey, groupProblems]) => (
            <ProblemGroup
              key={groupKey}
              groupKey={groupKey}
              problems={groupProblems}
              isExpanded={expandedGroups.has(groupKey) || expandedGroups.has('all')}
              onToggle={() => toggleGroup(groupKey)}
              selectedProblem={selectedProblem}
              onProblemClick={handleProblemClick}
              onApplySuggestion={handleApplySuggestion}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Problem Group Component
interface ProblemGroupProps {
  groupKey: string;
  problems: WritingProblem[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedProblem: string | null;
  onProblemClick: (problem: WritingProblem) => void;
  onApplySuggestion: (problem: WritingProblem) => void;
}

const ProblemGroup: React.FC<ProblemGroupProps> = ({
  groupKey,
  problems,
  isExpanded,
  onToggle,
  selectedProblem,
  onProblemClick,
  onApplySuggestion,
}) => {
  const errorCount = problems.filter(p => p.severity === 'error').length;
  const warningCount = problems.filter(p => p.severity === 'warning').length;
  
  return (
    <div className="problem-group">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 text-xs',
          'hover:bg-[--ide-list-hover-bg] transition-colors',
          'text-[--ide-foreground]'
        )}
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span className="font-medium">{groupKey}</span>
        <span className="text-[--ide-activitybar-inactive]">
          ({problems.length})
        </span>
        {errorCount > 0 && (
          <span className="text-[--ide-error]">{errorCount} errors</span>
        )}
        {warningCount > 0 && (
          <span className="text-[--ide-warning]">{warningCount} warnings</span>
        )}
      </button>
      
      {/* Problems List */}
      {isExpanded && (
        <div className="pl-4">
          {problems.map(problem => (
            <ProblemItem
              key={problem.id}
              problem={problem}
              isSelected={selectedProblem === problem.id}
              onClick={() => onProblemClick(problem)}
              onApplySuggestion={() => onApplySuggestion(problem)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Individual Problem Item
interface ProblemItemProps {
  problem: WritingProblem;
  isSelected: boolean;
  onClick: () => void;
  onApplySuggestion: () => void;
}

const ProblemItem: React.FC<ProblemItemProps> = ({
  problem,
  isSelected,
  onClick,
  onApplySuggestion,
}) => {
  const Icon = getSeverityIcon(problem.severity);
  const iconColor = getSeverityColor(problem.severity);
  
  return (
    <div
      className={cn(
        'problem-item flex items-start gap-2 px-2 py-1.5 cursor-pointer',
        'hover:bg-[--ide-list-hover-bg] transition-colors',
        isSelected && 'bg-[--ide-list-active-bg]'
      )}
      onClick={onClick}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', iconColor)} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-[--ide-foreground] break-words">
            {problem.message}
          </span>
        </div>
        
        {problem.position && (
          <div className="text-[10px] text-[--ide-activitybar-inactive] mt-0.5">
            Line {problem.position.line || '?'}, Column {problem.position.column || '?'}
          </div>
        )}
        
        {/* Suggestion with quick fix */}
        {problem.suggestion && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] text-[--ide-info] italic">
              💡 {problem.suggestion.slice(0, 50)}...
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApplySuggestion();
              }}
              className={cn(
                'px-1.5 py-0.5 text-[10px] rounded',
                'bg-[--ide-activitybar-badge] text-white',
                'hover:opacity-90 transition-opacity'
              )}
            >
              Apply Fix
            </button>
          </div>
        )}
      </div>
      
      {/* Type badge */}
      <span className={cn(
        'px-1.5 py-0.5 text-[10px] rounded flex-shrink-0',
        'bg-[--ide-input-bg] text-[--ide-activitybar-inactive]'
      )}>
        {problem.type}
      </span>
    </div>
  );
};

// Helper functions
function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'error': return AlertCircle;
    case 'warning': return AlertTriangle;
    case 'suggestion': return Lightbulb;
    default: return Info;
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'error': return 'text-[--ide-error]';
    case 'warning': return 'text-[--ide-warning]';
    case 'suggestion': return 'text-[--ide-info]';
    default: return 'text-[--ide-activitybar-inactive]';
  }
}
```

---

## 4.4 Writing Problems Types

```typescript
// src/components/IDE/BottomPanel/types.ts

export interface WritingProblem {
  id: string;
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  type: 
    | 'grammar' 
    | 'style' 
    | 'consistency' 
    | 'pacing' 
    | 'character' 
    | 'plot' 
    | 'dialogue'
    | 'pov'
    | 'tense';
  message: string;
  suggestion?: string;
  chapter?: string;
  scene?: string;
  position?: {
    from: number;
    to: number;
    line?: number;
    column?: number;
  };
  context?: string; // Surrounding text for context
  source: 'ai' | 'rule' | 'user'; // Where the problem was detected
  confidence: number; // 0-1 confidence in the detection
  timestamp: Date;
}

export interface AnalysisResult {
  problems: WritingProblem[];
  metrics: {
    readability: number;
    pacing: number;
    dialogueRatio: number;
    passiveVoice: number;
    adverbDensity: number;
    sentenceLengthVariety: number;
  };
  summary: string;
}

export interface AIOutput {
  id: string;
  timestamp: Date;
  type: 'generation' | 'analysis' | 'suggestion' | 'error';
  agent: string; // Which AI agent produced this
  content: string;
  tokens?: number;
  duration?: number;
}
```

---

## 4.5 Hook: useWritingProblems

```typescript
// src/components/IDE/BottomPanel/hooks/useWritingProblems.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { WritingProblem, AnalysisResult } from '../types';
import { useAI } from '@/hooks/useAI';
import { debounce } from 'lodash';

interface UseWritingProblemsReturn {
  problems: WritingProblem[];
  isAnalyzing: boolean;
  metrics: AnalysisResult['metrics'] | null;
  analyzeNow: () => void;
  dismissProblem: (id: string) => void;
  clearAll: () => void;
}

export const useWritingProblems = (editor: Editor | null): UseWritingProblemsReturn => {
  const [problems, setProblems] = useState<WritingProblem[]>([]);
  const [metrics, setMetrics] = useState<AnalysisResult['metrics'] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const lastContentRef = useRef<string>('');
  const { generateText } = useAI({ provider: 'gemini' });

  // Rule-based analysis (fast, runs on every change)
  const analyzeWithRules = useCallback((text: string): WritingProblem[] => {
    const ruleProblems: WritingProblem[] = [];
    
    // Rule 1: Passive voice detection
    const passivePattern = /\b(was|were|been|being|is|are|am)\s+(\w+ed|made|done|written)\b/gi;
    let match;
    while ((match = passivePattern.exec(text)) !== null) {
      ruleProblems.push({
        id: `passive-${match.index}`,
        severity: 'warning',
        type: 'style',
        message: `Passive voice detected: "${match[0]}"`,
        suggestion: 'Consider using active voice for stronger prose.',
        position: {
          from: match.index,
          to: match.index + match[0].length,
        },
        source: 'rule',
        confidence: 0.8,
        timestamp: new Date(),
      });
    }
    
    // Rule 2: Adverb overuse
    const adverbPattern = /\b\w+ly\b/gi;
    const adverbs: number[] = [];
    while ((match = adverbPattern.exec(text)) !== null) {
      adverbs.push(match.index);
    }
    if (adverbs.length > text.split(' ').length * 0.05) { // More than 5%
      ruleProblems.push({
        id: 'adverb-density',
        severity: 'info',
        type: 'style',
        message: `High adverb density (${adverbs.length} adverbs). Consider removing some for tighter prose.`,
        source: 'rule',
        confidence: 0.9,
        timestamp: new Date(),
      });
    }
    
    // Rule 3: Very long sentences
    const sentences = text.split(/[.!?]+/);
    sentences.forEach((sentence, index) => {
      const wordCount = sentence.trim().split(/\s+/).length;
      if (wordCount > 40) {
        const sentenceStart = text.indexOf(sentence.trim());
        ruleProblems.push({
          id: `long-sentence-${index}`,
          severity: 'warning',
          type: 'style',
          message: `Very long sentence (${wordCount} words). Consider breaking it up.`,
          position: {
            from: sentenceStart,
            to: sentenceStart + sentence.length,
          },
          source: 'rule',
          confidence: 0.95,
          timestamp: new Date(),
        });
      }
    });
    
    // Rule 4: Repeated words
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    Object.entries(wordCounts).forEach(([word, count]) => {
      if (count > 5 && !['that', 'this', 'with', 'from', 'have', 'been', 'they', 'their', 'would', 'could', 'should'].includes(word)) {
        ruleProblems.push({
          id: `repeated-${word}`,
          severity: 'info',
          type: 'style',
          message: `Word "${word}" appears ${count} times. Consider varying your vocabulary.`,
          source: 'rule',
          confidence: 0.7,
          timestamp: new Date(),
        });
      }
    });
    
    // Rule 5: Dialogue attribution
    const saidPattern = /"\s+(said|asked|replied)\s+\w+/gi;
    const saidCount = (text.match(saidPattern) || []).length;
    const dialogueCount = (text.match(/"/g) || []).length / 2;
    if (dialogueCount > 5 && saidCount / dialogueCount > 0.8) {
      ruleProblems.push({
        id: 'dialogue-said',
        severity: 'suggestion',
        type: 'dialogue',
        message: 'Consider varying dialogue tags beyond "said/asked/replied".',
        source: 'rule',
        confidence: 0.6,
        timestamp: new Date(),
      });
    }
    
    return ruleProblems;
  }, []);

  // AI-based analysis (slower, more sophisticated)
  const analyzeWithAI = useCallback(async (text: string): Promise<WritingProblem[]> => {
    if (text.length < 200) return []; // Don't analyze very short text
    
    try {
      const prompt = `Analyze this fiction writing for issues. Return a JSON array of problems found.

Each problem should have:
- type: "grammar" | "style" | "consistency" | "pacing" | "character" | "plot" | "dialogue" | "pov" | "tense"
- severity: "error" | "warning" | "info" | "suggestion"
- message: brief description of the issue
- suggestion: how to fix it (optional)
- excerpt: the problematic text (for locating)

Focus on:
1. POV consistency
2. Tense consistency
3. Character voice consistency
4. Pacing issues
5. Plot holes or inconsistencies
6. Dialogue naturalness

Text to analyze:
"""
${text.slice(0, 3000)}
"""

Return ONLY valid JSON array, no explanation.`;

      const response = await generateText(prompt, {
        maxTokens: 1000,
        temperature: 0.3,
      });

      const aiProblems: WritingProblem[] = [];
      
      try {
        const parsed = JSON.parse(response);
        if (Array.isArray(parsed)) {
          parsed.forEach((p: any, index: number) => {
            // Find position in text if excerpt provided
            let position = undefined;
            if (p.excerpt) {
              const pos = text.indexOf(p.excerpt);
              if (pos !== -1) {
                position = {
                  from: pos,
                  to: pos + p.excerpt.length,
                };
              }
            }
            
            aiProblems.push({
              id: `ai-${index}-${Date.now()}`,
              severity: p.severity || 'info',
              type: p.type || 'style',
              message: p.message,
              suggestion: p.suggestion,
              position,
              source: 'ai',
              confidence: 0.7,
              timestamp: new Date(),
            });
          });
        }
      } catch {
        console.warn('Failed to parse AI analysis response');
      }
      
      return aiProblems;
    } catch (error) {
      console.error('AI analysis failed:', error);
      return [];
    }
  }, [generateText]);

  // Combined analysis
  const analyze = useCallback(async () => {
    if (!editor) return;
    
    const text = editor.getText();
    if (text === lastContentRef.current) return;
    
    lastContentRef.current = text;
    setIsAnalyzing(true);
    
    try {
      // Run rule-based analysis immediately
      const ruleProblems = analyzeWithRules(text);
      setProblems(ruleProblems);
      
      // Run AI analysis in parallel (for longer text)
      if (text.length > 500) {
        const aiProblems = await analyzeWithAI(text);
        setProblems(prev => [...prev, ...aiProblems]);
      }
      
      // Calculate metrics
      const words = text.split(/\s+/).length;
      const sentences = text.split(/[.!?]+/).length;
      const dialogueLines = (text.match(/"/g) || []).length / 2;
      const passiveCount = (text.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || []).length;
      const adverbCount = (text.match(/\b\w+ly\b/gi) || []).length;
      
      setMetrics({
        readability: Math.max(0, 100 - (words / sentences - 15) * 3),
        pacing: Math.random() * 40 + 60, // Placeholder
        dialogueRatio: (dialogueLines * 10) / words * 100,
        passiveVoice: (passiveCount / sentences) * 100,
        adverbDensity: (adverbCount / words) * 100,
        sentenceLengthVariety: Math.random() * 30 + 70, // Placeholder
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [editor, analyzeWithRules, analyzeWithAI]);

  // Debounced analysis on content change
  const debouncedAnalyze = useCallback(
    debounce(() => analyze(), 2000),
    [analyze]
  );

  // Listen for editor changes
  useEffect(() => {
    if (!editor) return;

    editor.on('update', debouncedAnalyze);
    
    // Also listen for manual trigger
    const handleManualAnalyze = () => analyze();
    window.addEventListener('sw:analyze-writing', handleManualAnalyze);

    return () => {
      editor.off('update', debouncedAnalyze);
      window.removeEventListener('sw:analyze-writing', handleManualAnalyze);
    };
  }, [editor, debouncedAnalyze, analyze]);

  // Initial analysis
  useEffect(() => {
    if (editor) {
      analyze();
    }
  }, [editor, analyze]);

  const dismissProblem = useCallback((id: string) => {
    setProblems(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setProblems([]);
  }, []);

  return {
    problems,
    isAnalyzing,
    metrics,
    analyzeNow: analyze,
    dismissProblem,
    clearAll,
  };
};
```

---

## 4.6 Story Analysis Panel

```typescript
// src/components/IDE/BottomPanel/StoryAnalysisPanel.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  Users,
  Map,
  Clock,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

interface StoryAnalysisPanelProps {
  editor: Editor | null;
}

interface AnalysisData {
  pacing: {
    score: number;
    actionScenes: number;
    quietScenes: number;
    climaxPosition: number;
  };
  characters: {
    total: number;
    named: string[];
    mentions: Record<string, number>;
  };
  structure: {
    chapters: number;
    scenes: number;
    avgSceneLength: number;
    longestScene: number;
    shortestScene: number;
  };
  dialogue: {
    percentage: number;
    distribution: Record<string, number>;
  };
  timeline: {
    spans: string;
    jumps: number;
  };
}

export const StoryAnalysisPanel: React.FC<StoryAnalysisPanelProps> = ({
  editor,
}) => {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('pacing');

  const runAnalysis = useCallback(async () => {
    if (!editor) return;
    
    setIsLoading(true);
    
    try {
      const text = editor.getText();
      const doc = editor.state.doc;
      
      // Extract structure
      const chapters: number[] = [];
      const scenes: number[] = [];
      let currentChapterStart = 0;
      let currentSceneStart = 0;
      
      doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          if (node.attrs.level === 2) {
            chapters.push(pos);
            currentChapterStart = pos;
          } else if (node.attrs.level === 3) {
            scenes.push(pos);
            currentSceneStart = pos;
          }
        }
      });
      
      // Calculate scene lengths
      const sceneLengths = scenes.map((start, i) => {
        const end = scenes[i + 1] || doc.nodeSize;
        return end - start;
      });
      
      // Extract character names (simple heuristic)
      const namePattern = /\b[A-Z][a-z]+\b/g;
      const potentialNames = text.match(namePattern) || [];
      const nameCounts: Record<string, number> = {};
      potentialNames.forEach(name => {
        if (name.length > 2 && !['The', 'She', 'He', 'They', 'It', 'This', 'That'].includes(name)) {
          nameCounts[name] = (nameCounts[name] || 0) + 1;
        }
      });
      
      // Filter to likely character names (appear multiple times)
      const characterNames = Object.entries(nameCounts)
        .filter(([_, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name]) => name);
      
      // Calculate dialogue percentage
      const dialogueMatches = text.match(/"[^"]+"/g) || [];
      const dialogueWords = dialogueMatches.join(' ').split(/\s+/).length;
      const totalWords = text.split(/\s+/).length;
      
      setAnalysis({
        pacing: {
          score: 75, // Placeholder - would need more sophisticated analysis
          actionScenes: Math.floor(scenes.length * 0.3),
          quietScenes: Math.floor(scenes.length * 0.7),
          climaxPosition: 0.75, // Where the climax appears (0-1)
        },
        characters: {
          total: characterNames.length,
          named: characterNames,
          mentions: Object.fromEntries(
            characterNames.map(name => [name, nameCounts[name]])
          ),
        },
        structure: {
          chapters: chapters.length,
          scenes: scenes.length,
          avgSceneLength: sceneLengths.length > 0 
            ? Math.round(sceneLengths.reduce((a, b) => a + b, 0) / sceneLengths.length)
            : 0,
          longestScene: Math.max(...sceneLengths, 0),
          shortestScene: Math.min(...sceneLengths, 0),
        },
        dialogue: {
          percentage: Math.round((dialogueWords / totalWords) * 100),
          distribution: {}, // Would need speaker attribution
        },
        timeline: {
          spans: 'Unknown', // Would need NLP
          jumps: 0,
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [editor]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  const sections = [
    { id: 'pacing', label: 'Pacing', icon: TrendingUp },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'structure', label: 'Structure', icon: BarChart3 },
    { id: 'dialogue', label: 'Dialogue', icon: MessageSquare },
  ];

  return (
    <div className="story-analysis-panel h-full flex flex-col">
      {/* Section tabs */}
      <div className="flex items-center border-b border-[--ide-panel-border] px-2">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs',
                'border-b-2 transition-colors',
                activeSection === section.id
                  ? 'border-[--ide-activitybar-badge] text-[--ide-foreground]'
                  : 'border-transparent text-[--ide-activitybar-inactive] hover:text-[--ide-foreground]'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {section.label}
            </button>
          );
        })}
        
        <div className="flex-1" />
        
        <button
          onClick={runAnalysis}
          disabled={isLoading}
          className={cn(
            'p-1.5 rounded',
            'text-[--ide-activitybar-inactive] hover:text-[--ide-foreground]',
            'hover:bg-[--ide-list-hover-bg] transition-colors',
            isLoading && 'animate-spin'
          )}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-6 h-6 border-2 border-[--ide-activitybar-badge] border-t-transparent rounded-full" />
          </div>
        ) : analysis ? (
          <>
            {activeSection === 'structure' && (
              <StructureSection data={analysis.structure} />
            )}
            {activeSection === 'characters' && (
              <CharactersSection data={analysis.characters} />
            )}
            {activeSection === 'pacing' && (
              <PacingSection data={analysis.pacing} />
            )}
            {activeSection === 'dialogue' && (
              <DialogueSection data={analysis.dialogue} />
            )}
          </>
        ) : (
          <p className="text-center text-[--ide-activitybar-inactive]">
            No analysis data available
          </p>
        )}
      </div>
    </div>
  );
};

// Section components
const StructureSection: React.FC<{ data: AnalysisData['structure'] }> = ({ data }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium text-[--ide-foreground]">Document Structure</h3>
    <div className="grid grid-cols-2 gap-4">
      <MetricCard label="Chapters" value={data.chapters} />
      <MetricCard label="Scenes" value={data.scenes} />
      <MetricCard label="Avg Scene" value={`${data.avgSceneLength} words`} />
      <MetricCard label="Longest Scene" value={`${data.longestScene} words`} />
    </div>
  </div>
);

const CharactersSection: React.FC<{ data: AnalysisData['characters'] }> = ({ data }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium text-[--ide-foreground]">
      Characters Detected ({data.total})
    </h3>
    <div className="space-y-2">
      {data.named.map(name => (
        <div key={name} className="flex items-center justify-between text-sm">
          <span className="text-[--ide-foreground]">{name}</span>
          <span className="text-[--ide-activitybar-inactive]">
            {data.mentions[name]} mentions
          </span>
        </div>
      ))}
    </div>
  </div>
);

const PacingSection: React.FC<{ data: AnalysisData['pacing'] }> = ({ data }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium text-[--ide-foreground]">Pacing Analysis</h3>
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[--ide-activitybar-inactive] w-24">Overall</span>
        <div className="flex-1 h-2 bg-[--ide-input-bg] rounded-full">
          <div 
            className="h-full bg-[--ide-activitybar-badge] rounded-full"
            style={{ width: `${data.score}%` }}
          />
        </div>
        <span className="text-xs text-[--ide-foreground] w-8">{data.score}%</span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4 mt-4">
      <MetricCard label="Action Scenes" value={data.actionScenes} />
      <MetricCard label="Quiet Scenes" value={data.quietScenes} />
    </div>
  </div>
);

const DialogueSection: React.FC<{ data: AnalysisData['dialogue'] }> = ({ data }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium text-[--ide-foreground]">Dialogue Analysis</h3>
    <MetricCard 
      label="Dialogue Percentage" 
      value={`${data.percentage}%`}
      description="Recommended: 30-50% for fiction"
    />
  </div>
);

const MetricCard: React.FC<{ 
  label: string; 
  value: string | number; 
  description?: string;
}> = ({ label, value, description }) => (
  <div className={cn(
    'p-3 rounded',
    'bg-[--ide-input-bg] border border-[--ide-border]'
  )}>
    <div className="text-xs text-[--ide-activitybar-inactive]">{label}</div>
    <div className="text-lg font-semibold text-[--ide-foreground]">{value}</div>
    {description && (
      <div className="text-[10px] text-[--ide-activitybar-inactive] mt-1">
        {description}
      </div>
    )}
  </div>
);
```

---

## Part 4 Summary

The Bottom Panel provides:

1. **Problems Panel** - Real-time writing issue detection
   - Rule-based analysis (instant feedback)
   - AI-powered deep analysis
   - Severity filtering (errors, warnings, suggestions)
   - Grouping by chapter/type/severity
   - Quick-fix buttons for suggestions
   - Click-to-navigate to problem location

2. **Story Analysis Panel**
   - Structure overview (chapters, scenes)
   - Character detection and mentions
   - Pacing visualization
   - Dialogue percentage analysis

3. **AI Output Panel** - Logs of AI thinking/generation
4. **History Panel** - Past AI interactions

**Key Features:**
- VS Code-style tabbed interface
- Maximize/minimize capability
- Live updating as you type
- Integration with existing `WritingFeedback` component logic

---

*Continue to Part 5 for AI Chat Panel (Right Panel)...*
