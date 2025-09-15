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

const FrameworkToolbarVertical = ({ 
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
      "flex flex-col items-center gap-1.5 py-2",
      "absolute left-0 top-16 z-40",
      "rounded-r-lg p-1.5 bg-[--card]/80 backdrop-blur",
      className
    )}>
      {/* Framework Selection Buttons - Square black buttons stacked vertically */}
      {WRITING_FRAMEWORKS.map((framework) => {
        const isActive = activeFramework === framework.id
        const iconSrc = FRAMEWORK_ICONS[framework.id]
        
        return (
          <button
            key={framework.id}
            onClick={() => handleFrameworkClick(framework)}
            className={cn(
              "relative group",
              "w-10 h-10 p-2", // Square button 40x40px
              "bg-[--card] text-[--card-foreground] rounded-md border border-[--border]",
              "flex items-center justify-center",
              "transition-all duration-200",
              "hover:bg-white/5",
              "focus:outline-none focus:ring-2 focus:ring-purple-500",
              isActive && "ring-2 ring-purple-500 bg-white/10"
            )}
            aria-label={`Apply ${framework.name}`}
          >
            {/* Framework Icon */}
            {iconSrc && (
              <Image
                src={iconSrc}
                alt={framework.name}
                width={24}
                height={24}
                style={{ width: '24px', height: 'auto' }}
                className={cn(
                  "object-contain",
                  isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                )}
              />
            )}
            
            {/* Tooltip - Shows framework name on hover, positioned to the right */}
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 min-w-max bg-[--card] text-[--card-foreground] border border-[--border] text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl">
              <div className="font-medium">{framework.name}</div>
              {/* Tooltip arrow pointing left */}
              <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[--card]"></div>
            </div>
          </button>
        )
      })}
      
      {/* Divider */}
      <div className="w-6 h-px bg-neutral-400 dark:bg-neutral-600" />
      
      {/* Clear Framework Button - Also square black button */}
      <button 
        onClick={handleClearFramework}
        className={cn(
          "relative group",
          "w-10 h-10 p-2",
          "bg-[--card] text-[--card-foreground] rounded-md border border-[--border]",
          "flex items-center justify-center",
          "transition-all duration-200",
          "hover:bg-white/5",
          "focus:outline-none focus:ring-2 focus:ring-red-500"
        )}
        aria-label="Clear framework"
      >
        {/* Clear Icon - X symbol */}
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="opacity-70 group-hover:opacity-100">
          <path 
            d="M4 4L12 12M12 4L4 12" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </svg>
        
        {/* Tooltip */}
        <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 min-w-max bg-[--card] text-[--card-foreground] border border-[--border] text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl">
          Clear Framework
          {/* Tooltip arrow pointing left */}
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-[--card]"></div>
        </div>
      </button>
    </div>
  )
}

export default FrameworkToolbarVertical