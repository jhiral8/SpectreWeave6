import { useState, useCallback } from 'react'
import { WritingSurface } from '@/lib/ai/dualSurfaceContextManager'

interface UseDualSurfaceReturn {
  activeSurface: WritingSurface
  setActiveSurface: (surface: WritingSurface) => void
  toggleSurface: () => void
}

/**
 * Hook for managing active writing surface (manuscript vs framework)
 * Simple state management for dual editor surface switching
 */
export default function useDualSurface(
  initialSurface: WritingSurface = 'manuscript'
): UseDualSurfaceReturn {
  const [activeSurface, setActiveSurface] = useState<WritingSurface>(initialSurface)

  const toggleSurface = useCallback(() => {
    setActiveSurface(current => current === 'manuscript' ? 'framework' : 'manuscript')
  }, [])

  return {
    activeSurface,
    setActiveSurface,
    toggleSurface,
  }
}
