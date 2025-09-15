import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Surface } from './SurfaceSwitcher'

interface FloatingSurfaceDockProps {
  activeSurface: Surface
  onSurfaceChange: (surface: Surface) => void
  className?: string
}

export const FloatingSurfaceDock = ({ 
  activeSurface, 
  onSurfaceChange,
  className 
}: FloatingSurfaceDockProps) => {
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
  
  const handleSurfaceChange = (surface: Surface) => {
    onSurfaceChange(surface)
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
            'fixed z-50',
            // Desktop: bottom-left
            'bottom-6 left-6',
            // Mobile: bottom-center
            'max-md:bottom-4 max-md:left-1/2 max-md:-translate-x-1/2',
            className
          )}
          onHoverStart={() => setIsTyping(false)} // Show fully on hover
        >
          <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md backdrop-saturate-150
                          border border-neutral-200/30 dark:border-neutral-700/60 
                          rounded-md shadow-xl shadow-black/20 dark:shadow-black/40 
                          px-1 py-0.5 flex items-center gap-0.5">
            
            {/* Manuscript Button */}
            <motion.button
              onClick={() => handleSurfaceChange('manuscript')}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium transition-all border border-transparent',
                'min-h-[44px] md:min-h-[28px]', // Mobile touch targets
                activeSurface === 'manuscript' 
                  ? 'bg-white text-black border-white shadow-sm' 
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-black/5 hover:text-neutral-700 dark:hover:bg-white/10 dark:hover:text-neutral-300'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              aria-pressed={activeSurface === 'manuscript'}
            >
              <span className="flex items-center gap-1.5">
                <motion.div 
                  className="w-1.5 h-1.5 rounded-full bg-current opacity-70"
                  animate={activeSurface === 'manuscript' ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
                <span className="hidden sm:inline">Manuscript</span>
                <span className="sm:hidden font-medium">M</span>
              </span>
            </motion.button>

            {/* Framework Button */}
            <motion.button
              onClick={() => handleSurfaceChange('framework')}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium transition-all border border-transparent',
                'min-h-[44px] md:min-h-[28px]',
                activeSurface === 'framework' 
                  ? 'bg-white text-black border-white shadow-sm' 
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-black/5 hover:text-neutral-700 dark:hover:bg-white/10 dark:hover:text-neutral-300'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              aria-pressed={activeSurface === 'framework'}
            >
              <span className="flex items-center gap-1.5">
                <motion.div 
                  className="w-1.5 h-1.5 rounded-full bg-current opacity-70"
                  animate={activeSurface === 'framework' ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
                <span className="hidden sm:inline">Story Framework</span>
                <span className="sm:hidden font-medium">SF</span>
              </span>
            </motion.button>

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