/**
 * Production Agent Provider
 * 
 * Enhanced agent context provider with production API integration,
 * streaming support, and connection status monitoring.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { aiAgentService, AIProvider, StreamCallbacks } from '@/services/AIAgentService';
import {
  AgentId,
  AgentTask,
  AgentInput,
  AgentOutput,
  AgentStatus,
} from '@/components/IDE/AIAgents/types';
import { getAgentConfig, AGENT_CONFIGS } from '@/components/IDE/AIAgents/AgentRegistry';

// Connection status types
export type ConnectionStatus = 'connected' | 'disconnected' | 'checking' | 'error';

export interface ProductionAgentConfig {
  /** AI provider to use */
  provider?: AIProvider;
  /** Maximum tasks in history */
  maxHistorySize?: number;
  /** Health check interval in ms */
  healthCheckInterval?: number;
  /** Enable streaming by default */
  enableStreaming?: boolean;
  /** Retry failed requests */
  enableRetry?: boolean;
}

export interface ProductionAgentContextValue {
  // Connection
  connectionStatus: ConnectionStatus;
  lastHealthCheck: Date | null;
  checkConnection: () => Promise<boolean>;
  
  // Tasks
  activeTasks: AgentTask[];
  taskHistory: AgentTask[];
  
  // Agent operations
  runAgent: (agentId: AgentId, input?: Partial<AgentInput>) => Promise<AgentOutput | null>;
  streamAgent: (agentId: AgentId, input: Partial<AgentInput>, callbacks: StreamCallbacks) => Promise<void>;
  cancelTask: (taskId: string) => void;
  cancelAllTasks: () => void;
  clearHistory: () => void;
  
  // Queries
  isAgentRunning: (agentId: AgentId) => boolean;
  getAgentStatus: (agentId: AgentId) => AgentStatus;
  getActiveTask: (agentId: AgentId) => AgentTask | undefined;
  getLastTaskResult: (agentId: AgentId) => AgentTask | undefined;
  
  // Config
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
}

const ProductionAgentContext = createContext<ProductionAgentContextValue | null>(null);

export function ProductionAgentProvider({
  children,
  config = {},
}: {
  children: ReactNode;
  config?: ProductionAgentConfig;
}) {
  const {
    provider: initialProvider = 'gemini',
    maxHistorySize = 50,
    healthCheckInterval = 60000,
    enableStreaming = true,
    enableRetry = true,
  } = config;

  // State
  const [provider, setProvider] = useState<AIProvider>(initialProvider);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([]);
  const [taskHistory, setTaskHistory] = useState<AgentTask[]>([]);
  
  // Refs
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Check API connection health
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setConnectionStatus('checking');
    
    try {
      const response = await fetch('/api/ai/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      const isConnected = response.ok;
      setConnectionStatus(isConnected ? 'connected' : 'error');
      setLastHealthCheck(new Date());
      
      return isConnected;
    } catch (error) {
      setConnectionStatus('disconnected');
      setLastHealthCheck(new Date());
      return false;
    }
  }, []);

  // Set up health check interval
  useEffect(() => {
    // Initial check
    checkConnection();
    
    // Set up interval
    if (healthCheckInterval > 0) {
      healthCheckIntervalRef.current = setInterval(checkConnection, healthCheckInterval);
    }
    
    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [checkConnection, healthCheckInterval]);

  // Cleanup abort controllers on unmount
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
    };
  }, []);

  /**
   * Build input from provided data and defaults
   */
  const buildInput = useCallback((customInput?: Partial<AgentInput>): AgentInput => {
    return {
      type: 'cursor',
      content: '',
      context: {},
      ...customInput,
    };
  }, []);

  /**
   * Run an agent with the given input
   */
  const runAgent = useCallback(async (
    agentId: AgentId,
    customInput?: Partial<AgentInput>
  ): Promise<AgentOutput | null> => {
    const config = getAgentConfig(agentId);
    const input = buildInput(customInput);
    
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
    
    // Create abort controller
    const abortController = new AbortController();
    abortControllersRef.current.set(taskId, abortController);
    
    try {
      const output = await aiAgentService.runAgent(agentId, input, {
        provider,
        signal: abortController.signal,
      });
      
      // Complete the task
      const completedTask: AgentTask = {
        ...task,
        status: 'success',
        output,
        endTime: new Date(),
      };
      
      setActiveTasks(prev => prev.filter(t => t.id !== taskId));
      setTaskHistory(prev => [completedTask, ...prev.slice(0, maxHistorySize - 1)]);
      
      return output;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setActiveTasks(prev => prev.filter(t => t.id !== taskId));
        return null;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const failedTask: AgentTask = {
        ...task,
        status: 'error',
        error: errorMessage,
        endTime: new Date(),
      };
      
      setActiveTasks(prev => prev.filter(t => t.id !== taskId));
      setTaskHistory(prev => [failedTask, ...prev.slice(0, maxHistorySize - 1)]);
      
      return null;
    } finally {
      abortControllersRef.current.delete(taskId);
    }
  }, [provider, buildInput, maxHistorySize]);

  /**
   * Stream an agent response
   */
  const streamAgent = useCallback(async (
    agentId: AgentId,
    customInput: Partial<AgentInput>,
    callbacks: StreamCallbacks
  ): Promise<void> => {
    const input = buildInput(customInput);
    
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
    
    await aiAgentService.streamAgent(agentId, input, {
      onToken: callbacks.onToken,
      onComplete: (fullText) => {
        const output: AgentOutput = {
          type: 'text',
          content: fullText,
        };
        
        const completedTask: AgentTask = {
          ...task,
          status: 'success',
          output,
          endTime: new Date(),
        };
        
        setActiveTasks(prev => prev.filter(t => t.id !== taskId));
        setTaskHistory(prev => [completedTask, ...prev.slice(0, maxHistorySize - 1)]);
        abortControllersRef.current.delete(taskId);
        
        callbacks.onComplete(fullText);
      },
      onError: (error) => {
        const failedTask: AgentTask = {
          ...task,
          status: 'error',
          error: error.message,
          endTime: new Date(),
        };
        
        setActiveTasks(prev => prev.filter(t => t.id !== taskId));
        setTaskHistory(prev => [failedTask, ...prev.slice(0, maxHistorySize - 1)]);
        abortControllersRef.current.delete(taskId);
        
        callbacks.onError(error);
      },
    }, {
      provider,
      signal: abortController.signal,
    });
  }, [provider, buildInput, maxHistorySize]);

  /**
   * Cancel a specific task
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
   * Cancel all active tasks
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
   * Check if an agent is currently running
   */
  const isAgentRunning = useCallback((agentId: AgentId): boolean => {
    return activeTasks.some(t => t.agentId === agentId && t.status === 'working');
  }, [activeTasks]);

  /**
   * Get the status of an agent
   */
  const getAgentStatus = useCallback((agentId: AgentId): AgentStatus => {
    const activeTask = activeTasks.find(t => t.agentId === agentId);
    if (activeTask) {
      return activeTask.status;
    }
    
    const lastTask = taskHistory.find(t => t.agentId === agentId);
    return lastTask?.status || 'idle';
  }, [activeTasks, taskHistory]);

  /**
   * Get the active task for an agent
   */
  const getActiveTask = useCallback((agentId: AgentId): AgentTask | undefined => {
    return activeTasks.find(t => t.agentId === agentId && t.status === 'working');
  }, [activeTasks]);

  /**
   * Get the last completed task for an agent
   */
  const getLastTaskResult = useCallback((agentId: AgentId): AgentTask | undefined => {
    return taskHistory.find(t => t.agentId === agentId);
  }, [taskHistory]);

  const value: ProductionAgentContextValue = {
    connectionStatus,
    lastHealthCheck,
    checkConnection,
    activeTasks,
    taskHistory,
    runAgent,
    streamAgent,
    cancelTask,
    cancelAllTasks,
    clearHistory,
    isAgentRunning,
    getAgentStatus,
    getActiveTask,
    getLastTaskResult,
    provider,
    setProvider,
  };

  return (
    <ProductionAgentContext.Provider value={value}>
      {children}
    </ProductionAgentContext.Provider>
  );
}

/**
 * Hook to access production agent context
 */
export function useProductionAgents() {
  const context = useContext(ProductionAgentContext);
  
  if (!context) {
    throw new Error('useProductionAgents must be used within ProductionAgentProvider');
  }
  
  return context;
}

/**
 * Hook for a specific agent with streaming support
 */
export function useProductionAgent(agentId: AgentId) {
  const context = useProductionAgents();
  
  const run = useCallback(async (input?: Partial<AgentInput>) => {
    return context.runAgent(agentId, input);
  }, [context, agentId]);
  
  const stream = useCallback(async (
    input: Partial<AgentInput>,
    callbacks: StreamCallbacks
  ) => {
    return context.streamAgent(agentId, input, callbacks);
  }, [context, agentId]);
  
  const cancel = useCallback(() => {
    const task = context.getActiveTask(agentId);
    if (task) {
      context.cancelTask(task.id);
    }
  }, [context, agentId]);
  
  return {
    run,
    stream,
    cancel,
    isRunning: context.isAgentRunning(agentId),
    status: context.getAgentStatus(agentId),
    activeTask: context.getActiveTask(agentId),
    lastResult: context.getLastTaskResult(agentId),
    config: getAgentConfig(agentId),
  };
}

export default ProductionAgentProvider;
