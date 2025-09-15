/**
 * Character Profile Manager Component
 * 
 * Main interface for managing character profiles in the character lock system
 */

'use client'

import { useState, useEffect } from 'react'
import { User, Plus, Edit, Trash2, Eye, Upload, Zap, Settings } from 'lucide-react'
import { CharacterProfileCard } from './CharacterProfileCard'
import { CharacterProfileForm } from './CharacterProfileForm'
import { CharacterTurnaroundViewer } from './CharacterTurnaroundViewer'
import { ConsistencyAnalyzer } from './ConsistencyAnalyzer'
import type { 
  CharacterProfile, 
  PhysicalTraits, 
  PersonalityTraits,
  CharacterAppearance 
} from '@/lib/ai/characterLock'

interface CharacterProfileManagerProps {
  projectId: string
  onCharacterSelect?: (character: CharacterProfile) => void
  showConsistencyTools?: boolean
}

export function CharacterProfileManager({ 
  projectId, 
  onCharacterSelect,
  showConsistencyTools = true 
}: CharacterProfileManagerProps) {
  const [characters, setCharacters] = useState<CharacterProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterProfile | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<CharacterProfile | null>(null)
  const [showTurnarounds, setShowTurnarounds] = useState(false)
  const [showConsistency, setShowConsistency] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadCharacters()
  }, [projectId])

  const loadCharacters = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/characters/profiles?projectId=${projectId}`)
      const data = await response.json()
      
      if (data.success) {
        setCharacters(data.profiles)
      } else {
        console.error('Failed to load characters:', data.error)
      }
    } catch (error) {
      console.error('Error loading characters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCharacter = () => {
    setEditingCharacter(null)
    setShowForm(true)
  }

  const handleEditCharacter = (character: CharacterProfile) => {
    setEditingCharacter(character)
    setShowForm(true)
  }

  const handleDeleteCharacter = async (character: CharacterProfile) => {
    if (!confirm(`Are you sure you want to delete "${character.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/characters/profiles/${character.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        await loadCharacters()
        if (selectedCharacter?.id === character.id) {
          setSelectedCharacter(null)
        }
      } else {
        alert('Failed to delete character: ' + data.error)
      }
    } catch (error) {
      console.error('Error deleting character:', error)
      alert('Failed to delete character')
    }
  }

  const handleFormSubmit = async (characterData: any) => {
    try {
      const url = editingCharacter 
        ? `/api/characters/profiles/${editingCharacter.id}`
        : `/api/characters/profiles`
      
      const method = editingCharacter ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...characterData
        })
      })

      const data = await response.json()
      if (data.success) {
        await loadCharacters()
        setShowForm(false)
        setEditingCharacter(null)
      } else {
        alert('Failed to save character: ' + data.error)
      }
    } catch (error) {
      console.error('Error saving character:', error)
      alert('Failed to save character')
    }
  }

  const handleViewTurnarounds = (character: CharacterProfile) => {
    setSelectedCharacter(character)
    setShowTurnarounds(true)
  }

  const handleAnalyzeConsistency = (character: CharacterProfile) => {
    setSelectedCharacter(character)
    setShowConsistency(true)
  }

  const handleCharacterClick = (character: CharacterProfile) => {
    setSelectedCharacter(character)
    onCharacterSelect?.(character)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--primary]"></div>
        <span className="ml-2">Loading characters...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">Character Profiles</h2>
          <p className="text-[--muted-foreground] mt-1">
            Manage character consistency across your book
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-[--border] overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-2 text-sm ${
                view === 'grid' 
                  ? 'bg-[--primary] text-[--primary-foreground]' 
                  : 'bg-[--background] hover:bg-[--muted]/50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 text-sm ${
                view === 'list' 
                  ? 'bg-[--primary] text-[--primary-foreground]' 
                  : 'bg-[--background] hover:bg-[--muted]/50'
              }`}
            >
              List
            </button>
          </div>

          <button
            onClick={handleCreateCharacter}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[--primary] text-[--primary-foreground] rounded-md hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Character
          </button>
        </div>
      </div>

      {/* Character List */}
      {characters.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-[--border] rounded-xl">
          <User className="w-12 h-12 mx-auto mb-4 text-[--muted-foreground]" />
          <h3 className="text-lg font-semibold mb-2">No Characters Yet</h3>
          <p className="text-[--muted-foreground] mb-4">
            Create character profiles to maintain visual consistency across your book
          </p>
          <button
            onClick={handleCreateCharacter}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[--primary] text-[--primary-foreground] rounded-md hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Create First Character
          </button>
        </div>
      ) : (
        <div className={
          view === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {characters.map((character) => (
            <CharacterProfileCard
              key={character.id}
              character={character}
              viewMode={view}
              selected={selectedCharacter?.id === character.id}
              onClick={() => handleCharacterClick(character)}
              onEdit={() => handleEditCharacter(character)}
              onDelete={() => handleDeleteCharacter(character)}
              onViewTurnarounds={() => handleViewTurnarounds(character)}
              onAnalyzeConsistency={showConsistencyTools ? () => handleAnalyzeConsistency(character) : undefined}
            />
          ))}
        </div>
      )}

      {/* Character Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[--background] rounded-xl border border-[--border] max-w-2xl w-full max-h-[90vh] overflow-auto">
            <CharacterProfileForm
              character={editingCharacter}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false)
                setEditingCharacter(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Turnaround Viewer Modal */}
      {showTurnarounds && selectedCharacter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[--background] rounded-xl border border-[--border] max-w-4xl w-full max-h-[90vh] overflow-auto">
            <CharacterTurnaroundViewer
              character={selectedCharacter}
              onClose={() => {
                setShowTurnarounds(false)
                setSelectedCharacter(null)
              }}
              onUpdate={loadCharacters}
            />
          </div>
        </div>
      )}

      {/* Consistency Analyzer Modal */}
      {showConsistency && selectedCharacter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[--background] rounded-xl border border-[--border] max-w-6xl w-full max-h-[90vh] overflow-auto">
            <ConsistencyAnalyzer
              character={selectedCharacter}
              onClose={() => {
                setShowConsistency(false)
                setSelectedCharacter(null)
              }}
              onUpdate={loadCharacters}
            />
          </div>
        </div>
      )}
    </div>
  )
}