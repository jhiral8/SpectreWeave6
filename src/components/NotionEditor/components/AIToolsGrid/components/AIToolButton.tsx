"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'
import { AITool } from '../AIToolsGrid'
import { Loader2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/radix-tooltip'

interface AIToolButtonProps {
  tool: AITool
  onClick: () => void
  disabled?: boolean
  isLoading?: boolean
  className?: string
}

export function AIToolButton({
  tool,
  onClick,
  disabled = false,
  isLoading = false,
  className
}: AIToolButtonProps) {
  const IconComponent = tool.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={cn(
              "ai-tool-button",
              "flex flex-col items-center justify-center p-3 rounded-md border border-border/50",
              "bg-background hover:bg-accent hover:border-accent-foreground/20",
              "transition-all duration-200 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background",
              "group relative overflow-hidden",
              isLoading && "pointer-events-none",
              className
            )}
          >
            {/* Background hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            {/* Icon container */}
            <div className="relative z-10 mb-1.5">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <IconComponent className="h-5 w-5 text-foreground group-hover:text-primary transition-colors duration-200" />
              )}
            </div>

            {/* Tool name */}
            <div className="relative z-10 text-xs font-medium text-foreground group-hover:text-primary transition-colors duration-200 text-center leading-tight">
              {tool.name}
            </div>

            {/* Keyboard shortcut */}
            {tool.shortcut && (
              <div className="relative z-10 text-[10px] text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {tool.shortcut}
              </div>
            )}

            {/* Loading indicator overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-md flex items-center justify-center">
                <div className="text-xs text-muted-foreground">...</div>
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          <div className="max-w-xs">
            <div className="font-medium">{tool.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{tool.description}</div>
            {tool.shortcut && (
              <div className="text-xs text-muted-foreground mt-1">
                Shortcut: <span className="font-mono">{tool.shortcut}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}