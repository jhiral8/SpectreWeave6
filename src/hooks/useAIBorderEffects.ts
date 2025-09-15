'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAIChatSidebar } from './useAIChatSidebar'

export type AIActivity = 'idle' | 'thinking' | 'generating' | 'error'
export type AIQuality = 'low' | 'medium' | 'high'

interface AIBorderState {
  activity: AIActivity
  confidence: number // 0-1
  quality: AIQuality
  isDataFlowing: boolean
  intensity: number // 0-1
}

interface UseAIBorderEffectsReturn {
  borderState: AIBorderState
  setBorderActivity: (activity: AIActivity) => void
  setBorderConfidence: (confidence: number) => void
  setBorderQuality: (quality: AIQuality) => void
  setDataFlowing: (flowing: boolean) => void
  setIntensity: (intensity: number) => void
  getActivityClasses: () => string
  getConfidenceClasses: () => string
  getQualityClasses: () => string
  getDataFlowClasses: () => string
  getCSSVariables: () => React.CSSProperties
}

export function useAIBorderEffects(initialState?: Partial<AIBorderState>): UseAIBorderEffectsReturn {
  const aiChatSidebar = useAIChatSidebar()
  
  const [borderState, setBorderState] = useState<AIBorderState>({
    activity: 'idle',
    confidence: 0.7,
    quality: 'medium',
    isDataFlowing: false,
    intensity: 0.5,
    ...initialState
  })

  // Extract primitive values to avoid object reference dependencies
  const { isLoading, isStreaming, error } = aiChatSidebar
  
  // Auto-detect AI activity from chat sidebar state
  useEffect(() => {
    if (isLoading) {
      setBorderState(prev => ({ ...prev, activity: 'thinking' }))
    } else if (isStreaming) {
      setBorderState(prev => ({ ...prev, activity: 'generating' }))
    } else if (error) {
      setBorderState(prev => ({ ...prev, activity: 'error' }))
    } else {
      setBorderState(prev => ({ ...prev, activity: 'idle' }))
    }
  }, [isLoading, isStreaming, error])

  const setBorderActivity = useCallback((activity: AIActivity) => {
    setBorderState(prev => ({ ...prev, activity }))
  }, [])

  const setBorderConfidence = useCallback((confidence: number) => {
    const clampedConfidence = Math.max(0, Math.min(1, confidence))
    setBorderState(prev => ({ ...prev, confidence: clampedConfidence }))
  }, [])

  const setBorderQuality = useCallback((quality: AIQuality) => {
    setBorderState(prev => ({ ...prev, quality }))
  }, [])

  const setDataFlowing = useCallback((flowing: boolean) => {
    setBorderState(prev => ({ ...prev, isDataFlowing: flowing }))
  }, [])

  const setIntensity = useCallback((intensity: number) => {
    const clampedIntensity = Math.max(0, Math.min(1, intensity))
    setBorderState(prev => ({ ...prev, intensity: clampedIntensity }))
  }, [])

  const getActivityClasses = useCallback(() => {
    const { activity } = borderState
    const baseClasses = 'ai-border-base ai-neural-border'
    
    switch (activity) {
      case 'thinking':
        return `${baseClasses} ai-thinking`
      case 'generating':
        return `${baseClasses} ai-generating`
      case 'error':
        return `${baseClasses} ai-error`
      default:
        return baseClasses
    }
  }, [borderState.activity])

  const getConfidenceClasses = useCallback(() => {
    return 'ai-confidence-border'
  }, [])

  const getQualityClasses = useCallback(() => {
    const { quality } = borderState
    return `ai-quality-border ${quality}-quality`
  }, [borderState.quality])

  const getDataFlowClasses = useCallback(() => {
    const { isDataFlowing } = borderState
    return isDataFlowing ? 'ai-dual-flow' : ''
  }, [borderState.isDataFlowing])

  const getCSSVariables = useCallback((): React.CSSProperties => {
    const { confidence, intensity } = borderState
    
    return {
      '--ai-confidence': confidence.toString(),
      '--ai-intensity': intensity.toString(),
    } as React.CSSProperties
  }, [borderState.confidence, borderState.intensity])

  // Memoize the return object to prevent unnecessary re-renders
  // Only depend on primitive values that actually change, not the functions or objects
  return useMemo(() => ({
    borderState,
    setBorderActivity,
    setBorderConfidence,
    setBorderQuality,
    setDataFlowing,
    setIntensity,
    getActivityClasses,
    getConfidenceClasses,
    getQualityClasses,
    getDataFlowClasses,
    getCSSVariables,
  }), [
    // Only depend on primitive values from borderState to prevent infinite loops
    borderState.activity,
    borderState.confidence,
    borderState.quality,
    borderState.isDataFlowing,
    borderState.intensity,
  ])
}

// Convenience hook for manuscript surfaces (neural + quality effects)
export function useManuscriptBorderEffects(initialState?: Partial<AIBorderState>) {
  const borderEffects = useAIBorderEffects(initialState)
  
  const getManuscriptClasses = useCallback(() => {
    const baseClass = 'ai-manuscript-border'
    const activityClass = borderEffects.borderState.activity !== 'idle' ? borderEffects.borderState.activity : ''
    const qualityClass = `${borderEffects.borderState.quality}-quality`
    
    return `${baseClass} ${activityClass} ${qualityClass}`.trim()
  }, [borderEffects.borderState.activity, borderEffects.borderState.quality])

  return useMemo(() => ({
    ...borderEffects,
    getManuscriptClasses,
  }), [borderEffects.borderState.activity, borderEffects.borderState.quality])
}

// Convenience hook for framework surfaces (confidence + data flow effects)  
export function useFrameworkBorderEffects(initialState?: Partial<AIBorderState>) {
  const borderEffects = useAIBorderEffects(initialState)
  
  const getFrameworkClasses = useCallback(() => {
    const baseClass = 'ai-framework-border'
    const dataFlowClass = borderEffects.getDataFlowClasses()
    const confidenceLevel = borderEffects.borderState.confidence > 0.8 ? 'high-confidence' 
                          : borderEffects.borderState.confidence > 0.5 ? 'medium-confidence' 
                          : 'low-confidence'
    
    return `${baseClass} ${confidenceLevel} ${dataFlowClass}`.trim()
  }, [borderEffects.borderState.confidence, borderEffects.borderState.isDataFlowing])

  return useMemo(() => ({
    ...borderEffects,
    getFrameworkClasses,
  }), [borderEffects.borderState.confidence, borderEffects.borderState.isDataFlowing])
}

// Hook for detecting AI processing patterns and adjusting effects
export function useAdaptiveAIEffects() {
  const [processingHistory, setProcessingHistory] = useState<number[]>([])
  const [adaptiveIntensity, setAdaptiveIntensity] = useState(0.5)
  
  const recordProcessingTime = useCallback((durationMs: number) => {
    setProcessingHistory(prev => {
      const newHistory = [...prev, durationMs].slice(-10) // Keep last 10 measurements
      
      // Calculate adaptive intensity based on processing patterns
      const avgDuration = newHistory.reduce((sum, time) => sum + time, 0) / newHistory.length
      const intensity = Math.min(1, Math.max(0.2, avgDuration / 5000)) // Scale based on 5s max
      
      setAdaptiveIntensity(intensity)
      return newHistory
    })
  }, [])

  return useMemo(() => ({
    adaptiveIntensity,
    recordProcessingTime,
    processingHistory,
  }), [adaptiveIntensity, processingHistory.length])
}