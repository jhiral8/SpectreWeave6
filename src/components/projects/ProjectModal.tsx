'use client'

import React from 'react'
import { X, FileText, Sparkles, AlertCircle } from 'lucide-react'
import { Project, CreateProjectData, PROJECT_GENRES } from '@/types/projects'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateProjectData | Partial<Project>) => Promise<void>
  project?: Project | null // For editing existing projects
  mode?: 'create' | 'edit'
  isLoading?: boolean
  error?: string | null
}

interface FormData {
  title: string
  description: string
  genre: string
  brief: string
}

interface FormErrors {
  title?: string
  description?: string
  genre?: string
  brief?: string
}

const validateForm = (data: FormData): FormErrors => {
  const errors: FormErrors = {}
  
  if (!data.title.trim()) {
    errors.title = 'Project title is required'
  } else if (data.title.length < 3) {
    errors.title = 'Title must be at least 3 characters long'
  } else if (data.title.length > 100) {
    errors.title = 'Title must be less than 100 characters'
  }
  
  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be less than 500 characters'
  }
  
  if (data.brief && data.brief.length > 1000) {
    errors.brief = 'Brief must be less than 1000 characters'
  }
  
  return errors
}

const GENRE_OPTIONS = [
  { value: '', label: 'Select a genre...' },
  ...PROJECT_GENRES.map(genre => ({ value: genre, label: genre }))
]

const AI_SUGGESTIONS = {
  title: [
    "The Last Chronicles",
    "Digital Dreams",
    "Shadows of Tomorrow",
    "The Memory Keeper",
    "Echoes in Time"
  ],
  description: [
    "A compelling story that explores the depths of human nature and the power of choice.",
    "An epic journey through uncharted territories of imagination and wonder.",
    "A thought-provoking narrative that challenges conventional wisdom and beliefs.",
    "A tale of resilience, hope, and the unbreakable bonds of friendship.",
    "An exploration of love, loss, and redemption in extraordinary circumstances."
  ]
}

export function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  project,
  mode = project ? 'edit' : 'create',
  isLoading = false,
  error
}: ProjectModalProps) {
  const [formData, setFormData] = React.useState<FormData>({
    title: project?.title || '',
    description: project?.description || '',
    genre: project?.genre || '',
    brief: project?.brief || ''
  })
  
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [showAISuggestions, setShowAISuggestions] = React.useState<keyof FormData | null>(null)
  const [hasChanges, setHasChanges] = React.useState(false)
  
  // Reset form when modal opens/closes or project changes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        title: project?.title || '',
        description: project?.description || '',
        genre: project?.genre || '',
        brief: project?.brief || ''
      })
      setErrors({})
      setHasChanges(false)
    }
  }, [isOpen, project])
  
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }
  
  const applySuggestion = (field: keyof FormData, suggestion: string) => {
    setFormData(prev => ({ ...prev, [field]: suggestion }))
    setShowAISuggestions(null)
    setHasChanges(true)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formErrors = validateForm(formData)
    setErrors(formErrors)
    
    if (Object.keys(formErrors).length > 0) {
      return
    }
    
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        genre: formData.genre || undefined,
        brief: formData.brief.trim() || undefined
      })
      onClose()
    } catch (error) {
      console.error('Failed to save project:', error)
    }
  }
  
  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }
  
  const AISuggestionButton = ({ field, label }: { field: keyof FormData; label: string }) => (
    <Button
      type="button"
      variant="ghost"
      buttonSize="small"
      onClick={() => setShowAISuggestions(showAISuggestions === field ? null : field)}
      className="ai-neural-border ai-thinking text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
    >
      <Sparkles className="w-3 h-3 mr-1" />
      AI {label}
    </Button>
  )
  
  const AISuggestions = ({ field, suggestions }: { field: keyof FormData; suggestions: string[] }) => {
    if (showAISuggestions !== field) return null
    
    return (
      <div className="ai-confidence-border high-confidence mt-2 p-3 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <div className="text-xs font-medium text-indigo-900 dark:text-indigo-300 mb-2 flex items-center">
          <Sparkles className="w-3 h-3 mr-1" />
          AI Suggestions
        </div>
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => applySuggestion(field, suggestion)}
              className="block w-full text-left text-xs p-2 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    )
  }
  
  const modalTitle = mode === 'create' ? 'Create New Project' : 'Edit Project'
  const submitLabel = mode === 'create' ? 'Create Project' : 'Save Changes'
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="ai-neural-border rounded-lg bg-white dark:bg-black">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="ai-confidence-border high-confidence w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {modalTitle}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {mode === 'create' 
                  ? 'Start your next writing adventure'
                  : 'Update your project details'
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            buttonSize="icon"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error display */}
          {error && (
            <div className="ai-neural-border ai-error rounded-lg p-4 bg-red-50 dark:bg-red-950/30">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}
          
          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="title" className="block text-sm font-medium text-neutral-900 dark:text-white">
                Project Title *
              </label>
              <AISuggestionButton field="title" label="Title" />
            </div>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter your project title..."
              error={errors.title}
              className={cn(
                formData.title && 'ai-manuscript-border',
                errors.title && 'border-red-500 dark:border-red-400'
              )}
              maxLength={100}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            <AISuggestions field="title" suggestions={AI_SUGGESTIONS.title} />
            {errors.title && (
              <p id="title-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.title}
              </p>
            )}
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="description" className="block text-sm font-medium text-neutral-900 dark:text-white">
                Description
              </label>
              <AISuggestionButton field="description" label="Description" />
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of your project..."
              rows={3}
              maxLength={500}
              error={errors.description}
              className={cn(
                formData.description && 'ai-framework-border',
                errors.description && 'border-red-500 dark:border-red-400'
              )}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            <AISuggestions field="description" suggestions={AI_SUGGESTIONS.description} />
            {errors.description && (
              <p id="description-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.description}
              </p>
            )}
            <div className="text-xs text-neutral-500 dark:text-neutral-400 text-right">
              {formData.description.length}/500
            </div>
          </div>
          
          {/* Genre / Type */}
          <div className="space-y-2">
            <label htmlFor="genre" className="block text-sm font-medium text-neutral-900 dark:text-white">
              Project Type / Genre
            </label>
            <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
              <SelectTrigger className={cn(
                'w-full',
                formData.genre && 'ai-confidence-border medium-confidence'
              )}>
                <SelectValue placeholder="Select a genre..." />
              </SelectTrigger>
              <SelectContent>
                {GENRE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
                <SelectItem value="research_notes">Research notes</SelectItem>
              </SelectContent>
            </Select>
            {errors.genre && (
              <p id="genre-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.genre}
              </p>
            )}
          </div>
          
          {/* Brief */}
          <div className="space-y-2">
            <label htmlFor="brief" className="block text-sm font-medium text-neutral-900 dark:text-white">
              Project Brief
            </label>
            <Textarea
              id="brief"
              value={formData.brief}
              onChange={(e) => handleInputChange('brief', e.target.value)}
              placeholder="Detailed project brief, outline, or notes..."
              rows={6}
              maxLength={1000}
              error={errors.brief}
              className={cn(
                formData.brief && 'ai-quality-border medium-quality',
                errors.brief && 'border-red-500 dark:border-red-400'
              )}
              aria-describedby={errors.brief ? 'brief-error' : undefined}
            />
            {errors.brief && (
              <p id="brief-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.brief}
              </p>
            )}
            <div className="text-xs text-neutral-500 dark:text-neutral-400 text-right">
              {formData.brief.length}/1000
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title.trim()}
              className="ai-confidence-border high-confidence"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default ProjectModal