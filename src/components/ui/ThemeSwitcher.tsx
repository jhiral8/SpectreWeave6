'use client'

import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { cn } from '@/lib/utils'

interface ThemeSwitcherProps {
  variant?: 'button' | 'dropdown'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ThemeSwitcher({ 
  variant = 'button', 
  size = 'md',
  className 
}: ThemeSwitcherProps) {
  const { theme, toggleTheme, isDark } = useTheme()

  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        buttonSize={size === 'sm' ? 'iconSmall' : 'icon'}
        onClick={toggleTheme}
        className={cn(
          'ai-confidence-border hover:ai-neural-border transition-all duration-200',
          className
        )}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      >
        {isDark ? (
          <Sun className={cn(
            'transition-all',
            size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
          )} />
        ) : (
          <Moon className={cn(
            'transition-all',
            size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
          )} />
        )}
      </Button>
    )
  }

  // Simple dropdown variant with just light/dark options
  return (
    <Button
      variant="ghost"
      buttonSize={size === 'sm' ? 'iconSmall' : 'icon'}
      onClick={toggleTheme}
      className={cn(
        'ai-confidence-border hover:ai-neural-border transition-all duration-200',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? (
        <Sun className={cn(
          'transition-all',
          size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
        )} />
      ) : (
        <Moon className={cn(
          'transition-all',
          size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
        )} />
      )}
    </Button>
  )
}

// Enhanced theme switcher with visual feedback
export function ThemeSwitcherAdvanced({ className }: { className?: string }) {
  const { theme, toggleTheme, isDark } = useTheme()
  const [isTransitioning, setIsTransitioning] = React.useState(false)

  const handleToggle = () => {
    setIsTransitioning(true)
    toggleTheme()
    setTimeout(() => setIsTransitioning(false), 300)
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        buttonSize="icon"
        onClick={handleToggle}
        disabled={isTransitioning}
        className={cn(
          'relative overflow-hidden ai-confidence-border hover:ai-neural-border transition-all duration-300',
          isTransitioning && 'ai-thinking animate-pulse'
        )}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      >
        {/* Sun Icon */}
        <Sun className={cn(
          'h-5 w-5 transition-all duration-300 absolute',
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        )} />
        
        {/* Moon Icon */}
        <Moon className={cn(
          'h-5 w-5 transition-all duration-300 absolute',
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        )} />
      </Button>
      
      {/* Loading indicator during transition */}
      {isTransitioning && (
        <div className="absolute inset-0 rounded-lg ai-neural-border ai-thinking">
          <div className="absolute inset-1 rounded-md bg-gradient-to-br from-purple-500/20 to-blue-500/20 animate-pulse" />
        </div>
      )}
    </div>
  )
}