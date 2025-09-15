'use client'

import { useState, useEffect, useCallback } from 'react'

export type SurfaceMode = 'dual' | 'manuscript' | 'framework'

/**
 * Unified Surface Manager - Consolidates useDualSurface + useResponsiveEditor
 * Single Responsibility: Handle all surface/view mode switching and responsive behavior
 */
export const useUnifiedSurfaceManager = (initialMode: SurfaceMode = 'dual') => {
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>(initialMode)
  const [canShowDual, setCanShowDual] = useState(true)
  const [screenWidth, setScreenWidth] = useState(1024)

  // Responsive behavior
  useEffect(() => {
    if (typeof window === 'undefined') return

    let resizeTimer: NodeJS.Timeout | null = null

    const checkScreenSize = () => {
      const width = window.innerWidth
      const isWideEnough = width >= 1024 // lg breakpoint
      
      setScreenWidth(width)
      setCanShowDual(isWideEnough)
      
      // Auto-switch to single mode if screen is too narrow
      if (!isWideEnough && surfaceMode === 'dual') {
        setSurfaceMode('manuscript')
      }
    }

    const debouncedCheckScreenSize = () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(checkScreenSize, 150)
    }

    checkScreenSize() // Initial check
    window.addEventListener('resize', debouncedCheckScreenSize)

    return () => {
      window.removeEventListener('resize', debouncedCheckScreenSize)
      if (resizeTimer) clearTimeout(resizeTimer)
    }
  }, [surfaceMode])

  // Surface switching logic
  const switchToSurface = useCallback((mode: SurfaceMode) => {
    if (mode === 'dual' && !canShowDual) {
      console.warn('Cannot switch to dual mode on narrow screens')
      return false
    }
    setSurfaceMode(mode)
    return true
  }, [canShowDual])

  const toggleSurface = useCallback(() => {
    if (surfaceMode === 'dual') {
      setSurfaceMode('manuscript')
    } else {
      setSurfaceMode(surfaceMode === 'manuscript' ? 'framework' : 'manuscript')
    }
  }, [surfaceMode])

  return {
    // Surface state
    activeSurface: surfaceMode === 'dual' ? 'manuscript' : surfaceMode, // For compatibility
    viewMode: surfaceMode,
    surfaceMode,
    
    // Actions
    switchToSurface,
    toggleSurface,
    setViewMode: switchToSurface,
    
    // Responsive info
    canShowDual,
    screenWidth,
    isMobile: screenWidth < 640,
    isTablet: screenWidth >= 640 && screenWidth < 1024,
    isDesktop: screenWidth >= 1024
  }
}

export default useUnifiedSurfaceManager