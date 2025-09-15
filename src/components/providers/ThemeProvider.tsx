'use client'

import React from 'react'
import { useTheme } from '@/hooks/useTheme'

interface ThemeProviderProps {
  children: React.ReactNode
}

function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize theme on mount
  useTheme()
  
  return <>{children}</>
}

export default ThemeProvider