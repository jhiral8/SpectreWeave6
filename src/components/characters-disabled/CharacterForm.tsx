'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { X, Plus, ImageIcon } from 'lucide-react'
import type { CharacterProfile } from '@/lib/ai/characterLock'

const characterSchema = z.object({
  name: z.string().min(1, 'Character name is required').max(100),
  description: z.string().max(500).optional(),
  visualDescription: z.string().min(10, 'Visual description must be at least 10 characters').max(1000),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'narrator', 'background']),
  personality: z.array(z.string()).max(10, 'Maximum 10 personality traits'),
  generateReferenceImages: z.boolean().default(false),
  referenceImageTypes: z.array(z.string()).default([])
})

type CharacterFormData = z.infer<typeof characterSchema>

interface CharacterFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  character?: CharacterProfile | null
  projectId: string
  onSubmit: (data: CharacterFormData) => Promise<void>
  isLoading?: boolean
}

const roleOptions = [
  { value: 'protagonist', label: 'Protagonist', description: 'Main character driving the story' },
  { value: 'antagonist', label: 'Antagonist', description: 'Character opposing the protagonist' },
  { value: 'supporting', label: 'Supporting', description: 'Important secondary character' },
  { value: 'narrator', label: 'Narrator', description: 'Character telling the story' },
  { value: 'background', label: 'Background', description: 'Minor character in scenes' }
]

const referenceImageTypes = [
  { value: 'front_view', label: 'Front View', description: 'Facing forward' },
  { value: 'side_view', label: 'Side View', description: 'Profile view' },
  { value: 'back_view', label: 'Back View', description: 'From behind' },
  { value: 'close_up', label: 'Close-up', description: 'Detailed face/head' },
  { value: 'full_body', label: 'Full Body', description: 'Complete character' },
  { value: 'emotion', label: 'Emotional', description: 'Expressing emotion' },
  { value: 'outfit', label: 'Outfit', description: 'Showcasing clothing' }
]

const commonPersonalityTraits = [
  'brave', 'kind', 'curious', 'funny', 'smart', 'creative', 'loyal', 
  'adventurous', 'gentle', 'energetic', 'wise', 'playful', 'caring',
  'determined', 'optimistic', 'imaginative', 'helpful', 'honest',
  'patient', 'cheerful', 'independent', 'confident', 'thoughtful'
]

export function CharacterForm({
  open,
  onOpenChange,
  character,
  projectId,
  onSubmit,
  isLoading = false
}: CharacterFormProps) {
  const [customTrait, setCustomTrait] = useState('')
  
  const form = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: '',
      description: '',
      visualDescription: '',
      role: 'supporting',
      personality: [],
      generateReferenceImages: true,
      referenceImageTypes: ['front_view', 'side_view', 'full_body']
    }
  })

  const { watch, setValue, getValues } = form
  const watchPersonality = watch('personality')
  const watchGenerateImages = watch('generateReferenceImages')

  // Populate form when editing an existing character
  useEffect(() => {
    if (character) {
      form.reset({
        name: character.name,
        description: character.description || '',
        visualDescription: character.visualDescription,
        role: character.role,
        personality: character.personality || [],
        generateReferenceImages: false,
        referenceImageTypes: []
      })
    } else {
      form.reset({
        name: '',
        description: '',
        visualDescription: '',
        role: 'supporting',
        personality: [],
        generateReferenceImages: true,
        referenceImageTypes: ['front_view', 'side_view', 'full_body']
      })
    }
  }, [character, form])

  const addPersonalityTrait = (trait: string) => {
    const current = getValues('personality')
    if (!current.includes(trait) && current.length < 10) {
      setValue('personality', [...current, trait])
    }
  }

  const removePersonalityTrait = (trait: string) => {
    const current = getValues('personality')
    setValue('personality', current.filter(t => t !== trait))
  }

  const addCustomTrait = () => {
    if (customTrait.trim() && !watchPersonality.includes(customTrait.trim())) {
      addPersonalityTrait(customTrait.trim())
      setCustomTrait('')
    }
  }

  const toggleReferenceImageType = (type: string) => {
    const current = getValues('referenceImageTypes')
    if (current.includes(type)) {
      setValue('referenceImageTypes', current.filter(t => t !== type))
    } else {
      setValue('referenceImageTypes', [...current, type])
    }
  }

  const handleSubmit = async (data: CharacterFormData) => {
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting character form:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {character ? 'Edit Character' : 'Create New Character'}
          </DialogTitle>
          <DialogDescription>
            {character 
              ? 'Update your character profile and settings'
              : 'Create a new character for consistent generation across your story'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Character Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter character name..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="w-48">
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the character's role and personality..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A short description of who this character is in your story
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visualDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visual Description *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed visual description for AI generation (hair color, eye color, clothing style, age, build, etc.)..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed physical appearance for consistent AI generation. Be specific about colors, style, age, and distinctive features.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Personality Traits */}
            <div className="space-y-4">
              <FormLabel>Personality Traits</FormLabel>
              <FormDescription>
                Select traits that define your character's personality (max 10)
              </FormDescription>
              
              {/* Selected Traits */}
              {watchPersonality.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {watchPersonality.map((trait, index) => (
                    <Badge 
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => removePersonalityTrait(trait)}
                    >
                      {trait}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Common Traits */}
              {watchPersonality.length < 10 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Common Traits:</div>
                  <div className="flex flex-wrap gap-2">
                    {commonPersonalityTraits
                      .filter(trait => !watchPersonality.includes(trait))
                      .map((trait) => (
                        <Badge 
                          key={trait}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => addPersonalityTrait(trait)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {trait}
                        </Badge>
                      ))}
                  </div>

                  {/* Custom Trait Input */}
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add custom trait..."
                      value={customTrait}
                      onChange={(e) => setCustomTrait(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomTrait()
                        }
                      }}
                      className="flex-1"
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={addCustomTrait}
                      disabled={!customTrait.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {!character && (
              <>
                <Separator />

                {/* Reference Image Generation */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="generateReferenceImages"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Generate Reference Images
                          </FormLabel>
                          <FormDescription>
                            Automatically create reference images for character consistency
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {watchGenerateImages && (
                    <div className="space-y-3">
                      <FormLabel>Reference Image Types</FormLabel>
                      <FormDescription>
                        Select which reference images to generate
                      </FormDescription>
                      <div className="grid grid-cols-2 gap-3">
                        {referenceImageTypes.map((type) => (
                          <div
                            key={type.value}
                            className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                              getValues('referenceImageTypes').includes(type.value)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => toggleReferenceImageType(type.value)}
                          >
                            <Checkbox
                              checked={getValues('referenceImageTypes').includes(type.value)}
                              onChange={() => toggleReferenceImageType(type.value)}
                            />
                            <div>
                              <div className="font-medium text-sm">{type.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {type.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-24"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <>
                    {character ? 'Update' : 'Create'}
                    {watchGenerateImages && !character && (
                      <>
                        {' & Generate '}
                        <ImageIcon className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default CharacterForm