'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { CharacterProfileCard } from './CharacterProfileCard'
import { CharacterForm } from './CharacterForm'
import type { CharacterProfile } from '@/lib/ai/characterLock'

interface CharacterManagerProps {
  projectId: string
}

export function CharacterManager({ projectId }: CharacterManagerProps) {
  const [characters, setCharacters] = useState<CharacterProfile[]>([])
  const [filteredCharacters, setFilteredCharacters] = useState<CharacterProfile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<CharacterProfile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch characters on mount and when projectId changes
  useEffect(() => {
    loadCharacters()
  }, [projectId])

  // Filter characters based on search and role filter
  useEffect(() => {
    let filtered = characters

    if (searchTerm) {
      filtered = filtered.filter(character =>
        character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        character.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        character.visualDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        character.personality?.some(trait => 
          trait.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(character => character.role === roleFilter)
    }

    setFilteredCharacters(filtered)
  }, [characters, searchTerm, roleFilter])

  const loadCharacters = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/characters/profiles?projectId=${projectId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch characters')
      }

      const data = await response.json()
      setCharacters(data.profiles || [])
    } catch (error) {
      console.error('Error loading characters:', error)
      toast.error('Failed to load characters')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCharacter = async (formData: any) => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/characters/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          projectId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create character')
      }

      const data = await response.json()
      setCharacters(prev => [data.profile, ...prev])
      toast.success('Character created successfully!')
      
      if (formData.generateReferenceImages) {
        toast.info('Reference images are being generated...')
      }
    } catch (error) {
      console.error('Error creating character:', error)
      toast.error('Failed to create character')
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCharacter = async (formData: any) => {
    if (!editingCharacter) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/characters/profiles/${editingCharacter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update character')
      }

      const data = await response.json()
      setCharacters(prev =>
        prev.map(char => char.id === editingCharacter.id ? data.profile : char)
      )
      toast.success('Character updated successfully!')
    } catch (error) {
      console.error('Error updating character:', error)
      toast.error('Failed to update character')
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCharacter = async (character: CharacterProfile) => {
    if (!confirm(`Are you sure you want to delete "${character.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/characters/profiles/${character.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete character')
      }

      setCharacters(prev => prev.filter(char => char.id !== character.id))
      toast.success('Character deleted successfully')
    } catch (error) {
      console.error('Error deleting character:', error)
      toast.error('Failed to delete character')
    }
  }

  const handleGenerateReferences = async (character: CharacterProfile) => {
    try {
      toast.info('Generating reference images...')
      const response = await fetch('/api/characters/reference-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: character.id,
          imageTypes: ['front_view', 'side_view', 'full_body'],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate reference images')
      }

      await loadCharacters() // Reload to get updated reference images
      toast.success('Reference images generated successfully!')
    } catch (error) {
      console.error('Error generating reference images:', error)
      toast.error('Failed to generate reference images')
    }
  }

  const openEditForm = (character: CharacterProfile) => {
    setEditingCharacter(character)
    setIsFormOpen(true)
  }

  const openCreateForm = () => {
    setEditingCharacter(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingCharacter(null)
  }

  const handleSubmitForm = async (formData: any) => {
    if (editingCharacter) {
      await handleUpdateCharacter(formData)
    } else {
      await handleCreateCharacter(formData)
    }
    closeForm()
  }

  // Calculate stats
  const stats = {
    total: characters.length,
    protagonists: characters.filter(c => c.role === 'protagonist').length,
    supporting: characters.filter(c => c.role === 'supporting').length,
    avgConsistency: characters.length > 0 
      ? Math.round(characters.reduce((sum, c) => sum + (c.metadata?.averageConsistencyScore || 0), 0) / characters.length * 100)
      : 0
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Character Manager</h2>
          <p className="text-muted-foreground">
            Manage character profiles for consistent AI generation
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="w-4 h-4 mr-2" />
          Create Character
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Characters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protagonists</CardTitle>
            <Badge variant="outline">{stats.protagonists}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.protagonists}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supporting</CardTitle>
            <Badge variant="outline">{stats.supporting}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.supporting}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Consistency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgConsistency}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search characters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="protagonist">Protagonist</SelectItem>
            <SelectItem value="antagonist">Antagonist</SelectItem>
            <SelectItem value="supporting">Supporting</SelectItem>
            <SelectItem value="narrator">Narrator</SelectItem>
            <SelectItem value="background">Background</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Characters Grid */}
      {filteredCharacters.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">
                {characters.length === 0 ? 'No characters yet' : 'No matching characters'}
              </h3>
              <p className="text-muted-foreground">
                {characters.length === 0 
                  ? 'Create your first character to get started with consistent AI generation'
                  : 'Try adjusting your search or filters to find characters'
                }
              </p>
            </div>
            {characters.length === 0 && (
              <Button onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Character
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharacters.map((character) => (
            <CharacterProfileCard
              key={character.id}
              character={character}
              onEdit={openEditForm}
              onDelete={handleDeleteCharacter}
              onGenerateReferences={handleGenerateReferences}
            />
          ))}
        </div>
      )}

      {/* Character Form Dialog */}
      <CharacterForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        character={editingCharacter}
        projectId={projectId}
        onSubmit={handleSubmitForm}
        isLoading={isSubmitting}
      />
    </div>
  )
}

export default CharacterManager