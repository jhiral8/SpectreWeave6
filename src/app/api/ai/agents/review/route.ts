import { NextRequest, NextResponse } from 'next/server';

/**
 * Agent Review API
 * Specialist agents that provide focused feedback on writing
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface AgentConfig {
  name: string;
  persona: string;
  focusAreas: string[];
  suggestionTypes: string[];
}

const AGENTS: Record<string, AgentConfig> = {
  'style-coach': {
    name: 'Style Coach',
    persona: `You are an expert prose stylist and writing coach. Focus on sentence-level craft, word choice, rhythm, and voice consistency. Be encouraging but specific.`,
    focusAreas: ['prose style', 'word choice', 'sentence variety', 'voice', 'show vs tell'],
    suggestionTypes: ['style', 'prose', 'clarity']
  },
  'character-keeper': {
    name: 'Character Keeper',
    persona: `You are a character development specialist. Ensure characters stay consistent, have depth, and behave believably. Track motivations and arcs.`,
    focusAreas: ['character consistency', 'motivation', 'dialogue authenticity', 'character arcs', 'relationships'],
    suggestionTypes: ['character', 'dialogue', 'consistency']
  },
  'plot-analyst': {
    name: 'Plot Analyst',
    persona: `You are a narrative structure expert. Analyze pacing, plot holes, tension, and story logic. Ensure events connect meaningfully.`,
    focusAreas: ['pacing', 'plot logic', 'tension', 'foreshadowing', 'cause and effect'],
    suggestionTypes: ['plot', 'pacing', 'structure']
  },
  'dialogue-master': {
    name: 'Dialogue Master',
    persona: `You are a dialogue specialist. Focus on making conversations feel natural, reveal character, and advance the story. Each character should sound unique.`,
    focusAreas: ['dialogue flow', 'subtext', 'character voice', 'dialogue tags', 'exposition in dialogue'],
    suggestionTypes: ['dialogue', 'voice', 'subtext']
  },
  'world-builder': {
    name: 'World Builder',
    persona: `You are a world-building consultant. Ensure settings are vivid, consistent, and integrated into the narrative. Focus on sensory details and atmosphere.`,
    focusAreas: ['setting description', 'world consistency', 'atmosphere', 'sensory details', 'world rules'],
    suggestionTypes: ['setting', 'atmosphere', 'world-building']
  },
  'continuity-checker': {
    name: 'Continuity Checker',
    persona: `You are a continuity expert. Track details across scenes: character locations, timelines, physical descriptions, and established facts.`,
    focusAreas: ['timeline', 'character tracking', 'detail consistency', 'established facts'],
    suggestionTypes: ['continuity', 'consistency', 'error']
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agentType,
      content,
      framework,
      characters = [],
      locations = [],
      chapterOutline,
      model = 'meta-llama/llama-3.2-3b-instruct:free'
    } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!agentType || !AGENTS[agentType]) {
      return NextResponse.json({ 
        error: 'Invalid agent type',
        validAgents: Object.keys(AGENTS)
      }, { status: 400 });
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
    }

    const agent = AGENTS[agentType];

    // Build context
    let context = '';
    
    if (framework?.premise) {
      context += `STORY PREMISE: ${framework.premise}\n`;
    }
    if (framework?.genre) {
      context += `GENRE: ${framework.genre}\n`;
    }
    if (characters.length > 0) {
      context += `\nCHARACTERS:\n${characters.map((c: any) => `- ${c.name}: ${c.description || ''}`).join('\n')}\n`;
    }
    if (locations.length > 0) {
      context += `\nLOCATIONS:\n${locations.map((l: any) => `- ${l.name}: ${l.description || ''}`).join('\n')}\n`;
    }
    if (chapterOutline) {
      context += `\nCHAPTER OUTLINE: ${chapterOutline.summary}\n`;
    }

    const systemPrompt = `${agent.persona}

${context ? `STORY CONTEXT:\n${context}` : ''}

FOCUS AREAS: ${agent.focusAreas.join(', ')}

Analyze the provided text and give specific, actionable suggestions. For each issue found:
1. Quote the specific passage
2. Explain the issue
3. Provide a concrete improvement suggestion

Return your review as JSON:
{
  "overall_assessment": "Brief overall impression (2-3 sentences)",
  "strengths": ["What's working well"],
  "suggestions": [
    {
      "type": "${agent.suggestionTypes[0]}",
      "severity": "minor|moderate|major",
      "quote": "The specific text with the issue",
      "issue": "What the problem is",
      "suggestion": "How to improve it",
      "example": "Optional rewritten version"
    }
  ],
  "priority_fix": "The single most important thing to address"
}`;

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
          { role: 'user', content: `Please review this text:\n\n${content}` }
        ],
        temperature: 0.5,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter error:', error);
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let review = null;
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        review = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse review JSON:', e);
        // Return raw response if JSON parsing fails
        return NextResponse.json({
          review: {
            overall_assessment: responseContent,
            strengths: [],
            suggestions: [],
            priority_fix: 'See overall assessment'
          },
          raw: responseContent,
          parsed: false
        });
      }
    }

    if (!review) {
      return NextResponse.json({
        review: {
          overall_assessment: responseContent,
          strengths: [],
          suggestions: [],
          priority_fix: 'See overall assessment'
        },
        raw: responseContent,
        parsed: false
      });
    }

    return NextResponse.json({
      review,
      agent: {
        type: agentType,
        name: agent.name
      },
      raw: responseContent,
      parsed: true
    });

  } catch (error) {
    console.error('Agent review error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to list available agents
export async function GET() {
  const agentList = Object.entries(AGENTS).map(([id, config]) => ({
    id,
    name: config.name,
    focusAreas: config.focusAreas,
    suggestionTypes: config.suggestionTypes
  }));

  return NextResponse.json({ agents: agentList });
}
