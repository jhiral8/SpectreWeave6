// Main Components
export { ProjectLibrary } from './ProjectLibrary'
export { ProjectCard } from './ProjectCard'
export { CreateProjectModal } from './CreateProjectModal'

// Search and Filter Components
export { SearchBar } from './SearchBar'
export { FilterControls } from './FilterControls'

// Supporting Components
export { 
  EmptyState, 
  ProjectsEmptyState, 
  SearchEmptyState, 
  FilterEmptyState 
} from './EmptyState'
export { ProjectSkeleton, SearchSkeleton } from './ProjectSkeleton'

// Types
export type {
  Project,
  ProjectFilters,
  CreateProjectData,
  ProjectCardProps,
  ProjectLibraryProps
} from '@/types/projects'