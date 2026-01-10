import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouterWithFallback, handleAIError } from '@/lib/ai/openrouter-utils';

/**
 * Chapter Outline Generation API
 * Generates chapter outlines with scene beats from framework elements
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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

		const systemPrompt = `You are an expert story architect. Generate a detailed chapter outline for Chapter ${chapterNumber} of ${totalChapters}.
Your goal is to create a compelling bridge between previous chapters and the upcoming story arcs while maintaining theme and character consistency.

OUTPUT FORMAT:
\`\`\`json
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
}
\`\`\``;

		const messages = [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: `Context:\n${context}\n\nGenerate outline for Chapter ${chapterNumber}:` }
		];

		const result = await callOpenRouterWithFallback(model, messages, {
			temperature: 0.8,
			max_tokens: 2000,
			title: 'SpectreWeave Outline Builder',
			type: 'free'
		});

		if (!result.ok) {
			const { error, status } = handleAIError(result);
			return NextResponse.json({ error }, { status });
		}

		const data = result.data;
		const content = data.choices?.[0]?.message?.content || '';

		// Extract JSON block
		const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
		if (!jsonMatch) {
			return NextResponse.json({ error: 'Failed to generate valid outline structure' }, { status: 500 });
		}

		try {
			const outline = JSON.parse(jsonMatch[1]);
			return NextResponse.json({ outline });
		} catch (e) {
			console.error('Failed to parse outline JSON:', e);
			return NextResponse.json({ error: 'Invalid outline JSON structure' }, { status: 500 });
		}
	} catch (error) {
		console.error('Outline generation error:', error);
		return NextResponse.json({ error: 'AI service error' }, { status: 500 });
	}
}
