'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { Project, ProjectFilters, ProjectLibraryProps, CreateProjectData } from '@/types/projects'
import { SearchBar } from './SearchBar'
import { FilterControls } from './FilterControls'
import { ProjectCard } from './ProjectCard'
import { CreateProjectModal } from './CreateProjectModal'
import { ProjectsEmptyState, SearchEmptyState, FilterEmptyState } from './EmptyState'
import { ProjectSkeleton, SearchSkeleton } from './ProjectSkeleton'

interface ProjectLibraryState {
  projects: Project[]
  loading: boolean
  error: string | null
  filters: ProjectFilters
  viewMode: 'grid' | 'list'
  showCreateModal: boolean
  createLoading: boolean
}

export const ProjectLibrary: React.FC<ProjectLibraryProps> = ({ userId }) => {
  const [state, setState] = useState<ProjectLibraryState>({
    projects: [],
    loading: true,
    error: null,
    filters: {
      search: '',
      sortBy: 'updated_at',
      sortOrder: 'desc'
    },
    viewMode: 'grid',
    showCreateModal: false,
    createLoading: false
  })

  // Simulate API call - replace with real API integration
  const fetchProjects = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data - replace with real API call
      const mockProjects: Project[] = [
        {
          id: '1',
          user_id: userId,
          title: 'The Midnight Chronicles',
          description: 'A dark fantasy novel about magical creatures living in the shadows of modern cities.',
          genre: 'Fantasy',
          brief: 'An urban fantasy exploring the hidden world of supernatural beings...',
          content: null,
          word_count: 45000,
          status: 'in_progress',
          order: 1,
          archived: false,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-20T14:30:00Z'
        },
        {
          id: '2',
          user_id: userId,
          title: 'Silicon Dreams',
          description: 'A sci-fi thriller set in a near-future where AI consciousness becomes reality.',
          genre: 'Sci-Fi',
          brief: 'Exploring the ethical implications of artificial consciousness...',
          content: null,
          word_count: 12000,
          status: 'draft',
          order: 2,
          archived: false,
          created_at: '2024-01-10T09:00:00Z',
          updated_at: '2024-01-18T16:45:00Z'
        }
      ]
      
      setState(prev => ({ 
        ...prev, 
        projects: mockProjects, 
        loading: false 
      }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to load projects' 
      }))
    }
  }, [userId])

  // Load projects on component mount
  React.useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = [...state.projects]

    // Apply search filter
    if (state.filters.search) {
      const searchTerm = state.filters.search.toLowerCase()
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm) ||
        project.description?.toLowerCase().includes(searchTerm) ||
        project.genre?.toLowerCase().includes(searchTerm)
      )
    }

    // Apply status filter
    if (state.filters.status && state.filters.status !== 'all') {
      filtered = filtered.filter(project => project.status === state.filters.status)
    }

    // Apply genre filter
    if (state.filters.genre) {
      filtered = filtered.filter(project => project.genre === state.filters.genre)
    }

    // Apply sorting
    const sortBy = state.filters.sortBy || 'updated_at'
    const sortOrder = state.filters.sortOrder || 'desc'
    
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Project]
      let bValue: any = b[sortBy as keyof Project]

      if (sortBy === 'title') {
        aValue = aValue?.toLowerCase() || ''
        bValue = bValue?.toLowerCase() || ''
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [state.projects, state.filters])

  const updateFilters = useCallback((newFilters: ProjectFilters) => {
    setState(prev => ({
      ...prev,
      filters: newFilters
    }))
  }, [])

  const updateViewMode = useCallback((viewMode: 'grid' | 'list') => {
    setState(prev => ({ ...prev, viewMode }))
  }, [])

  const handleCreateProject = useCallback(async (data: CreateProjectData) => {
    setState(prev => ({ ...prev, createLoading: true }))

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock project creation
      const newProject: Project = {
        id: Date.now().toString(),
        user_id: userId,
        title: data.title,
        description: data.description,
        genre: data.genre,
        brief: data.brief,
        content: null,
        word_count: 0,
        status: 'draft',
        order: state.projects.length + 1,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setState(prev => ({
        ...prev,
        projects: [newProject, ...prev.projects],
        showCreateModal: false,
        createLoading: false
      }))
    } catch (error) {
      setState(prev => ({ ...prev, createLoading: false }))
      throw error
    }
  }, [userId, state.projects.length])

  const handleProjectEdit = useCallback((project: Project) => {
    console.log('Edit project:', project)
    // Implement edit functionality
  }, [])

  const handleProjectDuplicate = useCallback((project: Project) => {
    console.log('Duplicate project:', project)
    // Implement duplicate functionality
  }, [])

  const handleProjectArchive = useCallback((project: Project) => {
    console.log('Archive project:', project)
    // Implement archive functionality
  }, [])

  const handleProjectDelete = useCallback((project: Project) => {
    console.log('Delete project:', project)
    // Implement delete functionality
  }, [])

  const handleProjectOpen = useCallback((project: Project) => {
    console.log('Open project:', project)
    // Navigate to editor with project
    // router.push(`/editor/${project.id}`)
  }, [])

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
            Error Loading Projects
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            {state.error}
          </p>
          <Button onClick={fetchProjects}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const hasProjects = state.projects.length > 0
  const hasFilteredProjects = filteredProjects.length > 0
  const hasActiveFilters = Boolean(
    state.filters.search || 
    state.filters.genre || 
    (state.filters.status && state.filters.status !== 'all')
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              Project Library
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Manage and organize your writing projects
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setState(prev => ({ ...prev, showCreateModal: true }))}
            className="whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Loading State */}
        {state.loading ? (
          <div>
            <SearchSkeleton />
            <div className={cn(
              "gap-6",
              state.viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "space-y-4"
            )}>
              <ProjectSkeleton viewMode={state.viewMode} count={6} />
            </div>
          </div>
        ) : !hasProjects ? (
          /* Empty State - No Projects */
          <ProjectsEmptyState 
            onCreateProject={() => setState(prev => ({ ...prev, showCreateModal: true }))}
          />
        ) : (
          <>
            {/* Search and Filters */}
            <div className="space-y-4 mb-8">
              <SearchBar
                value={state.filters.search || ''}
                onChange={(search) => updateFilters({ ...state.filters, search })}
                placeholder="Search projects by title, description, or genre..."
              />
              
              <FilterControls
                filters={state.filters}
                onFiltersChange={updateFilters}
                viewMode={state.viewMode}
                onViewModeChange={updateViewMode}
                projectCount={filteredProjects.length}
              />
            </div>

            {/* Projects Grid/List */}
            {!hasFilteredProjects ? (
              hasActiveFilters ? (
                <FilterEmptyState />
              ) : (
                <SearchEmptyState searchQuery={state.filters.search || ''} />
              )
            ) : (
              <div
                className={cn(
                  "gap-6",
                  state.viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                    : "space-y-4"
                )}
              >
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode={state.viewMode}
                    onEdit={handleProjectEdit}
                    onDuplicate={handleProjectDuplicate}
                    onArchive={handleProjectArchive}
                    onDelete={handleProjectDelete}
                    onOpen={handleProjectOpen}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={state.showCreateModal}
        onClose={() => setState(prev => ({ ...prev, showCreateModal: false }))}
        onSubmit={handleCreateProject}
        isLoading={state.createLoading}
      />
    </div>
  )
}

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)