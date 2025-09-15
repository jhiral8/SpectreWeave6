'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WritingSurface } from '@/lib/ai/dualSurfaceContextManager'
import { Icon } from '@/components/ui/Icon'

interface SurfaceSwitcherProps {
  activeSurface: WritingSurface
  onSurfaceChange: (surface: WritingSurface) => void
  className?: string
  variant?: 'default' | 'floating' | 'compact' | 'pills'
  showIcons?: boolean
  showLabels?: boolean
  orientation?: 'horizontal' | 'vertical'
}

export const SurfaceSwitcher: React.FC<SurfaceSwitcherProps> = ({
  activeSurface,
  onSurfaceChange,
  className = '',
  variant = 'default',
  showIcons = true,
  showLabels = true,
  orientation = 'horizontal'
}) => {
  const [isHovered, setIsHovered] = useState(false)
  // Variant-specific styles
  const getContainerStyles = () => {
    const baseStyles = 'relative transition-all duration-300'
    
    switch (variant) {
      case 'floating':
        return `${baseStyles} bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-2xl p-1.5 shadow-xl border border-neutral-200/50 dark:border-neutral-700/50 hover:shadow-2xl hover:scale-105`
      case 'compact':
        return `${baseStyles} bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 shadow-sm border border-neutral-200 dark:border-neutral-700`
      case 'pills':
        return `${baseStyles} flex gap-2`
      default:
        return `${baseStyles} bg-neutral-100 dark:bg-neutral-800 rounded-full p-1 shadow-sm border border-neutral-200 dark:border-neutral-700`
    }
  }

  const getLayoutStyles = () => {
    if (variant === 'pills') return 'flex gap-2'
    return orientation === 'vertical' ? 'flex flex-col gap-1' : 'flex'
  }

  // Floating variant
  if (variant === 'floating') {
    return (
      <motion.div 
        className={`${getContainerStyles()} ${className}`}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <div className="flex items-center gap-1">
          {['manuscript', 'framework'].map((surface) => {
            const isActive = activeSurface === surface
            const isManuscript = surface === 'manuscript'
            
            return (
              <motion.button
                key={surface}
                onClick={() => onSurfaceChange(surface as WritingSurface)}
                className={`relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    className={`absolute inset-0 rounded-xl ${
                      isManuscript 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                        : 'bg-gradient-to-r from-orange-500 to-orange-600'
                    }`}
                    layoutId="activeFloatingTab"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {showIcons && (
                    <Icon 
                      name={isManuscript ? 'BookOpen' : 'GitBranch'} 
                      className="w-4 h-4" 
                    />
                  )}
                  {showLabels && (isManuscript ? 'Manuscript' : 'Framework')}
                </span>
              </motion.button>
            )
          })}
        </div>
        
        {/* Floating indicator */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Icon name="Zap" className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // Pills variant
  if (variant === 'pills') {
    return (
      <div className={`${getContainerStyles()} ${className}`}>
        {['manuscript', 'framework'].map((surface) => {
          const isActive = activeSurface === surface
          const isManuscript = surface === 'manuscript'
          
          return (
            <motion.button
              key={surface}
              onClick={() => onSurfaceChange(surface as WritingSurface)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? isManuscript
                    ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/25'
                    : 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/25'
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="flex items-center gap-2">
                {showIcons && (
                  <Icon 
                    name={isManuscript ? 'BookOpen' : 'GitBranch'} 
                    className="w-4 h-4" 
                  />
                )}
                {showLabels && (isManuscript ? 'Manuscript' : 'Framework')}
              </span>
            </motion.button>
          )
        })}
      </div>
    )
  }

  // Default and compact variants
  return (
    <div className={`${getContainerStyles()} ${className}`}>
      {/* Background pill that slides */}
      <motion.div
        className={`absolute ${orientation === 'vertical' ? 'left-1 right-1' : 'top-1 bottom-1'} bg-white dark:bg-neutral-700 ${variant === 'compact' ? 'rounded-md' : 'rounded-full'} shadow-sm`}
        initial={false}
        animate={orientation === 'vertical' ? {
          top: activeSurface === 'manuscript' ? '4px' : '50%',
          bottom: activeSurface === 'manuscript' ? '50%' : '4px',
        } : {
          left: activeSurface === 'manuscript' ? '4px' : '50%',
          right: activeSurface === 'manuscript' ? '50%' : '4px',
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      />
      
      <div className={getLayoutStyles()}>
        {/* Manuscript Button */}
        <button
          onClick={() => onSurfaceChange('manuscript')}
          className={`relative z-10 px-4 py-2 text-sm font-medium ${variant === 'compact' ? 'rounded-md' : 'rounded-full'} transition-colors duration-200 ${
            activeSurface === 'manuscript'
              ? 'text-neutral-900 dark:text-white'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span className={`flex items-center gap-2 ${orientation === 'vertical' ? 'justify-center' : ''}`}>
            {showIcons && (
              <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                activeSurface === 'manuscript' ? 'bg-blue-500' : 'bg-neutral-400 dark:bg-neutral-500'
              }`} />
            )}
            {showLabels && 'Manuscript'}
          </span>
        </button>
        
        {/* Framework Button */}
        <button
          onClick={() => onSurfaceChange('framework')}
          className={`relative z-10 px-4 py-2 text-sm font-medium ${variant === 'compact' ? 'rounded-md' : 'rounded-full'} transition-colors duration-200 ${
            activeSurface === 'framework'
              ? 'text-neutral-900 dark:text-white'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span className={`flex items-center gap-2 ${orientation === 'vertical' ? 'justify-center' : ''}`}>
            {showIcons && (
              <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                activeSurface === 'framework' ? 'bg-orange-500' : 'bg-neutral-400 dark:bg-neutral-500'
              }`} />
            )}
            {showLabels && 'Framework'}
          </span>
        </button>
      </div>
    </div>
  )
}

export default SurfaceSwitcher