'use client'

import { useState, useEffect, useCallback } from 'react'

export type ViewMode = 'dual' | 'manuscript' | 'framework'

/**
 * Hook for managing responsive editor behavior
 * Single Responsibility: Handle screen size detection and view mode switching
 */
export const useResponsiveEditor = (initialMode: ViewMode = 'dual') => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode)
  const [canShowDual, setCanShowDual] = useState(true)
  const [screenWidth, setScreenWidth] = useState(1024)

  // Check if screen is wide enough for dual mode
  useEffect(() => {
    if (typeof window === 'undefined') return

    let resizeTimer: NodeJS.Timeout | null = null

    const checkScreenSize = () => {
      const width = window.innerWidth
      const isWideEnough = width >= 1024 // lg breakpoint
      
      setScreenWidth(width)
      setCanShowDual(isWideEnough)
      
      // Auto-switch to single mode if screen is too narrow
      if (!isWideEnough && viewMode === 'dual') {
        setViewMode('manuscript')
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
  }, [viewMode])

  const switchToMode = useCallback((mode: ViewMode) => {
    if (mode === 'dual' && !canShowDual) {
      console.warn('Cannot switch to dual mode on narrow screens')
      return false
    }
    setViewMode(mode)
    return true
  }, [canShowDual])

  return {
    viewMode,
    setViewMode: switchToMode,
    canShowDual,
    screenWidth,
    isMobile: screenWidth < 640,
    isTablet: screenWidth >= 640 && screenWidth < 1024,
    isDesktop: screenWidth >= 1024
  }
}

export default useResponsiveEditor