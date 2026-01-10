import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouterWithFallback, handleAIError } from '@/lib/ai/openrouter-utils';

/**
 * Framework Wizard API
 * Step-by-step guided conversation to build comprehensive story framework
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Step-specific system prompts
const STEP_PROMPTS: Record<string, string> = {
  welcome: `You are a friendly story development guide helping an author start their novel.
Your role is to welcome them, understand their experience level, and prepare them for the framework building process.
Be encouraging and ask what kind of story they want to tell.`,

  genre: `You are helping an author define their story's genre and tone.
Ask clarifying questions about:
- Primary genre (fantasy, sci-fi, mystery, romance, thriller, literary fiction, etc.)
- Sub-genres or genre blends
- Tone (dark, humorous, epic, intimate, gritty, whimsical)
- Target audience (adult, YA, middle grade)

When you have enough information, include a JSON block in your response:
\`\`\`framework
{"genre": {"primary": "...", "subgenres": [...], "tone": "...", "targetAudience": "..."}}
\`\`\``,

  premise: `You are helping an author craft their story premise.
A strong premise includes:
- A clear protagonist with a goal
- An obstacle or conflict
- Stakes (what happens if they fail)
- A hook that makes it unique

Help them refine their concept into:
- A one-sentence logline
- The hook/unique angle
- A brief synopsis

When you have enough, include:
\`\`\`framework
{"premise": {"logline": "...", "hook": "...", "synopsis": "..."}}
\`\`\``,

  protagonist: `You are helping an author develop their protagonist.
Explore:
- Name and basic details (age, occupation)
- Physical description
- Core motivation (external goal)
- Internal need (what they really need to learn/grow)
- Fatal flaw or wound
- Character arc (how will they change)
- Key personality traits

When you have enough, include:
\`\`\`framework
{"protagonist": {"name": "...", "age": "...", "occupation": "...", "description": "...", "motivation": "...", "flaw": "...", "arc": "...", "traits": [...]}}
\`\`\``,

  antagonist: `You are helping an author develop their antagonist.
The antagonist can be:
- A person (villain, rival, authority figure)
- An organization (corporation, government, cult)
- Nature (disaster, environment, survival)
- Society (prejudice, expectations, systems)
- Self (internal demons, addiction, fear)
- Technology (AI, machines, progress)

Explore:
- Type of antagonist
- Their motivation (they should believe they're right)
- Their relationship to the protagonist
- What makes them a worthy opponent

When you have enough, include:
\`\`\`framework
{"antagonist": {"name": "...", "type": "person|organization|nature|society|self|technology", "description": "...", "motivation": "...", "relationship": "..."}}
\`\`\``,

  supporting: `You are helping an author develop their supporting cast.
Common supporting character roles:
- Mentor - guides the protagonist
- Ally/Sidekick - loyal friend and helper
- Love Interest - romantic connection
- Foil - contrasts with protagonist
- Trickster - comic relief, chaos agent

For each character, explore:
- Name and role
- Relationship to protagonist
- Brief description
- What they add to the story

When describing a character, include:
\`\`\`framework
{"supportingCharacter": {"name": "...", "role": "...", "relationship": "...", "description": "..."}}
\`\`\``,

  world: `You are helping an author build their story world.
Explore:
- Time period (contemporary, historical, future, timeless)
- Setting type (urban, rural, fantastical, space, etc.)
- Technology level (primitive, contemporary, advanced, mixed)
- Society structure (how is society organized)
- Special rules (magic systems, sci-fi tech, supernatural elements)
- Atmosphere (overall mood and feel)

When you have enough, include:
\`\`\`framework
{"world": {"timePeriod": "...", "settingType": "...", "technology": "...", "society": "...", "rules": "...", "atmosphere": "..."}}
\`\`\``,

  locations: `You are helping an author define key locations in their story.
Important locations often include:
- Home Base - where the protagonist starts
- Destination - where they're headed
- Threshold - point of no return
- Ordeal Location - where major challenges occur
- Sacred Space - place of reflection/growth

For each location, explore:
- Name
- Type (city, building, landscape, etc.)
- Description (visual, sensory details)
- Significance to the story

When describing a location, include:
\`\`\`framework
{"location": {"name": "...", "type": "...", "description": "...", "significance": "..."}}
\`\`\``,

  conflict: `You are helping an author define their story's central conflict.
Explore:
- External conflict (what must be overcome)
- Internal conflict (what inner struggle must be resolved)
- Stakes (what happens if they fail - personal, local, global)
- Key obstacles (what stands in the way)

When you have enough, include:
\`\`\`framework
{"conflict": {"external": "...", "internal": "...", "stakes": "...", "obstacles": [...]}}
\`\`\``,

  themes: `You are helping an author explore their story's themes.
Great themes give stories depth and resonance:
- Primary theme - the main question/idea explored
- Secondary themes - supporting ideas
- Symbols - objects/images that represent themes
- Questions - what questions does the story ask readers to consider

Themes are explored, not preached. The story demonstrates the theme through character choices and consequences.

When you have enough, include:
\`\`\`framework
{"themes": {"primary": "...", "secondary": [...], "symbols": [...], "questions": [...]}}
\`\`\``,

  review: `You are helping an author review and finalize their story framework.
Summarize what they've built and offer suggestions for:
- Strengthening weak areas
- Connections between elements
- Potential plot threads
- Character relationships

Be encouraging and congratulate them on building their framework.`,
};

// Generate mode prompts
const GENERATE_PROMPTS: Record<string, string> = {
  genre: `Based on the story framework so far, suggest creative genre combinations and tones that could work well. Provide 2-3 specific options with brief explanations of why they might work.`,
  
  premise: `Based on the genre and any existing framework elements, generate 2-3 compelling premise ideas. Each should have a clear logline, hook, and brief concept.`,
  
  protagonist: `Based on the story framework so far, generate a detailed protagonist concept including name, background, motivation, flaw, and character arc. Make them compelling and suited to the genre.`,
  
  antagonist: `Based on the protagonist and story framework, generate a worthy antagonist concept. Consider what type of opposition would create the most interesting conflict.`,
  
  supporting: `Based on the story framework, suggest 2-3 supporting characters that would complement the protagonist and add depth to the story. Include their role, relationship, and what they add.`,
  
  world: `Based on the genre and premise, generate detailed world-building suggestions including time period, setting, technology, society, and atmosphere.`,
  
  locations: `Based on the story framework, generate 2-3 key locations that would be important to the story. Include vivid descriptions and their narrative significance.`,
  
  conflict: `Based on the protagonist, antagonist, and themes, generate specific internal and external conflicts with high stakes and meaningful obstacles.`,
  
  themes: `Based on the story framework so far, identify potential themes that emerge naturally from the characters and conflict. Suggest symbols and thematic questions.`,
  
  review: `Provide a comprehensive analysis of the story framework, highlighting its strengths, potential issues, and suggestions for making it stronger.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      step,
      prompt, 
      framework,
      projectTitle,
      model = 'meta-llama/llama-3.2-3b-instruct:free',
      generateMode = false
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
    }

    // Build context from existing framework
    const frameworkContext = buildFrameworkContext(framework);
    
    // Build system prompt
    const systemPrompt = `You are an expert story development assistant helping an author build a comprehensive story framework for their novel${projectTitle ? ` titled "${projectTitle}"` : ''}.

${STEP_PROMPTS[step] || STEP_PROMPTS.welcome}

${generateMode ? `\n\nGENERATION MODE:\n${GENERATE_PROMPTS[step] || 'Generate creative suggestions based on the story framework.'}` : ''}

EXISTING FRAMEWORK:
${frameworkContext}

GUIDELINES:
- Be encouraging and collaborative
- Ask clarifying questions when needed
- Provide specific, actionable suggestions
- When you have enough information, include the JSON framework block
- Keep responses focused and not too long
- Use markdown formatting for readability`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    const result = await callOpenRouterWithFallback(model, messages, {
      temperature: generateMode ? 0.8 : 0.7,
      max_tokens: 1500,
      title: 'SpectreWeave Framework Wizard',
      type: 'free'
    });

    if (!result.ok) {
      const { error, status } = handleAIError(result);
      return NextResponse.json({ error }, { status });
    }

    const content = result.data.choices?.[0]?.message?.content || '';

    // Extract framework updates from response
    const frameworkUpdate = extractFrameworkUpdate(content);
    
    // Generate contextual suggestions
    const suggestions = generateSuggestions(step, content, framework);

    // Clean the response (remove framework JSON blocks for display)
    let cleanedMessage = content
      .replace(/```framework[\s\S]*?```/g, '')
      .replace(/```json[\s\S]*?```/g, '')
      // Also remove unformatted JSON objects that look like framework data
      .replace(/\{\s*"\w+_?\w*"\s*:\s*\{[\s\S]*?\}\s*\}/g, (match: string) => {
        // Only remove if it looks like framework JSON (has framework-like keys)
        if (/("novel_title"|"story_setting"|"protagonist"|"antagonist"|"genre"|"premise"|"themes"|"conflict"|"core_engine"|"mythology"|"trilogy_structure")/.test(match)) {
          return '';
        }
        return match;
      })
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return NextResponse.json({
      message: cleanedMessage,
      frameworkUpdate,
      suggestions
    });

  } catch (error) {
    console.error('Framework wizard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Build context string from framework
function buildFrameworkContext(framework: any): string {
  if (!framework) return 'No framework data yet.';

  const sections: string[] = [];

  if (framework.genre?.primary) {
    sections.push(`Genre: ${framework.genre.primary}${framework.genre.tone ? ` (${framework.genre.tone})` : ''}`);
    if (framework.genre.subgenres?.length) {
      sections.push(`Sub-genres: ${framework.genre.subgenres.join(', ')}`);
    }
  }

  if (framework.premise?.logline) {
    sections.push(`Premise: ${framework.premise.logline}`);
    if (framework.premise.hook) {
      sections.push(`Hook: ${framework.premise.hook}`);
    }
  }

  if (framework.protagonist?.name) {
    sections.push(`Protagonist: ${framework.protagonist.name}`);
    if (framework.protagonist.motivation) {
      sections.push(`  - Motivation: ${framework.protagonist.motivation}`);
    }
    if (framework.protagonist.flaw) {
      sections.push(`  - Flaw: ${framework.protagonist.flaw}`);
    }
  }

  if (framework.antagonist?.name) {
    sections.push(`Antagonist: ${framework.antagonist.name} (${framework.antagonist.type || 'unknown type'})`);
    if (framework.antagonist.motivation) {
      sections.push(`  - Motivation: ${framework.antagonist.motivation}`);
    }
  }

  if (framework.supportingCharacters?.length) {
    sections.push(`Supporting Characters:`);
    framework.supportingCharacters.forEach((char: any) => {
      sections.push(`  - ${char.name} (${char.role}): ${char.relationship}`);
    });
  }

  if (framework.world?.settingType || framework.world?.timePeriod) {
    sections.push(`World: ${framework.world.settingType || ''} ${framework.world.timePeriod || ''}`.trim());
    if (framework.world.atmosphere) {
      sections.push(`  - Atmosphere: ${framework.world.atmosphere}`);
    }
  }

  if (framework.locations?.length) {
    sections.push(`Key Locations:`);
    framework.locations.forEach((loc: any) => {
      sections.push(`  - ${loc.name}: ${loc.significance || loc.description}`);
    });
  }

  if (framework.conflict?.external) {
    sections.push(`External Conflict: ${framework.conflict.external}`);
    if (framework.conflict.internal) {
      sections.push(`Internal Conflict: ${framework.conflict.internal}`);
    }
    if (framework.conflict.stakes) {
      sections.push(`Stakes: ${framework.conflict.stakes}`);
    }
  }

  if (framework.themes?.primary) {
    sections.push(`Primary Theme: ${framework.themes.primary}`);
    if (framework.themes.secondary?.length) {
      sections.push(`Secondary Themes: ${framework.themes.secondary.join(', ')}`);
    }
  }

  return sections.length > 0 ? sections.join('\n') : 'No framework data yet.';
}

// Extract framework update from AI response
function extractFrameworkUpdate(content: string): any | null {
  // Try to extract framework JSON
  const frameworkMatch = content.match(/```framework\s*([\s\S]*?)```/);
  if (frameworkMatch) {
    try {
      return JSON.parse(frameworkMatch[1].trim());
    } catch (e) {
      console.error('Failed to parse framework JSON:', e);
    }
  }

  // Also try regular JSON blocks that might contain framework data
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      // Check if it looks like framework data
      if (parsed.genre || parsed.premise || parsed.protagonist || parsed.antagonist || 
          parsed.world || parsed.conflict || parsed.themes || 
          parsed.supportingCharacter || parsed.location) {
        
        // Handle supporting character and location arrays
        const result: any = {};
        
        if (parsed.supportingCharacter) {
          // This is a single supporting character to add
          result._addSupportingCharacter = {
            id: `char-${Date.now()}`,
            ...parsed.supportingCharacter
          };
        } else if (parsed.location) {
          // This is a single location to add
          result._addLocation = {
            id: `loc-${Date.now()}`,
            ...parsed.location
          };
        } else {
          Object.assign(result, parsed);
        }
        
        return result;
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }
  }

  return null;
}

// Generate contextual suggestions based on step and response
function generateSuggestions(step: string, content: string, framework: any): Array<{ label: string; value: string }> {
  const suggestions: Array<{ label: string; value: string }> = [];

  switch (step) {
    case 'genre':
      if (!framework?.genre?.primary) {
        suggestions.push(
          { label: 'Fantasy', value: "I'm writing fantasy - let me tell you more about the type" },
          { label: 'Sci-Fi', value: "I'm writing science fiction" },
          { label: 'Mystery', value: "I'm writing a mystery" },
          { label: 'Romance', value: "I'm writing romance" }
        );
      } else {
        suggestions.push(
          { label: 'Add subgenre', value: 'I want to add a subgenre element' },
          { label: 'Adjust tone', value: 'Let me adjust the tone' },
          { label: 'Move on', value: "This looks good, let's move to the next step" }
        );
      }
      break;

    case 'premise':
      if (!framework?.premise?.logline) {
        suggestions.push(
          { label: 'Help brainstorm', value: 'Help me brainstorm premise ideas' },
          { label: 'I have an idea', value: 'I have a basic idea, let me describe it' }
        );
      } else {
        suggestions.push(
          { label: 'Refine logline', value: 'Help me refine the logline' },
          { label: 'Strengthen hook', value: 'Help me strengthen the hook' },
          { label: 'Move on', value: "This looks good, let's move to the next step" }
        );
      }
      break;

    case 'protagonist':
      if (!framework?.protagonist?.name) {
        suggestions.push(
          { label: 'Generate ideas', value: 'Generate some protagonist ideas for me' },
          { label: 'I have a character', value: 'I have a character in mind' }
        );
      } else {
        suggestions.push(
          { label: 'Deepen backstory', value: 'Help me develop their backstory' },
          { label: 'Add traits', value: 'Help me add more personality traits' },
          { label: 'Move on', value: "This looks good, let's move to the next step" }
        );
      }
      break;

    case 'antagonist':
      suggestions.push(
        { label: 'Human villain', value: 'I want a human antagonist' },
        { label: 'Organization', value: 'The antagonist is an organization' },
        { label: 'Internal', value: 'The main conflict is internal' },
        { label: 'Generate ideas', value: 'Generate antagonist ideas that fit my story' }
      );
      break;

    case 'supporting':
      suggestions.push(
        { label: 'Add mentor', value: 'Help me create a mentor character' },
        { label: 'Add ally', value: 'Help me create an ally/sidekick' },
        { label: 'Add love interest', value: 'Help me create a love interest' },
        { label: 'Generate cast', value: 'Suggest a supporting cast for my story' }
      );
      break;

    case 'world':
      suggestions.push(
        { label: 'Magic system', value: 'Help me develop a magic system' },
        { label: 'Society', value: 'Help me develop the society structure' },
        { label: 'Atmosphere', value: 'Help me define the atmosphere and mood' }
      );
      break;

    case 'locations':
      suggestions.push(
        { label: 'Starting location', value: 'Help me create where the story begins' },
        { label: 'Key destination', value: 'Help me create a key destination' },
        { label: 'Generate locations', value: 'Generate important locations for my story' }
      );
      break;

    case 'conflict':
      suggestions.push(
        { label: 'External', value: 'Help me define the external conflict' },
        { label: 'Internal', value: 'Help me define the internal conflict' },
        { label: 'Stakes', value: 'Help me raise the stakes' }
      );
      break;

    case 'themes':
      suggestions.push(
        { label: 'Identify themes', value: 'Help me identify themes from my story' },
        { label: 'Add symbols', value: 'Suggest symbolic elements for my themes' },
        { label: 'Thematic questions', value: 'What questions should my story explore?' }
      );
      break;

    case 'review':
      suggestions.push(
        { label: 'Summary', value: 'Give me a complete summary of my framework' },
        { label: 'Suggestions', value: 'What could be improved?' },
        { label: 'Ready to save', value: "Everything looks good, I'm ready to save!" }
      );
      break;
  }

  return suggestions;
}
