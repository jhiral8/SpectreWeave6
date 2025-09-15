'use client'

import React from 'react'
import {
  Search,
  Filter,
  X,
  Check,
  ChevronDown,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Plus
} from 'lucide-react'
import { ProjectFilters as FilterType, PROJECT_GENRES, PROJECT_STATUSES, SORT_OPTIONS } from '@/types/projects'
import { Button } from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProjectFiltersProps {
  filters: FilterType
  onFiltersChange: (filters: Partial<FilterType>) => void
  onClearFilters: () => void
  totalCount?: number
  filteredCount?: number
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onCreateProject?: () => void
  className?: string
}

interface FilterDropdownProps {
  label: string
  value: string | undefined
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const FilterDropdown = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder = 'All',
  className 
}: FilterDropdownProps) => {
  const selectedOption = options.find(opt => opt.value === value)
  const hasValue = value && value !== 'all'
  
  const menuItems = options.map(option => ({
    label: option.label,
    onClick: () => onChange(option.value),
    active: option.value === value
  }))
  
  return (
    <DropdownMenu
      trigger={
        <Button 
          variant={hasValue ? "secondary" : "ghost"}
          className={cn(
            'justify-between min-w-[120px]',
            hasValue && 'ai-confidence-border medium-confidence',
            className
          )}
        >
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
        </Button>
      }
      items={menuItems}
      align="start"
    />
  )
}

const ActiveFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: {
  filters: FilterType
  onFiltersChange: (filters: Partial<FilterType>) => void
  onClearFilters: () => void
}) => {
  const activeFilters = []
  
  if (filters.status && filters.status !== 'all') {
    const statusOption = PROJECT_STATUSES.find(s => s.value === filters.status)
    activeFilters.push({
      key: 'status',
      label: statusOption?.label || filters.status,
      onRemove: () => onFiltersChange({ status: 'all' })
    })
  }
  
  if (filters.genre) {
    activeFilters.push({
      key: 'genre',
      label: filters.genre,
      onRemove: () => onFiltersChange({ genre: undefined })
    })
  }
  
  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: `"${filters.search}"`,
      onRemove: () => onFiltersChange({ search: undefined })
    })
  }
  
  if (activeFilters.length === 0) return null
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-neutral-600 dark:text-neutral-400">Filters:</span>
      {activeFilters.map((filter) => (
        <Badge 
          key={filter.key}
          variant="secondary"
          className="ai-neural-border flex items-center gap-1 pr-1"
        >
          {filter.label}
          <button
            onClick={filter.onRemove}
            className="ml-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded p-0.5"
            aria-label={`Remove ${filter.key} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button 
        variant="ghost" 
        buttonSize="small"
        onClick={onClearFilters}
        className="text-xs"
      >
        Clear all
      </Button>
    </div>
  )
}

const SearchInput = ({ 
  value, 
  onChange, 
  onClear,
  className 
}: {
  value: string | undefined
  onChange: (value: string) => void
  onClear: () => void
  className?: string
}) => {
  const [localValue, setLocalValue] = React.useState(value || '')
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, 300) // Debounce search
    
    return () => clearTimeout(timer)
  }, [localValue, value, onChange])
  
  React.useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || '')
    }
  }, [value])
  
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
      <input
        type="text"
        placeholder="Search projects..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className={cn(
          'w-full pl-10 pr-10 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg',
          'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white',
          'placeholder-neutral-500 dark:placeholder-neutral-400',
          'focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400',
          'transition-colors',
          localValue && 'ai-neural-border ai-thinking'
        )}
        aria-label="Search projects"
      />
      {localValue && (
        <button
          onClick={() => {
            setLocalValue('')
            onClear()
          }}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
          aria-label="Clear search"
        >
          <X className="h-3 w-3 text-neutral-400" />
        </button>
      )}
    </div>
  )
}

export function ProjectFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  totalCount = 0,
  filteredCount,
  viewMode,
  onViewModeChange,
  onCreateProject,
  className
}: ProjectFiltersProps) {
  const displayCount = filteredCount ?? totalCount
  const hasActiveFilters = filters.search || (filters.status && filters.status !== 'all') || filters.genre
  
  const sortOption = SORT_OPTIONS.find(opt => opt.value === filters.sortBy)
  const sortLabel = sortOption ? `${sortOption.label} ${filters.sortOrder === 'asc' ? '↑' : '↓'}` : 'Sort'
  
  const sortMenuItems = SORT_OPTIONS.map(option => ({
    label: option.label,
    onClick: () => {
      const newSortOrder = filters.sortBy === option.value && filters.sortOrder === 'desc' ? 'asc' : 'desc'
      onFiltersChange({ 
        sortBy: option.value as keyof ProjectFilters['sortBy'],
        sortOrder: newSortOrder 
      })
    },
    icon: filters.sortBy === option.value
      ? (filters.sortOrder === 'asc' ? SortAsc : SortDesc)
      : undefined,
    active: filters.sortBy === option.value
  }))
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Top bar with search and primary actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={filters.search}
            onChange={(value) => onFiltersChange({ search: value || undefined })}
            onClear={() => onFiltersChange({ search: undefined })}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              buttonSize="iconSmall"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid view"
              className={cn(
                'rounded p-1.5',
                viewMode === 'grid' && 'ai-manuscript-border'
              )}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              buttonSize="iconSmall"
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
              className={cn(
                'rounded p-1.5',
                viewMode === 'list' && 'ai-manuscript-border'
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Create project button */}
          {onCreateProject && (
            <Button
              onClick={onCreateProject}
              className="ai-confidence-border high-confidence"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </div>
      
      {/* Filter bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <FilterDropdown
            label="Status"
            value={filters.status}
            options={PROJECT_STATUSES}
            onChange={(value) => onFiltersChange({ status: value as FilterType['status'] })}
            placeholder="All Status"
          />
          
          {/* Genre filter */}
          <FilterDropdown
            label="Genre"
            value={filters.genre}
            options={PROJECT_GENRES.map(genre => ({ value: genre, label: genre }))}
            onChange={(value) => onFiltersChange({ genre: value })}
            placeholder="All Genres"
          />
          
          {/* Sort dropdown */}
          <DropdownMenu
            trigger={
              <Button 
                variant="ghost"
                className="justify-between min-w-[100px]"
              >
                <span className="truncate">{sortLabel}</span>
                <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
              </Button>
            }
            items={sortMenuItems}
            align="start"
          />
        </div>
        
        {/* Results count */}
        <div className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
          {hasActiveFilters && filteredCount !== undefined ? (
            <span>
              {displayCount} of {totalCount} projects
            </span>
          ) : (
            <span>
              {totalCount} project{totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      
      {/* Active filters */}
      <ActiveFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onClearFilters={onClearFilters}
      />
    </div>
  )
}

export default ProjectFilters