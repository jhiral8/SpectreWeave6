'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  AlertCircle, 
  Terminal, 
  BookOpen, 
  History,
  Minimize2,
  Maximize2,
  X,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { ProblemsPanel } from './ProblemsPanel';
import { AIOutputPanel } from './AIOutputPanel';
import { AgentHistoryPanel } from './AgentHistoryPanel';
import { usePanels } from '../PanelSystem/PanelContext';
import { WritingProblem, BottomPanelTab, StoryMetrics } from './types';
import type { AgentTask } from '../AIAgents/types';

interface BottomPanelProps {
  problems?: WritingProblem[];
  isAnalyzing?: boolean;
  storyMetrics?: StoryMetrics;
  // Agent integration
  activeTasks?: AgentTask[];
  taskHistory?: AgentTask[];
  onClearAgentHistory?: () => void;
  className?: string;
  onProblemClick?: (problem: WritingProblem) => void;
  onRefreshAnalysis?: () => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  problems = [],
  isAnalyzing = false,
  storyMetrics,
  activeTasks = [],
  taskHistory = [],
  onClearAgentHistory,
  className,
  onProblemClick,
  onRefreshAnalysis,
}) => {
  const [activeTab, setActiveTab] = useState<BottomPanelTab>('problems');
  const [isMaximized, setIsMaximized] = useState(false);
  const { togglePanel } = usePanels();
  
  // Problem counts for badge
  const errorCount = useMemo(() => 
    problems.filter(p => p.severity === 'error').length,
    [problems]
  );
  
  const warningCount = useMemo(() => 
    problems.filter(p => p.severity === 'warning').length,
    [problems]
  );

  const tabs = useMemo(() => [
    { 
      id: 'problems' as const, 
      label: 'Problems', 
      icon: AlertCircle,
      badgeCount: problems.length,
      badgeColor: errorCount > 0 ? 'bg-[--ide-error]' : 'bg-[--ide-warning]',
    },
    { 
      id: 'ai-output' as const, 
      label: 'AI Output', 
      icon: Terminal,
      badgeCount: activeTasks.length > 0 ? activeTasks.length : undefined,
      badgeColor: 'bg-[--ide-info]',
    },
    { 
      id: 'story-analysis' as const, 
      label: 'Story Analysis', 
      icon: BarChart3,
    },
    { 
      id: 'history' as const, 
      label: 'History', 
      icon: History,
      badgeCount: taskHistory.length > 0 ? taskHistory.length : undefined,
      badgeColor: 'bg-[--ide-foreground-muted]',
    },
  ], [problems.length, errorCount, activeTasks.length, taskHistory.length]);

  const handleClose = useCallback(() => {
    togglePanel('bottom');
  }, [togglePanel]);

  const handleMaximize = useCallback(() => {
    setIsMaximized(!isMaximized);
  }, [isMaximized]);

  return (
    <div className={cn(
      'vsc-panel flex flex-col h-full',
      'bg-[--vsc-panel-bg] text-[--vsc-panel-fg]',
      isMaximized && 'fixed inset-0 z-50',
      className
    )}>
      {/* Panel Header with Tabs - VS Code style */}
      <div className={cn(
        'vsc-panel__header flex items-center',
        'bg-[--vsc-panel-bg]',
        'border-b border-[--vsc-panel-border]'
      )}
      style={{ height: 'var(--vsc-panel-header-height)', minHeight: 'var(--vsc-panel-header-height)' }}
      >
        {/* Tabs */}
        <div className="flex-1 flex items-center h-full overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'vsc-panel__tab flex items-center gap-1.5 px-3 h-full',
                  'text-[11px] font-medium uppercase tracking-wider whitespace-nowrap',
                  'transition-colors relative border-b-2',
                  isActive
                    ? 'vsc-panel__tab--active text-[--vsc-panel-title-active-fg] border-b-[--vsc-panel-title-active-border]'
                    : 'text-[--vsc-panel-title-inactive-fg] hover:text-[--vsc-panel-title-active-fg] border-b-transparent'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span className={cn(
                    'ml-1.5 min-w-[18px] h-[18px] px-1.5 text-[10px] font-semibold leading-[18px] rounded-full text-white text-center',
                    isActive ? 'bg-[--vsc-activitybar-badge-bg]' : 'bg-[--ide-background-tertiary] text-[--vsc-panel-title-inactive-fg]'
                  )}>
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Status indicators */}
        <div className="flex items-center gap-2 px-2 text-[11px]">
          {isAnalyzing && (
            <span className="flex items-center gap-1 text-[--ide-info]">
              <Sparkles className="w-3 h-3 animate-pulse" />
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
        <div className="flex items-center border-l border-[--vsc-panel-border]">
          <button
            onClick={handleMaximize}
            className={cn(
              'p-2 hover:bg-[--vsc-list-hover-bg] transition-colors',
              'text-[--vsc-panel-title-inactive-fg] hover:text-[--vsc-panel-title-active-fg]'
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
              'p-2 hover:bg-[--vsc-list-hover-bg] transition-colors',
              'text-[--vsc-panel-title-inactive-fg] hover:text-[--vsc-panel-title-active-fg]'
            )}
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Panel Content */}
      <div className="vsc-panel__content flex-1 overflow-hidden">
        {activeTab === 'problems' && (
          <ProblemsPanel 
            problems={problems}
            isAnalyzing={isAnalyzing}
            onProblemClick={onProblemClick}
            onRefresh={onRefreshAnalysis}
          />
        )}
        {activeTab === 'ai-output' && (
          <AIOutputPanel
            tasks={taskHistory}
            activeTasks={activeTasks}
            onClearHistory={onClearAgentHistory}
          />
        )}
        {activeTab === 'story-analysis' && (
          <StoryAnalysisTab metrics={storyMetrics} />
        )}
        {activeTab === 'history' && (
          <AgentHistoryPanel
            tasks={taskHistory}
            onClearHistory={onClearAgentHistory}
          />
        )}
      </div>
    </div>
  );
};

// Story Analysis Tab
interface StoryAnalysisTabProps {
  metrics?: StoryMetrics;
}

const StoryAnalysisTab: React.FC<StoryAnalysisTabProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-[--ide-activitybar-inactive]">
          No story data available
        </p>
      </div>
    );
  }

  return (
    <div className="h-full p-4 overflow-auto space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Word Count" value={metrics.wordCount.toLocaleString()} />
        <MetricCard label="Chapters" value={metrics.chapterCount.toString()} />
        <MetricCard label="Scenes" value={metrics.sceneCount.toString()} />
      </div>
      
      {/* Pacing breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-[--ide-foreground]">Pacing Breakdown</h4>
        <div className="space-y-1">
          <ProgressBar label="Action" value={metrics.pacing.actionPercent} />
          <ProgressBar label="Dialogue" value={metrics.pacing.dialoguePercent} />
          <ProgressBar label="Description" value={metrics.pacing.descriptionPercent} />
        </div>
      </div>
      
      {/* Style metrics */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-[--ide-foreground]">Style Metrics</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[--ide-activitybar-inactive]">Passive Voice</span>
            <span className={metrics.styleMetrics.passiveVoicePercent > 15 ? 'text-[--ide-warning]' : ''}>
              {metrics.styleMetrics.passiveVoicePercent}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--ide-activitybar-inactive]">Avg Sentence</span>
            <span>{metrics.styleMetrics.averageSentenceLength} words</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric card
const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className={cn(
    'p-3 rounded-lg',
    'bg-[--ide-background-tertiary,--ide-background]',
    'border border-[--ide-border]'
  )}>
    <div className="text-lg font-semibold text-[--ide-foreground]">{value}</div>
    <div className="text-xs text-[--ide-activitybar-inactive]">{label}</div>
  </div>
);

// Progress bar
const ProgressBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-[--ide-activitybar-inactive] w-20">{label}</span>
    <div className="flex-1 h-1.5 bg-[--ide-border] rounded-full overflow-hidden">
      <div 
        className="h-full bg-[--ide-activitybar-badge] rounded-full transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
    <span className="text-xs text-[--ide-activitybar-inactive] w-8 text-right">{value}%</span>
  </div>
);
