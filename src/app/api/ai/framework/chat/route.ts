import { NextRequest, NextResponse } from 'next/server';

/**
 * Framework Chat API
 * Guided conversation to build story framework elements
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Topic-specific prompts
const TOPIC_PROMPTS: Record<string, string> = {
  premise: `Help the user develop their story premise and genre. Ask about:
- The core concept in one sentence
- Genre (fantasy, sci-fi, thriller, romance, etc.)
- Tone (dark, humorous, epic, intimate)
- What makes it unique

When they provide enough info, output a JSON block with:
\`\`\`json
{"type": "premise", "data": {"premise": "...", "genre": "...", "tone": "...", "hook": "..."}}
\`\`\``,

  protagonist: `Help the user develop their protagonist. Ask about:
- Name and basic appearance
- Core motivation and goal
- Flaw or internal conflict
- Background/backstory
- What makes them compelling

When they provide enough info, output a JSON block with:
\`\`\`json
{"type": "character", "data": {"name": "...", "role": "protagonist", "description": "...", "traits": [...], "notes": "..."}}
\`\`\``,

  antagonist: `Help the user develop their antagonist. Ask about:
- Who or what opposes the protagonist
- Their motivation (they should believe they're right)
- Their relationship to the protagonist
- What makes them a worthy opponent

When they provide enough info, output a JSON block with:
\`\`\`json
{"type": "character", "data": {"name": "...", "role": "antagonist", "description": "...", "traits": [...], "notes": "..."}}
\`\`\``,

  world: `Help the user build their story world. Ask about:
- Time period and setting type
- Key locations
- Rules (magic systems, technology, society)
- Atmosphere and sensory details

When they describe a specific location, output:
\`\`\`json
{"type": "location", "data": {"name": "...", "type": "...", "description": "..."}}
\`\`\``,

  conflict: `Help the user define the central conflict. Ask about:
- External conflict (what must be overcome)
- Internal conflict (what the protagonist struggles with inside)
- Stakes (what happens if they fail)
- Obstacles they'll face

When defined, output:
\`\`\`json
{"type": "note", "data": {"title": "Central Conflict", "category": "plot", "content": "..."}}
\`\`\``,

  themes: `Help the user explore their story themes. Ask about:
- What questions does the story explore?
- What message or truth do they want to convey?
- How will themes manifest through character arcs?
- Symbolic elements

When defined, output:
\`\`\`json
{"type": "note", "data": {"title": "Story Themes", "category": "theme", "content": "..."}}
\`\`\``,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      prompt, 
      topic, 
      existingFramework, 
      characters = [], 
      locations = [],
      model = 'meta-llama/llama-3.2-3b-instruct:free',
      projectTitle 
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
    }

    // Build system prompt based on topic
    let systemPrompt = `You are a helpful writing coach assisting an author in building their story framework. Be encouraging, ask good questions, and help them develop rich, compelling story elements.

Project: "${projectTitle || 'Untitled'}"
`;

    if (topic && TOPIC_PROMPTS[topic]) {
      systemPrompt += `\n\nCURRENT FOCUS: ${topic.toUpperCase()}\n${TOPIC_PROMPTS[topic]}`;
    }

    // Add existing context
    if (existingFramework?.premise) {
      systemPrompt += `\n\nExisting premise: ${existingFramework.premise}`;
    }
    if (existingFramework?.genre) {
      systemPrompt += `\nGenre: ${existingFramework.genre}`;
    }
    if (characters.length > 0) {
      systemPrompt += `\n\nExisting characters: ${characters.map((c: any) => c.name).join(', ')}`;
    }
    if (locations.length > 0) {
      systemPrompt += `\nExisting locations: ${locations.map((l: any) => l.name).join(', ')}`;
    }

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'SpectreWeave'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter error:', error);
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse for JSON framework element
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    let element = null;
    let message = content;

    if (jsonMatch) {
      try {
        element = JSON.parse(jsonMatch[1]);
        // Remove JSON block from message
        message = content.replace(/```json[\s\S]*?```/, '').trim();
      } catch (e) {
        console.error('Failed to parse framework element JSON:', e);
      }
    }

    return NextResponse.json({
      message,
      element: element ? { type: element.type, data: element.data } : null,
      type: element ? 'framework_element' : 'message'
    });

  } catch (error) {
    console.error('Framework chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
