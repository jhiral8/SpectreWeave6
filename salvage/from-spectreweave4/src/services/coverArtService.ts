import { stabilityAIService } from './stabilityAIService';
// import type { DocumentBlock } from '../types/document';

// Temporary interface definition to test
interface DocumentBlock {
  id: string;
  project_id: string;
  parent_id?: string | null;
  block_type: string;
  content: string;
  metadata?: any;
  order_index: number;
  created_at: string;
  updated_at: string;
  children?: DocumentBlock[];
}

export interface CoverArtOptions {
  style: 'realistic' | 'artistic' | 'minimalist' | 'fantasy' | 'sci-fi' | 'mystery' | 'romance';
  aspectRatio: 'portrait' | 'landscape' | 'square';
  resolution: '1024x1024' | '1152x896' | '1216x832' | '1344x768' | '1536x640' | '640x1536' | '768x1344' | '832x1216' | '896x1152';
  mood: 'dark' | 'bright' | 'mysterious' | 'romantic' | 'action' | 'peaceful';
  includeText: boolean;
  textStyle?: 'elegant' | 'bold' | 'minimal' | 'handwritten';
}

export interface IllustrationOptions {
  type: 'character' | 'scene' | 'landscape' | 'object' | 'concept';
  style: 'realistic' | 'artistic' | 'cartoon' | 'watercolor' | 'digital-art';
  perspective: 'front' | 'side' | 'three-quarter' | 'bird-eye' | 'worm-eye';
  lighting: 'natural' | 'dramatic' | 'soft' | 'backlit' | 'moonlit';
  colorPalette: 'warm' | 'cool' | 'monochrome' | 'vibrant' | 'pastel';
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  metadata: {
    genre: string;
    mood: string;
    aspectRatio: string;
    resolution: string;
    generatedAt: string;
    aiService: string;
  };
  tags: string[];
}

export class CoverArtService {
  private static instance: CoverArtService;

  static getInstance(): CoverArtService {
    if (!CoverArtService.instance) {
      CoverArtService.instance = new CoverArtService();
    }
    return CoverArtService.instance;
  }

  /**
   * Analyze story content to extract key themes and elements
   */
  private analyzeStoryContent(blocks: DocumentBlock[], genre: string): {
    themes: string[];
    characters: string[];
    settings: string[];
    mood: string;
    keyElements: string[];
  } {
    const content = blocks.map(block => block.content).join(' ');
    const words = content.toLowerCase().split(/\s+/);
    
    // Extract potential character names (capitalized words that appear multiple times)
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      if (word.length > 2 && /^[A-Z]/.test(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    const characters = Object.entries(wordCount)
      .filter(([_, count]) => count > 2)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3)
      .map(([name, _]) => name);

    // Extract themes based on genre and content
    const themes = this.extractThemes(content, genre);
    
    // Extract settings (locations, environments)
    const settings = this.extractSettings(content, genre);
    
    // Determine mood from content analysis
    const mood = this.determineMood(content, genre);
    
    // Extract key visual elements
    const keyElements = this.extractKeyElements(content, genre);

    return {
      themes,
      characters,
      settings,
      mood,
      keyElements,
    };
  }

  /**
   * Extract themes from content based on genre
   */
  private extractThemes(content: string, genre: string): string[] {
    const themes: string[] = [];
    const lowerContent = content.toLowerCase();

    // Genre-specific theme extraction
    switch (genre.toLowerCase()) {
      case 'fantasy':
        if (lowerContent.includes('magic')) themes.push('magic', 'mystical');
        if (lowerContent.includes('dragon')) themes.push('dragons', 'creatures');
        if (lowerContent.includes('kingdom') || lowerContent.includes('castle')) themes.push('medieval', 'royalty');
        if (lowerContent.includes('quest') || lowerContent.includes('journey')) themes.push('adventure', 'quest');
        break;
      
      case 'sci-fi':
        if (lowerContent.includes('space') || lowerContent.includes('planet')) themes.push('space', 'cosmic');
        if (lowerContent.includes('robot') || lowerContent.includes('ai')) themes.push('technology', 'robots');
        if (lowerContent.includes('future') || lowerContent.includes('time')) themes.push('futuristic', 'time');
        if (lowerContent.includes('alien')) themes.push('aliens', 'extraterrestrial');
        break;
      
      case 'mystery':
        if (lowerContent.includes('murder') || lowerContent.includes('crime')) themes.push('crime', 'investigation');
        if (lowerContent.includes('detective') || lowerContent.includes('clue')) themes.push('detective', 'mystery');
        if (lowerContent.includes('dark') || lowerContent.includes('shadow')) themes.push('darkness', 'secrets');
        break;
      
      case 'romance':
        if (lowerContent.includes('love') || lowerContent.includes('heart')) themes.push('love', 'romance');
        if (lowerContent.includes('kiss') || lowerContent.includes('embrace')) themes.push('intimacy', 'passion');
        if (lowerContent.includes('beautiful') || lowerContent.includes('handsome')) themes.push('beauty', 'attraction');
        break;
      
      case 'thriller':
        if (lowerContent.includes('danger') || lowerContent.includes('threat')) themes.push('danger', 'suspense');
        if (lowerContent.includes('chase') || lowerContent.includes('escape')) themes.push('action', 'chase');
        if (lowerContent.includes('dark') || lowerContent.includes('shadow')) themes.push('darkness', 'fear');
        break;
      
      default:
        themes.push('story', 'narrative');
    }

    return themes.slice(0, 5); // Limit to top 5 themes
  }

  /**
   * Extract settings from content
   */
  private extractSettings(content: string, genre: string): string[] {
    const settings: string[] = [];
    const lowerContent = content.toLowerCase();

    // Common setting keywords
    const settingKeywords = [
      'forest', 'mountain', 'ocean', 'desert', 'city', 'village', 'castle', 'house',
      'room', 'street', 'park', 'beach', 'cave', 'temple', 'school', 'office',
      'space', 'planet', 'ship', 'station', 'laboratory', 'hospital', 'prison'
    ];

    settingKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        settings.push(keyword);
      }
    });

    return settings.slice(0, 3); // Limit to top 3 settings
  }

  /**
   * Determine mood from content analysis
   */
  private determineMood(content: string, genre: string): string {
    const lowerContent = content.toLowerCase();
    
    // Mood indicators
    const moodIndicators = {
      dark: ['dark', 'shadow', 'night', 'black', 'evil', 'death', 'fear', 'horror'],
      bright: ['light', 'bright', 'sun', 'day', 'happy', 'joy', 'cheerful', 'warm'],
      mysterious: ['mystery', 'secret', 'unknown', 'hidden', 'strange', 'curious'],
      romantic: ['love', 'romance', 'beautiful', 'passion', 'heart', 'kiss'],
      action: ['action', 'fight', 'battle', 'chase', 'run', 'escape', 'danger'],
      peaceful: ['peace', 'calm', 'quiet', 'serene', 'gentle', 'soft', 'tranquil']
    };

    const scores: { [key: string]: number } = {};
    
    Object.entries(moodIndicators).forEach(([mood, indicators]) => {
      scores[mood] = indicators.reduce((count, indicator) => {
        return count + (lowerContent.includes(indicator) ? 1 : 0);
      }, 0);
    });

    const dominantMood = Object.entries(scores)
      .sort(([_, a], [__, b]) => b - a)[0][0];
    
    return dominantMood;
  }

  /**
   * Extract key visual elements from content
   */
  private extractKeyElements(content: string, genre: string): string[] {
    const elements: string[] = [];
    const lowerContent = content.toLowerCase();

    // Visual element keywords
    const visualKeywords = [
      'sword', 'book', 'crown', 'ring', 'key', 'door', 'window', 'tree', 'flower',
      'animal', 'bird', 'car', 'building', 'bridge', 'river', 'fire', 'water',
      'moon', 'star', 'sun', 'cloud', 'rain', 'snow', 'light', 'shadow'
    ];

    visualKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        elements.push(keyword);
      }
    });

    return elements.slice(0, 5); // Limit to top 5 elements
  }

  /**
   * Generate cover art prompt based on story analysis
   */
  private generateCoverArtPrompt(
    title: string,
    genre: string,
    storyAnalysis: ReturnType<typeof this.analyzeStoryContent>,
    options: CoverArtOptions
  ): string {
    const { themes, characters, settings, mood, keyElements } = storyAnalysis;
    
    let prompt = `Book cover for "${title}", ${genre} novel, `;
    
    // Add style and mood
    prompt += `${options.style} style, ${options.mood} mood, `;
    
    // Add main themes
    if (themes.length > 0) {
      prompt += `themes: ${themes.slice(0, 2).join(', ')}, `;
    }
    
    // Add primary setting
    if (settings.length > 0) {
      prompt += `setting: ${settings[0]}, `;
    }
    
    // Add key visual elements
    if (keyElements.length > 0) {
      prompt += `featuring: ${keyElements.slice(0, 3).join(', ')}, `;
    }
    
    // Add character if available
    if (characters.length > 0) {
      prompt += `main character: ${characters[0]}, `;
    }
    
    // Add technical specifications
    prompt += `professional book cover design, high quality, detailed, `;
    prompt += `${options.aspectRatio} composition, `;
    
    // Add text placement if requested
    if (options.includeText) {
      prompt += `space for title text, `;
    }
    
    // Add genre-specific enhancements
    switch (genre.toLowerCase()) {
      case 'fantasy':
        prompt += 'magical atmosphere, epic fantasy art style, ';
        break;
      case 'sci-fi':
        prompt += 'futuristic design, technological elements, ';
        break;
      case 'mystery':
        prompt += 'mysterious atmosphere, dramatic lighting, ';
        break;
      case 'romance':
        prompt += 'romantic atmosphere, soft lighting, ';
        break;
      case 'thriller':
        prompt += 'tense atmosphere, dramatic shadows, ';
        break;
    }
    
    // Remove trailing comma and space
    prompt = prompt.replace(/,\s*$/, '');
    
    return prompt;
  }

  /**
   * Generate illustration prompt based on story context
   */
  private generateIllustrationPrompt(
    context: string,
    genre: string,
    options: IllustrationOptions
  ): string {
    let prompt = `${options.type} illustration, ${options.style} style, `;
    prompt += `${options.perspective} perspective, ${options.lighting} lighting, `;
    prompt += `${options.colorPalette} color palette, `;
    prompt += `context: ${context}, `;
    prompt += `genre: ${genre}, `;
    prompt += `high quality, detailed, professional illustration`;
    
    return prompt;
  }

  /**
   * Generate book cover art
   */
  async generateCoverArt(
    title: string,
    genre: string,
    blocks: DocumentBlock[],
    options: CoverArtOptions
  ): Promise<GeneratedImage> {
    try {
      // Analyze story content
      const storyAnalysis = this.analyzeStoryContent(blocks, genre);
      let prompt = ''; // Declare prompt variable
      
      // Generate prompt
      prompt = this.generateCoverArtPrompt(title, genre, storyAnalysis, options); // Assign prompt variable
      console.log('Cover art prompt:', prompt);
      // Generate image using Stability AI
      const response = await stabilityAIService.generateImage({
        prompt: prompt,
        width: parseInt(options.resolution.split('x')[0]),
        height: parseInt(options.resolution.split('x')[1]),
      });

     if (!response || !response.imageUrl) {
       throw new Error('No images generated');
     }
console.log('Stability AI response:', response);
const image = {
  id: `cover_${Date.now()}`,
  url: response.imageUrl,
  base64: response.imageData,
};

      
      return {
        id: image.id || `cover_${Date.now()}`,
        url: image.url,
        prompt,
        style: options.style,
        metadata: {
          genre,
          mood: storyAnalysis.mood,
          aspectRatio: options.aspectRatio,
          resolution: options.resolution,
          generatedAt: new Date().toISOString(),
          aiService: 'stability-ai',
        },
        tags: [...storyAnalysis.themes, ...storyAnalysis.keyElements, options.style, options.mood],
      };
    } catch (error) {
      console.error('Cover art generation error:', error);
      throw new Error('Failed to generate cover art');
    }
  }

  /**
   * Generate chapter illustration
   */
  async generateChapterIllustration(
    chapterTitle: string,
    chapterContent: string,
    genre: string,
    options: IllustrationOptions
  ): Promise<GeneratedImage> {
    try {
      // Generate prompt
      const prompt = this.generateIllustrationPrompt(chapterContent, genre, options);
      
      // Generate image using Stability AI
      const response = await stabilityAIService.generateImage({
        prompt: prompt,
        width: 1024,
        height: 1024,
      });

     if (!response || !response.imageUrl) {
       throw new Error('No images generated');
     }
 
     const image = {
       id: `illustration_${Date.now()}`,
       url: response.imageUrl,
       base64: response.imageData,
     };
      
      return {
        id: image.id || `illustration_${Date.now()}`,
        url: image.url,
        prompt,
        style: options.style,
        metadata: {
          genre,
          mood: 'chapter-illustration',
          aspectRatio: 'landscape',
          resolution: '1024x1024',
          generatedAt: new Date().toISOString(),
          aiService: 'stability-ai',
        },
        tags: [chapterTitle, options.type, options.style, genre],
      };
    } catch (error) {
      console.error('Chapter illustration generation error:', error);
      throw new Error('Failed to generate chapter illustration');
    }
  }

  /**
   * Generate scene illustration based on specific text
   */
  async generateSceneIllustration(
    sceneText: string,
    genre: string,
    options: IllustrationOptions
  ): Promise<GeneratedImage> {
    try {
      // Generate prompt
      const prompt = this.generateIllustrationPrompt(sceneText, genre, options);
      
      // Generate image using Stability AI
      const response = await stabilityAIService.generateImage({
        prompt: prompt,
        width: 1024,
        height: 1024,
      });

     if (!response || !response.imageUrl) {
       throw new Error('No images generated');
     }
 
     const image = {
       id: `scene_${Date.now()}`,
       url: response.imageUrl,
       base64: response.imageData,
     };
      
      return {
        id: image.id || `scene_${Date.now()}`,
        url: image.url,
        prompt,
        style: options.style,
        metadata: {
          genre,
          mood: 'scene-illustration',
          aspectRatio: 'landscape',
          resolution: '1024x1024',
          generatedAt: new Date().toISOString(),
          aiService: 'stability-ai',
        },
        tags: ['scene', options.type, options.style, genre],
      };
    } catch (error) {
      console.error('Scene illustration generation error:', error);
      throw new Error('Failed to generate scene illustration');
    }
  }

  /**
   * Get recommended cover art styles for a genre
   */
  getRecommendedCoverStyles(genre: string): CoverArtOptions['style'][] {
    const recommendations: { [key: string]: CoverArtOptions['style'][] } = {
      fantasy: ['fantasy', 'artistic', 'realistic'],
      'sci-fi': ['sci-fi', 'minimalist', 'realistic'],
      mystery: ['mystery', 'minimalist', 'realistic'],
      romance: ['romance', 'artistic', 'minimalist'],
      thriller: ['realistic', 'artistic', 'minimalist'],
      horror: ['realistic', 'artistic', 'minimalist'],
      historical: ['realistic', 'artistic', 'minimalist'],
      contemporary: ['minimalist', 'realistic', 'artistic'],
    };

    return recommendations[genre.toLowerCase()] || ['realistic', 'artistic', 'minimalist'];
  }

  /**
   * Get recommended illustration styles for a genre
   */
  getRecommendedIllustrationStyles(genre: string): IllustrationOptions['style'][] {
    const recommendations: { [key: string]: IllustrationOptions['style'][] } = {
      fantasy: ['artistic', 'watercolor', 'digital-art'],
      'sci-fi': ['digital-art', 'realistic', 'artistic'],
      mystery: ['realistic', 'artistic', 'cartoon'],
      romance: ['watercolor', 'artistic', 'realistic'],
      thriller: ['realistic', 'artistic', 'cartoon'],
      horror: ['realistic', 'artistic', 'cartoon'],
      historical: ['realistic', 'watercolor', 'artistic'],
      contemporary: ['realistic', 'cartoon', 'artistic'],
    };

    return recommendations[genre.toLowerCase()] || ['realistic', 'artistic', 'digital-art'];
  }
}

export const coverArtService = CoverArtService.getInstance();