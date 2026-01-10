/**
 * AI Agents Panel
 * 
 * Displays available AI agents organized by category with controls to
 * run, cancel, and view results. Integrates with the AgentContext.
 */

'use client';

import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Bot,
  Play,
  Square,
  History,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Trash2,
  Settings,
  Zap,
} from 'lucide-react';
import { AGENT_CONFIGS, getAgentsByCategory } from './AgentRegistry';
import { AgentConfig, AgentTask, AgentStatus, AgentId, AgentCategory } from './types';
import { useAgents, useAgent } from './context/AgentContext';

interface AIAgentsPanelProps {
  className?: string;
}

export const AIAgentsPanel: React.FC<AIAgentsPanelProps> = ({ className }) => {
  const {
    activeTasks,
    taskHistory,
    totalActiveCount,
    totalErrorCount,
    totalWarningCount,
    clearHistory,
  } = useAgents();

  const [expandedCategories, setExpandedCategories] = useState<Record<AgentCategory, boolean>>({
    generation: true,
    analysis: true,
    consistency: false,
  });

  const toggleCategory = (category: AgentCategory) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const generationAgents = getAgentsByCategory('generation');
  const analysisAgents = getAgentsByCategory('analysis');
  const consistencyAgents = getAgentsByCategory('consistency');

  return (
    <div className={cn('ai-agents-panel h-full flex flex-col bg-[--ide-sidebar-bg]', className)}>
      {/* Header - exact 35px like VSCode */}
      <div className={cn(
        'flex items-center justify-between px-3 h-[35px] min-h-[35px]',
        'border-b border-[--ide-border]'
      )}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[--ide-foreground-secondary]">
          AI Agents
        </span>
        <div className="flex items-center gap-1">
          {totalActiveCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-[--ide-info]">
              <Loader2 className="w-3 h-3 animate-spin" />
              {totalActiveCount}
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions - compact */}
      <div className={cn(
        'flex items-center gap-1 px-2 py-1.5',
        'border-b border-[--ide-border]'
      )}>
        <button
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-[11px]',
            'bg-[--ide-accent] text-white',
            'hover:opacity-90 transition-opacity'
          )}
          title="Run Ghost Writer (⌘⇧G)"
        >
          <Zap className="w-3 h-3" />
          Generate
        </button>
        <button
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-[11px]',
            'bg-[--ide-input-bg] text-[--ide-foreground]',
            'hover:bg-[--ide-list-hover] transition-colors'
          )}
          title="Run Style Coach (⌘⇧S)"
        >
          <AlertCircle className="w-3 h-3" />
          Analyze
        </button>
      </div>

      {/* Agent Categories */}
      <div className="flex-1 overflow-y-auto">
        {/* Generation Agents */}
        <AgentCategorySection
          title="✍️ Generation"
          description="Create new content"
          category="generation"
          agents={generationAgents}
          expanded={expandedCategories.generation}
          onToggle={() => toggleCategory('generation')}
        />

        {/* Analysis Agents */}
        <AgentCategorySection
          title="📊 Analysis"
          description="Analyze and improve"
          category="analysis"
          agents={analysisAgents}
          expanded={expandedCategories.analysis}
          onToggle={() => toggleCategory('analysis')}
        />

        {/* Consistency Agents */}
        <AgentCategorySection
          title="🔍 Consistency"
          description="Background checking"
          category="consistency"
          agents={consistencyAgents}
          expanded={expandedCategories.consistency}
          onToggle={() => toggleCategory('consistency')}
        />
      </div>

      {/* Task History */}
      {taskHistory.length > 0 && (
        <div className={cn(
          'border-t border-[--ide-border]',
          'max-h-[200px] overflow-y-auto'
        )}>
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-[--ide-foreground-muted]" />
              <span className="text-xs font-medium text-[--ide-foreground-muted]">
                Recent ({taskHistory.length})
              </span>
            </div>
            <button
              onClick={clearHistory}
              className="p-1 rounded hover:bg-[--ide-border] transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-3 h-3 text-[--ide-foreground-muted]" />
            </button>
          </div>
          <div className="px-2 pb-2 space-y-1">
            {taskHistory.slice(0, 5).map((task) => (
              <TaskHistoryItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Category Section Component
interface AgentCategorySectionProps {
  title: string;
  description: string;
  category: AgentCategory;
  agents: AgentConfig[];
  expanded: boolean;
  onToggle: () => void;
}

const AgentCategorySection: React.FC<AgentCategorySectionProps> = ({
  title,
  description,
  category,
  agents,
  expanded,
  onToggle,
}) => {
  return (
    <div className="border-b border-[--ide-border]">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2 px-4 py-2',
          'hover:bg-[--ide-list-hover] transition-colors',
          'text-left'
        )}
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-[--ide-foreground-muted]" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[--ide-foreground-muted]" />
        )}
        <span className="text-xs font-medium text-[--ide-foreground]">{title}</span>
        <span className="text-[10px] text-[--ide-foreground-muted]">{description}</span>
      </button>

      {/* Agent Cards */}
      {expanded && (
        <div className="px-2 pb-2 space-y-1">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
};

// Agent Card Component
interface AgentCardProps {
  agent: AgentConfig;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const { isRunning, status, run, cancel, lastResult } = useAgent(agent.id);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = async () => {
    if (isRunning) {
      cancel();
    } else {
      await run();
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2.5 rounded-lg',
        'bg-[--ide-input-bg] border border-[--ide-border]',
        'hover:border-[--ide-accent]/50 transition-all duration-200',
        isRunning && 'border-[--ide-info]/50 bg-[--ide-info]/5'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon */}
      <span className="text-lg flex-shrink-0">{agent.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[--ide-foreground]">
            {agent.name}
          </span>
          <AgentStatusIndicator status={status} />
        </div>
        <p className="text-[10px] text-[--ide-foreground-muted] truncate">
          {agent.description}
        </p>
        {agent.shortcut && (
          <kbd className={cn(
            'inline-block mt-1 px-1 py-0.5 rounded text-[9px]',
            'bg-[--ide-border] text-[--ide-foreground-muted]',
            'font-mono'
          )}>
            {agent.shortcut}
          </kbd>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleClick}
        className={cn(
          'flex-shrink-0 p-2 rounded-md transition-all duration-200',
          isRunning
            ? 'bg-[--ide-error]/20 text-[--ide-error] hover:bg-[--ide-error]/30'
            : 'bg-[--ide-accent] text-white hover:opacity-90',
          'focus:outline-none focus:ring-2 focus:ring-[--ide-accent]/50'
        )}
        title={isRunning ? 'Cancel' : `Run ${agent.name}`}
      >
        {isRunning ? (
          <Square className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};

// Status Indicator
interface AgentStatusIndicatorProps {
  status: AgentStatus;
}

const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({ status }) => {
  if (status === 'idle') return null;

  const config = {
    working: { 
      icon: Loader2, 
      color: 'text-[--ide-info]', 
      animate: true,
      label: 'Running',
    },
    success: { 
      icon: CheckCircle, 
      color: 'text-[--ide-success]', 
      animate: false,
      label: 'Success',
    },
    error: { 
      icon: XCircle, 
      color: 'text-[--ide-error]', 
      animate: false,
      label: 'Error',
    },
  }[status];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <span className={cn('flex items-center gap-1', config.color)} title={config.label}>
      <Icon className={cn('w-3 h-3', config.animate && 'animate-spin')} />
    </span>
  );
};

// Task History Item
interface TaskHistoryItemProps {
  task: AgentTask;
}

const TaskHistoryItem: React.FC<TaskHistoryItemProps> = ({ task }) => {
  const agent = AGENT_CONFIGS[task.agentId];
  const duration = task.endTime
    ? Math.round((task.endTime.getTime() - task.startTime.getTime()) / 1000)
    : null;

  const timeAgo = getTimeAgo(task.startTime);

  return (
    <div className={cn(
      'flex items-center gap-2 px-2 py-1.5 rounded',
      'hover:bg-[--ide-list-hover] transition-colors',
      'text-xs cursor-pointer'
    )}>
      <span className="flex-shrink-0">{agent?.icon}</span>
      <span className="flex-1 truncate text-[--ide-foreground]">
        {agent?.name}
      </span>
      <AgentStatusIndicator status={task.status} />
      <span className="text-[--ide-foreground-muted] text-[10px]">
        {timeAgo}
      </span>
    </div>
  );
};

// Helper function
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default AIAgentsPanel;
