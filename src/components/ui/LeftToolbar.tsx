import React from 'react'
import { cn } from '@/lib/utils'
import { WRITING_FRAMEWORKS, WritingFramework } from '@/types/story-frameworks'

interface LeftToolbarProps {
  className?: string
  onFrameworkSelect?: (framework: WritingFramework) => void
  onClearFramework?: () => void
  activeFramework?: string
}

const FrameworkIcon = ({ frameworkId }: { frameworkId: string }) => {
  const iconProps = "w-4 h-4"
  
  switch (frameworkId) {
    case 'three-act':
      return (
        <svg className={iconProps} viewBox="0 0 16 16" fill="none">
          <rect x="1" y="8" width="3" height="6" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <rect x="6" y="3" width="3" height="11" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <rect x="11" y="5" width="3" height="9" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        </svg>
      )
    case 'hero-journey':
      return (
        <svg className={iconProps} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <path d="M8 2L10 6L8 8L6 6L8 2Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <path d="M14 8L10 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      )
    case 'save-the-cat':
      return (
        <svg className={iconProps} viewBox="0 0 16 16" fill="none">
          <circle cx="3" cy="3" r="1" fill="currentColor"/>
          <circle cx="8" cy="3" r="1" fill="currentColor"/>
          <circle cx="13" cy="3" r="1" fill="currentColor"/>
          <circle cx="3" cy="8" r="1" fill="currentColor"/>
          <circle cx="8" cy="8" r="1" fill="currentColor"/>
          <circle cx="13" cy="8" r="1" fill="currentColor"/>
          <circle cx="3" cy="13" r="1" fill="currentColor"/>
          <circle cx="8" cy="13" r="1" fill="currentColor"/>
          <circle cx="13" cy="13" r="1" fill="currentColor"/>
        </svg>
      )
    case 'seven-point':
      return (
        <svg className={iconProps} viewBox="0 0 16 16" fill="none">
          <path d="M8 2L11 5L11 11L8 14L5 11L5 5L8 2Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <circle cx="8" cy="2" r="1" fill="currentColor"/>
          <circle cx="11" cy="5" r="1" fill="currentColor"/>
          <circle cx="11" cy="11" r="1" fill="currentColor"/>
          <circle cx="8" cy="14" r="1" fill="currentColor"/>
          <circle cx="5" cy="11" r="1" fill="currentColor"/>
          <circle cx="5" cy="5" r="1" fill="currentColor"/>
          <circle cx="8" cy="8" r="1" fill="currentColor"/>
        </svg>
      )
    case 'snowflake':
      return (
        <svg className={iconProps} viewBox="0 0 16 16" fill="none">
          <path d="M8 1V15M3 4L13 12M13 4L3 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M8 4L6 2M8 4L10 2M8 12L6 14M8 12L10 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      )
    case 'freytag':
      return (
        <svg className={iconProps} viewBox="0 0 16 16" fill="none">
          <path d="M2 14L8 2L14 14H2Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <path d="M5 11L11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      )
    default:
      return (
        <svg className={iconProps} viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        </svg>
      )
  }
}

export const LeftToolbar = ({ className, onFrameworkSelect, onClearFramework, activeFramework }: LeftToolbarProps) => {
  const handleFrameworkClick = (framework: WritingFramework) => {
    onFrameworkSelect?.(framework)
  }

  const handleClearFramework = () => {
    onClearFramework?.()
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-start flex-none px-1 py-3 w-12 h-full",
      "text-black bg-white border-r border-neutral-200", 
      "dark:bg-black dark:text-white dark:border-neutral-800",
      className
    )}>
      {/* Story Framework Buttons */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-full">
        {WRITING_FRAMEWORKS.map((framework) => {
          const isActive = activeFramework === framework.id
          
          return (
            <button
              key={framework.id}
              onClick={() => handleFrameworkClick(framework)}
              className={cn(
                "w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center group relative",
                "hover:scale-105",
                isActive 
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm ring-2 ring-purple-200 dark:ring-purple-800" 
                  : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              )}
              aria-label={`Apply ${framework.name}`}
              title={framework.name}
            >
              <FrameworkIcon frameworkId={framework.id} />
              
              {/* Enhanced tooltip */}
              <div className="absolute left-12 top-0 min-w-max max-w-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded-lg px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg">
                <div className="font-medium">{framework.name}</div>
                <div className="text-neutral-300 dark:text-neutral-600 text-xs mt-0.5">
                  {framework.description}
                </div>
                {/* Tooltip arrow */}
                <div className="absolute left-0 top-2 -translate-x-1 w-0 h-0 border-t-2 border-b-2 border-r-4 border-transparent border-r-neutral-900 dark:border-r-neutral-100"></div>
              </div>
            </button>
          )
        })}
      </div>
      
      {/* Clear Framework Button */}
      <div className="mt-auto pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <button 
          onClick={handleClearFramework}
          className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 group relative"
          aria-label="Clear framework"
          title="Clear Framework"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          
          {/* Tooltip */}
          <div className="absolute left-12 top-0 min-w-max bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded-lg px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg">
            Clear Framework
            {/* Tooltip arrow */}
            <div className="absolute left-0 top-2 -translate-x-1 w-0 h-0 border-t-2 border-b-2 border-r-4 border-transparent border-r-neutral-900 dark:border-r-neutral-100"></div>
          </div>
        </button>
      </div>
    </div>
  )
}