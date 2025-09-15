'use client'

import { useState, useCallback } from 'react'
import { 
  AIProvider, 
  AIRequest, 
  ChatCompletionRequest,
  ChatMessage,
  AIResponse, 
  StreamResponse,
  AIServiceError,
  AIGenerationOptions,
  UseAIOptions,
  UseAIReturn
} from '@/lib/ai/types'

/**
 * React hook for AI text generation and chat completions
 * Provides a clean interface to all AI providers with built-in state management
 */
export function useAI(options: UseAIOptions = {}): UseAIReturn {
  const {
    provider = 'gemini',
    defaultOptions = {},
    enableStreaming = false,
    onError,
    onSuccess
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AIServiceError | null>(null)
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null)

  const handleError = useCallback((err: any) => {
    const aiError = err instanceof AIServiceError 
      ? err 
      : new AIServiceError({
          code: 'UNKNOWN_ERROR',
          message: err.message || 'An unknown error occurred',
          provider: provider,
          retryable: false
        })
    
    setError(aiError)
    onError?.(aiError)
  }, [provider, onError])

  const handleSuccess = useCallback((response: AIResponse) => {
    setLastResponse(response)
    setError(null)
    onSuccess?.(response)
  }, [onSuccess])

  const generateText = useCallback(async (
    prompt: string, 
    options: AIGenerationOptions = {}
  ): Promise<AIResponse<string>> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          prompt,
          provider,
          stream: false,
          ...defaultOptions,
          ...options
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new AIServiceError({
          code: errorData.code || 'API_ERROR',
          message: errorData.error || 'Failed to generate text',
          provider: provider,
          retryable: errorData.retryable || false
        })
      }

      const result: AIResponse<string> = await response.json()
      handleSuccess(result)
      return result
    } catch (err: any) {
      handleError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [provider, defaultOptions, handleError, handleSuccess])

  const streamText = useCallback(async (
    prompt: string, 
    options: AIGenerationOptions = {}
  ): Promise<StreamResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          prompt,
          provider,
          stream: true,
          ...defaultOptions,
          ...options
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new AIServiceError({
          code: errorData.code || 'STREAM_ERROR',
          message: errorData.error || 'Failed to create stream',
          provider: provider,
          retryable: errorData.retryable || false
        })
      }

      if (!response.body) {
        throw new AIServiceError({
          code: 'NO_STREAM_BODY',
          message: 'Response has no stream body',
          provider: provider,
          retryable: false
        })
      }

      const streamResponse: StreamResponse = {
        stream: response.body,
        provider: provider,
        requestId: response.headers.get('X-Request-ID') || undefined
      }

      return streamResponse
    } catch (err: any) {
      handleError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [provider, defaultOptions, handleError])

  const getChatCompletion = useCallback(async (
    messages: ChatMessage[], 
    options: AIGenerationOptions = {}
  ): Promise<AIResponse<string>> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'chat',
          messages,
          provider,
          ...defaultOptions,
          ...options
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new AIServiceError({
          code: errorData.code || 'CHAT_ERROR',
          message: errorData.error || 'Failed to get chat completion',
          provider: provider,
          retryable: errorData.retryable || false
        })
      }

      const result: AIResponse<string> = await response.json()
      handleSuccess(result)
      return result
    } catch (err: any) {
      handleError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [provider, defaultOptions, handleError, handleSuccess])

  return {
    generateText,
    streamText,
    getChatCompletion,
    isLoading,
    error,
    lastResponse
  }
}

/**
 * Convenience hook for quick text generation with default settings
 */
export function useQuickAI(provider: AIProvider = 'gemini') {
  return useAI({ provider })
}

/**
 * Hook for chat-based AI interactions with conversation management
 */
export function useAIChat(provider: AIProvider = 'databricks') {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const ai = useAI({ provider })

  const sendMessage = useCallback(async (content: string, role: 'user' | 'assistant' = 'user') => {
    const newMessage: ChatMessage = {
      role,
      content,
      timestamp: Date.now()
    }

    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)

    if (role === 'user') {
      try {
        const response = await ai.getChatCompletion(updatedMessages)
        
        if (response.success && response.data) {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: response.data,
            timestamp: Date.now()
          }
          setMessages(prev => [...prev, assistantMessage])
        }

        return response
      } catch (error) {
        // Remove the user message if the AI call failed
        setMessages(messages)
        throw error
      }
    }
  }, [messages, ai])

  const clearChat = useCallback(() => {
    setMessages([])
  }, [])

  const removeLastMessage = useCallback(() => {
    setMessages(prev => prev.slice(0, -1))
  }, [])

  return {
    messages,
    sendMessage,
    clearChat,
    removeLastMessage,
    isLoading: ai.isLoading,
    error: ai.error,
    lastResponse: ai.lastResponse
  }
}