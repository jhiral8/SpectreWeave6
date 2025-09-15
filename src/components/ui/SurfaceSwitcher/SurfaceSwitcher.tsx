import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type Surface = 'manuscript' | 'framework'

interface SurfaceSwitcherProps {
  activeSurface: Surface
  onSurfaceChange: (surface: Surface) => void
  variant?: 'floating' | 'pills' | 'compact'
  className?: string
}

export const SurfaceSwitcher = ({ 
  activeSurface, 
  onSurfaceChange, 
  variant = 'floating',
  className 
}: SurfaceSwitcherProps) => {
  const baseClasses = cn(
    'flex items-center rounded-lg p-1 transition-all duration-200',
    variant === 'floating' && 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 shadow-lg',
    variant === 'pills' && 'bg-neutral-100 dark:bg-neutral-800',
    variant === 'compact' && 'bg-neutral-50 dark:bg-neutral-800/50',
    className
  )

  const buttonClasses = (surface: Surface) => cn(
    'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 relative',
    'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
    activeSurface === surface ? [
      // Active states
      surface === 'manuscript' && 'bg-blue-500 text-white shadow-sm',
      surface === 'framework' && 'bg-purple-500 text-white shadow-sm',
    ] : [
      // Inactive states
      'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100',
      'hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
    ]
  )

  return (
    <motion.div 
      className={baseClasses}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.button
        onClick={() => onSurfaceChange('manuscript')}
        className={buttonClasses('manuscript')}
        aria-pressed={activeSurface === 'manuscript'}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <span className="flex items-center gap-2">
          <motion.div 
            className="w-2 h-2 rounded-full bg-current opacity-70"
            animate={activeSurface === 'manuscript' ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          />
          Manuscript
        </span>
      </motion.button>
      
      <motion.button
        onClick={() => onSurfaceChange('framework')}
        className={buttonClasses('framework')}
        aria-pressed={activeSurface === 'framework'}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <span className="flex items-center gap-2">
          <motion.div 
            className="w-2 h-2 rounded-full bg-current opacity-70"
            animate={activeSurface === 'framework' ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          />
          Story Framework
        </span>
      </motion.button>
    </motion.div>
  )
}