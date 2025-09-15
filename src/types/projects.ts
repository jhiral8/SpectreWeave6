// Import Project type from database types for consistency
import type { Project } from '@/types/database'

export type { Project }

export interface ProjectFilters {
  search?: string
  genre?: string
  status?: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived' | 'all'
  sortBy?: 'updated_at' | 'created_at' | 'title' | 'word_count'
  sortOrder?: 'asc' | 'desc'
}

export interface CreateProjectData {
  title: string
  description?: string
  genre?: string
  brief?: string
}

export interface ProjectCardProps {
  project: Project
  viewMode: 'grid' | 'list'
  onEdit: (project: Project) => void
  onDuplicate: (project: Project) => void
  onArchive: (project: Project) => void
  onDelete: (project: Project) => void
  onOpen: (project: Project) => void
}

export interface ProjectLibraryProps {
  userId: string
}

export const PROJECT_GENRES = [
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Fantasy',
  'Thriller',
  'Biography',
  'History',
  'Poetry',
  'Drama',
  'Horror',
  'Adventure',
  'Other'
] as const

export const PROJECT_STATUSES = [
  { value: 'all', label: 'All Projects' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Under Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
] as const

export const SORT_OPTIONS = [
  { value: 'updated_at', label: 'Last Modified' },
  { value: 'created_at', label: 'Date Created' },
  { value: 'title', label: 'Title' },
  { value: 'word_count', label: 'Word Count' }
] as const