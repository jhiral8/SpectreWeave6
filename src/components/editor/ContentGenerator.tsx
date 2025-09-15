'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { Toolbar } from '@/components/ui/Toolbar'
import { Icon } from '@/components/ui/Icon'
import { useAI } from '@/hooks/useAI'
import { promptEngine, WRITING_STYLES, CONTENT_TYPES } from '@/lib/ai/promptTemplates'
import { resilientAIService } from '@/lib/ai/resilientAIService'
import { cn } from '@/lib/utils'

interface ContentGeneratorProps {
  editor: Editor
  className?: string
}

interface GenerationRequest {
  type: 'outline' | 'expansion' | 'summary' | 'rewrite' | 'creative' | 'research'
  topic?: string
  style?: string
  tone?: string
  length?: 'short' | 'medium' | 'long'
  context?: string
  keywords?: string[]
  targetAudience?: string
}

interface GeneratedContent {
  id: string
  type: string
  content: string
  metadata: {
    wordCount: number
    readingTime: number
    style: string
    provider: string
  }
  timestamp: number
}

const GENERATION_TYPES = {
  outline: {
    name: 'Create Outline',
    description: 'Generate structured outline',
    icon: 'List',
    prompt: (req: GenerationRequest) => `Create a comprehensive outline for: "${req.topic}"

Style: ${req.style || 'Professional'}
Target Audience: ${req.targetAudience || 'General'}
Tone: ${req.tone || 'Informative'}

Requirements:
- Create a logical hierarchical structure
- Include main points and sub-points
- Ensure flow and progression
- Add brief descriptions for each section
- Use clear, descriptive headings

Outline:`
  },
  
  expansion: {
    name: 'Expand Content',
    description: 'Develop ideas into full content',
    icon: 'FileText',
    prompt: (req: GenerationRequest) => `Expand the following topic into ${req.length || 'medium'} length content:

Topic: ${req.topic}
Style: ${req.style || 'Professional'}
Tone: ${req.tone || 'Engaging'}
Target Audience: ${req.targetAudience || 'General'}
${req.keywords ? `Keywords to include: ${req.keywords.join(', ')}` : ''}

Requirements:
- Develop the topic thoroughly
- Include relevant examples and details
- Maintain consistent tone and style
- Ensure readability and engagement
- Structure with clear paragraphs

Expanded Content:`
  },

  summary: {
    name: 'Generate Summary',
    description: 'Create concise summaries',
    icon: 'FileText',
    prompt: (req: GenerationRequest) => {
      const currentText = req.context || ''
      return `Create a ${req.length || 'medium'} length summary of the following content:

Content to summarize:
${currentText}

Style: ${req.style || 'Professional'}
Focus: Key points, main ideas, and important conclusions

Requirements:
- Capture essential information
- Maintain original context and meaning
- Use clear, concise language
- Structure logically
- Highlight key takeaways

Summary:`
    }
  },

  rewrite: {
    name: 'Rewrite Content',
    description: 'Transform content style',
    icon: 'Edit',
    prompt: (req: GenerationRequest) => {
      const currentText = req.context || ''
      return `Rewrite the following content with these specifications:

Original Content:
${currentText}

New Style: ${req.style || 'Professional'}
New Tone: ${req.tone || 'Engaging'}
Target Audience: ${req.targetAudience || 'General'}
Length: ${req.length || 'maintain similar'}

Requirements:
- Transform style and tone as specified
- Maintain core information and meaning
- Adapt language for target audience
- Ensure clarity and engagement
- Keep factual accuracy

Rewritten Content:`
    }
  },

  creative: {
    name: 'Creative Writing',
    description: 'Generate creative content',
    icon: 'Sparkles',
    prompt: (req: GenerationRequest) => `Create creative content based on:

Topic/Theme: ${req.topic}
Style: ${req.style || 'Creative'}
Tone: ${req.tone || 'Engaging'}
Length: ${req.length || 'medium'}
${req.keywords ? `Elements to include: ${req.keywords.join(', ')}` : ''}

Requirements:
- Use vivid, descriptive language
- Include sensory details
- Create engaging narrative or content
- Show creativity and originality
- Maintain readability

Creative Content:`
  },

  research: {
    name: 'Research Brief',
    description: 'Create research framework',
    icon: 'Search',
    prompt: (req: GenerationRequest) => `Create a research brief for: "${req.topic}"

Research Focus: ${req.context || 'General research'}
Target Audience: ${req.targetAudience || 'Researchers'}
Scope: ${req.length || 'Comprehensive'}

Requirements:
- Define research objectives
- Identify key questions to explore
- Suggest research methodologies
- List potential sources and resources
- Outline expected outcomes
- Include timeline considerations

Research Brief:`
  }
}

const STYLE_OPTIONS = Object.entries(WRITING_STYLES).map(([key, style]) => ({
  id: key,
  name: style.name,
  description: style.description
}))

const TONE_OPTIONS = [
  { id: 'professional', name: 'Professional', description: 'Formal and business-like' },
  { id: 'casual', name: 'Casual', description: 'Relaxed and conversational' },
  { id: 'academic', name: 'Academic', description: 'Scholarly and precise' },
  { id: 'persuasive', name: 'Persuasive', description: 'Compelling and convincing' },
  { id: 'informative', name: 'Informative', description: 'Clear and educational' },
  { id: 'engaging', name: 'Engaging', description: 'Interesting and captivating' },
  { id: 'authoritative', name: 'Authoritative', description: 'Expert and confident' }
]

const LENGTH_OPTIONS = [
  { id: 'short', name: 'Short', description: '100-300 words' },
  { id: 'medium', name: 'Medium', description: '300-800 words' },
  { id: 'long', name: 'Long', description: '800+ words' }
]

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  editor,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [generationType, setGenerationType] = useState<keyof typeof GENERATION_TYPES>('outline')
  const [request, setRequest] = useState<GenerationRequest>({
    type: 'outline',
    style: 'professional',
    tone: 'informative',
    length: 'medium'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { generateText, isLoading } = useAI({ provider: 'gemini' })

  // Generate content
  const generateContent = useCallback(async () => {
    if (!request.topic && generationType !== 'summary' && generationType !== 'rewrite') {
      return
    }

    setIsGenerating(true)

    try {
      const generationConfig = GENERATION_TYPES[generationType]
      const currentText = editor.getText()
      
      const generationRequest: GenerationRequest = {
        ...request,
        type: generationType,
        context: ['summary', 'rewrite'].includes(generationType) ? currentText : request.context
      }

      const prompt = generationConfig.prompt(generationRequest)
      
      const response = await resilientAIService.generateText({
        prompt,
        provider: 'gemini',
        options: {
          maxTokens: request.length === 'short' ? 500 : request.length === 'medium' ? 1200 : 2000,
          temperature: generationType === 'creative' ? 0.8 : 0.6
        }
      })

      if (response.success && response.data) {
        const wordCount = response.data.split(/\s+/).length
        const readingTime = Math.ceil(wordCount / 200)

        const newContent: GeneratedContent = {
          id: `generated-${Date.now()}`,
          type: generationType,
          content: response.data,
          metadata: {
            wordCount,
            readingTime,
            style: request.style || 'professional',
            provider: response.provider
          },
          timestamp: Date.now()
        }

        setGeneratedContent(prev => [newContent, ...prev.slice(0, 9)]) // Keep last 10
        
        // Insert content into editor
        const insertPosition = editor.state.selection.from
        editor
          .chain()
          .focus()
          .setTextSelection(insertPosition)
          .insertContent(`\\n\\n${response.data}\\n\\n`)
          .run()
      }
    } catch (error) {
      console.error('Content generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [editor, generationType, request])

  // Insert generated content
  const insertContent = useCallback((content: GeneratedContent) => {
    const insertPosition = editor.state.selection.from
    editor
      .chain()
      .focus()
      .setTextSelection(insertPosition)
      .insertContent(`\\n\\n${content.content}\\n\\n`)
      .run()
    
    setIsOpen(false)
  }, [editor])

  // Update request field
  const updateRequest = useCallback((field: keyof GenerationRequest, value: any) => {
    setRequest(prev => ({ ...prev, [field]: value }))
  }, [])

  // Parse keywords from string
  const parseKeywords = useCallback((keywordString: string): string[] => {
    return keywordString
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
  }, [])

  const currentGenerationType = GENERATION_TYPES[generationType]

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Content Generator Toggle Button */}
      <Toolbar.Button
        onClick={() => setIsOpen(!isOpen)}
        active={isOpen}
        disabled={isGenerating || isLoading}
      >
        <Icon name="PlusCircle" />
        {(isGenerating || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="Loader2" className="w-4 h-4 animate-spin" />
          </div>
        )}
      </Toolbar.Button>

      {/* Content Generation Panel */}
      {isOpen && (
        <Surface className="absolute bottom-full right-0 mb-2 w-[480px] max-h-[600px] p-4 z-50 shadow-lg overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">AI Content Generator</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  buttonSize="iconSmall"
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(showHistory && 'bg-neutral-100 dark:bg-neutral-800')}
                >
                  <Icon name="History" className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  buttonSize="iconSmall"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon name="X" />
                </Button>
              </div>
            </div>

            {showHistory ? (
              /* Generation History */
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Recent Generations
                </h4>
                {generatedContent.length === 0 ? (
                  <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                    No generated content yet
                  </div>
                ) : (
                  generatedContent.map((content) => (
                    <div key={content.id} className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon name={GENERATION_TYPES[content.type as keyof typeof GENERATION_TYPES]?.icon as any} className="w-4 h-4" />
                          <span className="text-sm font-medium capitalize">{content.type}</span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {content.metadata.wordCount} words
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          buttonSize="iconSmall"
                          onClick={() => insertContent(content)}
                        >
                          <Icon name="Plus" className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3">
                        {content.content.substring(0, 150)}...
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Generation Interface */
              <>
                {/* Generation Type Selection */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    Content Type
                  </h4>
                  <div className="grid grid-cols-3 gap-1">
                    {Object.entries(GENERATION_TYPES).map(([key, config]) => (
                      <Button
                        key={key}
                        variant={generationType === key ? 'primary' : 'tertiary'}
                        buttonSize="small"
                        onClick={() => {
                          setGenerationType(key as keyof typeof GENERATION_TYPES)
                          updateRequest('type', key)
                        }}
                        className="flex flex-col items-center gap-1 p-2 text-xs h-auto"
                      >
                        <Icon name={config.icon as any} className="w-4 h-4" />
                        <span className="text-center leading-tight">{config.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Topic/Content Input */}
                {generationType !== 'summary' && generationType !== 'rewrite' && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      Topic or Subject
                    </h4>
                    <textarea
                      value={request.topic || ''}
                      onChange={(e) => updateRequest('topic', e.target.value)}
                      placeholder="Enter the topic or subject you want to generate content about..."
                      className="w-full h-16 px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                )}

                {/* Style and Tone Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      Writing Style
                    </h4>
                    <select
                      value={request.style || 'professional'}
                      onChange={(e) => updateRequest('style', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                      {STYLE_OPTIONS.map((style) => (
                        <option key={style.id} value={style.id}>
                          {style.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      Tone
                    </h4>
                    <select
                      value={request.tone || 'informative'}
                      onChange={(e) => updateRequest('tone', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                      {TONE_OPTIONS.map((tone) => (
                        <option key={tone.id} value={tone.id}>
                          {tone.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Length and Target Audience */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      Length
                    </h4>
                    <select
                      value={request.length || 'medium'}
                      onChange={(e) => updateRequest('length', e.target.value as 'short' | 'medium' | 'long')}
                      className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                      {LENGTH_OPTIONS.map((length) => (
                        <option key={length.id} value={length.id}>
                          {length.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      Target Audience
                    </h4>
                    <input
                      type="text"
                      value={request.targetAudience || ''}
                      onChange={(e) => updateRequest('targetAudience', e.target.value)}
                      placeholder="e.g., General public, Professionals, Students"
                      className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>

                {/* Keywords (for creative and expansion types) */}
                {(generationType === 'creative' || generationType === 'expansion') && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      Keywords/Elements (optional)
                    </h4>
                    <input
                      type="text"
                      value={request.keywords?.join(', ') || ''}
                      onChange={(e) => updateRequest('keywords', parseKeywords(e.target.value))}
                      placeholder="Enter keywords or elements separated by commas"
                      className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  variant="primary"
                  buttonSize="medium"
                  onClick={generateContent}
                  disabled={
                    isGenerating || 
                    isLoading || 
                    (!request.topic && !['summary', 'rewrite'].includes(generationType))
                  }
                  className="w-full"
                >
                  {isGenerating || isLoading ? (
                    <>
                      <Icon name="Loader2" className="w-4 h-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icon name={currentGenerationType.icon as any} className="w-4 h-4 mr-2" />
                      {currentGenerationType.name}
                    </>
                  )}
                </Button>

                {/* Current Content Info */}
                {(['summary', 'rewrite'].includes(generationType)) && (
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 p-2 bg-neutral-100 dark:bg-neutral-800 rounded">
                    Will work with current document content ({editor.getText().split(/\s+/).length} words)
                  </div>
                )}
              </>
            )}
          </div>
        </Surface>
      )}
    </div>
  )
}

export default ContentGenerator