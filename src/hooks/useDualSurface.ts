'use client'

import { useState, useCallback } from 'react'
import { WritingSurface } from '@/lib/ai/dualSurfaceContextManager'

export interface DualSurfaceState {
  activeSurface: WritingSurface
  switchToSurface: (surface: WritingSurface) => void
  toggleSurface: () => void
}

const useDualSurface = (initialSurface: WritingSurface = 'manuscript'): DualSurfaceState => {
  const [activeSurface, setActiveSurface] = useState<WritingSurface>(initialSurface)

  const switchToSurface = useCallback((surface: WritingSurface) => {
    setActiveSurface(surface)
  }, [])

  const toggleSurface = useCallback(() => {
    setActiveSurface(current => current === 'manuscript' ? 'framework' : 'manuscript')
  }, [])

  return {
    activeSurface,
    switchToSurface,
    toggleSurface,
  }
}

export default useDualSurface