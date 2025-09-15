'use client'

import React from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

import { DashboardLayout } from './DashboardLayout'
import { ProjectFilters } from './ProjectFilters'
import { ProjectTable } from './ProjectTable'
import { ProjectCard } from './ProjectCard'
import { ProjectModal } from './ProjectModal'
import useProjects, { useProjectFilters } from '@/hooks/useProjects'
import { Project, CreateProjectData } from '@/types/projects'
import { cn } from '@/lib/utils'

interface ProjectsDashboardProps {
  user: User
}

export function ProjectsDashboard({ user }: ProjectsDashboardProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  
  // Filters state
  const {
    filters,
    updateFilters,
    resetFilters,
    toggleSort
  } = useProjectFilters({
    status: 'all',
    sortBy: 'updated_at',
    sortOrder: 'desc'
  })
  
  // Projects data and actions
  const {
    projects,
    stats,
    isLoading,
    isCreating,
    isUpdating,
    isDuplicating,
    isArchiving,
    isDeleting,
    createError,
    updateError,
    createProject,
    updateProject,
    duplicateProject,
    archiveProject,
    deleteProject,
  } = useProjects(user, filters)
  
  // Project actions
  const handleProjectOpen = React.useCallback((project: Project) => {
    // Navigate to dual-surface editor
    router.push(`/projects/${project.id}`)
  }, [router])
  
  const handleProjectEdit = React.useCallback((project: Project) => {
    setEditingProject(project)
  }, [])
  
  const handleProjectDuplicate = React.useCallback(async (project: Project) => {
    try {
      await duplicateProject(project)
      toast.success('Project duplicated successfully')
    } catch (error) {
      toast.error('Failed to duplicate project')
      console.error('Duplicate error:', error)
    }
  }, [duplicateProject])
  
  const handleProjectArchive = React.useCallback(async (project: Project) => {
    const action = project.archived ? 'unarchive' : 'archive'
    const actionLabel = project.archived ? 'unarchived' : 'archived'
    
    try {
      await archiveProject(project.id, !project.archived)
      toast.success(`Project ${actionLabel} successfully`)
    } catch (error) {
      toast.error(`Failed to ${action} project`)
      console.error('Archive error:', error)
    }
  }, [archiveProject])
  
  const handleProjectDelete = React.useCallback(async (project: Project) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.title}"? This action cannot be undone.`
    )
    
    if (!confirmed) return
    
    try {
      await deleteProject(project.id)
      toast.success('Project deleted successfully')
    } catch (error) {
      toast.error('Failed to delete project')
      console.error('Delete error:', error)
    }
  }, [deleteProject])
  
  const handleCreateProject = React.useCallback(async (data: CreateProjectData) => {
    try {
      const newProject = await createProject(data)
      toast.success('Project created successfully')
      setIsCreateModalOpen(false)
      // Force refresh after a short delay to ensure the project appears
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      toast.error('Failed to create project')
      throw error // Re-throw to handle in modal
    }
  }, [createProject])
  
  const handleUpdateProject = React.useCallback(async (data: Partial<Project>) => {
    if (!editingProject) return
    
    try {
      await updateProject(editingProject.id, data)
      toast.success('Project updated successfully')
      setEditingProject(null)
    } catch (error) {
      toast.error('Failed to update project')
      throw error // Re-throw to handle in modal
    }
  }, [editingProject, updateProject])
  
  const handleProjectAction = React.useCallback((project: Project, action: string) => {
    switch (action) {
      case 'open':
        handleProjectOpen(project)
        break
      case 'edit':
        handleProjectEdit(project)
        break
      case 'duplicate':
        handleProjectDuplicate(project)
        break
      case 'archive':
      case 'unarchive':
        handleProjectArchive(project)
        break
      case 'delete':
        handleProjectDelete(project)
        break
    }
  }, [handleProjectOpen, handleProjectEdit, handleProjectDuplicate, handleProjectArchive, handleProjectDelete])
  
  const handleSort = React.useCallback((field: keyof Project) => {
    toggleSort(field)
  }, [toggleSort])
  
  // Filter projects for display
  const filteredProjects = React.useMemo(() => {
    return projects.filter(project => {
      // Handle archived filter
      if (filters.status === 'archived') {
        return project.archived
      } else {
        return !project.archived
      }
    })
  }, [projects, filters.status])
  
  return (
    <DashboardLayout 
      user={user} 
      sidebarOpen={sidebarOpen}
      onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white font-surgena">
                Projects
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                Manage your writing projects with AI-powered insights
              </p>
            </div>
            
            {/* Quick Stats */}
            {stats && (
              <div className="hidden lg:flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {stats.total}
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-400">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {stats.in_progress}
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-400">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {stats.completed}
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-400">Done</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                    {stats.totalWords.toLocaleString()}
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-400">Words</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Filters */}
        <ProjectFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={resetFilters}
          totalCount={projects.length}
          filteredCount={filteredProjects.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreateProject={() => setIsCreateModalOpen(true)}
          className="mb-6"
        />
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="ai-neural-border ai-thinking w-12 h-12 rounded-full mx-auto flex items-center justify-center">
                <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full animate-pulse" />
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Loading your projects...
              </p>
            </div>
          </div>
        )}
        
        {/* Projects Display */}
        {!isLoading && (
          <>
            {viewMode === 'list' ? (
              <ProjectTable
                projects={filteredProjects}
                loading={isLoading}
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
                onSort={handleSort}
                onProjectAction={handleProjectAction}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    viewMode="grid"
                    showHealthIndicators={true}
                    showAIInsights={true}
                    onOpen={handleProjectOpen}
                    onEdit={handleProjectEdit}
                    onDuplicate={handleProjectDuplicate}
                    onArchive={handleProjectArchive}
                    onDelete={handleProjectDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="ai-neural-border rounded-lg p-12 bg-white dark:bg-black">
              <div className="w-16 h-16 mx-auto mb-4 ai-confidence-border high-confidence rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl text-white">✍️</span>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                {filters.search || filters.genre || filters.status !== 'all' 
                  ? 'No projects match your filters'
                  : 'No projects yet'
                }
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                {filters.search || filters.genre || filters.status !== 'all'
                  ? 'Try adjusting your filters to see more projects'
                  : 'Create your first project to start your writing journey with SpectreWeave'
                }
              </p>
              {(!filters.search && !filters.genre && filters.status === 'all') && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="ai-confidence-border high-confidence px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Your First Project
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Create Project Modal */}
      <ProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        mode="create"
        isLoading={isCreating}
        error={createError?.message || null}
      />
      
      {/* Edit Project Modal */}
      <ProjectModal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onSubmit={handleUpdateProject}
        project={editingProject}
        mode="edit"
        isLoading={isUpdating}
        error={updateError?.message || null}
      />
    </DashboardLayout>
  )
}

export default ProjectsDashboard