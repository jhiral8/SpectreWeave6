/**
 * Writing-specific prompt templates and generation for AI services
 */

import type { NarrativeContext, NarrativeCharacter, PlotThread } from '../types/narrative-context';
import type { AIRequestOptions } from '../types/ai';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: PromptVariable[];
  defaultOptions: Partial<AIRequestOptions>;
  category: 'content' | 'editing' | 'analysis' | 'research' | 'planning';
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'context' | 'character' | 'plotThread';
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface GeneratedPrompt {
  prompt: string;
  options: AIRequestOptions;
  context: Partial<NarrativeContext>;
}

export class WritingPromptsService {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Content Generation Templates
    this.registerTemplate({
      id: 'continue-story',
      name: 'Continue Story',
      description: 'Generate content that continues the current narrative',
      category: 'content',
      template: `Continue this story, maintaining the established tone, style, and character voices. 

Current context:
Genre: {{genre}}
POV: {{narrativeVoice.perspective}} {{narrativeVoice.tense}} tense
Current scene: {{currentScene.purpose}}
Active characters: {{activeCharacters}}

{{#if plotContext}}
Active plot threads:
{{plotContext}}
{{/if}}

{{#if characterContext}}
Character states:
{{characterContext}}
{{/if}}

Current text:
{{currentContent}}

Continue the story for approximately {{wordTarget}} words, focusing on:
- Maintaining character voice consistency
- Advancing the current scene's purpose
- {{#if specificFocus}}{{specificFocus}}{{else}}Natural story progression{{/if}}

Write in the same style and voice as the existing text.`,
      variables: [
        { name: 'genre', type: 'string', required: true, description: 'Story genre' },
        { name: 'currentContent', type: 'string', required: true, description: 'Text to continue from' },
        { name: 'wordTarget', type: 'number', required: false, description: 'Target word count', defaultValue: 200 },
        { name: 'specificFocus', type: 'string', required: false, description: 'Specific element to focus on' },
        { name: 'activeCharacters', type: 'string', required: false, description: 'Characters in current scene' },
        { name: 'plotContext', type: 'string', required: false, description: 'Relevant plot information' },
        { name: 'characterContext', type: 'string', required: false, description: 'Character emotional states' }
      ],
      defaultOptions: {
        temperature: 0.8,
        maxTokens: 500,
        topP: 0.9
      }
    });

    this.registerTemplate({
      id: 'character-dialogue',
      name: 'Character Dialogue',
      description: 'Generate authentic dialogue for specific characters',
      category: 'content',
      template: `Write dialogue for {{characterName}} in this scene. 

Character Profile:
Name: {{character.name}}
Personality: {{character.traits}}
Voice characteristics: {{character.voiceProfile}}
Speaking patterns: {{character.speechPatterns}}
Current emotional state: {{emotionalState}}

Scene Context:
Setting: {{sceneContext}}
Other characters present: {{otherCharacters}}
Scene purpose: {{scenePurpose}}
Tension level: {{tensionLevel}}

Current conversation:
{{conversationContext}}

Generate {{lineCount}} lines of dialogue for {{characterName}} that:
- Matches their established voice and speech patterns
- Reflects their current emotional state
- Advances the scene's purpose
- Feels authentic to their character
- {{#if dialogueGoal}}{{dialogueGoal}}{{/if}}

Format as: "dialogue text"`,
      variables: [
        { name: 'characterName', type: 'string', required: true, description: 'Character speaking' },
        { name: 'character', type: 'character', required: true, description: 'Character object' },
        { name: 'emotionalState', type: 'string', required: true, description: 'Character current emotions' },
        { name: 'sceneContext', type: 'string', required: true, description: 'Scene setting and context' },
        { name: 'conversationContext', type: 'string', required: true, description: 'Current conversation' },
        { name: 'lineCount', type: 'number', required: false, description: 'Number of dialogue lines', defaultValue: 3 },
        { name: 'dialogueGoal', type: 'string', required: false, description: 'Specific dialogue objective' }
      ],
      defaultOptions: {
        temperature: 0.7,
        maxTokens: 300,
        topP: 0.85
      }
    });

    this.registerTemplate({
      id: 'scene-description',
      name: 'Scene Description',
      description: 'Generate vivid scene descriptions and settings',
      category: 'content',
      template: `Create a vivid scene description for this setting.

Setting Details:
Location: {{location}}
Time of day: {{timeOfDay}}
Weather/atmosphere: {{atmosphere}}
Mood: {{mood}}
POV character: {{povCharacter}}

Scene Context:
Purpose: {{scenePurpose}}
Emotional tone: {{emotionalTone}}
Key elements to highlight: {{keyElements}}

Style Guidelines:
- Genre: {{genre}}
- Description style: {{descriptionStyle}}
- Sensory focus: {{sensoryFocus}}
- Length: {{lengthTarget}} words

Create a scene description that:
- Sets the appropriate mood and atmosphere
- Uses vivid, genre-appropriate imagery
- Incorporates multiple senses
- Reflects the POV character's perspective
- Supports the scene's emotional purpose
- {{#if specificDetails}}Includes: {{specificDetails}}{{/if}}`,
      variables: [
        { name: 'location', type: 'string', required: true, description: 'Scene location' },
        { name: 'mood', type: 'string', required: true, description: 'Scene mood' },
        { name: 'scenePurpose', type: 'string', required: true, description: 'Scene narrative purpose' },
        { name: 'povCharacter', type: 'string', required: false, description: 'Point of view character' },
        { name: 'lengthTarget', type: 'number', required: false, description: 'Target word count', defaultValue: 150 },
        { name: 'descriptionStyle', type: 'string', required: false, description: 'Description approach', defaultValue: 'immersive' }
      ],
      defaultOptions: {
        temperature: 0.8,
        maxTokens: 400,
        topP: 0.9
      }
    });

    // Editing Templates
    this.registerTemplate({
      id: 'improve-prose',
      name: 'Improve Prose',
      description: 'Enhance writing style and prose quality',
      category: 'editing',
      template: `Improve this text while maintaining the author's voice and intent.

Original text:
{{originalText}}

Current style profile:
{{styleProfile}}

Improvement focus:
{{#if improvementAreas}}
Specific areas: {{improvementAreas}}
{{else}}
- Sentence variety and flow
- Word choice and precision
- Clarity and concision
- Imagery and sensory details
{{/if}}

Guidelines:
- Preserve the author's unique voice
- Maintain the same tone and mood
- Keep the same meaning and intent
- Enhance readability and engagement
- {{#if preserveLength}}Keep similar length{{else}}Optimize length for impact{{/if}}

Provide the improved version followed by a brief explanation of changes made.`,
      variables: [
        { name: 'originalText', type: 'string', required: true, description: 'Text to improve' },
        { name: 'styleProfile', type: 'string', required: false, description: 'Author style characteristics' },
        { name: 'improvementAreas', type: 'string', required: false, description: 'Specific areas to focus on' },
        { name: 'preserveLength', type: 'boolean', required: false, description: 'Maintain similar length' }
      ],
      defaultOptions: {
        temperature: 0.6,
        maxTokens: 600,
        topP: 0.8
      }
    });

    this.registerTemplate({
      id: 'consistency-check',
      name: 'Consistency Check',
      description: 'Check for narrative and character consistency',
      category: 'analysis',
      template: `Analyze this text for consistency issues within the established narrative context.

Text to analyze:
{{textToAnalyze}}

Established Context:
{{#if characters}}
Characters: {{characters}}
{{/if}}

{{#if worldRules}}
World rules: {{worldRules}}
{{/if}}

{{#if timeline}}
Timeline: {{timeline}}
{{/if}}

{{#if previousEvents}}
Previous events: {{previousEvents}}
{{/if}}

Check for:
- Character behavior consistency
- World rule adherence
- Timeline accuracy
- Factual consistency with established details
- Voice and style consistency
- {{#if customChecks}}{{customChecks}}{{/if}}

Provide:
1. Overall consistency score (1-10)
2. Specific issues found (if any)
3. Suggestions for resolution
4. Positive consistency elements`,
      variables: [
        { name: 'textToAnalyze', type: 'string', required: true, description: 'Text to check' },
        { name: 'characters', type: 'string', required: false, description: 'Relevant character info' },
        { name: 'worldRules', type: 'string', required: false, description: 'World building rules' },
        { name: 'customChecks', type: 'string', required: false, description: 'Additional checks to perform' }
      ],
      defaultOptions: {
        temperature: 0.3,
        maxTokens: 500,
        topP: 0.7
      }
    });

    // Research Templates
    this.registerTemplate({
      id: 'research-query',
      name: 'Research Query',
      description: 'Generate research queries for story elements',
      category: 'research',
      template: `Generate comprehensive research information for this story element.

Research Topic: {{topic}}
Context: {{context}}
Genre: {{genre}}
Historical period: {{historicalPeriod}}

Research Focus:
{{#if researchAreas}}
{{researchAreas}}
{{else}}
- Factual accuracy and realism
- Cultural and social context
- Technical or scientific details
- Historical background
- Setting and environment details
{{/if}}

Provide:
1. Key facts and details
2. Important considerations for accuracy
3. Common misconceptions to avoid
4. Relevant resources for further research
5. Story implications and opportunities
6. {{#if specificQuestions}}{{specificQuestions}}{{/if}}

Format as detailed, well-sourced information suitable for fiction writing.`,
      variables: [
        { name: 'topic', type: 'string', required: true, description: 'Research topic' },
        { name: 'context', type: 'string', required: true, description: 'Story context' },
        { name: 'genre', type: 'string', required: true, description: 'Story genre' },
        { name: 'researchAreas', type: 'string', required: false, description: 'Specific research areas' },
        { name: 'specificQuestions', type: 'string', required: false, description: 'Specific questions to answer' }
      ],
      defaultOptions: {
        temperature: 0.4,
        maxTokens: 800,
        topP: 0.8
      }
    });

    // Planning Templates
    this.registerTemplate({
      id: 'plot-development',
      name: 'Plot Development',
      description: 'Develop and advance plot threads',
      category: 'planning',
      template: `Develop the next phase of this plot thread.

Plot Thread: {{plotThread.title}}
Current Status: {{plotThread.status}}
Description: {{plotThread.description}}

Current Situation:
{{currentSituation}}

Characters Involved:
{{involvedCharacters}}

Constraints:
- Genre: {{genre}}
- Tone: {{tone}}
- Target chapter count: {{targetChapters}}
- {{#if constraints}}{{constraints}}{{/if}}

Develop:
1. Next 2-3 major plot events
2. Character involvement and reactions
3. Conflict escalation or resolution steps
4. Connection points with other plot threads
5. Potential complications or obstacles
6. Timeline for events

Focus on creating engaging, logical progression that maintains reader interest and character development.`,
      variables: [
        { name: 'plotThread', type: 'plotThread', required: true, description: 'Plot thread to develop' },
        { name: 'currentSituation', type: 'string', required: true, description: 'Current story situation' },
        { name: 'involvedCharacters', type: 'string', required: true, description: 'Characters in this thread' },
        { name: 'targetChapters', type: 'number', required: false, description: 'Target chapters for development' },
        { name: 'constraints', type: 'string', required: false, description: 'Additional constraints' }
      ],
      defaultOptions: {
        temperature: 0.7,
        maxTokens: 600,
        topP: 0.85
      }
    });
  }

  registerTemplate(template: PromptTemplate) {
    this.templates.set(template.id, template);
  }

  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return this.getAllTemplates().filter(template => template.category === category);
  }

  generatePrompt(
    templateId: string,
    variables: Record<string, any>,
    context?: NarrativeContext,
    customOptions?: Partial<AIRequestOptions>
  ): GeneratedPrompt {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template '${templateId}' not found`);
    }

    // Validate required variables
    const missingRequired = template.variables
      .filter(v => v.required && !(v.name in variables))
      .map(v => v.name);

    if (missingRequired.length > 0) {
      throw new Error(`Missing required variables: ${missingRequired.join(', ')}`);
    }

    // Merge context data if available
    const contextVariables = this.extractContextVariables(context);
    const allVariables = { ...contextVariables, ...variables };

    // Apply default values
    template.variables.forEach(variable => {
      if (!(variable.name in allVariables) && variable.defaultValue !== undefined) {
        allVariables[variable.name] = variable.defaultValue;
      }
    });

    // Process template with variables
    const prompt = this.processTemplate(template.template, allVariables);

    // Merge options
    const options: AIRequestOptions = {
      ...template.defaultOptions,
      ...customOptions,
      provider: customOptions?.provider || 'gemini', // Default to Gemini
    };

    // Extract relevant context for the request
    const relevantContext = this.extractRelevantContext(template, context);

    return {
      prompt,
      options,
      context: relevantContext
    };
  }

  private extractContextVariables(context?: NarrativeContext): Record<string, any> {
    if (!context) return {};

    return {
      genre: context.genre,
      narrativeVoice: context.narrativeVoice,
      currentScene: context.currentScene,
      characters: context.characters,
      plotThreads: context.plotThreads,
      worldElements: context.worldElements,
      themes: context.themes,
      writingStyle: context.writingStyle,
      wordCount: context.wordCount,
      currentContent: context.currentContent?.slice(-1000) || '', // Last 1000 chars for context
    };
  }

  private extractRelevantContext(template: PromptTemplate, context?: NarrativeContext): Partial<NarrativeContext> {
    if (!context) return {};

    // Extract only relevant context based on template category
    const relevantContext: Partial<NarrativeContext> = {
      documentId: context.documentId,
      projectId: context.projectId,
      genre: context.genre,
      narrativeVoice: context.narrativeVoice,
      writingStyle: context.writingStyle,
    };

    // Add category-specific context
    switch (template.category) {
      case 'content':
        relevantContext.characters = context.characters;
        relevantContext.currentScene = context.currentScene;
        relevantContext.plotThreads = context.plotThreads;
        break;
      case 'editing':
        relevantContext.writingStyle = context.writingStyle;
        break;
      case 'analysis':
        relevantContext.characters = context.characters;
        relevantContext.worldElements = context.worldElements;
        relevantContext.timeline = context.timeline;
        break;
      case 'research':
        relevantContext.worldElements = context.worldElements;
        break;
      case 'planning':
        relevantContext.plotThreads = context.plotThreads;
        relevantContext.characters = context.characters;
        relevantContext.themes = context.themes;
        break;
    }

    return relevantContext;
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    // Simple template processing - replace {{variable}} with values
    // This is a basic implementation - in production, you might want to use a proper template engine
    
    let processed = template;

    // Handle simple variable substitution
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, this.formatValue(value));
    });

    // Handle conditional blocks {{#if condition}}...{{/if}}
    processed = this.processConditionals(processed, variables);

    // Handle object property access {{object.property}}
    processed = this.processObjectAccess(processed, variables);

    return processed;
  }

  private processConditionals(template: string, variables: Record<string, any>): string {
    const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    
    return template.replace(conditionalRegex, (match, condition, content) => {
      const value = variables[condition];
      return value ? content : '';
    });
  }

  private processObjectAccess(template: string, variables: Record<string, any>): string {
    const objectAccessRegex = /{{(\w+)\.(\w+)}}/g;
    
    return template.replace(objectAccessRegex, (match, objectName, property) => {
      const object = variables[objectName];
      if (object && typeof object === 'object' && property in object) {
        return this.formatValue(object[property]);
      }
      return match; // Leave unchanged if not found
    });
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  }

  // Utility methods for common prompt generation scenarios
  
  async generateContinueStory(
    currentContent: string,
    context: NarrativeContext,
    wordTarget: number = 200,
    specificFocus?: string
  ): Promise<GeneratedPrompt> {
    const activeCharacters = context.currentScene?.characters?.join(', ') || '';
    const plotContext = context.plotThreads
      ?.filter(thread => thread.status !== 'completed')
      ?.map(thread => `${thread.title}: ${thread.description}`)
      ?.join('\n') || '';

    return this.generatePrompt('continue-story', {
      currentContent: currentContent.slice(-1500), // Last 1500 characters for context
      wordTarget,
      specificFocus,
      activeCharacters,
      plotContext
    }, context);
  }

  async generateCharacterDialogue(
    character: NarrativeCharacter,
    sceneContext: string,
    conversationContext: string,
    emotionalState: string,
    context: NarrativeContext,
    lineCount: number = 3
  ): Promise<GeneratedPrompt> {
    return this.generatePrompt('character-dialogue', {
      characterName: character.name,
      character,
      emotionalState,
      sceneContext,
      conversationContext,
      lineCount,
      otherCharacters: context.currentScene?.characters?.filter(c => c !== character.name)?.join(', ') || '',
      scenePurpose: context.currentScene?.purpose?.join(', ') || '',
      tensionLevel: 'moderate' // Could be derived from context
    }, context);
  }

  async generateSceneDescription(
    location: string,
    mood: string,
    scenePurpose: string,
    context: NarrativeContext,
    options?: {
      timeOfDay?: string;
      atmosphere?: string;
      lengthTarget?: number;
      specificDetails?: string;
    }
  ): Promise<GeneratedPrompt> {
    return this.generatePrompt('scene-description', {
      location,
      mood,
      scenePurpose,
      timeOfDay: options?.timeOfDay || 'unspecified',
      atmosphere: options?.atmosphere || 'neutral',
      lengthTarget: options?.lengthTarget || 150,
      specificDetails: options?.specificDetails,
      povCharacter: context.narrativeVoice?.narrator || 'narrator',
      emotionalTone: mood,
      keyElements: scenePurpose,
      descriptionStyle: 'immersive',
      sensoryFocus: 'visual, auditory, tactile'
    }, context);
  }
}

// Export singleton instance
export const writingPrompts = new WritingPromptsService();