/**
 * AI Agent Service
 * 
 * Production-ready service for AI agent API interactions.
 * Supports both standard requests and streaming for ghost text.
 */

import { AgentId, AgentInput, AgentOutput, AgentProblem } from '@/components/IDE/AIAgents/types';
import { getAgentConfig } from '@/components/IDE/AIAgents/AgentRegistry';
import { buildAgentPrompt, formatFullPrompt } from '@/components/IDE/AIAgents/AgentPromptBuilder';

export type AIProvider = 'gemini' | 'databricks' | 'azure' | 'openai';

export interface AgentRequestOptions {
  provider?: AIProvider;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
  stream?: boolean;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export interface AgentServiceError {
  code: string;
  message: string;
  retryable: boolean;
  statusCode?: number;
}

class AIAgentService {
  private baseUrl: string;
  private defaultProvider: AIProvider;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    this.defaultProvider = (process.env.NEXT_PUBLIC_AI_PROVIDER as AIProvider) || 'gemini';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Run an agent and get the full response
   */
  async runAgent(
    agentId: AgentId,
    input: AgentInput,
    options: AgentRequestOptions = {}
  ): Promise<AgentOutput> {
    const config = getAgentConfig(agentId);
    const prompt = buildAgentPrompt(agentId, input);
    const fullPrompt = formatFullPrompt(prompt);

    const requestOptions = {
      provider: options.provider || this.defaultProvider,
      maxTokens: options.maxTokens || config.maxTokens,
      temperature: options.temperature || config.temperature,
    };

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/api/ai/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: fullPrompt,
            ...requestOptions,
          }),
          signal: options.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(errorData.error || `Request failed: ${response.status}`);
          
          // Don't retry 4xx errors (except 429)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw error;
          }
          
          lastError = error;
          
          if (attempt < this.maxRetries - 1) {
            await this.delay(this.retryDelay * Math.pow(2, attempt));
            continue;
          }
          
          throw error;
        }

        const result = await response.json();
        const content = result.result?.text || result.data || result.content || result.text || '';

        return this.buildOutput(agentId, content, result);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }
        
        lastError = error as Error;
        
        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Run an agent with streaming response for ghost text
   */
  async streamAgent(
    agentId: AgentId,
    input: AgentInput,
    callbacks: StreamCallbacks,
    options: AgentRequestOptions = {}
  ): Promise<void> {
    const config = getAgentConfig(agentId);
    const prompt = buildAgentPrompt(agentId, input);
    const fullPrompt = formatFullPrompt(prompt);

    const requestOptions = {
      provider: options.provider || this.defaultProvider,
      maxTokens: options.maxTokens || config.maxTokens,
      temperature: options.temperature || config.temperature,
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/ai/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          ...requestOptions,
        }),
        signal: options.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Stream request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response has no body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        callbacks.onToken(chunk);
      }

      callbacks.onComplete(fullText);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        callbacks.onComplete('');
        return;
      }
      
      callbacks.onError(error as Error);
    }
  }

  /**
   * Generate ghost text continuation
   */
  async generateGhostText(
    context: string,
    options: AgentRequestOptions = {}
  ): Promise<string> {
    const prompt = `Continue the following story naturally. Write 1-2 sentences that flow seamlessly from the existing text. Do not repeat any of the provided text. Only output the new continuation, nothing else.

Text to continue:
${context}

Continuation:`;

    try {
      const response = await fetch(`${this.baseUrl}/api/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          provider: options.provider || this.defaultProvider,
          maxTokens: options.maxTokens || 100,
          temperature: options.temperature || 0.7,
        }),
        signal: options.signal,
      });

      if (!response.ok) {
        throw new Error(`Ghost text request failed: ${response.status}`);
      }

      const result = await response.json();
      return result.result?.text || result.data || result.content || result.text || '';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return '';
      }
      throw error;
    }
  }

  /**
   * Stream ghost text continuation
   */
  async streamGhostText(
    context: string,
    callbacks: StreamCallbacks,
    options: AgentRequestOptions = {}
  ): Promise<void> {
    const prompt = `Continue the following story naturally. Write 1-2 sentences that flow seamlessly from the existing text. Do not repeat any of the provided text. Only output the new continuation, nothing else.

Text to continue:
${context}

Continuation:`;

    try {
      const response = await fetch(`${this.baseUrl}/api/ai/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          provider: options.provider || this.defaultProvider,
          maxTokens: options.maxTokens || 100,
          temperature: options.temperature || 0.7,
        }),
        signal: options.signal,
      });

      if (!response.ok) {
        throw new Error(`Ghost text stream failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response has no body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        callbacks.onToken(chunk);
      }

      callbacks.onComplete(fullText);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        callbacks.onComplete('');
        return;
      }
      
      callbacks.onError(error as Error);
    }
  }

  /**
   * Build agent output from API response
   */
  private buildOutput(
    agentId: AgentId,
    content: string,
    result: Record<string, unknown>
  ): AgentOutput {
    const config = getAgentConfig(agentId);
    const problems = this.parseProblems(agentId, content);

    const output: AgentOutput = {
      type: config.category === 'generation' ? 'text' : 'analysis',
      content,
      metadata: {
        model: (result.model as string) || 'gemini-pro',
        tokensUsed: (result.usage as { totalTokens?: number })?.totalTokens || Math.ceil(content.length / 4),
        processingTime: (result.processingTime as number) || 0,
      },
      problems: problems.length > 0 ? problems : undefined,
      actions: this.buildActions(config.category, content),
    };

    return output;
  }

  /**
   * Build action buttons based on agent category
   */
  private buildActions(category: string, content: string) {
    if (category === 'generation') {
      return [
        {
          id: 'insert',
          label: 'Insert at Cursor',
          type: 'insert' as const,
          payload: content,
          icon: '📝',
        },
        {
          id: 'replace',
          label: 'Replace Selection',
          type: 'replace' as const,
          payload: content,
          icon: '🔄',
        },
        {
          id: 'copy',
          label: 'Copy to Clipboard',
          type: 'copy' as const,
          payload: content,
          icon: '📋',
        },
        {
          id: 'dismiss',
          label: 'Dismiss',
          type: 'dismiss' as const,
          payload: null,
          icon: '✕',
        },
      ];
    }

    return [
      {
        id: 'apply',
        label: 'Apply Suggestions',
        type: 'apply' as const,
        payload: content,
        icon: '✓',
      },
      {
        id: 'dismiss',
        label: 'Dismiss',
        type: 'dismiss' as const,
        payload: null,
        icon: '✕',
      },
    ];
  }

  /**
   * Parse problems from analysis agent output
   */
  private parseProblems(agentId: AgentId, content: string): AgentProblem[] {
    const config = getAgentConfig(agentId);
    const problems: AgentProblem[] = [];

    if (config.category !== 'analysis' && config.category !== 'consistency') {
      return problems;
    }

    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
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
        problems.push({
          id: `${agentId}-${index}`,
          severity: 'info',
          message: trimmed.replace(/^[-•*]\s+/, ''),
        });
      }
    });

    return problems;
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const aiAgentService = new AIAgentService();

// Export default for convenience
export default aiAgentService;
