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

const FrameworkToolbarBottom = ({ 
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
      "flex items-center justify-center gap-1.5 px-2",
      "absolute bottom-0 left-0 right-0 z-40",
      "h-10", // Fixed height for bottom bar
      "bg-black/90 backdrop-blur-sm rounded-t-lg",
      "border-t border-l border-r border-neutral-700/50",
      className
    )}>
      {/* Framework Selection Buttons - Square black buttons in horizontal row */}
      {WRITING_FRAMEWORKS.map((framework) => {
        const isActive = activeFramework === framework.id
        const iconSrc = FRAMEWORK_ICONS[framework.id]
        
        return (
          <button
            key={framework.id}
            onClick={() => handleFrameworkClick(framework)}
            className={cn(
              "relative group",
              "w-8 h-8 p-1.5", // Square button 32x32px
              "bg-black rounded-md", // Black background with rounded corners
              "border border-neutral-700",
              "flex items-center justify-center",
              "transition-all duration-200",
              "hover:bg-neutral-900 hover:border-neutral-500",
              "focus:outline-none focus:ring-2 focus:ring-purple-500",
              isActive && "ring-2 ring-purple-500 bg-neutral-900"
            )}
            aria-label={`Apply ${framework.name}`}
          >
            {/* Framework Icon */}
            {iconSrc && (
              <Image
                src={iconSrc}
                alt={framework.name}
                width={20}
                height={20}
                className={cn(
                  "object-contain",
                  isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                )}
              />
            )}
            
            {/* Tooltip - Shows framework name on hover, positioned above */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 min-w-max bg-black border border-neutral-700 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl">
              <div className="font-medium">{framework.name}</div>
              {/* Tooltip arrow pointing down */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
            </div>
          </button>
        )
      })}
      
      {/* Divider */}
      <div className="w-px h-6 bg-neutral-600" />
      
      {/* Clear Framework Button - Also square black button */}
      <button 
        onClick={handleClearFramework}
        className={cn(
          "relative group",
          "w-8 h-8 p-1.5",
          "bg-black rounded-md",
          "border border-neutral-700",
          "flex items-center justify-center",
          "transition-all duration-200",
          "hover:bg-red-900 hover:border-red-700",
          "focus:outline-none focus:ring-2 focus:ring-red-500"
        )}
        aria-label="Clear framework"
      >
        {/* Clear Icon - X symbol */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-70 group-hover:opacity-100">
          <path 
            d="M4 4L12 12M12 4L4 12" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </svg>
        
        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 min-w-max bg-black border border-neutral-700 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl">
          Clear Framework
          {/* Tooltip arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
        </div>
      </button>
    </div>
  )
}

export default FrameworkToolbarBottom