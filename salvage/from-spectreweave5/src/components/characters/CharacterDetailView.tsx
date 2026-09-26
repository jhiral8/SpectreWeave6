'use client'

import React, { useState, useEffect } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  ImageIcon, 
  Activity, 
  TrendingUp, 
  Calendar,
  Eye,
  Palette,
  Network
} from 'lucide-react'
import type { CharacterProfile, CharacterConsistency } from '@/lib/ai/characterLock'

interface CharacterDetailViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  character: CharacterProfile | null
}

interface ConsistencyHistory {
  consistencyHistory: CharacterConsistency[]
}

export function CharacterDetailView({
  open,
  onOpenChange,
  character
}: CharacterDetailViewProps) {
  const [consistencyHistory, setConsistencyHistory] = useState<CharacterConsistency[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  useEffect(() => {
    if (character && open) {
      loadConsistencyHistory()
    }
  }, [character, open])

  const loadConsistencyHistory = async () => {
    if (!character) return

    try {
      setIsLoadingHistory(true)
      const response = await fetch(`/api/characters/consistency?characterId=${character.id}&limit=10`)
      
      if (response.ok) {
        const data: ConsistencyHistory = await response.json()
        setConsistencyHistory(data.consistencyHistory || [])
      }
    } catch (error) {
      console.error('Error loading consistency history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  if (!character) {
    return null
  }

  const roleColors = {
    protagonist: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    antagonist: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    supporting: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    narrator: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    background: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }

  const primaryReferenceImage = character.referenceImages?.find(img => img.isCanonical)
  const consistencyScore = character.metadata?.averageConsistencyScore || 0
  const totalAppearances = character.metadata?.totalAppearances || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage 
                src={primaryReferenceImage?.url} 
                alt={character.name}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xl">
                {character.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{character.name}</DialogTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={roleColors[character.role]}>
                  {character.role}
                </Badge>
                <Badge variant="outline">
                  {Math.round(consistencyScore * 100)}% consistency
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <User className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="references">
              <ImageIcon className="w-4 h-4 mr-2" />
              References
            </TabsTrigger>
            <TabsTrigger value="consistency">
              <Activity className="w-4 h-4 mr-2" />
              Consistency
            </TabsTrigger>
            <TabsTrigger value="relationships">
              <Network className="w-4 h-4 mr-2" />
              Relationships
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Character Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Role</h4>
                    <Badge className={`mt-1 ${roleColors[character.role]}`}>
                      {character.role}
                    </Badge>
                  </div>
                  
                  {character.description && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">Description</h4>
                      <p className="mt-1 text-sm">{character.description}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Created</h4>
                    <p className="mt-1 text-sm flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(character.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Total Appearances</h4>
                    <p className="mt-1 text-sm flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      {totalAppearances} times
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Visual Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Visual Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{character.visualDescription}</p>
                </CardContent>
              </Card>
            </div>

            {/* Personality Traits */}
            {character.personality && character.personality.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personality Traits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {character.personality.map((trait, index) => (
                      <Badge key={index} variant="secondary">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Character Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Consistency Score</span>
                    <span className="font-medium">{Math.round(consistencyScore * 100)}%</span>
                  </div>
                  <Progress value={consistencyScore * 100} className="h-3" />
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{character.referenceImages?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Reference Images</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{totalAppearances}</div>
                    <div className="text-xs text-muted-foreground">Total Appearances</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{consistencyHistory.length}</div>
                    <div className="text-xs text-muted-foreground">Consistency Checks</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="references" className="space-y-6">
            {character.referenceImages && character.referenceImages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {character.referenceImages.map((image, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="aspect-square relative bg-muted">
                      <img
                        src={image.url}
                        alt={`${character.name} - ${image.type}`}
                        className="w-full h-full object-cover"
                      />
                      {image.isCanonical && (
                        <Badge className="absolute top-2 left-2 bg-green-500">
                          Canonical
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {image.type.replace('_', ' ')}
                          </Badge>
                          {image.metadata?.qualityScore && (
                            <span className="text-xs text-muted-foreground">
                              Quality: {Math.round(image.metadata.qualityScore * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(image.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reference Images</h3>
                <p className="text-muted-foreground">
                  Generate reference images to improve character consistency
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="consistency" className="space-y-6">
            {/* Consistency Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consistency Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {Math.round(consistencyScore * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Average Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{consistencyHistory.length}</div>
                    <div className="text-sm text-muted-foreground">Total Checks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {character.metadata?.lastAppearance ? 
                        new Date(character.metadata.lastAppearance).toLocaleDateString() : 
                        'Never'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">Last Used</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consistency History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Consistency Checks</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-muted animate-pulse rounded" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                          <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : consistencyHistory.length > 0 ? (
                  <div className="space-y-4">
                    {consistencyHistory.map((check, index) => (
                      <div key={check.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                          <img
                            src={check.imageUrl}
                            alt="Generated image"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge 
                              variant={check.consistencyScore >= 0.8 ? "default" : 
                                      check.consistencyScore >= 0.6 ? "secondary" : "destructive"}
                            >
                              {Math.round(check.consistencyScore * 100)}%
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(check.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {check.pageNumber && (
                            <p className="text-sm text-muted-foreground">
                              Page {check.pageNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Consistency Data</h3>
                    <p className="text-muted-foreground">
                      Consistency data will appear here after generating images with this character
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relationships" className="space-y-6">
            <Card className="p-12 text-center">
              <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Character Relationships</h3>
              <p className="text-muted-foreground">
                Character relationship mapping will be available in a future update
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default CharacterDetailView