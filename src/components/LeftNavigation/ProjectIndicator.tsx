import { memo } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'

export interface ProjectIndicatorProps {
  project?: {
    title?: string
    version?: string
    id?: string
  }
  isCollapsed?: boolean
  className?: string
}

export const ProjectIndicator = memo(({
  project,
  isCollapsed = false,
  className
}: ProjectIndicatorProps) => {
  const title = project?.title || 'Untitled Project'
  const version = project?.version || 'v0.1.0'

  return (
    <div 
      className={cn(
        'group flex items-center transition-all duration-200',
        isCollapsed ? 'justify-center px-2 py-3 mx-2' : 'px-4 py-3 mx-3',
        'bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800',
        'hover:bg-neutral-100 dark:hover:bg-neutral-800/70',
        className
      )}
    >
      <div className="flex items-center justify-center flex-shrink-0">
        <Icon 
          name="FileText"
          className="text-neutral-600 dark:text-neutral-400"
        />
      </div>
      
      {!isCollapsed && (
        <div className="ml-3 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {title}
            </h3>
            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex-shrink-0">
              {version}
            </span>
          </div>
          
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Current Project
          </p>
        </div>
      )}
      
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-3 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
          <div className="font-medium">{title}</div>
          <div className="opacity-75 font-mono">{version}</div>
        </div>
      )}
    </div>
  )
})

ProjectIndicator.displayName = 'ProjectIndicator'