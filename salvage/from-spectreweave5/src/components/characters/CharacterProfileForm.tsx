/**
 * Character Profile Form Component
 * 
 * Form for creating and editing character profiles with physical and personality traits
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Plus, Trash2, User, Palette, Brain, Settings } from 'lucide-react'
import type { CharacterProfile, PhysicalTraits, PersonalityTraits, ReferenceImage } from '@/lib/ai/characterLock'

interface CharacterProfileFormProps {
  character?: CharacterProfile | null
  onSubmit: (characterData: any) => void
  onCancel: () => void
}

export function CharacterProfileForm({ character, onSubmit, onCancel }: CharacterProfileFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    role: 'main' as 'main' | 'supporting' | 'background' | 'narrator',
    physicalTraits: {
      height: '',
      build: '',
      hairColor: '',
      hairStyle: '',
      eyeColor: '',
      skinTone: '',
      facialFeatures: [] as string[],
      distinctiveMarks: [] as string[],
      clothing: {
        primary_outfit: '',
        color_scheme: [] as string[],
        style: '',
        signature_items: [] as string[]
      },
      accessories: [] as string[]
    } as PhysicalTraits,
    personalityTraits: {
      primary: [] as string[],
      secondary: [] as string[],
      motivations: [] as string[],
      fears: [] as string[],
      quirks: [] as string[],
      speech_patterns: [] as string[]
    } as PersonalityTraits,
    referenceImages: [] as ReferenceImage[],
    styleTokens: [] as string[]
  })

  const [activeTab, setActiveTab] = useState<'basic' | 'physical' | 'personality' | 'references'>('basic')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name || '',
        description: character.description || '',
        role: character.role || 'main',
        physicalTraits: character.physicalTraits || {
          facialFeatures: [],
          distinctiveMarks: [],
          clothing: {
            primary_outfit: '',
            color_scheme: [],
            style: '',
            signature_items: []
          },
          accessories: []
        },
        personalityTraits: character.personalityTraits || {
          primary: [],
          secondary: [],
          motivations: [],
          fears: [],
          quirks: [],
          speech_patterns: []
        },
        referenceImages: character.referenceImages || [],
        styleTokens: character.styleTokens || []
      })
    }
  }, [character])

  const handleInputChange = (field: string, value: any, section?: string) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev] as any,
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleArrayInputChange = (field: string, index: number, value: string, section?: string) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev] as any,
          [field]: (prev[section as keyof typeof prev] as any)[field].map((item: string, i: number) => 
            i === index ? value : item
          )
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field as keyof typeof prev].map((item: string, i: number) => 
          i === index ? value : item
        )
      }))
    }
  }

  const handleAddArrayItem = (field: string, section?: string) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev] as any,
          [field]: [...(prev[section as keyof typeof prev] as any)[field], '']
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof typeof prev] as string[]), '']
      }))
    }
  }

  const handleRemoveArrayItem = (field: string, index: number, section?: string) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev] as any,
          [field]: (prev[section as keyof typeof prev] as any)[field].filter((_: any, i: number) => i !== index)
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
      }))
    }
  }

  const handleImageUpload = async (files: FileList) => {
    setIsUploading(true)
    try {
      // In a real implementation, you would upload files to your storage service
      // For now, we'll just create placeholder URLs
      const newImages: ReferenceImage[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const imageUrl = URL.createObjectURL(file) // Temporary URL for preview
        
        newImages.push({
          id: `ref_${Date.now()}_${i}`,
          url: imageUrl,
          type: 'front', // Default type
          description: file.name
        })
      }
      
      setFormData(prev => ({
        ...prev,
        referenceImages: [...prev.referenceImages, ...newImages]
      }))
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Failed to upload images')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Character name is required')
      return
    }
    
    onSubmit(formData)
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'physical', label: 'Physical', icon: Palette },
    { id: 'personality', label: 'Personality', icon: Brain },
    { id: 'references', label: 'References', icon: Settings }
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-bold">
          {character ? 'Edit Character' : 'Create Character'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-[--muted]/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[--border] mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-2 border-b-2 transition-colors
                ${activeTab === tab.id 
                  ? 'border-[--primary] text-[--primary]' 
                  : 'border-transparent text-[--muted-foreground] hover:text-[--foreground]'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Character Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter character name"
                className="w-full px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your character..."
                rows={3}
                className="w-full px-3 py-2 border border-[--border] rounded-md bg-[--background]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-[--border] rounded-md bg-[--background]"
              >
                <option value="main">Main Character</option>
                <option value="supporting">Supporting Character</option>
                <option value="background">Background Character</option>
                <option value="narrator">Narrator</option>
              </select>
            </div>
          </div>
        )}

        {/* Physical Traits Tab */}
        {activeTab === 'physical' && (
          <div className="space-y-6">
            {/* Basic Physical Traits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Height</label>
                <select
                  value={formData.physicalTraits.height || ''}
                  onChange={(e) => handleInputChange('height', e.target.value, 'physicalTraits')}
                  className="w-full px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                >
                  <option value="">Select height</option>
                  <option value="very-short">Very Short</option>
                  <option value="short">Short</option>
                  <option value="average">Average</option>
                  <option value="tall">Tall</option>
                  <option value="very-tall">Very Tall</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Build</label>
                <select
                  value={formData.physicalTraits.build || ''}
                  onChange={(e) => handleInputChange('build', e.target.value, 'physicalTraits')}
                  className="w-full px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                >
                  <option value="">Select build</option>
                  <option value="thin">Thin</option>
                  <option value="average">Average</option>
                  <option value="stocky">Stocky</option>
                  <option value="muscular">Muscular</option>
                  <option value="chubby">Chubby</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Hair Color</label>
                <input
                  type="text"
                  value={formData.physicalTraits.hairColor || ''}
                  onChange={(e) => handleInputChange('hairColor', e.target.value, 'physicalTraits')}
                  placeholder="e.g., Brown, Blonde, Black"
                  className="w-full px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Hair Style</label>
                <input
                  type="text"
                  value={formData.physicalTraits.hairStyle || ''}
                  onChange={(e) => handleInputChange('hairStyle', e.target.value, 'physicalTraits')}
                  placeholder="e.g., Curly, Straight, Braided"
                  className="w-full px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Eye Color</label>
                <input
                  type="text"
                  value={formData.physicalTraits.eyeColor || ''}
                  onChange={(e) => handleInputChange('eyeColor', e.target.value, 'physicalTraits')}
                  placeholder="e.g., Blue, Brown, Green"
                  className="w-full px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Skin Tone</label>
                <input
                  type="text"
                  value={formData.physicalTraits.skinTone || ''}
                  onChange={(e) => handleInputChange('skinTone', e.target.value, 'physicalTraits')}
                  placeholder="e.g., Fair, Medium, Dark"
                  className="w-full px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                />
              </div>
            </div>

            {/* Clothing */}
            <div className="border-t border-[--border] pt-6">
              <h3 className="text-lg font-semibold mb-4">Clothing & Style</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Primary Outfit</label>
                  <input
                    type="text"
                    value={formData.physicalTraits.clothing?.primary_outfit || ''}
                    onChange={(e) => handleInputChange('clothing', { 
                      ...formData.physicalTraits.clothing, 
                      primary_outfit: e.target.value 
                    }, 'physicalTraits')}
                    placeholder="e.g., Red dress, Blue overalls"
                    className="w-full px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Style</label>
                  <select
                    value={formData.physicalTraits.clothing?.style || ''}
                    onChange={(e) => handleInputChange('clothing', { 
                      ...formData.physicalTraits.clothing, 
                      style: e.target.value 
                    }, 'physicalTraits')}
                    className="w-full px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                  >
                    <option value="">Select style</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                    <option value="fantasy">Fantasy</option>
                    <option value="modern">Modern</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personality Traits Tab */}
        {activeTab === 'personality' && (
          <div className="space-y-6">
            {/* Primary Traits */}
            <div>
              <label className="block text-sm font-medium mb-2">Primary Traits</label>
              <div className="space-y-2">
                {formData.personalityTraits.primary.map((trait, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={trait}
                      onChange={(e) => handleArrayInputChange('primary', index, e.target.value, 'personalityTraits')}
                      placeholder="e.g., Brave, Kind, Curious"
                      className="flex-1 px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem('primary', index, 'personalityTraits')}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddArrayItem('primary', 'personalityTraits')}
                  className="flex items-center gap-2 px-3 py-2 border border-dashed border-[--border] rounded-md text-[--muted-foreground] hover:text-[--foreground] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Primary Trait
                </button>
              </div>
            </div>

            {/* Motivations */}
            <div>
              <label className="block text-sm font-medium mb-2">Motivations</label>
              <div className="space-y-2">
                {formData.personalityTraits.motivations.map((motivation, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={motivation}
                      onChange={(e) => handleArrayInputChange('motivations', index, e.target.value, 'personalityTraits')}
                      placeholder="What drives this character?"
                      className="flex-1 px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem('motivations', index, 'personalityTraits')}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddArrayItem('motivations', 'personalityTraits')}
                  className="flex items-center gap-2 px-3 py-2 border border-dashed border-[--border] rounded-md text-[--muted-foreground] hover:text-[--foreground] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Motivation
                </button>
              </div>
            </div>

            {/* Quirks */}
            <div>
              <label className="block text-sm font-medium mb-2">Quirks & Habits</label>
              <div className="space-y-2">
                {formData.personalityTraits.quirks.map((quirk, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={quirk}
                      onChange={(e) => handleArrayInputChange('quirks', index, e.target.value, 'personalityTraits')}
                      placeholder="Unique behaviors or habits"
                      className="flex-1 px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveArrayItem('quirks', index, 'personalityTraits')}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddArrayItem('quirks', 'personalityTraits')}
                  className="flex items-center gap-2 px-3 py-2 border border-dashed border-[--border] rounded-md text-[--muted-foreground] hover:text-[--foreground] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Quirk
                </button>
              </div>
            </div>
          </div>
        )}

        {/* References Tab */}
        {activeTab === 'references' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Reference Images</label>
              <p className="text-sm text-[--muted-foreground] mb-4">
                Upload reference images to help maintain character consistency
              </p>
              
              {/* Upload Area */}
              <div className="border-2 border-dashed border-[--border] rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-[--muted-foreground]" />
                  <p className="text-sm text-[--muted-foreground]">
                    {isUploading ? 'Uploading...' : 'Click to upload images or drag and drop'}
                  </p>
                </label>
              </div>
              
              {/* Reference Images Grid */}
              {formData.referenceImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {formData.referenceImages.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt={image.description || `Reference ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            referenceImages: prev.referenceImages.filter((_, i) => i !== index)
                          }))
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-[--border]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-[--border] rounded-md hover:bg-[--muted]/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[--primary] text-[--primary-foreground] rounded-md hover:opacity-90 transition-opacity"
          >
            {character ? 'Update Character' : 'Create Character'}
          </button>
        </div>
      </form>
    </div>
  )
}