'use client'

import React from 'react'
import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal, 
  Calendar, 
  Users,
  FileText,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Circle
} from 'lucide-react'
import { Project } from '@/types/projects'
import { Button } from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProjectTableProps {
  projects: Project[]
  loading?: boolean
  sortBy?: keyof Project
  sortOrder?: 'asc' | 'desc'
  onSort?: (field: keyof Project) => void
  onProjectAction?: (project: Project, action: string) => void
  className?: string
}

interface TableColumn {
  key: keyof Project | 'actions'
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  className?: string
}

const columns: TableColumn[] = [
  { key: 'title', label: 'Project', sortable: true, width: 'flex-1' },
  { key: 'status', label: 'Status', sortable: true, width: 'w-24' },
  { key: 'genre', label: 'Genre', sortable: true, width: 'w-28' },
  { key: 'word_count', label: 'Words', sortable: true, width: 'w-20', align: 'right' },
  { key: 'updated_at', label: 'Last Modified', sortable: true, width: 'w-32' },
  { key: 'actions', label: '', width: 'w-12', align: 'center' },
]

const getStatusConfig = (status: Project['status']) => {
  switch (status) {
    case 'draft':
      return { 
        icon: Circle, 
        color: 'neutral', 
        label: 'Draft',
        bgClass: 'bg-neutral-100 dark:bg-neutral-800',
        textClass: 'text-neutral-700 dark:text-neutral-300'
      }
    case 'in_progress':
      return { 
        icon: Clock, 
        color: 'blue', 
        label: 'In Progress',
        bgClass: 'bg-blue-100 dark:bg-blue-900/30',
        textClass: 'text-blue-700 dark:text-blue-300'
      }
    case 'completed':
      return { 
        icon: CheckCircle, 
        color: 'green', 
        label: 'Completed',
        bgClass: 'bg-green-100 dark:bg-green-900/30',
        textClass: 'text-green-700 dark:text-green-300'
      }
    case 'archived':
      return { 
        icon: AlertCircle, 
        color: 'yellow', 
        label: 'Archived',
        bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
        textClass: 'text-yellow-700 dark:text-yellow-300'
      }
    default:
      return { 
        icon: Circle, 
        color: 'neutral', 
        label: status,
        bgClass: 'bg-neutral-100 dark:bg-neutral-800',
        textClass: 'text-neutral-700 dark:text-neutral-300'
      }
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays - 1} days ago`
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

const formatWordCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

const SortIcon = ({ sorted, direction }: { sorted: boolean; direction?: 'asc' | 'desc' }) => {
  if (!sorted) {
    return (
      <div className="flex flex-col ml-2">
        <ChevronUp className="h-2 w-2 text-neutral-400" />
        <ChevronDown className="h-2 w-2 text-neutral-400" />
      </div>
    )
  }
  
  return direction === 'asc' 
    ? <ChevronUp className="h-4 w-4 ml-2 text-neutral-900 dark:text-white" />
    : <ChevronDown className="h-4 w-4 ml-2 text-neutral-900 dark:text-white" />
}

export function ProjectTable({
  projects,
  loading = false,
  sortBy,
  sortOrder = 'desc',
  onSort,
  onProjectAction,
  className
}: ProjectTableProps) {
  const handleSort = (field: keyof Project) => {
    if (onSort) {
      onSort(field)
    }
  }

  const getActionMenuItems = (project: Project) => [
    {
      label: 'Open',
      icon: FileText,
      onClick: () => onProjectAction?.(project, 'open'),
    },
    {
      label: 'Edit',
      icon: FileText,
      onClick: () => onProjectAction?.(project, 'edit'),
    },
    {
      label: 'Duplicate',
      icon: FileText,
      onClick: () => onProjectAction?.(project, 'duplicate'),
    },
    {
      type: 'separator' as const,
    },
    {
      label: project.archived ? 'Unarchive' : 'Archive',
      onClick: () => onProjectAction?.(project, project.archived ? 'unarchive' : 'archive'),
    },
    {
      label: 'Delete',
      onClick: () => onProjectAction?.(project, 'delete'),
      variant: 'destructive' as const,
    },
  ]

  if (loading) {
    return (
      <div className={cn('ai-neural-border rounded-lg overflow-hidden', className)}>
        <div className="bg-white dark:bg-black">
          {/* Table header */}
          <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-center px-6 py-3">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className={cn(
                    'flex items-center',
                    column.width,
                    column.align === 'right' && 'justify-end',
                    column.align === 'center' && 'justify-center'
                  )}
                >
                  <div className="h-4 w-16 bg-neutral-300 dark:bg-neutral-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Loading rows */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center px-6 py-4">
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className={cn(
                      'flex items-center',
                      column.width,
                      column.align === 'right' && 'justify-end',
                      column.align === 'center' && 'justify-center'
                    )}
                  >
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" style={{ width: `${Math.random() * 60 + 40}%` }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className={cn('ai-neural-border rounded-lg bg-white dark:bg-black p-12 text-center', className)}>
        <FileText className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
          No projects found
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400">
          Create your first project to get started with SpectreWeave.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('ai-neural-border rounded-lg overflow-hidden', className)}>
      <div className="bg-white dark:bg-black">
        {/* Table header */}
        <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="flex items-center px-6 py-3">
            {columns.map((column) => (
              <div
                key={column.key}
                className={cn(
                  'flex items-center',
                  column.width,
                  column.align === 'right' && 'justify-end',
                  column.align === 'center' && 'justify-center'
                )}
              >
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column.key as keyof Project)}
                    className="flex items-center text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    {column.label}
                    <SortIcon 
                      sorted={sortBy === column.key} 
                      direction={sortBy === column.key ? sortOrder : undefined}
                    />
                  </button>
                ) : (
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    {column.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Table body */}
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {projects.map((project) => {
            const statusConfig = getStatusConfig(project.status)
            const StatusIcon = statusConfig.icon
            
            return (
              <div
                key={project.id}
                className="flex items-center px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer"
                onClick={() => onProjectAction?.(project, 'open')}
              >
                {/* Project title */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="ai-confidence-border high-confidence w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="w-24 flex justify-start">
                  <div className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    statusConfig.bgClass,
                    statusConfig.textClass
                  )}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </div>
                </div>

                {/* Genre */}
                <div className="w-28">
                  {project.genre && (
                    <Badge variant="secondary" size="sm">
                      {project.genre}
                    </Badge>
                  )}
                </div>

                {/* Word count */}
                <div className="w-20 text-right">
                  <span className="text-sm text-neutral-900 dark:text-white font-medium">
                    {formatWordCount(project.word_count)}
                  </span>
                </div>

                {/* Last modified */}
                <div className="w-32">
                  <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(project.updated_at)}
                  </div>
                </div>

                {/* Actions */}
                <div className="w-12 flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu
                    trigger={
                      <Button variant="ghost" buttonSize="iconSmall">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    }
                    items={getActionMenuItems(project)}
                    align="end"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ProjectTable