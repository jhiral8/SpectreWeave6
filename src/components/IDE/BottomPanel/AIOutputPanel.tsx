/**
 * AI Output Panel Component
 * 
 * Displays the output from AI agents in a terminal-like interface.
 * Shows real-time agent activity and results.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Copy,
  Trash2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { AGENT_CONFIGS } from '../AIAgents/AgentRegistry';
import type { AgentTask, AgentStatus } from '../AIAgents/types';

interface AIOutputPanelProps {
  tasks: AgentTask[];
  activeTasks: AgentTask[];
  onClearHistory?: () => void;
  className?: string;
}

export const AIOutputPanel: React.FC<AIOutputPanelProps> = ({
  tasks,
  activeTasks,
  onClearHistory,
  className,
}) => {
  const outputRef = useRef<HTMLDivElement>(null);
  const [expandedTasks, setExpandedTasks] = React.useState<Set<string>>(new Set());

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [tasks, activeTasks]);

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const copyOutput = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Combine active and completed tasks, most recent first
  const allTasks = [...activeTasks, ...tasks.slice(0, 20)];

  if (allTasks.length === 0) {
    return (
      <div className={cn('h-full p-4 overflow-auto font-mono text-xs', className)}>
        <div className="text-[--ide-foreground-muted] mb-2">[System] AI Ready</div>
        <div className="text-[--ide-foreground]">
          <span className="text-[--ide-info]">&gt;</span> Waiting for AI generation requests...
        </div>
        <div className="mt-4 text-[--ide-foreground-muted]">
          <p>Run an agent from the AI Agents panel (⌘5) to see output here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-[--ide-border]">
        <span className="text-xs text-[--ide-foreground-muted]">
          {activeTasks.length > 0 && (
            <span className="flex items-center gap-1 text-[--ide-info]">
              <Loader2 className="w-3 h-3 animate-spin" />
              {activeTasks.length} running
            </span>
          )}
        </span>
        {onClearHistory && tasks.length > 0 && (
          <button
            onClick={onClearHistory}
            className="p-1 rounded hover:bg-[--ide-border] transition-colors"
            title="Clear history"
          >
            <Trash2 className="w-3 h-3 text-[--ide-foreground-muted]" />
          </button>
        )}
      </div>

      {/* Output */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-auto p-2 font-mono text-xs space-y-2"
      >
        {allTasks.map((task) => (
          <TaskOutput
            key={task.id}
            task={task}
            isExpanded={expandedTasks.has(task.id)}
            onToggle={() => toggleExpand(task.id)}
            onCopy={copyOutput}
          />
        ))}
      </div>
    </div>
  );
};

interface TaskOutputProps {
  task: AgentTask;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: (content: string) => void;
}

const TaskOutput: React.FC<TaskOutputProps> = ({
  task,
  isExpanded,
  onToggle,
  onCopy,
}) => {
  const agent = AGENT_CONFIGS[task.agentId];
  const hasOutput = task.output?.content && task.output.content.length > 0;
  const isRunning = task.status === 'working';

  return (
    <div className={cn(
      'rounded border',
      isRunning
        ? 'border-[--ide-info]/30 bg-[--ide-info]/5'
        : task.status === 'error'
          ? 'border-[--ide-error]/30 bg-[--ide-error]/5'
          : 'border-[--ide-border] bg-[--ide-input-bg]/50'
    )}>
      {/* Header */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5',
          'hover:bg-[--ide-list-hover] transition-colors text-left'
        )}
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-[--ide-foreground-muted] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-[--ide-foreground-muted] flex-shrink-0" />
        )}
        
        <span className="flex-shrink-0">{agent?.icon}</span>
        
        <span className="flex-1 truncate text-[--ide-foreground]">
          {agent?.name}
        </span>

        <TaskStatusBadge status={task.status} />

        {task.endTime && (
          <span className="text-[10px] text-[--ide-foreground-muted]">
            {formatDuration(task.startTime, task.endTime)}
          </span>
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-2">
          {/* Error message */}
          {task.error && (
            <div className="p-2 rounded bg-[--ide-error]/10 text-[--ide-error]">
              {task.error}
            </div>
          )}

          {/* Output content */}
          {hasOutput && (
            <div className="relative">
              <pre className={cn(
                'p-2 rounded bg-[--ide-background] overflow-auto',
                'max-h-[300px] whitespace-pre-wrap'
              )}>
                {task.output!.content}
              </pre>
              
              <button
                onClick={() => onCopy(task.output!.content)}
                className={cn(
                  'absolute top-1 right-1 p-1 rounded',
                  'bg-[--ide-border] hover:bg-[--ide-border]/80',
                  'transition-colors'
                )}
                title="Copy output"
              >
                <Copy className="w-3 h-3 text-[--ide-foreground-muted]" />
              </button>
            </div>
          )}

          {/* Metadata */}
          {task.output?.metadata && (
            <div className="flex gap-4 text-[10px] text-[--ide-foreground-muted]">
              {task.output.metadata.model && (
                <span>Model: {task.output.metadata.model}</span>
              )}
              {task.output.metadata.tokensUsed && (
                <span>~{task.output.metadata.tokensUsed} tokens</span>
              )}
              {task.output.metadata.processingTime && (
                <span>{(task.output.metadata.processingTime / 1000).toFixed(1)}s</span>
              )}
            </div>
          )}

          {/* Actions */}
          {task.output?.actions && task.output.actions.length > 0 && (
            <div className="flex gap-2">
              {task.output.actions.map((action) => (
                <button
                  key={action.id}
                  className={cn(
                    'px-2 py-1 rounded text-[10px]',
                    action.type === 'dismiss'
                      ? 'bg-[--ide-border] hover:bg-[--ide-border]/80'
                      : 'bg-[--ide-accent] text-white hover:opacity-90',
                    'transition-colors'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TaskStatusBadge: React.FC<{ status: AgentStatus }> = ({ status }) => {
  const config = {
    idle: null,
    working: { icon: Loader2, color: 'text-[--ide-info]', spin: true, label: 'Running' },
    success: { icon: CheckCircle, color: 'text-[--ide-success]', spin: false, label: 'Done' },
    error: { icon: XCircle, color: 'text-[--ide-error]', spin: false, label: 'Error' },
  }[status];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <span className={cn('flex items-center gap-1', config.color)} title={config.label}>
      <Icon className={cn('w-3 h-3', config.spin && 'animate-spin')} />
    </span>
  );
};

function formatDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default AIOutputPanel;
