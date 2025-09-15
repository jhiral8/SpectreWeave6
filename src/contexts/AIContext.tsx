'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface AIRequest {
  id: string;
  type: 'generation' | 'editing' | 'analysis';
  prompt: string;
  context?: any;
  options?: {
    provider?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
  timestamp: Date;
}

interface AIResponse {
  content: string;
  metadata?: any;
}

interface AIContextType {
  generateText: (request: AIRequest) => Promise<AIResponse>;
  generateStream?: (request: AIRequest, onChunk: (chunk: string) => void) => Promise<void>;
  isLoading?: boolean;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const generateText = async (request: AIRequest): Promise<AIResponse> => {
    console.log('AI generateText request:', request);
    
    try {
      // Determine provider - default to gemini if not specified
      const provider = request.options?.provider || 'gemini';
      
      // Check if we're in demo mode (demo-room or no auth)
      // Use safer approach that works during SSR
      const isDemoMode = (typeof window !== 'undefined' && window.location.pathname.includes('demo-room')) || 
                        (typeof window !== 'undefined' && window.location.pathname.includes('test-editor')) ||
                        (typeof document !== 'undefined' && !document.cookie.includes('supabase-auth-token'));
      
      // Use demo endpoint if in demo mode, otherwise use authenticated endpoints
      const endpoint = isDemoMode ? '/api/ai/demo' : `/api/ai/${provider}`;
      
      // Call the appropriate AI API endpoint
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          prompt: request.prompt,
          temperature: request.options?.temperature || 0.7,
          maxTokens: request.options?.maxTokens || 500,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.data || data.content || data.response || data.text || 'No response generated',
        metadata: {
          provider: provider,
          timestamp: new Date(),
          requestId: request.id,
          success: data.success,
          usage: data.usage
        }
      };
    } catch (error) {
      console.error('AI generateText error:', error);
      
      // Fallback to a more informative error message
      return {
        content: `Error generating AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          provider: request.options?.provider || 'gemini',
          timestamp: new Date(),
          error: true
        }
      };
    }
  };

  const generateStream = async (request: AIRequest, onChunk: (chunk: string) => void): Promise<void> => {
    console.log('AI generateStream request:', request);
    
    try {
      const provider = request.options?.provider || 'gemini';
      
      // Check if we're in demo mode
      // Use safer approach that works during SSR
      const isDemoMode = (typeof window !== 'undefined' && window.location.pathname.includes('demo-room')) || 
                        (typeof window !== 'undefined' && window.location.pathname.includes('test-editor')) ||
                        (typeof document !== 'undefined' && !document.cookie.includes('supabase-auth-token'));
      
      // Use demo endpoint if in demo mode
      const endpoint = isDemoMode ? '/api/ai/demo' : `/api/ai/${provider}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          prompt: request.prompt,
          temperature: request.options?.temperature || 0.7,
          maxTokens: request.options?.maxTokens || 500,
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error(`AI streaming call failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } catch (error) {
      console.error('AI generateStream error:', error);
      onChunk(`Error streaming AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <AIContext.Provider value={{ generateText, generateStream, isLoading: false }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAIContext = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAIContext must be used within an AIProvider');
  }
  return context;
};

export default AIContext;