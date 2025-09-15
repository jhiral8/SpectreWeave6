/**
 * Mock Children's Book AI Service for testing
 * Returns dummy data to test the Complete Book flow without requiring actual AI services
 */

import type { 
  GeneratedStory, 
  StoryPrompt
} from './childrensBookAI'

// Local types for mock responses
interface GeneratedIllustration {
  url: string
  prompt: string
  seed: number
  metadata: {
    model: string
    generatedAt: string
  }
}

interface IllustrationPrompt {
  prompt: string
  characterId?: string
  pageNumber?: number
}

class MockChildrensBookAI {
  async generateStory(prompt: StoryPrompt): Promise<GeneratedStory> {
    console.log('Mock: Generating story with prompt:', prompt)
    
    // Return mock story data
    return {
      title: prompt.title || 'Test Story',
      pages: [
        {
          pageNumber: 1,
          text: 'Once upon a time in a magical forest...',
          illustrationPrompt: 'A magical forest with colorful trees and friendly animals'
        },
        {
          pageNumber: 2,
          text: 'There lived a brave little character who loved adventures...',
          illustrationPrompt: 'A brave character standing proudly in the forest'
        },
        {
          pageNumber: 3,
          text: 'One day, something amazing happened...',
          illustrationPrompt: 'An exciting scene with sparkles and wonder'
        },
        {
          pageNumber: 4,
          text: 'And they all lived happily ever after. The End.',
          illustrationPrompt: 'A happy ending scene with all characters together'
        }
      ],
      totalPages: 4,
      authorStyle: prompt.authorStyle,
      ageGroup: prompt.ageGroup,
      genre: prompt.genre,
      theme: prompt.theme,
      metadata: {
        generatedAt: new Date().toISOString(),
        modelUsed: 'mock',
        promptVersion: '1.0'
      }
    }
  }

  async generateStoryWithCharacterLock(prompt: StoryPrompt): Promise<GeneratedStory> {
    console.log('Mock: Generating story with character lock')
    return this.generateStory(prompt)
  }

  async validateStoryContent(story: GeneratedStory): Promise<{
    isAppropriate: boolean
    concerns: string[]
    suggestions: string[]
  }> {
    console.log('Mock: Validating story content')
    return {
      isAppropriate: true,
      concerns: [],
      suggestions: []
    }
  }

  async generateIllustration(prompt: IllustrationPrompt): Promise<GeneratedIllustration> {
    console.log('Mock: Generating illustration for prompt:', prompt)
    return {
      url: 'https://via.placeholder.com/512x512?text=Illustration',
      prompt: prompt.prompt,
      seed: Math.floor(Math.random() * 1000000),
      metadata: {
        model: 'mock',
        generatedAt: new Date().toISOString()
      }
    }
  }

  async generateBatchIllustrations(prompts: IllustrationPrompt[]): Promise<GeneratedIllustration[]> {
    console.log('Mock: Generating batch illustrations')
    return Promise.all(prompts.map(p => this.generateIllustration(p)))
  }
}

export const mockChildrensBookAI = new MockChildrensBookAI()