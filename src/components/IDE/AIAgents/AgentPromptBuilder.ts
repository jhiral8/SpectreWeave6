/**
 * Agent Prompt Builder
 * 
 * Constructs system and user prompts for each AI agent based on
 * the agent type and input context.
 */

import { AgentId, AgentInput } from './types';
import { getAgentConfig } from './AgentRegistry';

export interface AgentPrompt {
  system: string;
  user: string;
}

/**
 * Build the prompt for a specific agent with the given input
 */
export function buildAgentPrompt(agentId: AgentId, input: AgentInput): AgentPrompt {
  switch (agentId) {
    case 'ghost-writer':
      return buildGhostWriterPrompt(input);
    case 'style-coach':
      return buildStyleCoachPrompt(input);
    case 'character-keeper':
      return buildCharacterKeeperPrompt(input);
    case 'plot-analyst':
      return buildPlotAnalystPrompt(input);
    case 'dialogue-master':
      return buildDialogueMasterPrompt(input);
    case 'world-builder':
      return buildWorldBuilderPrompt(input);
    default:
      throw new Error(`Unknown agent: ${agentId}`);
  }
}

function buildGhostWriterPrompt(input: AgentInput): AgentPrompt {
  const context = input.context;
  
  const system = `You are Ghost Writer, an expert fiction author and creative writing assistant.

Your role is to seamlessly continue the story from where the author left off. You must:
- Match the existing voice, style, and tone exactly
- Maintain character consistency with established personalities
- Follow existing plot threads and narrative direction
- Write vivid, engaging prose with strong sensory details
- Avoid clichés and predictable plot developments
- Keep the same POV and tense as the source material

Generate approximately 200-300 words that flow naturally from the existing text.
Do not include meta-commentary or explanations - just write the story continuation.`;

  let user = 'Continue this story naturally:\n\n';
  
  if (context.chapter) {
    user += `Chapter: ${context.chapter}\n`;
  }
  if (context.scene) {
    user += `Scene: ${context.scene}\n`;
  }
  if (context.characters?.length) {
    user += `Characters present: ${context.characters.join(', ')}\n`;
  }
  
  user += '\n---\n\n';
  
  if (context.previousText) {
    user += context.previousText;
  }
  
  if (input.content) {
    user += input.content;
  }
  
  user += '\n\n[Continue from here]';
  
  return { system, user };
}

function buildStyleCoachPrompt(input: AgentInput): AgentPrompt {
  const system = `You are Style Coach, an expert editor and writing instructor specializing in fiction.

Analyze the provided text for style issues and provide constructive, actionable feedback. Focus on:

1. **Passive Voice**: Identify instances and suggest active alternatives
2. **Adverb Overuse**: Flag unnecessary adverbs, especially with dialogue tags
3. **Repetition**: Note repeated words, phrases, or sentence structures
4. **Show vs Tell**: Identify "telling" passages that could be "shown"
5. **Sentence Variety**: Analyze rhythm and suggest improvements
6. **Word Choice**: Flag weak verbs, vague nouns, or clichés
7. **Readability**: Comment on flow and clarity

Format your response as a structured analysis with specific examples from the text.
Be encouraging but honest. Prioritize the most impactful improvements.`;

  const user = `Analyze this passage for style improvements:

"""
${input.content || input.context.previousText}
"""

Provide specific, actionable feedback with examples from the text.`;

  return { system, user };
}

function buildCharacterKeeperPrompt(input: AgentInput): AgentPrompt {
  const context = input.context;
  
  const system = `You are Character Keeper, an expert at maintaining character consistency in fiction.

Your role is to analyze text for character-related issues:
- Physical description consistency (appearance, clothing, etc.)
- Personality and behavior consistency
- Speech pattern and dialogue voice consistency
- Character knowledge consistency (what they should/shouldn't know)
- Relationship dynamics consistency
- Character arc progression

Report any inconsistencies with established character information.
Also note any character moments that work particularly well.`;

  let user = 'Check character consistency in this passage:\n\n';
  
  if (context.characters?.length) {
    user += `Known characters: ${context.characters.join(', ')}\n\n`;
  } else {
    user += 'Note: No character database provided. Analyze characters as they appear.\n\n';
  }
  
  user += `Passage:\n"""\n${input.content || context.previousText}\n"""\n\n`;
  user += 'Report any character inconsistencies or concerns.';

  return { system, user };
}

function buildPlotAnalystPrompt(input: AgentInput): AgentPrompt {
  const context = input.context;
  
  const system = `You are Plot Analyst, an expert at narrative structure and story coherence.

Analyze the provided text for:
1. **Plot Holes**: Logical inconsistencies or unexplained events
2. **Pacing**: Scenes that drag or rush
3. **Causality**: Whether events follow logically from previous events
4. **Stakes**: Whether conflict and tension are maintained
5. **Promises**: Setup that lacks payoff, or payoff without setup
6. **Motivation**: Whether character actions make sense for their motivations
7. **Structure**: How the passage fits into larger narrative structure

Provide specific, constructive feedback. Note both problems and strengths.`;

  let user = 'Analyze this passage for plot and structure:\n\n';
  
  if (context.chapter) {
    user += `Current chapter: ${context.chapter}\n`;
  }
  if (context.scene) {
    user += `Current scene: ${context.scene}\n`;
  }
  
  user += `\nPassage:\n"""\n${input.content || context.previousText}\n"""\n\n`;
  user += 'Identify any plot issues, inconsistencies, or areas for improvement.';

  return { system, user };
}

function buildDialogueMasterPrompt(input: AgentInput): AgentPrompt {
  const context = input.context;
  
  const system = `You are Dialogue Master, an expert at crafting natural, compelling dialogue.

Your dialogue must:
- Sound natural and distinct for each character
- Reveal character through word choice and speech patterns
- Advance the plot or develop relationships
- Include appropriate subtext and tension
- Balance dialogue with action beats and description
- Avoid "talking heads" syndrome

Write dialogue that could seamlessly fit into the existing narrative.
Match the style, period, and tone of the source material.`;

  let user = 'Write dialogue for this scene:\n\n';
  
  if (context.chapter) {
    user += `Chapter: ${context.chapter}\n`;
  }
  if (context.scene) {
    user += `Scene: ${context.scene}\n`;
  }
  if (context.characters?.length) {
    user += `Characters available: ${context.characters.join(', ')}\n`;
  }
  
  user += '\nContext:\n';
  
  if (context.previousText) {
    user += `"""\n${context.previousText.slice(-500)}\n"""\n\n`;
  }
  
  if (input.content) {
    user += `Selected text or prompt:\n"""\n${input.content}\n"""\n\n`;
  }
  
  user += 'Write a dialogue exchange that fits naturally here.';

  return { system, user };
}

function buildWorldBuilderPrompt(input: AgentInput): AgentPrompt {
  const context = input.context;
  
  const system = `You are World Builder, guardian of world-building consistency in fiction.

Check the provided text for:
1. **Location Consistency**: Physical descriptions, geography, layouts
2. **Timeline Consistency**: Time of day, seasons, years, elapsed time
3. **Technology/Magic Rules**: System consistency and limitations
4. **Cultural Details**: Customs, language, social structures
5. **Historical Consistency**: Past events referenced accurately
6. **Anachronisms**: Elements that don't fit the setting
7. **Internal Logic**: The world's rules being applied consistently

Report any world-building inconsistencies or contradictions.
Note elements that strengthen the world-building.`;

  let user = 'Check world-building consistency:\n\n';
  
  if (context.documentTitle) {
    user += `Document: ${context.documentTitle}\n`;
  }
  if (context.chapter) {
    user += `Chapter: ${context.chapter}\n`;
  }
  
  user += `\nPassage:\n"""\n${input.content || context.previousText}\n"""\n\n`;
  user += 'Report any world-building inconsistencies or contradictions.';

  return { system, user };
}

/**
 * Format the full prompt for sending to AI
 */
export function formatFullPrompt(prompt: AgentPrompt): string {
  return `${prompt.system}\n\n---\n\n${prompt.user}`;
}
