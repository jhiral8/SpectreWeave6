/**
 * Children's Book AI Service
 * 
 * Extends SpectreWeaveAIBridge with children's book specific functionality
 * Reuses code patterns from SpectreWeave3's generate-story.ts
 */

import { spectreWeaveAIBridge, type AIGenerationOptions } from './spectreWeaveAIBridge'
import type { AIResponse } from './types'
import { characterLockService, type CharacterProfile, type CharacterGenerationConfig } from './characterLock'

// Types from SpectreWeave3 (reused)
export interface StoryPrompt {
  title: string
  authorStyle: FamousAuthorStyle
  ageGroup: AgeGroup
  genre: BookGenre
  theme: BookTheme
  characterName?: string
  setting?: string
  conflict?: string
  moralLesson?: string
  customInstructions?: string
  // Character lock system integration
  projectId?: string
  useCharacterLock?: boolean
  characterDescription?: string
}

export type FamousAuthorStyle = 
  | 'dr-seuss' | 'roald-dahl' | 'maurice-sendak' | 'shel-silverstein'
  | 'eric-carle' | 'margaret-wise-brown' | 'beatrix-potter' | 'a-a-milne'
  | 'judy-blume' | 'rick-riordan'

export type AgeGroup = '0-2' | '3-5' | '6-8' | '9-12' | 'teen'

export type BookGenre = 'adventure' | 'fantasy' | 'educational' | 'humor' | 'mystery' | 'friendship'

export type BookTheme = 
  | 'magical-forest' | 'underwater-adventure' | 'space-exploration' 
  | 'fairy-tale-castle' | 'animal-kingdom' | 'modern-city' 
  | 'pirate-adventure' | 'superhero' | 'prehistoric' | 'winter-wonderland'

export interface StoryPage {
  pageNumber: number
  text: string
  illustrationPrompt: string
}

export interface GeneratedStory {
  title: string
  pages: StoryPage[]
  authorStyle: FamousAuthorStyle
  ageGroup: AgeGroup
  totalPages: number
  metadata?: {
    generatedAt: string
    genre: BookGenre
    theme: BookTheme
    characterId?: string
    consistencyScores?: number[]
  }
}

// Author style prompts (reused from SpectreWeave3)
const authorStylePrompts: Record<FamousAuthorStyle, string> = {
  'dr-seuss': 'Write in the whimsical, rhyming style of Dr. Seuss with made-up words, playful language, and colorful characters. Use simple vocabulary suitable for young children.',
  'roald-dahl': 'Write in the imaginative, slightly darkly humorous style of Roald Dahl with vivid descriptions, quirky characters, and unexpected plot twists.',
  'maurice-sendak': 'Write in the dreamlike, slightly mysterious style of Maurice Sendak with rich imagery, emotional depth, and themes of imagination and adventure.',
  'shel-silverstein': 'Write in the simple, profound, and often humorous style of Shel Silverstein with clear language, meaningful messages, and gentle wisdom.',
  'eric-carle': 'Write in the simple, repetitive, and educational style of Eric Carle with clear language, learning themes, and gentle storytelling.',
  'margaret-wise-brown': 'Write in the gentle, soothing style of Margaret Wise Brown with simple language, calming rhythms, and themes of comfort and security.',
  'beatrix-potter': 'Write in the charming, detailed style of Beatrix Potter with anthropomorphic animals, rich descriptions, and gentle adventures.',
  'a-a-milne': 'Write in the warm, whimsical style of A.A. Milne with gentle humor, friendship themes, and simple but elegant language.',
  'judy-blume': 'Write in the relatable, honest style of Judy Blume with realistic characters, everyday situations, and themes of growing up.',
  'rick-riordan': 'Write in the adventurous, fast-paced style of Rick Riordan with action, mythology references, and engaging dialogue.'
}

// Age-appropriate content guidelines (reused from SpectreWeave3)
const ageAppropriateGuidelines: Record<AgeGroup, string> = {
  '0-2': 'Use very simple language, short sentences, repetitive patterns, bright colors, and gentle themes. Focus on basic concepts like counting, colors, and simple emotions.',
  '3-5': 'Use clear language, engaging characters, simple plots, and educational elements. Include themes of friendship, discovery, and basic problem-solving.',
  '6-8': 'Use clear language, engaging characters, simple plots, and educational elements. Include themes of friendship, discovery, and basic problem-solving.',
  '9-12': 'Use more complex language, detailed characters, engaging plots, and themes of adventure, friendship, and personal growth.',
  'teen': 'Use sophisticated language, complex characters, nuanced plots, and themes of identity, relationships, and personal challenges.'
}

export class ChildrensBookAI {
  constructor() {}

  /**
   * Generate a children's story with character consistency
   */
  async generateStoryWithCharacterLock(prompt: StoryPrompt): Promise<GeneratedStory> {
    try {
      await spectreWeaveAIBridge.initialize()

      let characterProfile: CharacterProfile | null = null
      let characterId: string | undefined

      // Initialize character if character lock is enabled
      if (prompt.useCharacterLock && prompt.characterName && prompt.projectId) {
        try {
          // Try to find existing character or create new one
          const existingCharacters = await characterLockService.getProjectCharacters(prompt.projectId)
          characterProfile = existingCharacters.find(
            char => char.name.toLowerCase() === prompt.characterName!.toLowerCase()
          ) || null

          if (!characterProfile && prompt.characterDescription) {
            // Create new character profile
            characterProfile = await characterLockService.createCharacterProfile(
              prompt.projectId,
              {
                name: prompt.characterName,
                description: prompt.characterDescription,
                visualDescription: prompt.characterDescription,
                personality: [],
                role: 'protagonist'
              }
            )
          }

          characterId = characterProfile?.id
        } catch (error) {
          console.warn('Character lock initialization failed, continuing without:', error)
        }
      }

      // Generate story content
      const storyPrompt = this.buildStoryPrompt(prompt, characterProfile)
      const response = await spectreWeaveAIBridge.generateText(
        storyPrompt,
        {
          temperature: 0.8,
          maxTokens: 2048,
        },
        {
          capability: 'creative',
          prioritizeQuality: true,
          maxCost: 0.50,
        }
      )

      if (!response.success || !response.content) {
        throw new Error('Failed to generate story content')
      }

      // Parse the generated story into structured pages
      let pages = this.parseStoryIntoPages(response.content)

      // Enhance illustration prompts with character consistency if character lock is available
      const consistencyScores: number[] = []
      if (characterProfile && prompt.characterName) {
        try {
          const enhancedPages = await this.enhanceIllustrationPromptsWithCharacterLock(
            pages,
            prompt.characterName,
            characterProfile,
            prompt.theme
          )
          
          pages = enhancedPages.map(p => ({
            pageNumber: p.pageNumber,
            text: p.text,
            illustrationPrompt: p.illustrationPrompt
          }))
          
          consistencyScores.push(...enhancedPages.map(p => p.consistency_score))
        } catch (error) {
          console.warn('Character lock enhancement failed, using basic prompts:', error)
        }
      }

      const story: GeneratedStory = {
        title: prompt.title,
        pages,
        authorStyle: prompt.authorStyle,
        ageGroup: prompt.ageGroup,
        totalPages: pages.length,
        metadata: {
          generatedAt: new Date().toISOString(),
          genre: prompt.genre,
          theme: prompt.theme,
          characterId,
          consistencyScores: consistencyScores.length > 0 ? consistencyScores : undefined
        }
      }

      return story

    } catch (error) {
      console.error('Error generating story with character lock:', error)
      // Fallback to basic story generation
      return this.generateStory(prompt)
    }
  }

  /**
   * Generate a children's story using the SpectreWeave AI Bridge
   * Integrates author styles and age-appropriate guidelines from SpectreWeave3
   */
  async generateStory(prompt: StoryPrompt): Promise<GeneratedStory> {
    try {
      await spectreWeaveAIBridge.initialize()

      // Build the story generation prompt using SpectreWeave3 patterns
      const storyPrompt = this.buildStoryPrompt(prompt)

      // Generate story using SpectreWeave5's intelligent AI routing
      const response = await spectreWeaveAIBridge.generateText(
        storyPrompt,
        {
          temperature: 0.8,
          maxTokens: 2048,
        },
        {
          capability: 'creative',
          prioritizeQuality: true,
          maxCost: 0.50, // Reasonable cost limit for children's books
        }
      )

      if (!response.success || !response.content) {
        throw new Error('Failed to generate story content')
      }

      // Parse the generated story into structured pages
      const pages = this.parseStoryIntoPages(response.content)

      const story: GeneratedStory = {
        title: prompt.title,
        pages,
        authorStyle: prompt.authorStyle,
        ageGroup: prompt.ageGroup,
        totalPages: pages.length,
        metadata: {
          generatedAt: new Date().toISOString(),
          genre: prompt.genre,
          theme: prompt.theme,
        }
      }

      return story

    } catch (error) {
      console.error('Error generating children\'s story:', error)
      throw error
    }
  }

  /**
   * Generate illustration prompts for existing story pages
   */
  async generateIllustrationPrompts(
    pages: StoryPage[],
    theme: BookTheme,
    illustrationStyle: string
  ): Promise<StoryPage[]> {
    try {
      await spectreWeaveAIBridge.initialize()

      const enhancedPages = await Promise.all(
        pages.map(async (page) => {
          if (page.illustrationPrompt) {
            // If illustration prompt already exists, enhance it
            const prompt = `Enhance this illustration prompt for a children's book with ${theme} theme and ${illustrationStyle} style:
"${page.illustrationPrompt}"

Story text: "${page.text}"

Create a detailed, artistic prompt that captures the scene's mood and visual elements.`

            const response = await spectreWeaveAIBridge.generateText(
              prompt,
              { temperature: 0.7, maxTokens: 150 },
              { capability: 'creative', prioritizeSpeed: true }
            )

            return {
              ...page,
              illustrationPrompt: response.content || page.illustrationPrompt
            }
          }
          return page
        })
      )

      return enhancedPages

    } catch (error) {
      console.error('Error generating illustration prompts:', error)
      return pages // Return original pages on error
    }
  }

  /**
   * Validate story content for age appropriateness and safety
   */
  async validateStoryContent(story: GeneratedStory): Promise<{
    isAppropriate: boolean
    concerns: string[]
    suggestions: string[]
  }> {
    try {
      await spectreWeaveAIBridge.initialize()

      const validationPrompt = `Validate this children's story for age group ${story.ageGroup}:

Title: ${story.title}
Author Style: ${story.authorStyle}

Story Content:
${story.pages.map(p => `Page ${p.pageNumber}: ${p.text}`).join('\n')}

Check for:
1. Age-appropriate language and concepts
2. Safety concerns or inappropriate content
3. Educational value and positive messaging
4. Consistency with chosen author style

Respond with JSON format:
{
  "isAppropriate": true/false,
  "concerns": ["concern 1", "concern 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`

      const response = await spectreWeaveAIBridge.generateText(
        validationPrompt,
        {
          temperature: 0.3,
          maxTokens: 500,
          format: 'json',
        },
        {
          capability: 'analytical',
          prioritizeQuality: true,
        }
      )

      try {
        const validation = JSON.parse(response.content || '{}')
        return {
          isAppropriate: validation.isAppropriate || false,
          concerns: validation.concerns || [],
          suggestions: validation.suggestions || []
        }
      } catch (parseError) {
        // Fallback to basic validation
        return {
          isAppropriate: true,
          concerns: [],
          suggestions: ['Story generated successfully but validation parsing failed']
        }
      }

    } catch (error) {
      console.error('Error validating story content:', error)
      return {
        isAppropriate: false,
        concerns: ['Validation failed due to technical error'],
        suggestions: ['Please try generating the story again']
      }
    }
  }

  /**
   * Enhance illustration prompts with character lock system
   */
  private async enhanceIllustrationPromptsWithCharacterLock(
    pages: StoryPage[],
    characterName: string,
    characterProfile: CharacterProfile,
    theme: BookTheme
  ): Promise<Array<{ pageNumber: number; text: string; illustrationPrompt: string; consistency_score: number }>> {
    try {
      // Use the character lock service to generate consistent illustrations
      const enhancedPages = await characterLockService.generateConsistentIllustrations?.(
        pages,
        characterName,
        `children's book illustration, ${theme} theme`
      )

      if (enhancedPages) {
        return enhancedPages
      }

      // Fallback: manual prompt enhancement
      return pages.map(page => ({
        pageNumber: page.pageNumber,
        text: page.text,
        illustrationPrompt: this.enhancePromptWithCharacterDetails(
          page.illustrationPrompt,
          characterProfile
        ),
        consistency_score: 0.8 // Estimated score for manual enhancement
      }))

    } catch (error) {
      console.warn('Character lock service unavailable, using fallback enhancement:', error)
      
      // Fallback: manual prompt enhancement
      return pages.map(page => ({
        pageNumber: page.pageNumber,
        text: page.text,
        illustrationPrompt: this.enhancePromptWithCharacterDetails(
          page.illustrationPrompt,
          characterProfile
        ),
        consistency_score: 0.7 // Lower score for fallback
      }))
    }
  }

  /**
   * Manually enhance prompt with character details (fallback when CLIP is unavailable)
   */
  private enhancePromptWithCharacterDetails(
    originalPrompt: string,
    characterProfile: CharacterProfile
  ): string {
    let enhancedPrompt = originalPrompt

    // Replace character name with detailed description
    const characterName = characterProfile.name
    if (enhancedPrompt.toLowerCase().includes(characterName.toLowerCase())) {
      const detailedDescription = `${characterName} (${characterProfile.visualDescription})`
      const nameRegex = new RegExp(characterName, 'gi')
      enhancedPrompt = enhancedPrompt.replace(nameRegex, detailedDescription)
    }

    // Add consistency instructions
    enhancedPrompt += `. IMPORTANT: Maintain visual consistency - ${characterName} must look identical to previous illustrations. ${characterProfile.visualDescription}`

    return enhancedPrompt
  }

  /**
   * Build story prompt using SpectreWeave3 patterns with optional character lock
   */
  private buildStoryPrompt(prompt: StoryPrompt, characterProfile?: CharacterProfile | null): string {
    const authorPrompt = authorStylePrompts[prompt.authorStyle]
    const ageGuidelines = ageAppropriateGuidelines[prompt.ageGroup]
    
    let storyPrompt = `Create a children's story with the following requirements:

Title: "${prompt.title}"
Author Style: ${authorPrompt}
Age Group: ${ageGuidelines}
Genre: ${prompt.genre}
Theme: ${prompt.theme}`

    if (prompt.characterName) {
      if (characterProfile) {
        storyPrompt += `\nMain Character: ${prompt.characterName} - ${characterProfile.visualDescription}`
        if (characterProfile.personality.length > 0) {
          storyPrompt += `\nCharacter Personality: ${characterProfile.personality.join(', ')}`
        }
      } else {
        storyPrompt += `\nMain Character: ${prompt.characterName}`
        if (prompt.characterDescription) {
          storyPrompt += ` - ${prompt.characterDescription}`
        }
      }
    }
    
    if (prompt.setting) {
      storyPrompt += `\nSetting: ${prompt.setting}`
    }
    
    if (prompt.conflict) {
      storyPrompt += `\nConflict: ${prompt.conflict}`
    }

    if (prompt.moralLesson) {
      storyPrompt += `\nMoral Lesson: ${prompt.moralLesson}`
    }

    if (prompt.customInstructions) {
      storyPrompt += `\nAdditional Instructions: ${prompt.customInstructions}`
    }

    // Encourage inline citations tied to supplied context cues
    storyPrompt += `\n\nContext Integration & Citations:\n- If any context lines are provided that include cues like [G] (graph) or [V] (vector), weave relevant facts naturally into the story.\n- When you use a fact from a context line, add a short inline citation token right after the sentence using the following format: [G:NodeName] for graph facts or [V:Category] for vector facts. Example: \'The ruins lay deep in the forest. [G:Ancient Temple]\'\n- Keep citations brief (one per sentence when relevant) and only where context was actually used.\n- Do not copy or list the raw context lines in the story; paraphrase them into natural storytelling.\n- Limit total citations to at most 1–2 per page.`

    storyPrompt += `

Please create a story with 6-8 pages, each page containing 2-3 sentences suitable for the specified age group. Format the response as:

Page 1:
[Story text for page 1]
Illustration: [Description of what should be illustrated]

Page 2:
[Story text for page 2]
Illustration: [Description of what should be illustrated]

And so on...

Make sure the story is engaging, age-appropriate, and follows the specified author's style.`

    return storyPrompt
  }

  /**
   * Parse generated story text into structured pages (reused from SpectreWeave3)
   */
  private parseStoryIntoPages(generatedStory: string): StoryPage[] {
    const pages: StoryPage[] = []
    const pageRegex = /Page (\d+):\s*\n([\s\S]*?)(?=Page \d+:|$)/g
    let match
    let pageNumber = 1

    while ((match = pageRegex.exec(generatedStory)) !== null) {
      const pageText = match[2].trim()
      const lines = pageText.split('\n')
      
      let text = ''
      let illustrationPrompt = ''
      
      for (const line of lines) {
        if (line.toLowerCase().startsWith('illustration:')) {
          illustrationPrompt = line.replace(/^illustration:\s*/i, '').trim()
        } else if (line.trim()) {
          text += line.trim() + ' '
        }
      }
      
      pages.push({
        pageNumber: pageNumber++,
        text: text.trim(),
        illustrationPrompt: illustrationPrompt || `Illustration for: ${text.trim()}`
      })
    }

    // If parsing failed, create a simple structure (fallback from SpectreWeave3)
    if (pages.length === 0) {
      const sentences = generatedStory.split(/[.!?]+/).filter(s => s.trim().length > 10)
      const sentencesPerPage = Math.ceil(sentences.length / 6)
      
      for (let i = 0; i < sentences.length; i += sentencesPerPage) {
        const pageSentences = sentences.slice(i, i + sentencesPerPage)
        pages.push({
          pageNumber: Math.floor(i / sentencesPerPage) + 1,
          text: pageSentences.join('. ') + '.',
          illustrationPrompt: `Illustration for: ${pageSentences.join(' ')}`
        })
      }
    }

    return pages
  }

  /**
   * Get available author styles with descriptions
   */
  getAuthorStyles(): Array<{ value: FamousAuthorStyle; label: string; description: string }> {
    return [
      { value: 'dr-seuss', label: 'Dr. Seuss', description: 'Whimsical rhymes and fantastical creatures' },
      { value: 'roald-dahl', label: 'Roald Dahl', description: 'Imaginative adventures with unexpected twists' },
      { value: 'maurice-sendak', label: 'Maurice Sendak', description: 'Emotionally rich stories exploring inner worlds' },
      { value: 'eric-carle', label: 'Eric Carle', description: 'Nature-focused educational stories' },
      { value: 'beatrix-potter', label: 'Beatrix Potter', description: 'Gentle animal tales in countryside settings' },
      { value: 'a-a-milne', label: 'A.A. Milne', description: 'Warm friendship stories with gentle humor' },
      { value: 'margaret-wise-brown', label: 'Margaret Wise Brown', description: 'Soothing bedtime stories with gentle rhythms' },
      { value: 'shel-silverstein', label: 'Shel Silverstein', description: 'Simple, meaningful stories with gentle wisdom' },
      { value: 'judy-blume', label: 'Judy Blume', description: 'Relatable stories about growing up and friendship' },
      { value: 'rick-riordan', label: 'Rick Riordan', description: 'Adventure-packed stories with mythological elements' },
    ]
  }
}

// Export singleton instance
export const childrensBookAI = new ChildrensBookAI()