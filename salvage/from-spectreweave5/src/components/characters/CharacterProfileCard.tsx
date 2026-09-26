'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Edit, 
  Eye, 
  Users, 
  ImageIcon, 
  TrendingUp,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CharacterProfile } from '@/lib/ai/characterLock'

interface CharacterProfileCardProps {
  character: CharacterProfile
  onEdit?: (character: CharacterProfile) => void
  onView?: (character: CharacterProfile) => void
  onDelete?: (character: CharacterProfile) => void
  onGenerateReferences?: (character: CharacterProfile) => void
}

export function CharacterProfileCard({
  character,
  onEdit,
  onView,
  onDelete,
  onGenerateReferences
}: CharacterProfileCardProps) {
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
    <Card className="w-full max-w-sm hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage 
                src={primaryReferenceImage?.url} 
                alt={character.name}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                {character.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">
                {character.name}
              </CardTitle>
              <Badge 
                variant="secondary" 
                className={`text-xs mt-1 ${roleColors[character.role]}`}
              >
                {character.role}
              </Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(character)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(character)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Character
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGenerateReferences?.(character)}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate References
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(character)}
                className="text-red-600 focus:text-red-600"
              >
                Delete Character
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Visual Description */}
        <div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {character.visualDescription}
          </p>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          {/* Consistency Score */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Consistency</span>
              <span className="font-medium">
                {Math.round(consistencyScore * 100)}%
              </span>
            </div>
            <Progress 
              value={consistencyScore * 100} 
              className="h-2"
            />
          </div>

          {/* Reference Images & Appearances */}
          <div className="flex justify-between text-sm">
            <div className="flex items-center space-x-1">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {character.referenceImages?.length || 0} refs
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {totalAppearances} uses
              </span>
            </div>
          </div>
        </div>

        {/* Personality Traits */}
        {character.personality && character.personality.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Personality</p>
            <div className="flex flex-wrap gap-1">
              {character.personality.slice(0, 3).map((trait, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className="text-xs px-2 py-0"
                >
                  {trait}
                </Badge>
              ))}
              {character.personality.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs px-2 py-0 text-muted-foreground"
                >
                  +{character.personality.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onView?.(character)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit?.(character)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default CharacterProfileCard