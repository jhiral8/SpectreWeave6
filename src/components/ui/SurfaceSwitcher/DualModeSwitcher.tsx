import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export type ViewMode = 'manuscript' | 'framework' | 'dual'

interface DualModeSwitcherProps {
  activeMode: ViewMode
  onModeChange: (mode: ViewMode) => void
  canShowDual?: boolean
  className?: string
  // Positioning strategy: default to 'absolute' so it stays within the page/editor area
  position?: 'absolute' | 'fixed'
}

export const DualModeSwitcher = ({ 
  activeMode, 
  onModeChange,
  canShowDual = true,
  className,
  position = 'absolute',
}: DualModeSwitcherProps) => {
  const [isVisible, setIsVisible] = useState(true)
  const [showHint, setShowHint] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  
  // Hide hint after 10 seconds or after first use
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 10000)
    return () => clearTimeout(timer)
  }, [])
  
  // Smart hiding while typing
  useEffect(() => {
    let typingTimer: NodeJS.Timeout
    
    const handleKeyPress = () => {
      setIsTyping(true)
      clearTimeout(typingTimer)
      typingTimer = setTimeout(() => setIsTyping(false), 2000)
    }
    
    document.addEventListener('keypress', handleKeyPress)
    return () => {
      document.removeEventListener('keypress', handleKeyPress)
      clearTimeout(typingTimer)
    }
  }, [])
  
  const handleModeChange = (mode: ViewMode) => {
    onModeChange(mode)
    setShowHint(false) // Hide hint after first interaction
  }
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isTyping ? 0.3 : 1, 
            y: 0 
          }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'dual-mode-switcher',
            position === 'fixed' ? 'fixed' : 'absolute',
            'z-40',
            // Desktop: bottom-left within the editor/page area (moved slightly up)
            'bottom-10 left-6',
            // Mobile: bottom-center (nudged up a bit)
            'max-md:bottom-6 max-md:left-1/2 max-md:-translate-x-1/2',
            className,
          )}
          onHoverStart={() => setIsTyping(false)} // Show fully on hover
        >
          <div className="bg-[--card]/85 text-[--card-foreground] backdrop-blur-md backdrop-saturate-150
                          border border-[--border]
                          rounded-md shadow-xl shadow-black/10 
                          px-1 py-0.5 flex items-center gap-0.5">
            
            {/* Manuscript Button */}
            <motion.button
              onClick={() => handleModeChange('manuscript')}
              className={cn(
                'px-2 py-1 rounded text-sm transition-all border',
                'min-h-[44px] md:min-h-[28px]', // Mobile touch targets
                activeMode === 'manuscript' 
                  ? 'bg-white/10 text-[--card-foreground] border-transparent shadow-sm' 
                  : 'text-[--muted-foreground] hover:bg-white/5 hover:text-[--card-foreground] border-transparent'
              )}
              style={{ fontFamily: 'Surgena, sans-serif' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              aria-pressed={activeMode === 'manuscript'}
            >
              <span className="flex items-center gap-1.5">
                <motion.div 
                  className="w-1.5 h-1.5 rounded-full bg-current opacity-70"
                  animate={activeMode === 'manuscript' ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
                <span className="hidden sm:inline">Manuscript</span>
                <span className="sm:hidden">M</span>
              </span>
            </motion.button>

            {/* Framework Button */}
            <motion.button
              onClick={() => handleModeChange('framework')}
              className={cn(
                'px-2 py-1 rounded text-sm transition-all border',
                'min-h-[44px] md:min-h-[28px]',
                activeMode === 'framework' 
                  ? 'bg-white/10 text-[--card-foreground] border-transparent shadow-sm' 
                  : 'text-[--muted-foreground] hover:bg-white/5 hover:text-[--card-foreground] border-transparent'
              )}
              style={{ fontFamily: 'Surgena, sans-serif' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              aria-pressed={activeMode === 'framework'}
            >
              <span className="flex items-center gap-1.5">
                <motion.div 
                  className="w-1.5 h-1.5 rounded-full bg-current opacity-70"
                  animate={activeMode === 'framework' ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
                <span className="hidden sm:inline">Story Framework</span>
                <span className="sm:hidden">SF</span>
              </span>
            </motion.button>

            {/* Dual Mode Button - Only show on larger screens */}
            {canShowDual && (
              <motion.button
                onClick={() => handleModeChange('dual')}
                className={cn(
                  'px-2 py-1 rounded text-sm transition-all border',
                  'min-h-[44px] md:min-h-[28px]',
                  activeMode === 'dual' 
                    ? 'bg-white/10 text-[--card-foreground] border-transparent shadow-sm' 
                    : 'text-[--muted-foreground] hover:bg-white/5 hover:text-[--card-foreground] border-transparent'
                )}
                style={{ fontFamily: 'Surgena, sans-serif' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                aria-pressed={activeMode === 'dual'}
              >
                <span className="flex items-center gap-1.5">
                  <motion.div 
                    className="w-1.5 h-1.5 rounded-full bg-current opacity-70"
                    animate={activeMode === 'dual' ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="hidden sm:inline">Dual</span>
                  <span className="sm:hidden">D</span>
                </span>
              </motion.button>
            )}

            {/* Keyboard Hint */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  className="hidden md:flex items-center ml-1.5 px-1.5 py-0.5 
                             bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded text-[10px] 
                             text-neutral-500 dark:text-neutral-400"
                >
                  <kbd className="px-1 py-0.5 bg-white dark:bg-neutral-700 rounded shadow-sm border border-neutral-200 dark:border-neutral-600 font-mono text-[9px]">
                    Ctrl+Tab
                  </kbd>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  )
}