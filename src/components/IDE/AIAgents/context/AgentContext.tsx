/**
 * Agent Context
 * 
 * Provides agent state and actions to all components in the tree.
 * This allows the Agent Panel, Problems Panel, and Editor to share agent state.
 */

'use client';

import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import {
  AgentId,
  AgentTask,
  AgentInput,
  AgentOutput,
  AgentStatus,
  AgentContext as AgentInputContext,
} from '../types';
import { useAgentManager } from '../hooks/useAgentManager';
import { AGENT_CONFIGS } from '../AgentRegistry';

interface AgentContextValue {
  // State
  activeTasks: AgentTask[];
  taskHistory: AgentTask[];
  
  // Actions
  runAgent: (agentId: AgentId, input?: Partial<AgentInput>) => Promise<AgentOutput | null>;
  runAgentWithContext: (agentId: AgentId, context: AgentInputContext, content?: string) => Promise<AgentOutput | null>;
  cancelTask: (taskId: string) => void;
  cancelAllTasks: () => void;
  clearHistory: () => void;
  
  // Queries
  isAgentRunning: (agentId: AgentId) => boolean;
  getAgentStatus: (agentId: AgentId) => AgentStatus;
  getActiveTask: (agentId: AgentId) => AgentTask | undefined;
  getLastTaskResult: (agentId: AgentId) => AgentTask | undefined;
  createConsoleError: (agentId: AgentId, message: string) => void;
  handleConsoleError: (error: any, agentId?: AgentId) => void;
  
  // Aggregated data
  totalActiveCount: number;
  totalErrorCount: number;
  totalWarningCount: number;
  allProblems: Array<{
    agentId: AgentId;
    problem: NonNullable<AgentOutput['problems']>[number];
  }>;
}

const AgentContext = createContext<AgentContextValue | null>(null);

interface AgentProviderProps {
  children: ReactNode;
}

export const AgentProvider: React.FC<AgentProviderProps> = ({ children }) => {
  const {
    activeTasks,
    taskHistory,
    runAgent,
    cancelTask,
    cancelAllTasks,
    clearHistory,
    isAgentRunning,
    getAgentStatus,
    getActiveTask,
    getLastTaskResult,
    createConsoleError,
    handleConsoleError,
  } = useAgentManager({
    onAgentComplete: (task, output) => {
      // Could add notifications here
      console.log(`[Agent] ${task.agentId} completed:`, output.type);
    },
    onAgentError: (task, error) => {
      console.error(`[Agent] ${task.agentId} failed:`, error);
    },
  });

  /**
   * Run agent with context from the editor
   */
  const runAgentWithContext = useCallback(async (
    agentId: AgentId,
    context: AgentInputContext,
    content?: string
  ): Promise<AgentOutput | null> => {
    return runAgent(agentId, {
      type: content ? 'selection' : 'cursor',
      content: content || '',
      context,
    });
  }, [runAgent]);

  /**
   * Aggregate counts
   */
  const totalActiveCount = activeTasks.length;

  /**
   * Aggregate problems from all completed tasks
   */
  const { allProblems, totalErrorCount, totalWarningCount } = useMemo(() => {
    const problems: AgentContextValue['allProblems'] = [];
    let errors = 0;
    let warnings = 0;

    // Get problems from recent successful tasks
    taskHistory
      .filter(t => t.status === 'success' && t.output?.problems)
      .slice(0, 10) // Only last 10 tasks
      .forEach(task => {
        task.output!.problems!.forEach(problem => {
          problems.push({
            agentId: task.agentId,
            problem,
          });
          if (problem.severity === 'error') errors++;
          if (problem.severity === 'warning') warnings++;
        });
      });

    return {
      allProblems: problems,
      totalErrorCount: errors,
      totalWarningCount: warnings,
    };
  }, [taskHistory]);

  const value: AgentContextValue = {
    activeTasks,
    taskHistory,
    runAgent,
    runAgentWithContext,
    cancelTask,
    cancelAllTasks,
    clearHistory,
    isAgentRunning,
    getAgentStatus,
    getActiveTask,
    getLastTaskResult,
    createConsoleError,
    handleConsoleError,
    totalActiveCount,
    totalErrorCount,
    totalWarningCount,
    allProblems,
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};

/**
 * Hook to use agent context
 */
export const useAgents = (): AgentContextValue => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgents must be used within an AgentProvider');
  }
  return context;
};

/**
 * Hook for a specific agent
 */
export const useAgent = (agentId: AgentId) => {
  const {
    runAgent,
    cancelTask,
    isAgentRunning,
    getAgentStatus,
    getActiveTask,
    getLastTaskResult,
  } = useAgents();

  const config = AGENT_CONFIGS[agentId];
  const isRunning = isAgentRunning(agentId);
  const status = getAgentStatus(agentId);
  const activeTask = getActiveTask(agentId);
  const lastResult = getLastTaskResult(agentId);

  const run = useCallback(async (input?: Partial<AgentInput>) => {
    return runAgent(agentId, input);
  }, [agentId, runAgent]);

  const cancel = useCallback(() => {
    const task = getActiveTask(agentId);
    if (task) {
      cancelTask(task.id);
    }
  }, [agentId, getActiveTask, cancelTask]);

  return {
    config,
    isRunning,
    status,
    activeTask,
    lastResult,
    run,
    cancel,
  };
};
