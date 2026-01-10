/**
 * Agent Manager Hook
 * 
 * Central hook for managing AI agent execution, state, and history.
 * Provides a clean interface for running agents and tracking their status.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AgentId,
  AgentTask,
  AgentInput,
  AgentOutput,
  AgentStatus,
  AgentContext,
  AgentProblem,
  OnAgentStart,
  OnAgentComplete,
  OnAgentError,
} from '../types';
import { getAgentConfig, AGENT_CONFIGS } from '../AgentRegistry';
import { buildAgentPrompt, formatFullPrompt } from '../AgentPromptBuilder';

interface UseAgentManagerConfig {
  /** Maximum number of tasks to keep in history */
  maxHistorySize?: number;
  /** Callback when an agent starts */
  onAgentStart?: OnAgentStart;
  /** Callback when an agent completes */
  onAgentComplete?: OnAgentComplete;
  /** Callback when an agent errors */
  onAgentError?: OnAgentError;
}

interface UseAgentManagerReturn {
  // State
  activeTasks: AgentTask[];
  taskHistory: AgentTask[];
  
  // Actions
  runAgent: (agentId: AgentId, input?: Partial<AgentInput>) => Promise<AgentOutput | null>;
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
}

export const useAgentManager = ({
  maxHistorySize = 50,
  onAgentStart,
  onAgentComplete,
  onAgentError,
}: UseAgentManagerConfig = {}): UseAgentManagerReturn => {
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([]);
  const [taskHistory, setTaskHistory] = useState<AgentTask[]>([]);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Cleanup abort controllers on unmount
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
    };
  }, []);

  /**
   * Build the input from provided data and defaults
   */
  const buildInput = useCallback((
    agentId: AgentId,
    customInput?: Partial<AgentInput>
  ): AgentInput => {
    const defaultInput: AgentInput = {
      type: 'cursor',
      content: '',
      context: {},
    };
    
    return {
      ...defaultInput,
      ...customInput,
      context: {
        ...defaultInput.context,
        ...customInput?.context,
      },
    };
  }, []);

  /**
   * Parse agent output for problems (for analysis agents)
   */
  const parseProblems = useCallback((
    agentId: AgentId,
    content: string
  ): AgentProblem[] => {
    const problems: AgentProblem[] = [];
    const config = getAgentConfig(agentId);
    
    // For analysis/consistency agents, try to extract structured problems
    if (config.category === 'analysis' || config.category === 'consistency') {
      // Look for bullet points or numbered items
      const lines = content.split('\n');
      let currentProblem: Partial<AgentProblem> | null = null;
      
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Check for severity indicators
        if (trimmed.match(/^(error|issue|problem|critical)/i)) {
          problems.push({
            id: `${agentId}-${index}`,
            severity: 'error',
            message: trimmed,
          });
        } else if (trimmed.match(/^(warning|caution|consider)/i)) {
          problems.push({
            id: `${agentId}-${index}`,
            severity: 'warning',
            message: trimmed,
          });
        } else if (trimmed.match(/^(suggestion|recommend|could|might)/i)) {
          problems.push({
            id: `${agentId}-${index}`,
            severity: 'suggestion',
            message: trimmed,
          });
        } else if (trimmed.match(/^(note|info|fyi)/i)) {
          problems.push({
            id: `${agentId}-${index}`,
            severity: 'info',
            message: trimmed,
          });
        } else if (trimmed.match(/^[-•*]\s+/)) {
          // Bullet point - default to info
          problems.push({
            id: `${agentId}-${index}`,
            severity: 'info',
            message: trimmed.replace(/^[-•*]\s+/, ''),
          });
        }
      });
    }
    
    return problems;
  }, []);

  /**
   * Run an agent with the given input
   */
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
    
    // Add to active tasks
    setActiveTasks(prev => [...prev, task]);
    onAgentStart?.(task);
    
    // Create abort controller
    const abortController = new AbortController();
    abortControllersRef.current.set(taskId, abortController);
    
    try {
      // Build the prompt
      const prompt = buildAgentPrompt(agentId, input);
      const fullPrompt = formatFullPrompt(prompt);
      
      // Call the AI API
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          provider: 'openrouter',
          maxTokens: config.maxTokens,
          temperature: config.temperature,
        }),
        signal: abortController.signal,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Agent request failed: ${response.status}`);
      }
      
      const result = await response.json();
      const content = result.data || result.content || result.text || '';
      
      // Parse problems for analysis agents
      const problems = parseProblems(agentId, content);
      
      // Build output
      const output: AgentOutput = {
        type: config.category === 'generation' ? 'text' : 'analysis',
        content,
        metadata: {
          model: result.model || 'gemini-pro',
          tokensUsed: result.usage?.totalTokens || Math.ceil(content.length / 4),
          processingTime: Date.now() - task.startTime.getTime(),
        },
        problems: problems.length > 0 ? problems : undefined,
        actions: config.category === 'generation' ? [
          {
            id: 'insert',
            label: 'Insert at Cursor',
            type: 'insert',
            payload: content,
            icon: '📝',
          },
          {
            id: 'replace',
            label: 'Replace Selection',
            type: 'replace',
            payload: content,
            icon: '🔄',
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss',
            payload: null,
            icon: '✕',
          },
        ] : [
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'dismiss',
            payload: null,
            icon: '✕',
          },
        ],
      };
      
      // Complete the task
      const completedTask: AgentTask = {
        ...task,
        status: 'success',
        output,
        endTime: new Date(),
      };
      
      setActiveTasks(prev => prev.filter(t => t.id !== taskId));
      setTaskHistory(prev => [completedTask, ...prev.slice(0, maxHistorySize - 1)]);
      onAgentComplete?.(completedTask, output);
      
      return output;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Don't report aborted requests as errors
      if (error instanceof Error && error.name === 'AbortError') {
        setActiveTasks(prev => prev.filter(t => t.id !== taskId));
        return null;
      }
      
      const failedTask: AgentTask = {
        ...task,
        status: 'error',
        error: errorMessage,
        endTime: new Date(),
      };
      
      setActiveTasks(prev => prev.filter(t => t.id !== taskId));
      setTaskHistory(prev => [failedTask, ...prev.slice(0, maxHistorySize - 1)]);
      onAgentError?.(failedTask, errorMessage);
      
      return null;
    } finally {
      abortControllersRef.current.delete(taskId);
    }
  }, [buildInput, parseProblems, maxHistorySize, onAgentStart, onAgentComplete, onAgentError]);

  /**
   * Create a manual error entry in the console
   */
  const createConsoleError = useCallback((agentId: AgentId, message: string) => {
    const taskId = `error-${agentId}-${Date.now()}`;
    const failedTask: AgentTask = {
      id: taskId,
      agentId,
      status: 'error',
      error: message,
      startTime: new Date(),
      endTime: new Date(),
      input: { type: 'cursor', content: '', context: {} }
    };
    setTaskHistory(prev => [failedTask, ...prev.slice(0, (maxHistorySize || 50) - 1)]);
    onAgentError?.(failedTask, message);
  }, [maxHistorySize, onAgentError]);

  /**
   * Handle an error by logging it to the console
   */
  const handleConsoleError = useCallback((error: any, agentId: AgentId = 'ghost-writer') => {
    const message = error instanceof Error ? error.message : String(error);
    createConsoleError(agentId, message);
  }, [createConsoleError]);

  /**
   * Cancel a specific running task
   */
  const cancelTask = useCallback((taskId: string) => {
    const controller = abortControllersRef.current.get(taskId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(taskId);
    }
    setActiveTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  /**
   * Cancel all running tasks
   */
  const cancelAllTasks = useCallback(() => {
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current.clear();
    setActiveTasks([]);
  }, []);

  /**
   * Clear task history
   */
  const clearHistory = useCallback(() => {
    setTaskHistory([]);
  }, []);

  /**
   * Check if a specific agent is currently running
   */
  const isAgentRunning = useCallback((agentId: AgentId): boolean => {
    return activeTasks.some(t => t.agentId === agentId);
  }, [activeTasks]);

  /**
   * Get the current status of an agent
   */
  const getAgentStatus = useCallback((agentId: AgentId): AgentStatus => {
    // Check active tasks first
    const activeTask = activeTasks.find(t => t.agentId === agentId);
    if (activeTask) return activeTask.status;
    
    // Then check history for last status
    const lastTask = taskHistory.find(t => t.agentId === agentId);
    if (lastTask) return lastTask.status;
    
    return 'idle';
  }, [activeTasks, taskHistory]);

  /**
   * Get the active task for an agent
   */
  const getActiveTask = useCallback((agentId: AgentId): AgentTask | undefined => {
    return activeTasks.find(t => t.agentId === agentId);
  }, [activeTasks]);

  /**
   * Get the last completed task for an agent
   */
  const getLastTaskResult = useCallback((agentId: AgentId): AgentTask | undefined => {
    return taskHistory.find(t => t.agentId === agentId);
  }, [taskHistory]);

  return {
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
  };
};
