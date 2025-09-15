/**
 * Character Turnaround Viewer Component
 * 
 * Displays and manages 360-degree character reference views
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Eye, RotateCcw, Zap, Download, Plus, Trash2, RefreshCw } from 'lucide-react'
import type { CharacterProfile } from '@/lib/ai/characterLock'

interface CharacterTurnaround {
  id: string
  character_profile_id: string
  front_view_url?: string
  side_view_url?: string
  back_view_url?: string
  three_quarter_view_url?: string
  additional_angles: Array<{ angle: string; url: string }>
  illustration_style: string
  art_style_notes?: string
  generated_as_batch: boolean
  consistency_validated: boolean
  created_at: string
}

interface CharacterTurnaroundViewerProps {
  character: CharacterProfile
  onClose: () => void
  onUpdate: () => void
}

export function CharacterTurnaroundViewer({ character, onClose, onUpdate }: CharacterTurnaroundViewerProps) {
  const [turnarounds, setTurnarounds] = useState<CharacterTurnaround[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedTurnaround, setSelectedTurnaround] = useState<CharacterTurnaround | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [uploadingView, setUploadingView] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    illustrationStyle: 'watercolor',
    artStyleNotes: '',
    generateMissing: true
  })

  const viewTypes = [
    { key: 'front_view_url', label: 'Front View', angle: '0°' },
    { key: 'side_view_url', label: 'Side View', angle: '90°' },
    { key: 'back_view_url', label: 'Back View', angle: '180°' },
    { key: 'three_quarter_view_url', label: '3/4 View', angle: '45°' }
  ]

  const illustrationStyles = [
    'watercolor', 'digital-art', 'cartoon', 'realistic', 'sketch', 
    'anime', 'vintage', 'minimalist', 'pop-art', 'storybook'
  ]

  useEffect(() => {
    loadTurnarounds()
  }, [character.id])

  const loadTurnarounds = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/characters/turnarounds?characterId=${character.id}`)
      const data = await response.json()
      
      if (data.success) {
        setTurnarounds(data.turnarounds)
        if (data.turnarounds.length > 0) {
          setSelectedTurnaround(data.turnarounds[0])
        }
      } else {
        console.error('Failed to load turnarounds:', data.error)
      }
    } catch (error) {
      console.error('Error loading turnarounds:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTurnaround = async () => {
    try {
      setGenerating(true)
      
      const response = await fetch('/api/characters/turnarounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          illustrationStyle: formData.illustrationStyle,
          artStyleNotes: formData.artStyleNotes,
          generateMissing: formData.generateMissing
        })
      })
      
      const data = await response.json()
      if (data.success) {
        await loadTurnarounds()
        setShowCreateForm(false)
        setSelectedTurnaround(data.turnaround)
        onUpdate()
      } else {
        alert('Failed to create turnaround: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating turnaround:', error)
      alert('Failed to create turnaround')
    } finally {
      setGenerating(false)
    }
  }

  const handleImageUpload = async (file: File, viewType: string, turnaroundId?: string) => {
    setUploadingView(viewType)
    try {
      // In a real implementation, you would upload to your storage service
      // For now, we'll create a placeholder URL
      const imageUrl = URL.createObjectURL(file)
      
      // Update the turnaround with the new image
      // This would typically involve an API call
      console.log('Uploading image for view:', viewType, 'to turnaround:', turnaroundId)
      
      // Reload turnarounds to reflect changes
      await loadTurnarounds()
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingView(null)
    }
  }

  const getViewImage = (turnaround: CharacterTurnaround, viewKey: string): string | undefined => {
    return (turnaround as any)[viewKey]
  }

  const hasAnyViews = (turnaround: CharacterTurnaround): boolean => {
    return viewTypes.some(view => getViewImage(turnaround, view.key))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--primary]"></div>
          <span className="ml-2">Loading turnarounds...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-heading font-bold">Character Turnarounds</h2>
          <p className="text-[--muted-foreground]">{character.name}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[--primary] text-[--primary-foreground] rounded-md hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Create Turnaround
          </button>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[--muted]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {turnarounds.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-[--border] rounded-xl">
          <RotateCcw className="w-12 h-12 mx-auto mb-4 text-[--muted-foreground]" />
          <h3 className="text-lg font-semibold mb-2">No Turnarounds Yet</h3>
          <p className="text-[--muted-foreground] mb-4">
            Create character turnarounds to maintain consistent visual appearance across all angles
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[--primary] text-[--primary-foreground] rounded-md hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Create First Turnaround
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Turnaround Selector */}
          {turnarounds.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {turnarounds.map((turnaround, index) => (
                <button
                  key={turnaround.id}
                  onClick={() => setSelectedTurnaround(turnaround)}
                  className={`flex-shrink-0 px-4 py-2 rounded-md border transition-colors ${
                    selectedTurnaround?.id === turnaround.id
                      ? 'border-[--primary] bg-[--primary]/10'
                      : 'border-[--border] hover:bg-[--muted]/50'
                  }`}
                >
                  <div className="text-sm font-medium">
                    {turnaround.illustration_style} #{index + 1}
                  </div>
                  <div className="text-xs text-[--muted-foreground]">
                    {new Date(turnaround.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Turnaround */}
          {selectedTurnaround && (
            <div className="space-y-6">
              {/* Turnaround Info */}
              <div className="flex items-center justify-between p-4 border border-[--border] rounded-xl bg-[--card]">
                <div>
                  <h3 className="font-semibold capitalize">
                    {selectedTurnaround.illustration_style} Turnaround
                  </h3>
                  <p className="text-sm text-[--muted-foreground]">
                    Created {new Date(selectedTurnaround.created_at).toLocaleDateString()}
                    {selectedTurnaround.generated_as_batch && ' • AI Generated'}
                    {selectedTurnaround.consistency_validated && ' • Validated'}
                  </p>
                  {selectedTurnaround.art_style_notes && (
                    <p className="text-sm text-[--muted-foreground] mt-1">
                      {selectedTurnaround.art_style_notes}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedTurnaround.consistency_validated ? (
                    <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 rounded-full text-sm">
                      Validated
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full text-sm">
                      Pending
                    </div>
                  )}
                </div>
              </div>

              {/* Views Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {viewTypes.map((view) => {
                  const imageUrl = getViewImage(selectedTurnaround, view.key)
                  const isUploading = uploadingView === view.key
                  
                  return (
                    <div key={view.key} className="space-y-3">
                      <div className="text-center">
                        <h4 className="font-medium">{view.label}</h4>
                        <p className="text-sm text-[--muted-foreground]">{view.angle}</p>
                      </div>
                      
                      <div className="relative aspect-square border-2 border-dashed border-[--border] rounded-xl bg-[--card] overflow-hidden">
                        {imageUrl ? (
                          <div className="relative group h-full">
                            <img
                              src={imageUrl}
                              alt={view.label}
                              className="w-full h-full object-cover"
                            />
                            
                            {/* Overlay actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => window.open(imageUrl, '_blank')}
                                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                              >
                                <Eye className="w-4 h-4 text-white" />
                              </button>
                              
                              <label className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors cursor-pointer">
                                <Upload className="w-4 h-4 text-white" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      handleImageUpload(file, view.key, selectedTurnaround.id)
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center">
                            {isUploading ? (
                              <div className="text-center">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[--muted-foreground]" />
                                <p className="text-sm text-[--muted-foreground]">Uploading...</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Upload className="w-8 h-8 mx-auto mb-2 text-[--muted-foreground]" />
                                <p className="text-sm text-[--muted-foreground] mb-2">No image</p>
                                <label className="text-xs px-3 py-1 bg-[--primary] text-[--primary-foreground] rounded cursor-pointer hover:opacity-90">
                                  Upload
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        handleImageUpload(file, view.key, selectedTurnaround.id)
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Additional Angles */}
              {selectedTurnaround.additional_angles.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Additional Angles</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedTurnaround.additional_angles.map((angle, index) => (
                      <div key={index} className="space-y-2">
                        <div className="aspect-square border border-[--border] rounded-lg overflow-hidden">
                          <img
                            src={angle.url}
                            alt={angle.angle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-sm text-center text-[--muted-foreground]">
                          {angle.angle}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Turnaround Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[--background] rounded-xl border border-[--border] max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Create Turnaround</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 rounded-lg hover:bg-[--muted]/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Illustration Style</label>
                <select
                  value={formData.illustrationStyle}
                  onChange={(e) => setFormData(prev => ({ ...prev, illustrationStyle: e.target.value }))}
                  className="w-full px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                >
                  {illustrationStyles.map(style => (
                    <option key={style} value={style} className="capitalize">
                      {style.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Art Style Notes</label>
                <textarea
                  value={formData.artStyleNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, artStyleNotes: e.target.value }))}
                  placeholder="Optional style guidance..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[--border] rounded-md bg-[--background]"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="generateMissing"
                  checked={formData.generateMissing}
                  onChange={(e) => setFormData(prev => ({ ...prev, generateMissing: e.target.checked }))}
                />
                <label htmlFor="generateMissing" className="text-sm">
                  Generate all views automatically using AI
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                disabled={generating}
                className="px-4 py-2 border border-[--border] rounded-md hover:bg-[--muted]/50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTurnaround}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-[--primary] text-[--primary-foreground] rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Create Turnaround
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}