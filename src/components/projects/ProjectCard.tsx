'use client'

import React from 'react'
import {
  FileText,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Circle,
  MoreHorizontal,
  Zap,
  Target,
  BookOpen,
  Activity,
  Edit,
  Copy,
  Archive,
  Trash2
} from 'lucide-react'
import { Project } from '@/types/projects'
import { Button } from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  viewMode?: 'grid' | 'list'
  showHealthIndicators?: boolean
  showAIInsights?: boolean
  onOpen?: (project: Project) => void
  onEdit?: (project: Project) => void
  onDuplicate?: (project: Project) => void
  onArchive?: (project: Project) => void
  onDelete?: (project: Project) => void
  className?: string
}

interface HealthMetric {
  label: string
  value: number
  max: number
  color: string
  icon: React.ComponentType<{ className?: string }>
  status: 'excellent' | 'good' | 'warning' | 'critical'
}

interface AIInsight {
  type: 'productivity' | 'style' | 'goal' | 'collaboration'
  message: string
  confidence: number
  action?: string
}

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

const generateHealthMetrics = (project: Project): HealthMetric[] => {
  // Simulated health metrics based on project data
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  const activityScore = Math.max(0, Math.min(100, 100 - daysSinceUpdate * 5))
  const progressScore = project.status === 'completed' ? 100 : 
                       project.status === 'in_progress' ? Math.min(85, project.word_count / 100) :
                       Math.min(45, project.word_count / 200)
  const consistencyScore = Math.max(30, Math.min(100, 90 - daysSinceUpdate * 3))
  const qualityScore = Math.max(60, Math.min(100, 70 + Math.random() * 30))

  return [
    {
      label: 'Activity',
      value: activityScore,
      max: 100,
      color: activityScore > 75 ? 'green' : activityScore > 50 ? 'yellow' : 'red',
      icon: Activity,
      status: activityScore > 75 ? 'excellent' : activityScore > 50 ? 'good' : activityScore > 25 ? 'warning' : 'critical'
    },
    {
      label: 'Progress',
      value: progressScore,
      max: 100,
      color: progressScore > 80 ? 'green' : progressScore > 60 ? 'blue' : progressScore > 40 ? 'yellow' : 'red',
      icon: Target,
      status: progressScore > 80 ? 'excellent' : progressScore > 60 ? 'good' : progressScore > 40 ? 'warning' : 'critical'
    }
  ]
}

const generateAIInsights = (project: Project, metrics: HealthMetric[]): AIInsight[] => {
  const insights: AIInsight[] = []
  
  const activityMetric = metrics.find(m => m.label === 'Activity')
  const progressMetric = metrics.find(m => m.label === 'Progress')
  
  if (activityMetric && activityMetric.value < 50) {
    insights.push({
      type: 'productivity',
      message: `Low activity detected. Consider setting a daily writing goal.`,
      confidence: 0.85,
      action: 'Set goal'
    })
  }
  
  if (progressMetric && progressMetric.value > 75 && project.status !== 'completed') {
    insights.push({
      type: 'goal',
      message: `Great progress! You're ${Math.round(progressMetric.value)}% towards completion.`,
      confidence: 0.9
    })
  }
  
  return insights.slice(0, 1) // Show maximum 1 insight in cards
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
  return count.toLocaleString()
}

const HealthIndicator = ({ metric }: { metric: HealthMetric }) => {
  const Icon = metric.icon
  const percentage = (metric.value / metric.max) * 100
  
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-600 dark:text-green-400'
      case 'blue':
        return 'text-blue-600 dark:text-blue-400'
      case 'yellow':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'red':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-neutral-600 dark:text-neutral-400'
    }
  }
  
  const getBarClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-500'
      case 'blue':
        return 'bg-blue-500'
      case 'yellow':
        return 'bg-yellow-500'
      case 'red':
        return 'bg-red-500'
      default:
        return 'bg-neutral-500'
    }
  }
  
  return (
    <div className="flex items-center space-x-2">
      <Icon className={cn('h-3 w-3', getColorClasses(metric.color))} />
      <span className="text-xs text-neutral-600 dark:text-neutral-400">
        {metric.label}
      </span>
      <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5">
        <div
          className={cn('h-full rounded-full transition-all duration-300', getBarClasses(metric.color))}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <span className={cn('text-xs font-medium', getColorClasses(metric.color))}>
        {Math.round(metric.value)}
      </span>
    </div>
  )
}

const AIInsightBadge = ({ insight }: { insight: AIInsight }) => {
  const getTypeIcon = () => {
    switch (insight.type) {
      case 'productivity': return Activity
      case 'style': return BookOpen
      case 'goal': return Target
      case 'collaboration': return Users
      default: return Zap
    }
  }
  
  const Icon = getTypeIcon()
  
  return (
    <div className="ai-confidence-border medium-confidence rounded-lg p-2 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0">
          <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <Icon className="h-2.5 w-2.5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {insight.message}
          </p>
          {insight.action && (
            <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium mt-1">
              {insight.action}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProjectCard({
  project,
  viewMode = 'grid',
  showHealthIndicators = true,
  showAIInsights = true,
  onOpen,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  className
}: ProjectCardProps) {
  const statusConfig = getStatusConfig(project.status)
  const StatusIcon = statusConfig.icon
  const healthMetrics = generateHealthMetrics(project)
  const aiInsights = generateAIInsights(project, healthMetrics)
  
  const getActionMenuItems = () => [
    {
      label: 'Open',
      icon: FileText,
      onClick: () => onOpen?.(project),
    },
    {
      label: 'Edit',
      icon: Edit,
      onClick: () => onEdit?.(project),
    },
    {
      label: 'Duplicate',
      icon: Copy,
      onClick: () => onDuplicate?.(project),
    },
    {
      type: 'separator' as const,
    },
    {
      label: project.archived ? 'Unarchive' : 'Archive',
      icon: Archive,
      onClick: () => onArchive?.(project),
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: () => onDelete?.(project),
      variant: 'destructive' as const,
    },
  ]

  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          'ai-framework-border rounded-lg p-4 bg-white dark:bg-black hover:shadow-lg transition-all duration-200 cursor-pointer',
          className
        )}
        onClick={() => onOpen?.(project)}
      >
        <div className="flex items-center space-x-4">
          {/* Icon */}
          <div className="ai-confidence-border high-confidence w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate mb-1">
                  {project.title}
                </h3>
                {project.description && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate mb-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 text-xs text-neutral-500 dark:text-neutral-400">
                  <div className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    statusConfig.bgClass,
                    statusConfig.textClass
                  )}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </div>
                  {project.genre && (
                    <Badge variant="secondary" size="sm">
                      {project.genre}
                    </Badge>
                  )}
                  <div className="flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>{formatWordCount(project.word_count)} words</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(project.updated_at)}</span>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex-shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu
                  trigger={
                    <Button variant="ghost" buttonSize="iconSmall">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                  items={getActionMenuItems()}
                  align="end"
                />
              </div>
            </div>
            
            {/* Health indicators for list view */}
            {showHealthIndicators && healthMetrics.length > 0 && (
              <div className="mt-2 space-y-1">
                {healthMetrics.slice(0, 2).map((metric) => (
                  <HealthIndicator key={metric.label} metric={metric} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // Grid view
  return (
    <div
      className={cn(
        'ai-neural-border rounded-lg p-6 bg-white dark:bg-black hover:shadow-xl transition-all duration-300 cursor-pointer group',
        className
      )}
      onClick={() => onOpen?.(project)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="ai-confidence-border high-confidence w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate mb-1">
              {project.title}
            </h3>
            <div className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              statusConfig.bgClass,
              statusConfig.textClass
            )}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu
            trigger={
              <Button variant="ghost" buttonSize="iconSmall">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
            items={getActionMenuItems()}
            align="end"
          />
        </div>
      </div>
      
      {/* Description */}
      {project.description && (
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}
      
      {/* Genre badge */}
      {project.genre && (
        <div className="mb-4">
          <Badge variant="secondary" size="sm">
            {project.genre}
          </Badge>
        </div>
      )}
      
      {/* Health Indicators */}
      {showHealthIndicators && healthMetrics.length > 0 && (
        <div className="space-y-2 mb-4">
          {healthMetrics.map((metric) => (
            <HealthIndicator key={metric.label} metric={metric} />
          ))}
        </div>
      )}
      
      {/* AI Insights */}
      {showAIInsights && aiInsights.length > 0 && (
        <div className="space-y-2 mb-4">
          {aiInsights.map((insight, index) => (
            <AIInsightBadge key={index} insight={insight} />
          ))}
        </div>
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(project.updated_at)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FileText className="w-3 h-3" />
            <span>{formatWordCount(project.word_count)} words</span>
          </div>
        </div>
        
        {/* Collaboration indicators */}
        <div className="flex -space-x-1">
          <Avatar 
            fallback="U" 
            size="xs"
            className="ring-2 ring-white dark:ring-black"
          />
        </div>
      </div>
    </div>
  )
}

export default ProjectCard