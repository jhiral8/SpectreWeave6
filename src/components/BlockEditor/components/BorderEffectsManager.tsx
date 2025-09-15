'use client'

import React, { useEffect, useMemo } from 'react'
import { useManuscriptBorderEffects, useFrameworkBorderEffects } from '@/hooks/useAIBorderEffects'

interface BorderEffectsManagerProps {
  viewMode: 'dual' | 'manuscript' | 'framework'
  children?: React.ReactNode
}

/**
 * BorderEffectsManager Component
 * Single Responsibility: Manage AI border visual effects
 */
export const BorderEffectsManager: React.FC<BorderEffectsManagerProps> = ({
  viewMode,
  children
}) => {
  // AI Border Effects initialization
  const manuscriptBorder = useManuscriptBorderEffects({ 
    quality: 'high',
    intensity: 0.6 
  })
  
  const frameworkBorder = useFrameworkBorderEffects({ 
    confidence: 0.8,
    isDataFlowing: viewMode === 'dual' 
  })

  // Update data flow effect based on view mode
  const isDataFlowing = useMemo(() => viewMode === 'dual', [viewMode])
  
  useEffect(() => {
    frameworkBorder.setDataFlowing(isDataFlowing)
  }, [isDataFlowing, frameworkBorder])

  // Export borders to context if needed
  const borderEffects = useMemo(() => ({
    manuscript: manuscriptBorder,
    framework: frameworkBorder,
    isDataFlowing
  }), [manuscriptBorder, frameworkBorder, isDataFlowing])

  // If children provided, pass effects via props or context
  if (children) {
    return (
      <BorderEffectsContext.Provider value={borderEffects}>
        {children}
      </BorderEffectsContext.Provider>
    )
  }

  // Otherwise, just manage the effects silently
  return null
}

// Optional context for accessing border effects
const BorderEffectsContext = React.createContext<{
  manuscript: ReturnType<typeof useManuscriptBorderEffects>
  framework: ReturnType<typeof useFrameworkBorderEffects>
  isDataFlowing: boolean
} | null>(null)

export const useBorderEffects = () => {
  const context = React.useContext(BorderEffectsContext)
  if (!context) {
    throw new Error('useBorderEffects must be used within BorderEffectsManager')
  }
  return context
}

BorderEffectsManager.displayName = 'BorderEffectsManager'

export default BorderEffectsManager