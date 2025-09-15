'use client'

import React from 'react'
import { Select, SelectContent, SelectItem } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ProjectFilters, PROJECT_GENRES, PROJECT_STATUSES, SORT_OPTIONS } from '@/types/projects'

interface FilterControlsProps {
  filters: ProjectFilters
  onFiltersChange: (filters: ProjectFilters) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  className?: string
  projectCount?: number
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  className,
  projectCount = 0
}) => {
  const handleFilterChange = (key: keyof ProjectFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value
    })
  }

  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      sortBy: 'updated_at',
      sortOrder: 'desc'
    })
  }

  const hasActiveFilters = Boolean(
    filters.search || 
    filters.genre || 
    (filters.status && filters.status !== 'all')
  )

  return (
    <div className={cn("flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between", className)}>
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status Filter */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <label htmlFor="status-filter" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 min-w-max">
            Status:
          </label>
          <Select
            id="status-filter"
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="min-w-[140px]"
          >
            {PROJECT_STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Genre Filter */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <label htmlFor="genre-filter" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 min-w-max">
            Genre:
          </label>
          <Select
            id="genre-filter"
            value={filters.genre || 'all'}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
            className="min-w-[120px]"
          >
            <SelectItem value="all">All Genres</SelectItem>
            {PROJECT_GENRES.map(genre => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <label htmlFor="sort-filter" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 min-w-max">
            Sort by:
          </label>
          <div className="flex gap-1">
            <Select
              id="sort-filter"
              value={filters.sortBy || 'updated_at'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="min-w-[140px]"
            >
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
            <Button
              variant="secondary"
              buttonSize="icon"
              onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              aria-label={`Sort ${filters.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              className="shrink-0"
            >
              {filters.sortOrder === 'asc' ? (
                <SortAscIcon className="w-4 h-4" />
              ) : (
                <SortDescIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            buttonSize="small"
            onClick={handleClearFilters}
            className="text-neutral-600 dark:text-neutral-400"
          >
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Project Count */}
        <span className="text-sm text-neutral-600 dark:text-neutral-400 min-w-max">
          {projectCount} project{projectCount !== 1 ? 's' : ''}
        </span>

        {/* View Mode Toggle */}
        <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg p-1" role="tablist">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            buttonSize="iconSmall"
            onClick={() => onViewModeChange('grid')}
            aria-label="Grid view"
            role="tab"
            aria-selected={viewMode === 'grid'}
            className="shrink-0"
          >
            <GridIcon className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            buttonSize="iconSmall"
            onClick={() => onViewModeChange('list')}
            aria-label="List view"
            role="tab"
            aria-selected={viewMode === 'list'}
            className="shrink-0"
          >
            <ListIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Icons
const SortAscIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
)

const SortDescIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
  </svg>
)

const GridIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const ListIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
)