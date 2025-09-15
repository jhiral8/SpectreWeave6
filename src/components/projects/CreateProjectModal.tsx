'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectItem } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { CreateProjectData, PROJECT_GENRES } from '@/types/projects'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateProjectData) => Promise<void>
  isLoading?: boolean
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreateProjectData>({
    title: '',
    description: '',
    genre: '',
    brief: ''
  })
  
  const [errors, setErrors] = useState<Partial<CreateProjectData>>({})

  const handleInputChange = (field: keyof CreateProjectData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateProjectData> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters'
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    if (formData.brief && formData.brief.length > 1000) {
      newErrors.brief = 'Brief must be less than 1000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await onSubmit({
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        genre: formData.genre || undefined,
        brief: formData.brief?.trim() || undefined
      })
      
      // Reset form on success
      setFormData({
        title: '',
        description: '',
        genre: '',
        brief: ''
      })
      setErrors({})
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        title: '',
        description: '',
        genre: '',
        brief: ''
      })
      setErrors({})
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      size="lg"
      showCloseButton={!isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div>
          <label htmlFor="project-title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Project Title *
          </label>
          <Input
            id="project-title"
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter your project title..."
            className={cn(errors.title && 'border-red-500 focus:outline-red-500')}
            disabled={isLoading}
            autoFocus
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Genre Field */}
        <div>
          <label htmlFor="project-genre" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Genre
          </label>
          <Select
            id="project-genre"
            value={formData.genre}
            onChange={(e) => handleInputChange('genre', e.target.value)}
            disabled={isLoading}
          >
            <SelectItem value="">Select a genre...</SelectItem>
            {PROJECT_GENRES.map(genre => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="project-description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Description
            <span className="text-xs text-neutral-500 ml-2">
              ({formData.description?.length || 0}/500)
            </span>
          </label>
          <Textarea
            id="project-description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Brief description of your project..."
            rows={3}
            className={cn(errors.description && 'border-red-500 focus:outline-red-500')}
            disabled={isLoading}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Brief Field */}
        <div>
          <label htmlFor="project-brief" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Project Brief
            <span className="text-xs text-neutral-500 ml-2">
              ({formData.brief?.length || 0}/1000)
            </span>
          </label>
          <Textarea
            id="project-brief"
            value={formData.brief}
            onChange={(e) => handleInputChange('brief', e.target.value)}
            placeholder="Detailed project brief, outline, or notes..."
            rows={4}
            className={cn(errors.brief && 'border-red-500 focus:outline-red-500')}
            disabled={isLoading}
          />
          {errors.brief && (
            <p className="text-red-500 text-sm mt-1">{errors.brief}</p>
          )}
        </div>

        {/* Template Selection */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            Start with template (optional)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TemplateOption
              title="Blank Document"
              description="Start with an empty document"
              selected={true}
              disabled={isLoading}
            />
            <TemplateOption
              title="Novel Template"
              description="Chapter-based structure"
              disabled={isLoading}
            />
            <TemplateOption
              title="Short Story"
              description="Single narrative structure"
              disabled={isLoading}
            />
            <TemplateOption
              title="Screenplay"
              description="Script format template"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
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
            variant="primary"
            disabled={isLoading || !formData.title.trim()}
          >
            {isLoading ? (
              <>
                <SpinnerIcon className="w-4 h-4 mr-2" />
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface TemplateOptionProps {
  title: string
  description: string
  selected?: boolean
  disabled?: boolean
}

const TemplateOption: React.FC<TemplateOptionProps> = ({
  title,
  description,
  selected = false,
  disabled = false
}) => (
  <div
    className={cn(
      'p-3 border rounded-lg cursor-pointer transition-all duration-200',
      selected 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    <div className="flex items-start gap-3">
      <div
        className={cn(
          'w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0',
          selected 
            ? 'border-blue-500 bg-blue-500'
            : 'border-neutral-300 dark:border-neutral-600'
        )}
      >
        {selected && (
          <div className="w-full h-full rounded-full bg-white scale-50"></div>
        )}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
          {title}
        </h4>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
          {description}
        </p>
      </div>
    </div>
  </div>
)

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={cn("animate-spin", className)} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
)