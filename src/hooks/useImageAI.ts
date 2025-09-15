'use client'

import { useState, useCallback } from 'react'
import { 
  ImageProvider, 
  ImageRequest, 
  ImageAnalysisRequest,
  ImageEditRequest,
  ImageGenerationOptions,
  AIResponse, 
  AIServiceError,
  UseImageAIReturn
} from '@/lib/ai/types'

/**
 * React hook for AI image generation, analysis, and editing
 * Provides a clean interface to image AI providers with built-in state management
 */
export function useImageAI(): UseImageAIReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AIServiceError | null>(null)
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null)

  const handleError = useCallback((err: any, provider: string) => {
    const aiError = err instanceof AIServiceError 
      ? err 
      : new AIServiceError({
          code: 'UNKNOWN_ERROR',
          message: err.message || 'An unknown error occurred',
          provider: provider as any,
          retryable: false
        })
    
    setError(aiError)
  }, [])

  const handleSuccess = useCallback((response: AIResponse) => {
    setLastResponse(response)
    setError(null)
  }, [])

  const generateImage = useCallback(async (
    prompt: string, 
    options: ImageGenerationOptions = {}
  ): Promise<AIResponse<string>> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/stability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-image',
          prompt,
          ...options
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new AIServiceError({
          code: errorData.code || 'IMAGE_GENERATION_ERROR',
          message: errorData.error || 'Failed to generate image',
          provider: 'stability',
          retryable: errorData.retryable || false
        })
      }

      const result: AIResponse<string> = await response.json()
      handleSuccess(result)
      return result
    } catch (err: any) {
      handleError(err, 'stability')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [handleError, handleSuccess])

  const analyzeImage = useCallback(async (
    imageData: string, 
    prompt: string
  ): Promise<AIResponse<string>> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze-image',
          imageData,
          prompt
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new AIServiceError({
          code: errorData.code || 'IMAGE_ANALYSIS_ERROR',
          message: errorData.error || 'Failed to analyze image',
          provider: 'gemini',
          retryable: errorData.retryable || false
        })
      }

      const result: AIResponse<string> = await response.json()
      handleSuccess(result)
      return result
    } catch (err: any) {
      handleError(err, 'gemini')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [handleError, handleSuccess])

  const editImage = useCallback(async (
    imageData: string, 
    prompt: string, 
    options: { strength?: number; steps?: number } = {}
  ): Promise<AIResponse<string>> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/stability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'edit-image',
          imageData,
          prompt,
          ...options
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new AIServiceError({
          code: errorData.code || 'IMAGE_EDIT_ERROR',
          message: errorData.error || 'Failed to edit image',
          provider: 'stability',
          retryable: errorData.retryable || false
        })
      }

      const result: AIResponse<string> = await response.json()
      handleSuccess(result)
      return result
    } catch (err: any) {
      handleError(err, 'stability')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [handleError, handleSuccess])

  return {
    generateImage,
    analyzeImage,
    editImage,
    isLoading,
    error,
    lastResponse
  }
}

/**
 * Convenience hook for quick image generation with preset options
 */
export function useQuickImageGen() {
  const { generateImage, isLoading, error } = useImageAI()
  
  const generateQuick = useCallback(async (prompt: string, size: 'square' | 'portrait' | 'landscape' = 'square') => {
    const sizeOptions = {
      square: { width: 1024, height: 1024 },
      portrait: { width: 768, height: 1024 },
      landscape: { width: 1024, height: 768 }
    }
    
    return generateImage(prompt, sizeOptions[size])
  }, [generateImage])

  return {
    generateQuick,
    isLoading,
    error
  }
}

/**
 * Hook for image editing workflow with multiple iterations
 */
export function useImageEditor() {
  const { editImage, isLoading, error } = useImageAI()
  const [editHistory, setEditHistory] = useState<Array<{
    prompt: string
    result: string
    timestamp: number
  }>>([])

  const editWithHistory = useCallback(async (
    imageData: string, 
    prompt: string, 
    options: { strength?: number; steps?: number } = {}
  ) => {
    const result = await editImage(imageData, prompt, options)
    
    if (result.success && result.data) {
      setEditHistory(prev => [...prev, {
        prompt,
        result: result.data!,
        timestamp: Date.now()
      }])
    }
    
    return result
  }, [editImage])

  const clearHistory = useCallback(() => {
    setEditHistory([])
  }, [])

  const undoLastEdit = useCallback(() => {
    setEditHistory(prev => prev.slice(0, -1))
  }, [])

  return {
    editWithHistory,
    editHistory,
    clearHistory,
    undoLastEdit,
    isLoading,
    error
  }
}

/**
 * Hook for batch image operations
 */
export function useBatchImageAI() {
  const { generateImage, analyzeImage } = useImageAI()
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 })
  const [isProcessing, setIsProcessing] = useState(false)

  const generateBatch = useCallback(async (
    prompts: string[], 
    options: ImageGenerationOptions = {}
  ) => {
    setIsProcessing(true)
    setBatchProgress({ completed: 0, total: prompts.length })
    
    const results: Array<AIResponse<string> | Error> = []

    for (let i = 0; i < prompts.length; i++) {
      try {
        const result = await generateImage(prompts[i], options)
        results.push(result)
      } catch (error: any) {
        results.push(error)
      }
      
      setBatchProgress({ completed: i + 1, total: prompts.length })
      
      // Add delay between requests to avoid rate limiting
      if (i < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    setIsProcessing(false)
    return results
  }, [generateImage])

  const analyzeBatch = useCallback(async (
    imageDataArray: string[], 
    prompts: string[]
  ) => {
    if (imageDataArray.length !== prompts.length) {
      throw new Error('Image data array and prompts array must have the same length')
    }

    setIsProcessing(true)
    setBatchProgress({ completed: 0, total: imageDataArray.length })
    
    const results: Array<AIResponse<string> | Error> = []

    for (let i = 0; i < imageDataArray.length; i++) {
      try {
        const result = await analyzeImage(imageDataArray[i], prompts[i])
        results.push(result)
      } catch (error: any) {
        results.push(error)
      }
      
      setBatchProgress({ completed: i + 1, total: imageDataArray.length })
      
      // Add delay between requests to avoid rate limiting
      if (i < imageDataArray.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    setIsProcessing(false)
    return results
  }, [analyzeImage])

  return {
    generateBatch,
    analyzeBatch,
    batchProgress,
    isProcessing
  }
}