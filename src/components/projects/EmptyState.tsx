'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-12", className)}>
      <div className="w-16 h-16 mb-6 text-neutral-400 dark:text-neutral-600">
        {icon || <DefaultEmptyIcon />}
      </div>
      
      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button
          variant="primary"
          onClick={onAction}
          className="min-w-[120px]"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

const DefaultEmptyIcon: React.FC = () => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 48 48"
    className="w-full h-full"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M12 6h24v36L24 30 12 42V6z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M16 14h16M16 20h12"
    />
  </svg>
)

export const ProjectsEmptyState: React.FC<{ onCreateProject: () => void }> = ({ 
  onCreateProject 
}) => (
  <EmptyState
    title="No projects yet"
    description="Start your writing journey by creating your first project. Organize your stories, novels, and writing pieces all in one place."
    actionLabel="Create your first project"
    onAction={onCreateProject}
  />
)

export const SearchEmptyState: React.FC<{ searchQuery: string }> = ({ 
  searchQuery 
}) => (
  <EmptyState
    title="No projects found"
    description={`No projects match "${searchQuery}". Try adjusting your search terms or filters.`}
    icon={<SearchEmptyIcon />}
  />
)

export const FilterEmptyState: React.FC = () => (
  <EmptyState
    title="No projects match your filters"
    description="Try adjusting your filters to see more projects."
    icon={<FilterEmptyIcon />}
  />
)

const SearchEmptyIcon: React.FC = () => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 48 48"
    className="w-full h-full"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM21 21l6 6"
    />
  </svg>
)

const FilterEmptyIcon: React.FC = () => (
  <svg
    fill="none"
    stroke="currentColor"
    viewBox="0 0 48 48"
    className="w-full h-full"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 6h42l-16 18.5v11.1L21 42V24.5L3 6z"
    />
  </svg>
)