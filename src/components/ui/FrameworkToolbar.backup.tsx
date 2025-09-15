// Backup of original FrameworkToolbar before modifications
import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { WRITING_FRAMEWORKS, WritingFramework } from '@/types/story-frameworks'

interface FrameworkToolbarProps {
  className?: string
  onFrameworkSelect?: (framework: WritingFramework) => void
  onClearFramework?: () => void
  activeFramework?: string
}

// Map framework IDs to PNG icon files
const FRAMEWORK_ICONS: Record<string, string> = {
  'three-act': '/images/SFButtons/3Act.png',
  'hero-journey': '/images/SFButtons/HeroJourney.png',
  'save-the-cat': '/images/SFButtons/BeatSheet.png',
  'seven-point': '/images/SFButtons/SevenPoint.png',
  'snowflake': '/images/SFButtons/Snowflake.png',
  'freytag': '/images/SFButtons/Freytag.png',
}

export const FrameworkToolbar = ({ 
  className, 
  onFrameworkSelect, 
  onClearFramework, 
  activeFramework 
}: FrameworkToolbarProps) => {
  const handleFrameworkClick = (framework: WritingFramework) => {
    onFrameworkSelect?.(framework)
  }

  const handleClearFramework = () => {
    onClearFramework?.()
  }

  return (
    <div className={cn(
      "w-full bg-black px-4 py-3 border-b border-neutral-800",
      "flex items-center justify-start gap-2 overflow-x-auto",
      className
    )}>
      {/* Framework Selection Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {WRITING_FRAMEWORKS.map((framework) => {
          const isActive = activeFramework === framework.id
          const iconSrc = FRAMEWORK_ICONS[framework.id]
          
          return (
            <button
              key={framework.id}
              onClick={() => handleFrameworkClick(framework)}
              className={cn(
                "relative group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                "font-surgena text-sm font-medium",
                "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black",
                isActive 
                  ? "bg-purple-600 text-white shadow-lg ring-2 ring-purple-400" 
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              )}
              aria-label={`Apply ${framework.name}`}
              title={framework.description}
            >
              {/* Framework Icon */}
              {iconSrc && (
                <div className="relative w-5 h-5 flex-shrink-0">
                  <Image
                    src={iconSrc}
                    alt={framework.name}
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                </div>
              )}
              
              {/* Framework Name - Hide on mobile, show on desktop */}
              <span className="hidden sm:inline-block whitespace-nowrap">
                {framework.name}
              </span>
              
              {/* Enhanced tooltip for mobile and additional info */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 min-w-max max-w-xs bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl">
                <div className="font-medium font-surgena">{framework.name}</div>
                <div className="text-neutral-300 text-xs mt-1 font-surgena">
                  {framework.description}
                </div>
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900"></div>
              </div>
            </button>
          )
        })}
      </div>
      
      {/* Divider */}
      <div className="w-px h-6 bg-neutral-600 mx-2 flex-shrink-0" />
      
      {/* Clear Framework Button */}
      <button 
        onClick={handleClearFramework}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 flex-shrink-0",
          "bg-red-600 hover:bg-red-700 text-white font-surgena text-sm font-medium",
          "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black",
          "group relative"
        )}
        aria-label="Clear framework"
        title="Clear current framework and reset content"
      >
        {/* Clear Icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
          <path 
            d="M4 4L12 12M12 4L4 12" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
        </svg>
        
        {/* Clear Text - Hide on mobile, show on desktop */}
        <span className="hidden sm:inline-block whitespace-nowrap">
          Clear Framework
        </span>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 min-w-max bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl font-surgena">
          Clear Framework & Reset Content
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900"></div>
        </div>
      </button>
    </div>
  )
}

export default FrameworkToolbar