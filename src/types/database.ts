// Database model interfaces for SpectreWeave5 project management system
import { User } from '@supabase/supabase-js'

// Core database models based on existing schema analysis

export interface Project {
  id: string
  title: string
  description?: string
  genre?: string
  brief?: string
  content?: string // Current document content
  word_count?: number // Made optional with database default of 0
  status: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived'
  order?: number // Optional with database default of 0
  archived?: boolean // Made optional with database default of false
  created_at: string
  updated_at: string
  user_id: string
  // Derived fields for API responses (runtime-only)
  chapter_count?: number
  character_count?: number
  last_edited?: string
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  subscription_tier?: 'free' | 'pro' | 'enterprise'
  preferences?: Record<string, any>
  created_at: string
  updated_at: string
  user_id: string
}

export interface DocumentVersion {
  id: string
  project_id: string
  version_number: number
  content: string
  summary?: string
  word_count?: number // Made optional with database default of 0
  created_at: string
  created_by: string
  is_milestone?: boolean // Made optional with database default of false
  tags?: string[]
}

export interface Chapter {
  id: string
  project_id: string
  title: string
  description?: string
  content?: string
  order?: number // Made optional with database default of 0
  word_count?: number // Made optional with database default of 0
  status: 'draft' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}

export interface Character {
  id: string
  project_id: string
  name: string
  description?: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  appearance?: string
  personality?: string
  backstory?: string
  relationships?: Record<string, any>
  notes?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface ResearchItem {
  id: string
  project_id: string
  title: string
  content: string
  category: 'worldbuilding' | 'character' | 'plot' | 'general'
  tags?: string[]
  source_url?: string
  attachments?: string[]
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  project_id: string
  title?: string
  content: string
  category: 'idea' | 'revision' | 'reminder' | 'general'
  chapter_id?: string
  character_id?: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer' | 'commenter'
  permissions: string[]
  invited_at: string
  joined_at?: string
  status: 'pending' | 'active' | 'inactive'
}

export interface Collaboration {
  id: string
  project_id: string
  room_id: string
  settings: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  name: string
  description?: string
  project_id?: string
  created_by: string
  settings: Record<string, any>
  is_public: boolean
  max_participants?: number
  created_at: string
  updated_at: string
}

// API request/response types

export interface CreateProjectRequest {
  title: string
  description?: string
  genre?: string
  brief?: string
  template?: string
}

export interface UpdateProjectRequest {
  title?: string
  description?: string
  genre?: string
  brief?: string
  status?: Project['status']
  archived?: boolean
}

export interface ProjectContentRequest {
  content: string
  create_version?: boolean
  version_summary?: string
  is_milestone?: boolean
}

export interface CreateChapterRequest {
  title: string
  description?: string
  order?: number
  content?: string
}

export interface UpdateChapterRequest {
  title?: string
  description?: string
  order?: number
  content?: string
  status?: Chapter['status']
}

export interface CreateCharacterRequest {
  name: string
  description?: string
  role: Character['role']
  appearance?: string
  personality?: string
  backstory?: string
  relationships?: Record<string, any>
  notes?: string
}

export interface UpdateCharacterRequest {
  name?: string
  description?: string
  role?: Character['role']
  appearance?: string
  personality?: string
  backstory?: string
  relationships?: Record<string, any>
  notes?: string
}

// API response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    has_more?: boolean
  }
}

export interface ProjectsResponse {
  projects: Project[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface ProjectDetailResponse extends Project {
  chapters: Chapter[]
  characters: Character[]
  recent_versions: DocumentVersion[]
  members?: ProjectMember[]
}

export interface VersionHistoryResponse {
  versions: DocumentVersion[]
  total: number
  page: number
  limit: number
}

// Query parameters for API endpoints
export interface ProjectsQueryParams {
  page?: number
  limit?: number
  status?: Project['status'] | Project['status'][]
  genre?: string
  search?: string
  sort_by?: 'title' | 'updated_at' | 'created_at' | 'word_count'
  sort_order?: 'asc' | 'desc'
  archived?: boolean
}

export interface VersionsQueryParams {
  page?: number
  limit?: number
  milestone_only?: boolean
  from_date?: string
  to_date?: string
}

// Database query utilities types
export interface QueryFilter {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'not_in'
  value: any
}

export interface QueryOptions {
  filters?: QueryFilter[]
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }[]
  pagination?: {
    page: number
    limit: number
  }
  include?: string[]
}

// Error types
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  field?: string
}

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR'
  field: string
  details: {
    expected: string
    received: any
  }
}

export interface AuthenticationError extends ApiError {
  code: 'AUTHENTICATION_ERROR'
  message: 'Authentication required' | 'Invalid credentials' | 'Token expired'
}

export interface AuthorizationError extends ApiError {
  code: 'AUTHORIZATION_ERROR'
  message: 'Insufficient permissions'
  details: {
    required_permission: string
    user_permissions: string[]
  }
}

export interface NotFoundError extends ApiError {
  code: 'NOT_FOUND'
  message: 'Resource not found'
  details: {
    resource: string
    id: string
  }
}

// Middleware types
export interface AuthenticatedUser extends User {
  profile?: UserProfile
}

export interface AuthContext {
  user: AuthenticatedUser
  permissions: string[]
  isAuthenticated: boolean
}

export interface RequestContext {
  auth: AuthContext
  params: Record<string, string>
  query: Record<string, any>
  body?: any
}

// Database connection types
export interface DatabaseConfig {
  url: string
  key: string
  schema?: string
  pool_size?: number
  timeout?: number
}

export interface QueryResult<T = any> {
  data: T[]
  error: any
  count?: number
}

// Export utility types
export type ProjectStatus = Project['status']
export type CharacterRole = Character['role']
export type SubscriptionTier = UserProfile['subscription_tier']
export type MemberRole = ProjectMember['role']
export type MemberStatus = ProjectMember['status']

// Type guards
export const isProject = (obj: any): obj is Project => {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string'
}

export const isValidProjectStatus = (status: any): status is ProjectStatus => {
  return ['draft', 'in_progress', 'review', 'completed', 'archived'].includes(status)
}

export const isValidCharacterRole = (role: any): role is CharacterRole => {
  return ['protagonist', 'antagonist', 'supporting', 'minor'].includes(role)
}