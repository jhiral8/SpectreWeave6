/**
 * Comprehensive AI Prompt Templates System for SpectreWeave
 * Advanced prompt engineering with context awareness and style optimization
 */

import { AIProvider } from './types'

export interface PromptTemplate {
  id: string
  name: string
  description: string
  category: 'writing' | 'editing' | 'analysis' | 'creative' | 'business' | 'academic' | 'technical'
  provider?: AIProvider
  variables: string[]
  template: string
  examples?: Array<{
    input: Record<string, string>
    expectedOutput: string
  }>
  metadata: {
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    tokens: number
    temperature: number
    maxTokens: number
  }
}

export interface ContextualPrompt {
  base: string
  contextModifiers: Record<string, string>
  styleModifiers: Record<string, string>
  toneModifiers: Record<string, string>
}

// Core prompt templates organized by category
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  // Writing Category
  improveClarity: {
    id: 'improveClarity',
    name: 'Improve Clarity',
    description: 'Enhance text clarity and readability',
    category: 'writing',
    provider: 'gemini',
    variables: ['text', 'context', 'target_audience'],
    template: `Improve the clarity and readability of the following text while maintaining its original meaning and intent.

Target Audience: {target_audience}
Context: {context}

Original Text:
{text}

Requirements:
- Use clear, concise language
- Eliminate ambiguity
- Maintain the original tone
- Ensure proper flow and transitions
- Keep technical accuracy if applicable

Improved Text:`,
    metadata: {
      difficulty: 'beginner',
      tokens: 200,
      temperature: 0.3,
      maxTokens: 1000
    }
  },

  creativeExpansion: {
    id: 'creativeExpansion',
    name: 'Creative Expansion',
    description: 'Expand content with creative details',
    category: 'creative',
    provider: 'gemini',
    variables: ['text', 'style', 'genre', 'mood'],
    template: `Expand the following content with creative details, maintaining the specified style and mood.

Style: {style}
Genre: {genre}
Mood: {mood}

Original Content:
{text}

Expansion Requirements:
- Add vivid descriptions
- Include sensory details
- Develop character depth (if applicable)
- Enhance atmosphere
- Maintain narrative consistency
- Use engaging language

Expanded Content:`,
    metadata: {
      difficulty: 'intermediate',
      tokens: 250,
      temperature: 0.8,
      maxTokens: 1500
    }
  },

  // Business Category
  professionalTone: {
    id: 'professionalTone',
    name: 'Professional Business Tone',
    description: 'Convert text to professional business language',
    category: 'business',
    provider: 'azure',
    variables: ['text', 'business_context', 'recipient_level'],
    template: `Convert the following text to professional business language appropriate for {recipient_level} level communication.

Business Context: {business_context}
Recipient Level: {recipient_level}

Original Text:
{text}

Professional Requirements:
- Use formal business language
- Maintain respectful tone
- Include appropriate business courtesies
- Ensure clarity and directness
- Follow business communication standards
- Remove casual expressions

Professional Version:`,
    metadata: {
      difficulty: 'beginner',
      tokens: 180,
      temperature: 0.2,
      maxTokens: 800
    }
  },

  // Academic Category
  academicWriting: {
    id: 'academicWriting',
    name: 'Academic Writing Enhancement',
    description: 'Transform text into academic style',
    category: 'academic',
    provider: 'databricks',
    variables: ['text', 'field', 'academic_level', 'citation_style'],
    template: `Transform the following text into academic writing style appropriate for {academic_level} level in the field of {field}.

Field: {field}
Academic Level: {academic_level}
Citation Style: {citation_style}

Original Text:
{text}

Academic Requirements:
- Use formal academic language
- Include appropriate terminology
- Maintain objective tone
- Structure arguments logically
- Use evidence-based statements
- Follow {citation_style} format conventions
- Avoid colloquialisms and contractions

Academic Version:`,
    metadata: {
      difficulty: 'advanced',
      tokens: 220,
      temperature: 0.1,
      maxTokens: 1200
    }
  },

  // Technical Category
  technicalDocumentation: {
    id: 'technicalDocumentation',
    name: 'Technical Documentation',
    description: 'Create clear technical documentation',
    category: 'technical',
    provider: 'databricks',
    variables: ['concept', 'audience', 'complexity_level', 'format'],
    template: `Create clear technical documentation for the following concept, tailored for {audience} with {complexity_level} complexity level.

Concept: {concept}
Target Audience: {audience}
Complexity Level: {complexity_level}
Format: {format}

Documentation Requirements:
- Start with clear overview
- Break down complex concepts
- Use appropriate technical terminology
- Include step-by-step instructions if applicable
- Add examples or use cases
- Maintain logical structure
- Ensure accuracy and completeness

Technical Documentation:`,
    metadata: {
      difficulty: 'advanced',
      tokens: 200,
      temperature: 0.2,
      maxTokens: 2000
    }
  },

  // Analysis Category
  contentAnalysis: {
    id: 'contentAnalysis',
    name: 'Content Analysis',
    description: 'Analyze content structure and effectiveness',
    category: 'analysis',
    provider: 'gemini',
    variables: ['text', 'analysis_focus', 'criteria'],
    template: `Analyze the following content focusing on {analysis_focus} using the specified criteria.

Analysis Focus: {analysis_focus}
Evaluation Criteria: {criteria}

Content to Analyze:
{text}

Analysis Requirements:
- Provide objective assessment
- Identify strengths and weaknesses
- Suggest specific improvements
- Rate effectiveness (1-10 scale)
- Include supporting evidence
- Maintain constructive tone

Analysis Report:`,
    metadata: {
      difficulty: 'intermediate',
      tokens: 300,
      temperature: 0.4,
      maxTokens: 1500
    }
  },

  // Editing Category
  grammarAndStyle: {
    id: 'grammarAndStyle',
    name: 'Grammar and Style Check',
    description: 'Comprehensive grammar and style review',
    category: 'editing',
    provider: 'azure',
    variables: ['text', 'style_guide', 'strictness_level'],
    template: `Perform a comprehensive grammar and style review of the following text according to {style_guide} guidelines with {strictness_level} strictness.

Style Guide: {style_guide}
Strictness Level: {strictness_level}

Text to Review:
{text}

Review Requirements:
- Check grammar, punctuation, and spelling
- Ensure style consistency
- Identify awkward phrasing
- Suggest improvements
- Maintain original meaning
- Follow {style_guide} conventions

Corrected Text:`,
    metadata: {
      difficulty: 'intermediate',
      tokens: 250,
      temperature: 0.1,
      maxTokens: 1000
    }
  }
}

// Contextual prompt builders for dynamic content generation
export const CONTEXTUAL_PROMPTS: Record<string, ContextualPrompt> = {
  adaptiveTone: {
    base: 'Rewrite the following text to match the specified tone and context requirements.',
    contextModifiers: {
      email: 'for email communication',
      presentation: 'for presentation delivery',
      report: 'for formal report inclusion',
      social: 'for social media posting',
      documentation: 'for technical documentation'
    },
    styleModifiers: {
      concise: 'using concise, direct language',
      detailed: 'with comprehensive details',
      conversational: 'in a conversational style',
      formal: 'in formal language',
      technical: 'with technical precision'
    },
    toneModifiers: {
      professional: 'maintaining a professional tone',
      friendly: 'with a friendly, approachable tone',
      authoritative: 'with an authoritative, expert tone',
      persuasive: 'using persuasive language',
      neutral: 'maintaining a neutral, objective tone'
    }
  },

  contentGeneration: {
    base: 'Generate content based on the specified parameters and requirements.',
    contextModifiers: {
      blog: 'for blog article publication',
      marketing: 'for marketing materials',
      educational: 'for educational content',
      news: 'for news article format',
      creative: 'for creative writing'
    },
    styleModifiers: {
      engaging: 'using engaging, compelling language',
      informative: 'with informative, factual content',
      storytelling: 'using narrative storytelling techniques',
      analytical: 'with analytical depth',
      practical: 'with practical, actionable content'
    },
    toneModifiers: {
      enthusiastic: 'with enthusiastic energy',
      serious: 'maintaining a serious tone',
      inspiring: 'with inspiring, motivational language',
      educational: 'in an educational, instructive tone',
      entertaining: 'with entertaining elements'
    }
  }
}

/**
 * Advanced prompt template engine
 */
export class PromptTemplateEngine {
  private templates: Record<string, PromptTemplate>

  constructor(customTemplates?: Record<string, PromptTemplate>) {
    this.templates = { ...PROMPT_TEMPLATES, ...customTemplates }
  }

  /**
   * Build a prompt from template with variable substitution
   */
  buildPrompt(templateId: string, variables: Record<string, string>): string {
    const template = this.templates[templateId]
    if (!template) {
      throw new Error(`Template '${templateId}' not found`)
    }

    let prompt = template.template
    
    // Substitute variables
    template.variables.forEach(variable => {
      const value = variables[variable] || `[${variable}]`
      const regex = new RegExp(`{${variable}}`, 'g')
      prompt = prompt.replace(regex, value)
    })

    return prompt
  }

  /**
   * Build contextual prompt with dynamic modifiers
   */
  buildContextualPrompt(
    promptKey: string,
    context: string,
    style: string,
    tone: string,
    content: string
  ): string {
    const contextualPrompt = CONTEXTUAL_PROMPTS[promptKey]
    if (!contextualPrompt) {
      throw new Error(`Contextual prompt '${promptKey}' not found`)
    }

    const contextMod = contextualPrompt.contextModifiers[context] || ''
    const styleMod = contextualPrompt.styleModifiers[style] || ''
    const toneMod = contextualPrompt.toneModifiers[tone] || ''

    return `${contextualPrompt.base} ${contextMod} ${styleMod} ${toneMod}

Content:
${content}

Result:`
  }

  /**
   * Get optimal settings for a template
   */
  getTemplateSettings(templateId: string) {
    const template = this.templates[templateId]
    if (!template) {
      throw new Error(`Template '${templateId}' not found`)
    }

    return {
      provider: template.provider,
      temperature: template.metadata.temperature,
      maxTokens: template.metadata.maxTokens
    }
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): PromptTemplate[] {
    return Object.values(this.templates).filter(template => template.category === category)
  }

  /**
   * Search templates by keyword
   */
  searchTemplates(keyword: string): PromptTemplate[] {
    const lowerKeyword = keyword.toLowerCase()
    return Object.values(this.templates).filter(template =>
      template.name.toLowerCase().includes(lowerKeyword) ||
      template.description.toLowerCase().includes(lowerKeyword)
    )
  }

  /**
   * Add custom template
   */
  addTemplate(template: PromptTemplate): void {
    this.templates[template.id] = template
  }

  /**
   * Remove template
   */
  removeTemplate(templateId: string): void {
    delete this.templates[templateId]
  }

  /**
   * Get all template categories
   */
  getCategories(): string[] {
    const categories = new Set(Object.values(this.templates).map(t => t.category))
    return Array.from(categories)
  }

  /**
   * Validate template variables
   */
  validateTemplate(templateId: string, variables: Record<string, string>): {
    valid: boolean
    missing: string[]
  } {
    const template = this.templates[templateId]
    if (!template) {
      return { valid: false, missing: ['Template not found'] }
    }

    const missing = template.variables.filter(variable => !variables[variable])
    return {
      valid: missing.length === 0,
      missing
    }
  }
}

// Export singleton instance
export const promptEngine = new PromptTemplateEngine()

// Writing style presets
export const WRITING_STYLES = {
  academic: {
    name: 'Academic',
    description: 'Formal, scholarly writing style',
    characteristics: ['formal tone', 'complex sentences', 'technical vocabulary', 'evidence-based']
  },
  business: {
    name: 'Business',
    description: 'Professional business communication',
    characteristics: ['clear', 'direct', 'professional', 'action-oriented']
  },
  creative: {
    name: 'Creative',
    description: 'Artistic, imaginative writing',
    characteristics: ['vivid imagery', 'emotional depth', 'varied sentence structure', 'metaphorical']
  },
  journalistic: {
    name: 'Journalistic',
    description: 'News and media style',
    characteristics: ['factual', 'concise', 'objective', 'structured']
  },
  conversational: {
    name: 'Conversational',
    description: 'Casual, friendly communication',
    characteristics: ['approachable', 'personal', 'simple language', 'engaging']
  },
  technical: {
    name: 'Technical',
    description: 'Precise, detailed documentation',
    characteristics: ['accurate', 'specific', 'logical flow', 'terminology-rich']
  }
}

// Content type templates
export const CONTENT_TYPES = {
  email: 'Professional email communication',
  article: 'Long-form article or blog post',
  report: 'Formal business or academic report',
  presentation: 'Presentation slides or speech',
  social: 'Social media content',
  documentation: 'Technical documentation',
  creative: 'Creative writing piece',
  marketing: 'Marketing and promotional content'
}

export default promptEngine