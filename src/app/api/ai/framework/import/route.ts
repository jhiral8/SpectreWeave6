import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouterWithFallback, handleAIError } from '@/lib/ai/openrouter-utils';

/**
 * Framework Import API
 * Parses pasted framework content (JSON or text) and extracts structured data
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const IMPORT_SYSTEM_PROMPT = `You are a story framework parser. The user will paste their existing story framework, which could be:
- JSON data from a previous export
- Plain text notes about their story
- A mix of structured and unstructured content
- Detailed world-building documents

Your job is to extract and organize this information into a structured framework.

OUTPUT FORMAT:
You must return a JSON object with the following structure. Include ALL fields, using empty strings/arrays if no data is available:

\`\`\`json
{
  "genre": {
    "primary": "main genre",
    "subgenres": ["subgenre1", "subgenre2"],
    "tone": "dark/light/gritty/etc",
    "targetAudience": "adult/YA/etc"
  },
  "premise": {
    "logline": "one sentence summary",
    "hook": "unique angle",
    "synopsis": "brief synopsis"
  },
  "protagonist": {
    "name": "character name",
    "age": "age if mentioned",
    "occupation": "job/role",
    "description": "physical/personality description",
    "motivation": "what they want",
    "flaw": "fatal flaw or wound",
    "arc": "how they change",
    "traits": ["trait1", "trait2"]
  },
  "antagonist": {
    "name": "antagonist name or description",
    "type": "person/organization/nature/society/self/technology",
    "description": "description",
    "motivation": "their goal",
    "relationship": "connection to protagonist"
  },
  "supportingCharacters": [
    {
      "id": "unique-id",
      "name": "character name",
      "role": "mentor/ally/love interest/etc",
      "relationship": "connection to protagonist",
      "description": "brief description"
    }
  ],
  "world": {
    "timePeriod": "when the story takes place",
    "settingType": "urban/rural/fantasy/space/etc",
    "technology": "tech level",
    "society": "social structure",
    "rules": "magic systems, special rules",
    "atmosphere": "mood/feel"
  },
  "locations": [
    {
      "id": "unique-id",
      "name": "location name",
      "type": "city/building/etc",
      "description": "description",
      "significance": "why it matters"
    }
  ],
  "conflict": {
    "external": "external conflict",
    "internal": "internal conflict",
    "stakes": "what's at risk",
    "obstacles": ["obstacle1", "obstacle2"]
  },
  "themes": {
    "primary": "main theme",
    "secondary": ["theme2", "theme3"],
    "symbols": ["symbol1", "symbol2"],
    "questions": ["question the story explores"]
  }
}
\`\`\`

EXTRACTION RULES:
1. Extract as much information as possible from the input
2. Make reasonable inferences where data is implied but not explicit
3. For trilogy/series structures, combine into the main framework
4. Convert any mythology/symbolism into themes
5. Extract ALL named characters, even minor ones
6. Identify ALL named locations
7. If the input is already JSON, parse and restructure it
8. Generate unique IDs for array items (use format: "char-1", "loc-1", etc.)

After the JSON, add a brief summary of what you extracted (2-3 sentences).`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      content,
      projectTitle,
      model = 'meta-llama/llama-3.3-70b-instruct:free'  // Use larger model for parsing
    } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
    }

    // Try to pre-parse if it looks like JSON
    let preprocessedContent = content;
    try {
      const parsed = JSON.parse(content);
      preprocessedContent = `The following is JSON data. Extract and restructure it:\n\n${JSON.stringify(parsed, null, 2)}`;
    } catch {
      // Not JSON, send as-is
      preprocessedContent = `Parse the following story framework and extract structured data:\n\n${content}`;
    }

    const messages = [
      { role: 'system', content: IMPORT_SYSTEM_PROMPT },
      { role: 'user', content: preprocessedContent }
    ];

    const result = await callOpenRouterWithFallback(model, messages, {
      temperature: 0.3,
      max_tokens: 4000,
      title: 'SpectreWeave Framework Import',
      type: 'power'
    });

    if (!result.ok) {
      const { error, status } = handleAIError(result);
      return NextResponse.json({ error }, { status });
    }

    const responseContent = result.data.choices?.[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (!jsonMatch) {
      // Try to find raw JSON object
      const rawJsonMatch = responseContent.match(/\{[\s\S]*"genre"[\s\S]*\}/);
      if (!rawJsonMatch) {
        return NextResponse.json({ 
          error: 'Could not parse framework from input. Please try again or provide more structured data.' 
        }, { status: 400 });
      }
      
      try {
        const framework = JSON.parse(rawJsonMatch[0]);
        const summary = responseContent.replace(rawJsonMatch[0], '').trim() || 
          'Framework parsed successfully.';
        
        return NextResponse.json({
          framework: normalizeFramework(framework),
          summary
        });
      } catch {
        return NextResponse.json({ 
          error: 'Failed to parse the extracted framework data.' 
        }, { status: 400 });
      }
    }

    try {
      const framework = JSON.parse(jsonMatch[1]);
      const summary = responseContent
        .replace(/```json[\s\S]*?```/g, '')
        .trim() || 'Framework imported successfully.';
      
      return NextResponse.json({
        framework: normalizeFramework(framework),
        summary
      });

    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse the extracted framework. Please try with simpler input.' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Framework import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Normalize framework to ensure all fields exist
function normalizeFramework(framework: any): any {
  const normalized = {
    genre: {
      primary: framework.genre?.primary || '',
      subgenres: framework.genre?.subgenres || [],
      tone: framework.genre?.tone || '',
      targetAudience: framework.genre?.targetAudience || ''
    },
    premise: {
      logline: framework.premise?.logline || '',
      hook: framework.premise?.hook || '',
      synopsis: framework.premise?.synopsis || ''
    },
    protagonist: {
      name: framework.protagonist?.name || '',
      age: framework.protagonist?.age || '',
      occupation: framework.protagonist?.occupation || '',
      description: framework.protagonist?.description || '',
      motivation: framework.protagonist?.motivation || '',
      flaw: framework.protagonist?.flaw || '',
      arc: framework.protagonist?.arc || '',
      traits: framework.protagonist?.traits || []
    },
    antagonist: {
      name: framework.antagonist?.name || '',
      type: framework.antagonist?.type || 'person',
      description: framework.antagonist?.description || '',
      motivation: framework.antagonist?.motivation || '',
      relationship: framework.antagonist?.relationship || ''
    },
    supportingCharacters: (framework.supportingCharacters || []).map((char: any, i: number) => ({
      id: char.id || `char-${i + 1}`,
      name: char.name || '',
      role: char.role || '',
      relationship: char.relationship || '',
      description: char.description || ''
    })),
    world: {
      timePeriod: framework.world?.timePeriod || '',
      settingType: framework.world?.settingType || '',
      technology: framework.world?.technology || '',
      society: framework.world?.society || '',
      rules: framework.world?.rules || '',
      atmosphere: framework.world?.atmosphere || ''
    },
    locations: (framework.locations || []).map((loc: any, i: number) => ({
      id: loc.id || `loc-${i + 1}`,
      name: loc.name || '',
      type: loc.type || '',
      description: loc.description || '',
      significance: loc.significance || ''
    })),
    conflict: {
      external: framework.conflict?.external || '',
      internal: framework.conflict?.internal || '',
      stakes: framework.conflict?.stakes || '',
      obstacles: framework.conflict?.obstacles || []
    },
    themes: {
      primary: framework.themes?.primary || '',
      secondary: framework.themes?.secondary || [],
      symbols: framework.themes?.symbols || [],
      questions: framework.themes?.questions || []
    }
  };

  return normalized;
}
