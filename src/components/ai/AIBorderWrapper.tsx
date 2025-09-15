'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { Editor } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { useAIBorderEffects, AIBorderEffectsConfig } from '@/hooks/useAIBorderEffects'

export interface AIBorderWrapperProps {
  children: React.ReactNode
  editor?: Editor
  
  // Border effect configuration
  effects?: ('neural' | 'confidence' | 'dataflow' | 'resonance' | 'context' | 'sync')[]
  className?: string
  
  // AI state integration
  aiState?: 'idle' | 'thinking' | 'generating' | 'analyzing' | 'error' | 'streaming'
  confidence?: number // 0-1
  quality?: number // 0-1
  processingSpeed?: number // milliseconds
  
  // Flow visualization
  dataFlowDirection?: 'manuscript-to-framework' | 'framework-to-manuscript' | 'bidirectional'
  showDataFlow?: boolean
  
  // Collaboration
  isCollaborating?: boolean
  syncStatus?: 'idle' | 'active' | 'conflict' | 'synced'
  
  // Interaction handlers
  onContextInteraction?: (x: number, y: number) => void
  onAIStateChange?: (state: any) => void
  
  // Configuration
  config?: Partial<AIBorderEffectsConfig>
  
  // Styling
  variant?: 'manuscript' | 'framework' | 'sidebar' | 'toolbar'
  intensity?: 'subtle' | 'normal' | 'prominent'
}

export const AIBorderWrapper: React.FC<AIBorderWrapperProps> = ({
  children,
  editor,
  effects = ['neural'],
  className,
  aiState = 'idle',
  confidence,
  quality,
  processingSpeed,
  dataFlowDirection = 'manuscript-to-framework',
  showDataFlow = false,
  isCollaborating = false,
  syncStatus = 'idle',
  onContextInteraction,
  onAIStateChange,
  config,
  variant = 'manuscript',
  intensity = 'normal'
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const borderEffects = useAIBorderEffects(editor, config)
  
  // Sync external state with border effects
  useEffect(() => {
    const stateUpdate: any = {}
    
    if (aiState !== borderEffects.borderState.aiState) {
      stateUpdate.aiState = aiState
    }
    
    if (confidence !== undefined) {
      stateUpdate.contextualRelevance = confidence * 100
    }
    
    if (quality !== undefined) {
      stateUpdate.semanticResonance = quality * 100
    }
    
    if (processingSpeed !== undefined) {
      stateUpdate.processingSpeed = processingSpeed
    }
    
    if (showDataFlow && dataFlowDirection !== borderEffects.borderState.dataFlow) {
      stateUpdate.dataFlow = dataFlowDirection
    }
    
    if (isCollaborating && syncStatus !== borderEffects.borderState.syncStatus) {
      stateUpdate.syncStatus = syncStatus
    }
    
    if (Object.keys(stateUpdate).length > 0) {
      borderEffects.updateAIState(stateUpdate)
    }
  }, [
    aiState, 
    confidence, 
    quality, 
    processingSpeed, 
    dataFlowDirection, 
    showDataFlow, 
    isCollaborating, 
    syncStatus,
    borderEffects
  ])
  
  // Notify parent of state changes
  useEffect(() => {
    onAIStateChange?.(borderEffects.borderState)
  }, [borderEffects.borderState, onAIStateChange])
  
  // Handle context interactions (clicks, hovers)
  const handleContextInteraction = useCallback((event: React.MouseEvent) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    
    borderEffects.triggerContextRipple(x, y)
    onContextInteraction?.(x, y)
  }, [borderEffects, onContextInteraction])
  
  // Generate variant-specific classes
  const getVariantClasses = useCallback(() => {
    const baseClasses = {
      manuscript: 'rounded-lg',
      framework: 'rounded-md',
      sidebar: 'rounded-none',
      toolbar: 'rounded-sm'
    }
    
    const intensityClasses = {
      subtle: 'opacity-70',
      normal: 'opacity-100',
      prominent: 'opacity-100 scale-[1.01]'
    }
    
    return cn(
      baseClasses[variant],
      intensityClasses[intensity],
      intensity === 'prominent' && 'z-10'
    )
  }, [variant, intensity])
  
  // Combine all classes and properties
  const borderClasses = cn(
    borderEffects.getBorderEffectClasses(effects),
    getVariantClasses(),
    className
  )
  
  const styleProperties = {
    ...borderEffects.getBorderStyleProperties(),
    // Add variant-specific CSS variables
    '--variant': variant,
    '--intensity': intensity === 'subtle' ? '0.7' : intensity === 'prominent' ? '1.2' : '1.0'
  }
  
  const dataAttributes = borderEffects.getBorderDataAttributes()
  
  return (
    <div
      ref={containerRef}
      className={borderClasses}
      style={styleProperties}
      {...dataAttributes}
      onClick={handleContextInteraction}
      onMouseMove={showDataFlow ? handleContextInteraction : undefined}
      role="region"
      aria-label={`AI-enhanced ${variant} area`}
    >
      {children}
      
      {/* Optional overlay for additional visual effects */}
      {intensity === 'prominent' && (
        <div 
          className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-inherit"
          aria-hidden="true"
        />
      )}
    </div>
  )
}

// Specialized wrapper components for different use cases
export const ManuscriptBorderWrapper: React.FC<Omit<AIBorderWrapperProps, 'variant'>> = (props) => (
  <AIBorderWrapper {...props} variant="manuscript" effects={['neural', 'confidence', 'resonance']} />
)

export const FrameworkBorderWrapper: React.FC<Omit<AIBorderWrapperProps, 'variant'>> = (props) => (
  <AIBorderWrapper {...props} variant="framework" effects={['dataflow', 'context', 'sync']} />
)

export const SidebarBorderWrapper: React.FC<Omit<AIBorderWrapperProps, 'variant'>> = (props) => (
  <AIBorderWrapper {...props} variant="sidebar" effects={['neural', 'sync']} intensity="subtle" />
)

export const ToolbarBorderWrapper: React.FC<Omit<AIBorderWrapperProps, 'variant'>> = (props) => (
  <AIBorderWrapper {...props} variant="toolbar" effects={['confidence', 'resonance']} intensity="subtle" />
)

// Hook for imperative control
export const useAIBorderControl = (borderRef: React.RefObject<HTMLDivElement>) => {
  const triggerThinking = useCallback(() => {
    if (borderRef.current) {
      borderRef.current.setAttribute('data-ai-state', 'thinking')
    }
  }, [borderRef])
  
  const triggerGenerating = useCallback(() => {
    if (borderRef.current) {
      borderRef.current.setAttribute('data-ai-state', 'generating')
    }
  }, [borderRef])
  
  const triggerComplete = useCallback((quality: 'poor' | 'average' | 'good' | 'excellent' = 'good') => {
    if (borderRef.current) {
      borderRef.current.setAttribute('data-ai-state', 'idle')
      borderRef.current.setAttribute('data-quality', quality)
    }
  }, [borderRef])
  
  const triggerError = useCallback(() => {
    if (borderRef.current) {
      borderRef.current.setAttribute('data-ai-state', 'error')
    }
  }, [borderRef])
  
  const setConfidence = useCallback((level: 'low' | 'medium' | 'high' | 'very-high') => {
    if (borderRef.current) {
      borderRef.current.setAttribute('data-confidence', level)
    }
  }, [borderRef])
  
  const setDataFlow = useCallback((direction: 'manuscript-to-framework' | 'framework-to-manuscript' | 'bidirectional') => {
    if (borderRef.current) {
      borderRef.current.setAttribute('data-flow', direction)
    }
  }, [borderRef])
  
  return {
    triggerThinking,
    triggerGenerating,
    triggerComplete,
    triggerError,
    setConfidence,
    setDataFlow
  }
}