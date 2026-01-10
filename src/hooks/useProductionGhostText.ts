/**
 * Production Ghost Text Hook
 * 
 * Connects the ghost text system to the production AI API.
 * Handles streaming responses and manages suggestion state.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { aiAgentService } from '@/services/AIAgentService';

export interface ProductionGhostTextConfig {
  /** Delay in ms after typing stops before generating suggestion */
  triggerDelay?: number;
  /** Maximum characters of context to send */
  maxContextLength?: number;
  /** Enable streaming responses */
  enableStreaming?: boolean;
  /** AI provider to use */
  provider?: 'gemini' | 'databricks' | 'azure' | 'openai';
  /** Temperature for generation (0-1) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
}

export interface ProductionGhostTextReturn {
  /** Current suggestion text */
  suggestion: string | null;
  /** Whether currently generating */
  isGenerating: boolean;
  /** Whether streaming response */
  isStreaming: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Request a suggestion for the given context */
  requestSuggestion: (context: string) => Promise<void>;
  /** Accept the current suggestion */
  acceptSuggestion: () => string | null;
  /** Dismiss the current suggestion */
  dismissSuggestion: () => void;
  /** Cancel any pending request */
  cancel: () => void;
}

export function useProductionGhostText(
  config: ProductionGhostTextConfig = {}
): ProductionGhostTextReturn {
  const {
    triggerDelay = 800,
    maxContextLength = 2000,
    enableStreaming = true,
    provider = 'gemini',
    temperature = 0.7,
    maxTokens = 100,
  } = config;

  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const triggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContextRef = useRef<string>('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (triggerTimeoutRef.current) {
        clearTimeout(triggerTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Cancel any pending request or timeout
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    
    if (triggerTimeoutRef.current) {
      clearTimeout(triggerTimeoutRef.current);
      triggerTimeoutRef.current = null;
    }
    
    setIsGenerating(false);
    setIsStreaming(false);
  }, []);

  /**
   * Dismiss the current suggestion
   */
  const dismissSuggestion = useCallback(() => {
    cancel();
    setSuggestion(null);
    setError(null);
  }, [cancel]);

  /**
   * Accept the current suggestion and return it
   */
  const acceptSuggestion = useCallback((): string | null => {
    const accepted = suggestion;
    setSuggestion(null);
    setError(null);
    return accepted;
  }, [suggestion]);

  /**
   * Request a ghost text suggestion for the given context
   */
  const requestSuggestion = useCallback(async (context: string) => {
    // Cancel any existing request
    cancel();
    
    // Trim context to max length
    const trimmedContext = context.slice(-maxContextLength);
    
    // Don't request for empty or whitespace-only context
    if (!trimmedContext.trim()) {
      return;
    }
    
    // Don't request if context hasn't changed significantly
    if (trimmedContext === lastContextRef.current) {
      return;
    }
    
    lastContextRef.current = trimmedContext;
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setIsGenerating(true);
    setError(null);
    
    try {
      if (enableStreaming) {
        setIsStreaming(true);
        setSuggestion('');
        
        await aiAgentService.streamGhostText(
          trimmedContext,
          {
            onToken: (token) => {
              setSuggestion(prev => (prev || '') + token);
            },
            onComplete: (fullText) => {
              setSuggestion(fullText || null);
              setIsStreaming(false);
              setIsGenerating(false);
            },
            onError: (err) => {
              setError(err);
              setSuggestion(null);
              setIsStreaming(false);
              setIsGenerating(false);
            },
          },
          {
            provider,
            temperature,
            maxTokens,
            signal: abortControllerRef.current?.signal,
          }
        );
      } else {
        const result = await aiAgentService.generateGhostText(
          trimmedContext,
          {
            provider,
            temperature,
            maxTokens,
            signal: abortControllerRef.current?.signal,
          }
        );
        
        setSuggestion(result || null);
        setIsGenerating(false);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't set error
        return;
      }
      
      setError(err as Error);
      setSuggestion(null);
      setIsGenerating(false);
      setIsStreaming(false);
    }
  }, [cancel, maxContextLength, enableStreaming, provider, temperature, maxTokens]);

  return {
    suggestion,
    isGenerating,
    isStreaming,
    error,
    requestSuggestion,
    acceptSuggestion,
    dismissSuggestion,
    cancel,
  };
}

/**
 * Hook for auto-triggering ghost text on typing pause
 */
export function useAutoGhostText(
  getContext: () => string,
  config: ProductionGhostTextConfig & { enabled?: boolean } = {}
) {
  const { enabled = true, triggerDelay = 800, ...ghostConfig } = config;
  
  const ghostText = useProductionGhostText({ ...ghostConfig, triggerDelay });
  const triggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTriggerTimeRef = useRef<number>(0);

  /**
   * Trigger a suggestion after a delay
   */
  const triggerAfterDelay = useCallback(() => {
    if (!enabled) return;
    
    // Clear existing timeout
    if (triggerTimeoutRef.current) {
      clearTimeout(triggerTimeoutRef.current);
    }
    
    // Dismiss current suggestion when user starts typing
    ghostText.dismissSuggestion();
    
    // Set new timeout
    triggerTimeoutRef.current = setTimeout(() => {
      const context = getContext();
      
      // Only trigger if we have meaningful context
      if (context.trim().length > 10) {
        // Check if we should trigger (e.g., at end of sentence)
        const lastChar = context.trim().slice(-1);
        const shouldTrigger = ['.', '!', '?', '"', "'", '\n', ' '].includes(lastChar);
        
        if (shouldTrigger || context.length > 100) {
          lastTriggerTimeRef.current = Date.now();
          ghostText.requestSuggestion(context);
        }
      }
    }, triggerDelay);
  }, [enabled, triggerDelay, getContext, ghostText]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (triggerTimeoutRef.current) {
        clearTimeout(triggerTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...ghostText,
    triggerAfterDelay,
  };
}

export default useProductionGhostText;
