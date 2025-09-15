/**
 * Context Parsers for Framework Content Analysis
 * 
 * Intelligent parsing and extraction utilities for story framework content.
 * Converts unstructured framework text into structured data for AI context.
 */

import { 
  CharacterProfile,
  PlotElement,
  WorldElement,
  ThemeElement,
  StyleGuide,
  OutlineElement,
  FrameworkCategory
} from './dualSurfaceContextManager'

// Parsing configuration
export interface ParsingConfig {
  enableAIAssisted: boolean
  strictMode: boolean
  fallbackToKeywords: boolean
  confidenceThreshold: number
  maxElementsPerCategory: number
}

// Parsing result with confidence
export interface ParsedElement<T> {
  element: T
  confidence: number
  source: 'structured' | 'ai-extracted' | 'keyword-matched'
  sourceText: string
}

// HTML structure patterns for different framework elements
export interface ElementPattern {
  category: FrameworkCategory
  selectors: string[]
  keywordPatterns: RegExp[]
  structureValidators: ((element: Element) => boolean)[]
  extractors: ((element: Element) => any)[]
}

/**
 * Main Context Parser Class
 */
export class ContextParser {
  private config: ParsingConfig
  private patterns: Map<FrameworkCategory, ElementPattern>

  constructor(config: Partial<ParsingConfig> = {}) {
    this.config = {
      enableAIAssisted: true,
      strictMode: false,
      fallbackToKeywords: true,
      confidenceThreshold: 0.6,
      maxElementsPerCategory: 20,
      ...config
    }

    this.patterns = new Map()
    this.initializePatterns()
  }

  /**
   * Parse complete framework content
   */
  async parseFrameworkContent(htmlContent: string): Promise<{
    characters: ParsedElement<CharacterProfile>[]
    plotElements: ParsedElement<PlotElement>[]
    worldBuilding: ParsedElement<WorldElement>[]
    themes: ParsedElement<ThemeElement>[]
    styleGuides: ParsedElement<StyleGuide>[]
    outlines: ParsedElement<OutlineElement>[]
  }> {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')

    const results = {
      characters: await this.parseCharacters(doc),
      plotElements: await this.parsePlotElements(doc),
      worldBuilding: await this.parseWorldBuilding(doc),
      themes: await this.parseThemes(doc),
      styleGuides: await this.parseStyleGuides(doc),
      outlines: await this.parseOutlines(doc)
    }

    // Apply limits
    Object.keys(results).forEach(key => {
      const elements = (results as any)[key]
      if (elements.length > this.config.maxElementsPerCategory) {
        (results as any)[key] = elements
          .sort((a: any, b: any) => b.confidence - a.confidence)
          .slice(0, this.config.maxElementsPerCategory)
      }
    })

    return results
  }

  /**
   * Parse character profiles from framework content
   */
  async parseCharacters(doc: Document): Promise<ParsedElement<CharacterProfile>[]> {
    const characters: ParsedElement<CharacterProfile>[] = []
    const pattern = this.patterns.get('character')!

    // 1. Try structured parsing first
    const structuredChars = this.parseStructuredElements(doc, pattern, 'character')
    characters.push(...structuredChars)

    // 2. Try AI-assisted extraction if enabled
    if (this.config.enableAIAssisted && characters.length < 3) {
      const aiChars = await this.aiAssistedCharacterExtraction(doc)
      characters.push(...aiChars)
    }

    // 3. Fallback to keyword matching
    if (this.config.fallbackToKeywords && characters.length < 2) {
      const keywordChars = this.keywordBasedCharacterExtraction(doc)
      characters.push(...keywordChars)
    }

    return this.deduplicateAndFilter(characters)
  }

  /**
   * Parse plot elements from framework content
   */
  async parsePlotElements(doc: Document): Promise<ParsedElement<PlotElement>[]> {
    const plotElements: ParsedElement<PlotElement>[] = []
    const pattern = this.patterns.get('plot')!

    // Structured parsing
    const structured = this.parseStructuredElements(doc, pattern, 'plot')
    plotElements.push(...structured)

    // AI-assisted extraction
    if (this.config.enableAIAssisted) {
      const aiElements = await this.aiAssistedPlotExtraction(doc)
      plotElements.push(...aiElements)
    }

    // Keyword-based extraction
    if (this.config.fallbackToKeywords) {
      const keywordElements = this.keywordBasedPlotExtraction(doc)
      plotElements.push(...keywordElements)
    }

    return this.deduplicateAndFilter(plotElements)
  }

  /**
   * Parse world-building elements
   */
  async parseWorldBuilding(doc: Document): Promise<ParsedElement<WorldElement>[]> {
    const worldElements: ParsedElement<WorldElement>[] = []
    const pattern = this.patterns.get('world')!

    // Structured parsing
    const structured = this.parseStructuredElements(doc, pattern, 'world')
    worldElements.push(...structured)

    // AI-assisted extraction
    if (this.config.enableAIAssisted) {
      const aiElements = await this.aiAssistedWorldExtraction(doc)
      worldElements.push(...aiElements)
    }

    // Keyword-based extraction
    if (this.config.fallbackToKeywords) {
      const keywordElements = this.keywordBasedWorldExtraction(doc)
      worldElements.push(...keywordElements)
    }

    return this.deduplicateAndFilter(worldElements)
  }

  /**
   * Parse theme elements
   */
  async parseThemes(doc: Document): Promise<ParsedElement<ThemeElement>[]> {
    const themes: ParsedElement<ThemeElement>[] = []
    const pattern = this.patterns.get('theme')!

    // Structured parsing
    const structured = this.parseStructuredElements(doc, pattern, 'theme')
    themes.push(...structured)

    // AI-assisted extraction
    if (this.config.enableAIAssisted) {
      const aiElements = await this.aiAssistedThemeExtraction(doc)
      themes.push(...aiElements)
    }

    return this.deduplicateAndFilter(themes)
  }

  /**
   * Parse style guides
   */
  async parseStyleGuides(doc: Document): Promise<ParsedElement<StyleGuide>[]> {
    const styleGuides: ParsedElement<StyleGuide>[] = []
    const pattern = this.patterns.get('style')!

    // Structured parsing
    const structured = this.parseStructuredElements(doc, pattern, 'style')
    styleGuides.push(...structured)

    // AI-assisted extraction
    if (this.config.enableAIAssisted) {
      const aiElements = await this.aiAssistedStyleExtraction(doc)
      styleGuides.push(...aiElements)
    }

    return this.deduplicateAndFilter(styleGuides)
  }

  /**
   * Parse outline elements
   */
  async parseOutlines(doc: Document): Promise<ParsedElement<OutlineElement>[]> {
    const outlines: ParsedElement<OutlineElement>[] = []

    // Parse hierarchical structure
    const hierarchical = this.parseHierarchicalOutline(doc)
    outlines.push(...hierarchical)

    // Parse list-based outlines
    const listBased = this.parseListBasedOutline(doc)
    outlines.push(...listBased)

    return this.deduplicateAndFilter(outlines)
  }

  /**
   * Generic structured element parsing
   */
  private parseStructuredElements(
    doc: Document, 
    pattern: ElementPattern, 
    category: FrameworkCategory
  ): ParsedElement<any>[] {
    const elements: ParsedElement<any>[] = []

    for (const selector of pattern.selectors) {
      const domElements = doc.querySelectorAll(selector)
      
      domElements.forEach(element => {
        // Validate structure
        const isValid = pattern.structureValidators.some(validator => validator(element))
        if (this.config.strictMode && !isValid) return

        // Extract data using pattern extractors
        let extractedData: any = null
        for (const extractor of pattern.extractors) {
          try {
            extractedData = extractor(element)
            if (extractedData) break
          } catch (error) {
            console.warn(`Extraction failed for ${category}:`, error)
          }
        }

        if (extractedData) {
          elements.push({
            element: extractedData,
            confidence: isValid ? 0.9 : 0.7,
            source: 'structured',
            sourceText: element.textContent?.slice(0, 200) || ''
          })
        }
      })
    }

    return elements
  }

  /**
   * AI-assisted character extraction
   */
  private async aiAssistedCharacterExtraction(doc: Document): Promise<ParsedElement<CharacterProfile>[]> {
    // This would use an AI service to extract character information
    // For now, return empty array as placeholder
    return []
  }

  /**
   * AI-assisted plot extraction
   */
  private async aiAssistedPlotExtraction(doc: Document): Promise<ParsedElement<PlotElement>[]> {
    return []
  }

  /**
   * AI-assisted world-building extraction
   */
  private async aiAssistedWorldExtraction(doc: Document): Promise<ParsedElement<WorldElement>[]> {
    return []
  }

  /**
   * AI-assisted theme extraction
   */
  private async aiAssistedThemeExtraction(doc: Document): Promise<ParsedElement<ThemeElement>[]> {
    return []
  }

  /**
   * AI-assisted style extraction
   */
  private async aiAssistedStyleExtraction(doc: Document): Promise<ParsedElement<StyleGuide>[]> {
    return []
  }

  /**
   * Keyword-based character extraction
   */
  private keywordBasedCharacterExtraction(doc: Document): ParsedElement<CharacterProfile>[] {
    const characters: ParsedElement<CharacterProfile>[] = []
    const pattern = this.patterns.get('character')!
    const text = doc.body.textContent || ''

    for (const keywordPattern of pattern.keywordPatterns) {
      const matches = text.match(keywordPattern)
      if (matches) {
        matches.forEach(match => {
          const character = this.extractCharacterFromMatch(match, text)
          if (character) {
            characters.push({
              element: character,
              confidence: 0.5,
              source: 'keyword-matched',
              sourceText: match
            })
          }
        })
      }
    }

    return characters
  }

  /**
   * Keyword-based plot extraction
   */
  private keywordBasedPlotExtraction(doc: Document): ParsedElement<PlotElement>[] {
    const plotElements: ParsedElement<PlotElement>[] = []
    const pattern = this.patterns.get('plot')!
    const text = doc.body.textContent || ''

    for (const keywordPattern of pattern.keywordPatterns) {
      const matches = text.match(keywordPattern)
      if (matches) {
        matches.forEach(match => {
          const plotElement = this.extractPlotFromMatch(match, text)
          if (plotElement) {
            plotElements.push({
              element: plotElement,
              confidence: 0.5,
              source: 'keyword-matched',
              sourceText: match
            })
          }
        })
      }
    }

    return plotElements
  }

  /**
   * Keyword-based world-building extraction
   */
  private keywordBasedWorldExtraction(doc: Document): ParsedElement<WorldElement>[] {
    const worldElements: ParsedElement<WorldElement>[] = []
    const pattern = this.patterns.get('world')!
    const text = doc.body.textContent || ''

    // Look for location patterns
    const locationPattern = /(?:location|place|setting|world):\s*([^.!?]+)/gi
    const matches = text.match(locationPattern)
    
    if (matches) {
      matches.forEach((match, index) => {
        const name = match.replace(/^[^:]*:\s*/, '').trim()
        if (name.length > 3) {
          worldElements.push({
            element: {
              id: `world-kw-${index}`,
              type: 'location',
              name,
              description: name,
              relevanceScore: 0.5
            },
            confidence: 0.5,
            source: 'keyword-matched',
            sourceText: match
          })
        }
      })
    }

    return worldElements
  }

  /**
   * Parse hierarchical outline structure
   */
  private parseHierarchicalOutline(doc: Document): ParsedElement<OutlineElement>[] {
    const outlines: ParsedElement<OutlineElement>[] = []
    
    // Look for heading hierarchies (h1, h2, h3, etc.)
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1)) - 1
      const title = heading.textContent?.trim() || ''
      
      if (title.length > 0) {
        // Get content until next heading of same or higher level
        const content = this.getContentUntilNextHeading(heading)
        
        outlines.push({
          element: {
            id: `outline-h-${index}`,
            level,
            title,
            content,
            children: [],
            relevanceScore: 0.8
          },
          confidence: 0.8,
          source: 'structured',
          sourceText: title
        })
      }
    })

    return outlines
  }

  /**
   * Parse list-based outline structure
   */
  private parseListBasedOutline(doc: Document): ParsedElement<OutlineElement>[] {
    const outlines: ParsedElement<OutlineElement>[] = []
    
    // Look for ordered and unordered lists
    const lists = doc.querySelectorAll('ol, ul')
    
    lists.forEach((list, listIndex) => {
      const items = list.querySelectorAll('li')
      
      items.forEach((item, itemIndex) => {
        const title = item.textContent?.trim() || ''
        if (title.length > 0) {
          // Determine level based on nesting
          const level = this.calculateListNestingLevel(item)
          
          outlines.push({
            element: {
              id: `outline-l-${listIndex}-${itemIndex}`,
              level,
              title,
              content: title,
              children: [],
              relevanceScore: 0.6
            },
            confidence: 0.6,
            source: 'structured',
            sourceText: title
          })
        }
      })
    })

    return outlines
  }

  /**
   * Helper methods
   */

  private extractCharacterFromMatch(match: string, fullText: string): CharacterProfile | null {
    // Simple character extraction from keyword match
    const nameMatch = match.match(/(?:character|char|person|protagonist|antagonist):\s*([^.!?]+)/i)
    if (!nameMatch) return null

    const name = nameMatch[1].trim()
    if (name.length < 2) return null

    return {
      id: `char-kw-${Date.now()}`,
      name,
      description: name,
      traits: [],
      relationships: [],
      arc: '',
      relevanceScore: 0.5
    }
  }

  private extractPlotFromMatch(match: string, fullText: string): PlotElement | null {
    // Simple plot extraction from keyword match
    const eventMatch = match.match(/(?:plot|event|conflict|resolution):\s*([^.!?]+)/i)
    if (!eventMatch) return null

    const description = eventMatch[1].trim()
    if (description.length < 5) return null

    return {
      id: `plot-kw-${Date.now()}`,
      type: 'event',
      title: description.slice(0, 50),
      description,
      chapterReferences: [],
      relevanceScore: 0.5
    }
  }

  private getContentUntilNextHeading(heading: Element): string {
    let content = ''
    let nextSibling = heading.nextElementSibling
    const headingLevel = parseInt(heading.tagName.charAt(1))

    while (nextSibling) {
      if (nextSibling.tagName.match(/^H[1-6]$/)) {
        const nextLevel = parseInt(nextSibling.tagName.charAt(1))
        if (nextLevel <= headingLevel) break
      }
      
      content += nextSibling.textContent + ' '
      nextSibling = nextSibling.nextElementSibling
    }

    return content.trim().slice(0, 500) // Limit content length
  }

  private calculateListNestingLevel(listItem: Element): number {
    let level = 0
    let parent = listItem.parentElement

    while (parent) {
      if (parent.tagName === 'OL' || parent.tagName === 'UL') {
        level++
      }
      parent = parent.parentElement
    }

    return Math.max(0, level - 1) // Adjust for zero-based indexing
  }

  private deduplicateAndFilter<T>(elements: ParsedElement<T>[]): ParsedElement<T>[] {
    // Remove duplicates based on element content similarity
    const unique = new Map<string, ParsedElement<T>>()
    
    elements.forEach(element => {
      const key = this.generateElementKey(element)
      const existing = unique.get(key)
      
      if (!existing || element.confidence > existing.confidence) {
        unique.set(key, element)
      }
    })

    // Filter by confidence threshold
    return Array.from(unique.values())
      .filter(element => element.confidence >= this.config.confidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence)
  }

  private generateElementKey(element: ParsedElement<any>): string {
    // Generate a key for deduplication based on element content
    const content = JSON.stringify(element.element)
    return content.slice(0, 100) // Use first 100 characters as key
  }

  /**
   * Initialize parsing patterns
   */
  private initializePatterns(): void {
    // Character patterns
    this.patterns.set('character', {
      category: 'character',
      selectors: [
        '[data-character]',
        '.character',
        '.character-profile',
        'section[class*="character"]',
        'div[class*="character"]'
      ],
      keywordPatterns: [
        /(?:character|char|protagonist|antagonist):\s*([^.!?]+)/gi,
        /(?:name|called|known as):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
      ],
      structureValidators: [
        (el) => !!el.textContent?.match(/name|character|protagonist|antagonist/i),
        (el) => el.children.length > 0 && el.textContent!.length > 20
      ],
      extractors: [
        (el) => this.extractCharacterFromElement(el),
        (el) => this.extractGenericCharacter(el)
      ]
    })

    // Plot patterns
    this.patterns.set('plot', {
      category: 'plot',
      selectors: [
        '[data-plot]',
        '.plot',
        '.plot-element',
        '.event',
        '.conflict',
        'section[class*="plot"]'
      ],
      keywordPatterns: [
        /(?:plot|event|conflict|climax|resolution):\s*([^.!?]+)/gi,
        /(?:chapter|scene):\s*([^.!?]+)/gi
      ],
      structureValidators: [
        (el) => !!el.textContent?.match(/plot|event|conflict|chapter|scene/i),
        (el) => el.textContent!.length > 15
      ],
      extractors: [
        (el) => this.extractPlotFromElement(el),
        (el) => this.extractGenericPlot(el)
      ]
    })

    // World patterns
    this.patterns.set('world', {
      category: 'world',
      selectors: [
        '[data-world]',
        '.world',
        '.setting',
        '.location',
        '.world-building',
        'section[class*="world"]'
      ],
      keywordPatterns: [
        /(?:location|place|setting|world):\s*([^.!?]+)/gi,
        /(?:city|town|country|planet):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
      ],
      structureValidators: [
        (el) => !!el.textContent?.match(/location|place|setting|world|city|town/i),
        (el) => el.textContent!.length > 10
      ],
      extractors: [
        (el) => this.extractWorldFromElement(el),
        (el) => this.extractGenericWorld(el)
      ]
    })

    // Theme patterns
    this.patterns.set('theme', {
      category: 'theme',
      selectors: [
        '[data-theme]',
        '.theme',
        '.themes',
        'section[class*="theme"]'
      ],
      keywordPatterns: [
        /(?:theme|moral|message|meaning):\s*([^.!?]+)/gi
      ],
      structureValidators: [
        (el) => !!el.textContent?.match(/theme|moral|message|meaning/i),
        (el) => el.textContent!.length > 10
      ],
      extractors: [
        (el) => this.extractThemeFromElement(el),
        (el) => this.extractGenericTheme(el)
      ]
    })

    // Style patterns
    this.patterns.set('style', {
      category: 'style',
      selectors: [
        '[data-style]',
        '.style',
        '.style-guide',
        '.writing-style',
        'section[class*="style"]'
      ],
      keywordPatterns: [
        /(?:style|tone|voice|writing):\s*([^.!?]+)/gi
      ],
      structureValidators: [
        (el) => !!el.textContent?.match(/style|tone|voice|writing/i),
        (el) => el.textContent!.length > 10
      ],
      extractors: [
        (el) => this.extractStyleFromElement(el),
        (el) => this.extractGenericStyle(el)
      ]
    })
  }

  /**
   * Element extractors
   */
  private extractCharacterFromElement(element: Element): CharacterProfile | null {
    const text = element.textContent || ''
    const nameMatch = text.match(/(?:name|character):\s*([^.!?\n]+)/i)
    
    if (!nameMatch) return null

    const name = nameMatch[1].trim()
    return {
      id: `char-${Date.now()}`,
      name,
      description: text.slice(0, 200),
      traits: this.extractTraits(text),
      relationships: [],
      arc: '',
      relevanceScore: 0.8
    }
  }

  private extractGenericCharacter(element: Element): CharacterProfile | null {
    const text = element.textContent || ''
    if (text.length < 20) return null

    return {
      id: `char-generic-${Date.now()}`,
      name: text.slice(0, 30).trim(),
      description: text.slice(0, 200),
      traits: [],
      relationships: [],
      arc: '',
      relevanceScore: 0.6
    }
  }

  private extractPlotFromElement(element: Element): PlotElement | null {
    const text = element.textContent || ''
    const title = text.slice(0, 50).trim()
    
    return {
      id: `plot-${Date.now()}`,
      type: 'event',
      title,
      description: text.slice(0, 300),
      chapterReferences: [],
      relevanceScore: 0.8
    }
  }

  private extractGenericPlot(element: Element): PlotElement | null {
    const text = element.textContent || ''
    if (text.length < 15) return null

    return {
      id: `plot-generic-${Date.now()}`,
      type: 'event',
      title: text.slice(0, 50).trim(),
      description: text.slice(0, 300),
      chapterReferences: [],
      relevanceScore: 0.6
    }
  }

  private extractWorldFromElement(element: Element): WorldElement | null {
    const text = element.textContent || ''
    const nameMatch = text.match(/(?:location|place|name):\s*([^.!?\n]+)/i)
    
    const name = nameMatch ? nameMatch[1].trim() : text.slice(0, 30).trim()
    
    return {
      id: `world-${Date.now()}`,
      type: 'location',
      name,
      description: text.slice(0, 200),
      relevanceScore: 0.8
    }
  }

  private extractGenericWorld(element: Element): WorldElement | null {
    const text = element.textContent || ''
    if (text.length < 10) return null

    return {
      id: `world-generic-${Date.now()}`,
      type: 'location',
      name: text.slice(0, 30).trim(),
      description: text.slice(0, 200),
      relevanceScore: 0.6
    }
  }

  private extractThemeFromElement(element: Element): ThemeElement | null {
    const text = element.textContent || ''
    const name = text.slice(0, 50).trim()
    
    return {
      id: `theme-${Date.now()}`,
      name,
      description: text.slice(0, 300),
      manifestations: [],
      relevanceScore: 0.8
    }
  }

  private extractGenericTheme(element: Element): ThemeElement | null {
    const text = element.textContent || ''
    if (text.length < 10) return null

    return {
      id: `theme-generic-${Date.now()}`,
      name: text.slice(0, 50).trim(),
      description: text.slice(0, 300),
      manifestations: [],
      relevanceScore: 0.6
    }
  }

  private extractStyleFromElement(element: Element): StyleGuide | null {
    const text = element.textContent || ''
    const name = text.slice(0, 50).trim()
    
    return {
      id: `style-${Date.now()}`,
      name,
      rules: this.extractRules(text),
      examples: [],
      tone: this.extractTone(text)
    }
  }

  private extractGenericStyle(element: Element): StyleGuide | null {
    const text = element.textContent || ''
    if (text.length < 10) return null

    return {
      id: `style-generic-${Date.now()}`,
      name: text.slice(0, 50).trim(),
      rules: [],
      examples: [],
      tone: 'neutral'
    }
  }

  private extractTraits(text: string): string[] {
    const traitPatterns = [
      /(?:trait|personality|characteristic):\s*([^.!?\n]+)/gi,
      /(?:is|was|seems|appears)\s+((?:very\s+|quite\s+|rather\s+)?(?:kind|brave|smart|clever|funny|serious|quiet|loud|friendly|shy|confident|nervous|calm|angry|happy|sad|mysterious|determined|lazy|hardworking|creative|logical|emotional|rational)[^.!?\n]*)/gi
    ]

    const traits: string[] = []
    traitPatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const trait = match.replace(/^[^:]*:\s*/, '').trim()
          if (trait.length > 3 && trait.length < 50) {
            traits.push(trait)
          }
        })
      }
    })

    return traits.slice(0, 5) // Limit to 5 traits
  }

  private extractRules(text: string): string[] {
    const rulePatterns = [
      /(?:rule|guideline|principle):\s*([^.!?\n]+)/gi,
      /(?:should|must|always|never|avoid|use)\s+([^.!?\n]+)/gi
    ]

    const rules: string[] = []
    rulePatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const rule = match.replace(/^[^:]*:\s*/, '').trim()
          if (rule.length > 5 && rule.length < 100) {
            rules.push(rule)
          }
        })
      }
    })

    return rules.slice(0, 10) // Limit to 10 rules
  }

  private extractTone(text: string): string {
    const toneKeywords = {
      formal: /formal|professional|academic|serious/i,
      casual: /casual|informal|relaxed|friendly/i,
      dramatic: /dramatic|intense|emotional|powerful/i,
      humorous: /funny|humorous|comedic|witty/i,
      dark: /dark|grim|serious|somber/i,
      light: /light|cheerful|upbeat|positive/i
    }

    for (const [tone, pattern] of Object.entries(toneKeywords)) {
      if (pattern.test(text)) {
        return tone
      }
    }

    return 'neutral'
  }
}

// Export default parser instance
export const contextParser = new ContextParser()

// Export parser factory
export function createContextParser(config?: Partial<ParsingConfig>): ContextParser {
  return new ContextParser(config)
}