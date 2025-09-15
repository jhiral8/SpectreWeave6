'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Project, ProjectFilters, CreateProjectData } from '@/types/projects'
import { User } from '@supabase/supabase-js'

// Query keys for caching
const QUERY_KEYS = {
  projects: (userId?: string, filters?: ProjectFilters) => ['projects', userId, filters],
  project: (id: string) => ['project', id],
  projectStats: (userId?: string) => ['project-stats', userId],
} as const

// API functions
const projectsApi = {
  async getProjects(userId: string, filters: ProjectFilters = {}): Promise<Project[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', filters.status === 'archived')
      .order(filters.sortBy || 'updated_at', { ascending: filters.sortOrder === 'asc' })
    
    // Apply filters
    if (filters.status && filters.status !== 'all' && filters.status !== 'archived') {
      query = query.eq('status', filters.status)
    }
    
    if (filters.genre) {
      query = query.eq('genre', filters.genre)
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`)
    }
    
    return data || []
  },
  
  async getProject(id: string): Promise<Project> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      throw new Error(`Failed to fetch project: ${error.message}`)
    }
    
    return data
  },
  
  async createProject(userId: string, projectData: CreateProjectData): Promise<Project> {
    const supabase = createClient()
    
    // Get the next order number by finding the highest existing order
    let nextOrder = 1
    try {
      const { data: lastProject } = await supabase
        .from('projects')
        .select('order')
        .eq('user_id', userId)
        .order('order', { ascending: false })
        .limit(1)
        .maybeSingle()
      nextOrder = (lastProject?.order ?? 0) + 1
    } catch {
      // Ignore empty or transient errors; default to 1
      nextOrder = 1
    }

    const newProject = {
      ...projectData,
      user_id: userId,
      word_count: 0,
      status: 'draft' as const,
      order: nextOrder,
      archived: false,
      // Remove manual timestamp fields - let database handle defaults
    }
    
    const { data, error } = await supabase
      .from('projects')
      .insert(newProject)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create project: ${error.message}`)
    }
    
    return data
  },
  
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('projects')
      .update(updates) // Let database trigger handle updated_at
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update project: ${error.message}`)
    }
    
    return data
  },
  
  async duplicateProject(project: Project): Promise<Project> {
    const supabase = createClient()
    
    const duplicatedProject = {
      ...project,
      id: undefined, // Let Supabase generate new ID
      title: `${project.title} (Copy)`,
      // Remove timestamps - let database handle defaults
      created_at: undefined,
      updated_at: undefined,
    }
    
    delete (duplicatedProject as any).id
    
    const { data, error } = await supabase
      .from('projects')
      .insert(duplicatedProject)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to duplicate project: ${error.message}`)
    }
    
    return data
  },
  
  async archiveProject(id: string, archived: boolean = true): Promise<Project> {
    return projectsApi.updateProject(id, { archived })
  },
  
  async deleteProject(id: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`)
    }
  },
  
  async getProjectStats(userId: string) {
    const supabase = createClient()
    
    const { data: projects, error } = await supabase
      .from('projects')
      .select('status, word_count, created_at, updated_at')
      .eq('user_id', userId)
      .eq('archived', false)
    
    if (error) {
      throw new Error(`Failed to fetch project stats: ${error.message}`)
    }
    
    const stats = {
      total: projects.length,
      draft: projects.filter(p => p.status === 'draft').length,
      in_progress: projects.filter(p => p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      totalWords: projects.reduce((sum, p) => sum + (p.word_count ?? 0), 0),
      averageWords: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.word_count ?? 0), 0) / projects.length) : 0,
      recentActivity: projects.filter(p => {
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysSinceUpdate <= 7
      }).length
    }
    
    return stats
  }
}

// Main hook for projects management
function useProjects(user?: User | null, filters: ProjectFilters = {}) {
  const queryClient = useQueryClient()
  
  // Fetch projects
  const {
    data: projects = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.projects(user?.id, filters),
    queryFn: () => user ? projectsApi.getProjects(user.id, filters) : Promise.resolve([]),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
  })
  
  // Fetch project stats
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: QUERY_KEYS.projectStats(user?.id),
    queryFn: () => user ? projectsApi.getProjectStats(user.id) : Promise.resolve(null),
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (projectData: CreateProjectData) => {
      if (!user) throw new Error('User not authenticated')
      return projectsApi.createProject(user.id, projectData)
    },
    onSuccess: () => {
      // Invalidate all project queries for this user
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectStats(user?.id) })
    },
  })
  
  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Project> }) => {
      return projectsApi.updateProject(id, updates)
    },
    onSuccess: (updatedProject) => {
      // Update cached projects list
      queryClient.setQueryData(
        QUERY_KEYS.projects(user?.id, filters),
        (old: Project[] | undefined) => {
          if (!old) return [updatedProject]
          return old.map(p => p.id === updatedProject.id ? updatedProject : p)
        }
      )
      // Update individual project cache
      queryClient.setQueryData(QUERY_KEYS.project(updatedProject.id), updatedProject)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectStats(user?.id) })
    },
  })
  
  // Duplicate project mutation
  const duplicateProjectMutation = useMutation({
    mutationFn: (project: Project) => projectsApi.duplicateProject(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects(user?.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectStats(user?.id) })
    },
  })
  
  // Archive project mutation
  const archiveProjectMutation = useMutation({
    mutationFn: ({ id, archived }: { id: string, archived: boolean }) => {
      return projectsApi.archiveProject(id, archived)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects(user?.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectStats(user?.id) })
    },
  })
  
  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    // Optimistic update: remove project immediately from the current filtered list
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.projects(user?.id, filters) })
      const previous = queryClient.getQueryData<Project[]>(QUERY_KEYS.projects(user?.id, filters))
      if (previous) {
        queryClient.setQueryData<Project[]>(
          QUERY_KEYS.projects(user?.id, filters),
          previous.filter((p) => p.id === id ? false : true)
        )
      }
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.projects(user?.id, filters), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects(user?.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectStats(user?.id) })
    },
  })
  
  // Action handlers
  const createProject = useCallback((projectData: CreateProjectData) => {
    return createProjectMutation.mutateAsync(projectData)
  }, [createProjectMutation])
  
  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    return updateProjectMutation.mutateAsync({ id, updates })
  }, [updateProjectMutation])
  
  const duplicateProject = useCallback((project: Project) => {
    return duplicateProjectMutation.mutateAsync(project)
  }, [duplicateProjectMutation])
  
  const archiveProject = useCallback((id: string, archived: boolean = true) => {
    return archiveProjectMutation.mutateAsync({ id, archived })
  }, [archiveProjectMutation])
  
  const deleteProject = useCallback((id: string) => {
    return deleteProjectMutation.mutateAsync(id)
  }, [deleteProjectMutation])
  
  const refreshProjects = useCallback(() => {
    refetch()
  }, [refetch])
  
  return {
    // Data
    projects,
    stats,
    
    // Loading states
    isLoading,
    statsLoading,
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending,
    isDuplicating: duplicateProjectMutation.isPending,
    isArchiving: archiveProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
    
    // Error states
    error,
    createError: createProjectMutation.error,
    updateError: updateProjectMutation.error,
    duplicateError: duplicateProjectMutation.error,
    archiveError: archiveProjectMutation.error,
    deleteError: deleteProjectMutation.error,
    
    // Actions
    createProject,
    updateProject,
    duplicateProject,
    archiveProject,
    deleteProject,
    refreshProjects,
  }
}

// Hook for a single project
export function useProject(id: string | null) {
  const queryClient = useQueryClient()
  
  const {
    data: project,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.project(id || ''),
    queryFn: () => id ? projectsApi.getProject(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
  
  const updateProjectMutation = useMutation({
    mutationFn: (updates: Partial<Project>) => {
      if (!id) throw new Error('No project ID provided')
      return projectsApi.updateProject(id, updates)
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(QUERY_KEYS.project(id || ''), updatedProject)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
  
  const updateProject = useCallback((updates: Partial<Project>) => {
    return updateProjectMutation.mutateAsync(updates)
  }, [updateProjectMutation])
  
  return {
    project,
    isLoading,
    error,
    isUpdating: updateProjectMutation.isPending,
    updateError: updateProjectMutation.error,
    updateProject,
    refreshProject: refetch,
  }
}

// Hook for project filters
export function useProjectFilters(initialFilters: ProjectFilters = {}) {
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters)
  
  const updateFilter = useCallback(<K extends keyof ProjectFilters>(
    key: K,
    value: ProjectFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])
  
  const updateFilters = useCallback((newFilters: Partial<ProjectFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])
  
  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])
  
  const clearSearch = useCallback(() => {
    setFilters(prev => ({ ...prev, search: undefined }))
  }, [])
  
  const toggleSort = useCallback((field: keyof Project) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }))
  }, [])
  
  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    clearSearch,
    toggleSort,
  }
}

export default useProjects