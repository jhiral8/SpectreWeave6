// Children's Books Type Definitions for SpectreWeave5 Integration
// Integrates with existing project system while supporting specialized book features

// Base project type extensions
export type ProjectType = 'manuscript' | 'childrens-book' | 'poetry' | 'screenplay'

export type AgeGroup = '0-2' | '3-5' | '6-8' | '9-12' | 'teen'

export type BookTheme = 
  | 'magical-forest'
  | 'underwater-adventure'
  | 'space-exploration'
  | 'fairy-tale-castle'
  | 'animal-kingdom'
  | 'modern-city'
  | 'pirate-adventure'
  | 'superhero'
  | 'prehistoric'
  | 'winter-wonderland'

export type IllustrationStyle = 
  | 'watercolor'
  | 'digital-art'
  | 'cartoon'
  | 'realistic'
  | 'sketch'
  | 'anime'
  | 'vintage'
  | 'minimalist'
  | 'pop-art'
  | 'storybook'

export type FamousAuthorStyle = 
  | 'dr-seuss'
  | 'roald-dahl'
  | 'maurice-sendak'
  | 'shel-silverstein'
  | 'eric-carle'
  | 'margaret-wise-brown'
  | 'beatrix-potter'
  | 'a-a-milne'
  | 'rick-riordan'
  | 'judy-blume'

export type VideoStyle = 
  | 'cinematic'
  | 'animated'
  | 'whimsical'
  | 'realistic'
  | 'dreamy'
  | 'adventurous'
  | 'educational'
  | 'magical'
  | 'gentle'
  | 'energetic'

export type GenerationType = 'story' | 'images' | 'videos' | 'audio' | 'export'
export type GenerationStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'

// Extended Project interface for children's books
export interface ChildrensBookProject {
  id: string
  title: string
  description?: string
  project_type: 'childrens-book'
  user_id: string
  status: string
  
  // Children's book specific fields
  target_age: AgeGroup
  book_theme: BookTheme
  illustration_style: IllustrationStyle
  author_style: FamousAuthorStyle
  total_pages: number
  book_metadata: ChildrensBookMetadata
  
  // Standard project fields
  created_at: string
  updated_at: string
  content?: any
  manuscript_content?: any
  framework_content?: any
}

export interface ChildrensBookMetadata {
  reading_time?: string
  difficulty?: 'Easy' | 'Medium' | 'Advanced'
  moral_lesson?: string
  main_character?: string
  setting?: string
  conflict?: string
  resolution?: string
  include_video?: boolean
  include_audio?: boolean
  video_style?: VideoStyle
  video_duration?: '8s' | '15s' | '25s'
  custom_instructions?: string
}

// Book Page interface
export interface BookPage {
  id: string
  book_id?: string // For legacy SpectreWeave3 books
  project_id?: string // For new SpectreWeave5 projects
  page_number: number
  text: string
  illustration_prompt?: string
  illustration_url?: string  // Changed from image_url to match DB schema
  video_url?: string
  audio_url?: string
  page_metadata: BookPageMetadata
  created_at: string
  updated_at?: string
}

export interface BookPageMetadata {
  word_count?: number
  reading_level?: string
  characters_mentioned?: string[]
  scene_description?: string
  emotional_tone?: string
  illustration_generated?: boolean
  video_generated?: boolean
  audio_generated?: boolean
}

// Generation tracking
export interface BookGeneration {
  id: string
  book_id?: string // For legacy books
  project_id?: string // For new projects
  generation_type: GenerationType
  status: GenerationStatus
  progress: number // 0-100
  total_items: number
  completed_items: number
  result_data: Record<string, any>
  error_message?: string
  metadata: GenerationMetadata
  created_at: string
  updated_at: string
}

export interface GenerationMetadata {
  batch_size?: number
  model_used?: string
  prompt_version?: string
  generation_time?: number
  cost_estimate?: number
  quality_score?: number
}

// Story prompt for AI generation
export interface StoryPrompt {
  main_character: string
  setting: string
  conflict: string
  resolution?: string
  moral_lesson?: string
  target_age: AgeGroup
  author_style: FamousAuthorStyle
  theme: BookTheme
  total_pages: number
  custom_instructions?: string
}

// Book template for reusable story structures
export interface BookTemplate {
  id: string
  title: string
  description: string
  template_type: 'character' | 'plot' | 'theme' | 'complete'
  author_style?: FamousAuthorStyle
  target_age?: AgeGroup
  book_theme?: BookTheme
  template_content: TemplateContent
  is_public: boolean
  created_by?: string
  usage_count: number
  created_at: string
  updated_at: string
}

export interface TemplateContent {
  main_character?: string
  setting?: string
  conflict?: string
  resolution?: string
  moral_lesson?: string
  characters?: Character[]
  plot_points?: PlotPoint[]
  themes?: string[]
  vocabulary_level?: string
}

export interface Character {
  name: string
  description: string
  personality: string
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'narrator'
  appearance?: string
  special_abilities?: string[]
}

export interface PlotPoint {
  chapter: number
  event: string
  characters_involved: string[]
  setting: string
  conflict_level: 'low' | 'medium' | 'high'
}

// Video generation specific types
export interface VideoAsset {
  url: string
  duration: number
  style: VideoStyle
  prompt: string
  metadata: VideoMetadata
}

export interface VideoMetadata {
  resolution?: string
  format?: string
  file_size?: number
  generation_model?: string
  prompt_used?: string
  style_applied?: VideoStyle
}

// Audio generation types
export interface AudioAsset {
  url: string
  duration: number
  voice_style: string
  metadata: AudioMetadata
}

export interface AudioMetadata {
  voice_model?: string
  speed?: number
  pitch?: number
  emotion?: string
  background_music?: boolean
}

// Book creation wizard steps
export interface BookCreationStep {
  id: string
  title: string
  description: string
  component: string
  validation?: ValidationRule[]
  is_complete: boolean
}

export interface ValidationRule {
  field: string
  rule: 'required' | 'min_length' | 'max_length' | 'pattern'
  value?: any
  message: string
}

// Book export types
export interface BookExport {
  format: 'html' | 'pdf' | 'epub' | 'json'
  options: ExportOptions
  status: 'pending' | 'generating' | 'completed' | 'failed'
  download_url?: string
  error_message?: string
}

export interface ExportOptions {
  include_videos: boolean
  include_audio: boolean
  responsive_design: boolean
  offline_capable: boolean
  print_optimized: boolean
  theme_colors?: string[]
  custom_css?: string
}

// API request/response types
export interface GenerateStoryRequest {
  prompt: StoryPrompt
  project_id: string
}

export interface GenerateStoryResponse {
  success: boolean
  story: {
    title: string
    pages: Array<{
      page_number: number
      text: string
      illustration_prompt: string
    }>
  }
  metadata: {
    word_count: number
    reading_time: string
    difficulty: string
  }
  error?: string
}

export interface GenerateImagesRequest {
  project_id: string
  pages: Array<{
    page_number: number
    illustration_prompt: string
  }>
  style: IllustrationStyle
  theme: BookTheme
  target_age: AgeGroup
}

export interface GenerateImagesResponse {
  success: boolean
  images: Array<{
    page_number: number
    image_url: string
    prompt_used: string
  }>
  error?: string
}

// Utility types for form handling
export interface BookCreationForm {
  // Step 1: Story Setup
  main_character: string
  setting: string
  conflict: string
  moral_lesson: string
  
  // Step 2: Author Style
  author_style: FamousAuthorStyle
  
  // Step 3: Visual Settings
  book_theme: BookTheme
  illustration_style: IllustrationStyle
  
  // Step 4: Video Options
  include_video: boolean
  video_style?: VideoStyle
  video_duration?: '8s' | '15s' | '25s'
  
  // Step 5: Book Settings
  target_age: AgeGroup
  total_pages: number
  include_audio: boolean
  
  // Step 6: Additional Options
  custom_instructions?: string
}

// Dashboard specific types
export interface BookStats {
  total_books: number
  total_pages: number
  total_illustrations: number
  reading_time_minutes: number
  favorite_theme: BookTheme
  favorite_author_style: FamousAuthorStyle
}

export interface BookDashboardWidget {
  type: 'stats' | 'recent_books' | 'generation_progress' | 'gallery'
  title: string
  data: any
  is_loading: boolean
}

// Search and filtering
export interface BookFilter {
  age_group?: AgeGroup[]
  themes?: BookTheme[]
  author_styles?: FamousAuthorStyle[]
  has_video?: boolean
  has_audio?: boolean
  page_count_min?: number
  page_count_max?: number
  created_after?: string
  created_before?: string
}

export interface BookSearchResult {
  id: string
  title: string
  target_age: AgeGroup
  book_theme: BookTheme
  author_style: FamousAuthorStyle
  total_pages: number
  cover_image_url?: string
  reading_time: string
  created_at: string
  highlight?: string
}