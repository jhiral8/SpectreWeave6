import React from 'react'
import { DualWritingSurface } from '@/components/DualWritingSurface/DualWritingSurface'
import { cn } from '@/lib/utils'

interface WritingWorkspaceProps {
  className?: string
}

/**
 * Complete Writing Workspace with horizontal framework toolbar integration.
 * 
 * Features:
 * - Framework selection via horizontal toolbar (now embedded in DualWritingSurface)
 * - Automatic template insertion into framework editor
 * - Auto-switch to framework surface when selecting templates
 * - Clear framework functionality
 * - Visual feedback for active framework
 * - Responsive design with mobile-friendly controls
 */
export const WritingWorkspace = ({ className }: WritingWorkspaceProps) => {
  return (
    <div className={cn('h-full flex', className)}>
      {/* Main Writing Surface with Integrated Framework Toolbar */}
      <div className="flex-1 min-w-0">
        <DualWritingSurface />
      </div>
    </div>
  )
}

export default WritingWorkspace