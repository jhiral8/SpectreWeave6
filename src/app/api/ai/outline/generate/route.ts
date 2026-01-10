import { NextRequest, NextResponse } from 'next/server';

/**
 * Chapter Outline Generation API
 * Generates chapter outlines with scene beats from framework elements
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      framework,
      characters = [],
      locations = [],
      existingOutlines = [],
      chapterNumber = 1,
      totalChapters = 10,
      model = 'meta-llama/llama-3.2-3b-instruct:free'
    } = body;

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
    }

    // Build comprehensive context
    let context = `STORY FRAMEWORK:
Premise: ${framework?.premise || 'Not defined'}
Genre: ${framework?.genre || 'Not defined'}
Tone: ${framework?.tone || 'Not defined'}
Hook: ${framework?.hook || 'Not defined'}
`;

    if (characters.length > 0) {
      context += `\nCHARACTERS:\n`;
      characters.forEach((char: any) => {
        context += `- ${char.name} (${char.role || 'supporting'}): ${char.description || 'No description'}\n`;
        if (char.traits?.length > 0) {
          context += `  Traits: ${char.traits.join(', ')}\n`;
        }
      });
    }

    if (locations.length > 0) {
      context += `\nLOCATIONS:\n`;
      locations.forEach((loc: any) => {
        context += `- ${loc.name}: ${loc.description || 'No description'}\n`;
      });
    }

    if (existingOutlines.length > 0) {
      context += `\nEXISTING CHAPTER OUTLINES:\n`;
      existingOutlines.forEach((outline: any, idx: number) => {
        context += `Chapter ${idx + 1}: ${outline.summary}\n`;
      });
    }

    const systemPrompt = `You are a story structuring expert. Generate a detailed chapter outline with scene beats.

${context}

Generate an outline for Chapter ${chapterNumber} of ${totalChapters}. Consider pacing, story arc placement, and character development.

Return ONLY valid JSON in this format:
{
  "chapter_number": ${chapterNumber},
  "title": "Chapter Title",
  "summary": "2-3 sentence summary of what happens",
  "beats": [
    {
      "id": "beat-1",
      "title": "Opening Beat",
      "description": "What happens in this scene",
      "characters_involved": ["Character Name"],
      "location": "Location Name",
      "target_words": 500,
      "mood": "tense/peaceful/exciting/etc"
    }
  ],
  "target_word_count": 3000,
  "notes": "Any additional notes about this chapter"
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
          { role: 'user', content: `Generate a detailed outline for Chapter ${chapterNumber}. Include 4-6 scene beats that advance the story logically.` }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter error:', error);
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let outline = null;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        outline = JSON.parse(jsonMatch[0]);
        
        // Ensure beats have IDs
        if (outline.beats) {
          outline.beats = outline.beats.map((beat: any, idx: number) => ({
            ...beat,
            id: beat.id || `beat-${idx + 1}`,
            status: 'not_started'
          }));
        }
      } catch (e) {
        console.error('Failed to parse outline JSON:', e);
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
    }

    if (!outline) {
      return NextResponse.json({ error: 'No valid outline generated' }, { status: 500 });
    }

    return NextResponse.json({
      outline,
      raw: content
    });

  } catch (error) {
    console.error('Outline generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
