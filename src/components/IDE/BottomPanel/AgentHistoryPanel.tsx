/**
 * Agent History Panel
 * 
 * Shows the history of AI agent tasks with filtering and search.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Trash2,
} from 'lucide-react';
import { AGENT_CONFIGS, getAgentIds } from '../AIAgents/AgentRegistry';
import type { AgentTask, AgentId, AgentStatus } from '../AIAgents/types';

interface AgentHistoryPanelProps {
  tasks: AgentTask[];
  onClearHistory?: () => void;
  onSelectTask?: (task: AgentTask) => void;
  className?: string;
}

export const AgentHistoryPanel: React.FC<AgentHistoryPanelProps> = ({
  tasks,
  onClearHistory,
  onSelectTask,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgent, setFilterAgent] = useState<AgentId | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AgentStatus | 'all'>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Agent filter
      if (filterAgent !== 'all' && task.agentId !== filterAgent) return false;
      
      // Status filter
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      
      // Search filter
      if (searchQuery) {
        const agent = AGENT_CONFIGS[task.agentId];
        const searchLower = searchQuery.toLowerCase();
        const matchesAgent = agent?.name.toLowerCase().includes(searchLower);
        const matchesOutput = task.output?.content.toLowerCase().includes(searchLower);
        const matchesError = task.error?.toLowerCase().includes(searchLower);
        if (!matchesAgent && !matchesOutput && !matchesError) return false;
      }
      
      return true;
    });
  }, [tasks, filterAgent, filterStatus, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const success = tasks.filter(t => t.status === 'success').length;
    const error = tasks.filter(t => t.status === 'error').length;
    return { total: tasks.length, success, error };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className={cn('h-full flex items-center justify-center', className)}>
        <div className="text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-[--ide-foreground-muted]" />
          <p className="text-sm text-[--ide-foreground-muted]">
            No agent history yet
          </p>
          <p className="text-xs text-[--ide-foreground-muted] mt-1">
            Run agents to see their history here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header & Filters */}
      <div className="p-2 border-b border-[--ide-border] space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[--ide-foreground-muted]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className={cn(
              'w-full pl-7 pr-2 py-1 text-xs',
              'bg-[--ide-input-bg] border border-[--ide-border] rounded',
              'text-[--ide-foreground] placeholder:text-[--ide-foreground-muted]',
              'focus:outline-none focus:border-[--ide-accent]'
            )}
          />
        </div>

        {/* Filters & Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value as AgentId | 'all')}
              className={cn(
                'px-2 py-1 text-[10px] rounded',
                'bg-[--ide-input-bg] border border-[--ide-border]',
                'text-[--ide-foreground]'
              )}
            >
              <option value="all">All Agents</option>
              {getAgentIds().map(id => (
                <option key={id} value={id}>
                  {AGENT_CONFIGS[id].icon} {AGENT_CONFIGS[id].name}
                </option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AgentStatus | 'all')}
              className={cn(
                'px-2 py-1 text-[10px] rounded',
                'bg-[--ide-input-bg] border border-[--ide-border]',
                'text-[--ide-foreground]'
              )}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-[--ide-success]">
              <CheckCircle className="w-3 h-3" />
              {stats.success}
            </span>
            <span className="flex items-center gap-1 text-[--ide-error]">
              <XCircle className="w-3 h-3" />
              {stats.error}
            </span>
            {onClearHistory && (
              <button
                onClick={onClearHistory}
                className="p-1 rounded hover:bg-[--ide-border] transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-3 h-3 text-[--ide-foreground-muted]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-auto">
        {filteredTasks.length === 0 ? (
          <div className="p-4 text-center text-xs text-[--ide-foreground-muted]">
            No tasks match your filters
          </div>
        ) : (
          <div className="divide-y divide-[--ide-border]">
            {filteredTasks.map((task) => (
              <HistoryItem
                key={task.id}
                task={task}
                onClick={() => onSelectTask?.(task)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface HistoryItemProps {
  task: AgentTask;
  onClick?: () => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ task, onClick }) => {
  const agent = AGENT_CONFIGS[task.agentId];
  const duration = task.endTime
    ? Math.round((task.endTime.getTime() - task.startTime.getTime()) / 1000)
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-2 px-3 py-2 text-left',
        'hover:bg-[--ide-list-hover] transition-colors'
      )}
    >
      {/* Status Icon */}
      <div className="mt-0.5">
        {task.status === 'success' ? (
          <CheckCircle className="w-3.5 h-3.5 text-[--ide-success]" />
        ) : task.status === 'error' ? (
          <XCircle className="w-3.5 h-3.5 text-[--ide-error]" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-[--ide-foreground-muted]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">{agent?.icon}</span>
          <span className="text-xs font-medium text-[--ide-foreground]">
            {agent?.name}
          </span>
        </div>
        
        {/* Preview */}
        {task.output?.content && (
          <p className="text-[10px] text-[--ide-foreground-muted] truncate mt-0.5">
            {task.output.content.slice(0, 100)}...
          </p>
        )}
        
        {task.error && (
          <p className="text-[10px] text-[--ide-error] truncate mt-0.5">
            {task.error}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="text-right flex-shrink-0">
        <div className="text-[10px] text-[--ide-foreground-muted]">
          {formatTimeAgo(task.startTime)}
        </div>
        {duration !== null && (
          <div className="text-[10px] text-[--ide-foreground-muted]">
            {duration}s
          </div>
        )}
      </div>
    </button>
  );
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default AgentHistoryPanel;
