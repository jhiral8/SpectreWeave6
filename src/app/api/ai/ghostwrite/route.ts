import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * /api/ai/ghostwrite
 * 
 * AI endpoint for manuscript editing AND story framework population.
 * 
 * Modes:
 * - text: Edit/insert manuscript text (default)
 * - framework: Create/update story framework elements (characters, locations, notes)
 * 
 * Strategy: Use strict prompting to get CLEAN output from free models,
 * then determine operation type based on context (selection vs no selection).
 */

interface StoryCharacter {
  id: string;
  name: string;
  role?: string;
  description?: string;
  traits?: string[];
}

interface StoryLocation {
  id: string;
  name: string;
  description?: string;
  type?: string;
}

// Framework element types for AI to create
type FrameworkElementType = 'character' | 'location' | 'note';

interface FrameworkCreationRequest {
  mode: 'framework';
  elementType: FrameworkElementType;
  prompt: string;
  model?: string;
  // Existing context for consistency
  characters?: StoryCharacter[];
  locations?: StoryLocation[];
  chapterTitle?: string;
  projectTitle?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if this is a framework creation request
    if (body.mode === 'framework') {
      return handleFrameworkRequest(body as FrameworkCreationRequest);
    }

    // Otherwise, handle as text editing request
    const { 
      prompt,
      selectedText,
      documentContent,
      model = 'meta-llama/llama-3.2-3b-instruct:free',
      // Story context
      characters = [],
      chapterTitle,
      projectTitle
    } = body as {
      prompt: string;
      selectedText?: string;
      documentContent?: string;
      model?: string;
      characters?: StoryCharacter[];
      chapterTitle?: string;
      projectTitle?: string;
    };

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
    }

    // Build story context section
    let storyContext = '';
    if (projectTitle || chapterTitle || characters.length > 0) {
      storyContext = '\n\nSTORY CONTEXT:';
      if (projectTitle) storyContext += `\nProject: "${projectTitle}"`;
      if (chapterTitle) storyContext += `\nChapter: "${chapterTitle}"`;
      if (characters.length > 0) {
        storyContext += '\nCharacters:';
        characters.forEach((char: StoryCharacter) => {
          storyContext += `\n- ${char.name}${char.role ? ` (${char.role})` : ''}${char.description ? `: ${char.description}` : ''}`;
        });
      }
    }

    // Determine operation type BEFORE calling the AI
    const hasSelection = selectedText && selectedText.trim().length > 0;
    const operationType = hasSelection ? 'replace' : 'insert';

    // Build system prompt based on operation type
    let systemPrompt: string;
    let userPrompt: string;

    if (operationType === 'replace') {
      // REPLACEMENT: AI must rewrite the selected text
      systemPrompt = `You are a ghostwriter. Rewrite the given text according to the user's instructions.

ABSOLUTE RULES:
- Output ONLY the rewritten text
- Do NOT include any explanation, commentary, or preamble
- Do NOT say "Here is..." or "I've rewritten..." or anything similar
- Do NOT mention what you're doing - just output the result
- Match the original style and voice unless told otherwise
- Preserve formatting (paragraphs, dialogue punctuation, etc.)
${storyContext}

START YOUR RESPONSE DIRECTLY WITH THE REWRITTEN TEXT.`;

      userPrompt = `TEXT TO REWRITE:
"""
${selectedText}
"""

INSTRUCTION: ${prompt}

REWRITTEN TEXT:`;

    } else {
      // INSERTION: AI must generate new content
      systemPrompt = `You are a ghostwriter. Write new content according to the user's instructions.

ABSOLUTE RULES:
- Output ONLY the new content
- Do NOT include any explanation, commentary, or preamble
- Do NOT say "Here is..." or "I'll write..." or anything similar
- Do NOT mention tools, functions, or what you're doing
- Write creative, engaging prose
- Match the document's style if context is provided
${storyContext}

START YOUR RESPONSE DIRECTLY WITH THE NEW CONTENT.`;

      // Include document context for style matching
      const contextSnippet = documentContent 
        ? `\n\nDOCUMENT CONTEXT (for style matching):\n"""${documentContent.slice(-1500)}"""`
        : '';

      userPrompt = `${contextSnippet}

INSTRUCTION: ${prompt}

NEW CONTENT:`;
    }

    // Make API call
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://spectreweave.com',
        'X-Title': 'SpectreWeave',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2500,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', errorData);
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Clean up the response - remove common AI preambles
    const cleanedContent = cleanAIResponse(content);

    // Return structured response
    return NextResponse.json({
      type: 'tool_calls',
      toolCalls: [{
        name: operationType === 'replace' ? 'replace_selection' : 'insert_at_cursor',
        arguments: {
          [operationType === 'replace' ? 'new_text' : 'text']: cleanedContent,
          explanation: operationType === 'replace' 
            ? `Rewrote selection: "${prompt}"`
            : `Generated: "${prompt}"`
        }
      }],
      model: data.model
    });

  } catch (error) {
    console.error('Ghostwrite API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Clean AI response of common preambles and meta-commentary
 */
function cleanAIResponse(content: string): string {
  let cleaned = content.trim();
  
  // Remove common AI preambles (case-insensitive)
  const preamblePatterns = [
    /^(here'?s?|here is|here are)\s+(the\s+)?(rewritten|edited|revised|new|updated|modified)?\s*(text|content|version|passage)?:?\s*/i,
    /^(i'?ve?|i have|i will|i'll|i am going to)\s+(rewritten?|edited?|revised?|created?|written?|made?|generated?)?\s*(the\s+)?(text|content|it|this)?:?\s*/i,
    /^(the\s+)?(rewritten|edited|revised|new|updated)\s+(text|content|version)?:?\s*/i,
    /^(certainly|sure|of course|absolutely)[!,.]?\s*(here'?s?|here is)?:?\s*/i,
    /^(using|with)\s+.{0,50}(emphasis|style|tone|imagery)[,.]?\s*/i,
    /^"""?\s*/,
    /^\*\*[^*]+\*\*:?\s*/,  // Remove bold labels like **Rewritten:**
  ];
  
  for (const pattern of preamblePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove trailing meta-commentary
  const trailingPatterns = [
    /\s*\(i used.+\)\s*$/i,
    /\s*\(using.+\)\s*$/i,
    /\s*\[.+\]\s*$/i,
    /\s*---+\s*.+$/i,
    /\s*"""?\s*$/,
  ];
  
  for (const pattern of trailingPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  return cleaned.trim();
}

/**
 * Handle framework element creation (characters, locations, notes)
 */
async function handleFrameworkRequest(req: FrameworkCreationRequest): Promise<NextResponse> {
  const { 
    elementType, 
    prompt, 
    model = 'meta-llama/llama-3.2-3b-instruct:free',
    characters = [],
    locations = [],
    projectTitle,
    chapterTitle 
  } = req;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
  }

  // Build existing context for consistency
  let existingContext = '';
  if (projectTitle) existingContext += `\nProject: "${projectTitle}"`;
  if (chapterTitle) existingContext += `\nChapter: "${chapterTitle}"`;
  if (characters.length > 0) {
    existingContext += '\nExisting Characters:';
    characters.forEach(c => {
      existingContext += `\n- ${c.name}${c.role ? ` (${c.role})` : ''}`;
    });
  }
  if (locations.length > 0) {
    existingContext += '\nExisting Locations:';
    locations.forEach(l => {
      existingContext += `\n- ${l.name}${l.type ? ` (${l.type})` : ''}`;
    });
  }

  // Build prompts based on element type
  let systemPrompt: string;
  let userPrompt: string;

  switch (elementType) {
    case 'character':
      systemPrompt = `You are a creative writing assistant helping to flesh out characters for a story.

OUTPUT FORMAT (JSON):
{
  "name": "Character Name",
  "role": "protagonist|antagonist|supporting|minor",
  "description": "1-2 sentence description of who they are",
  "traits": ["trait1", "trait2", "trait3"],
  "notes": "Additional background, motivations, or story notes"
}

RULES:
- Output ONLY valid JSON, no explanation or markdown code blocks
- Create a compelling, believable character
- Make them fit the story context if provided
- Be specific with traits (not generic like "brave" - use "recklessly brave after losing his brother")
${existingContext ? `\nSTORY CONTEXT:${existingContext}` : ''}`;

      userPrompt = `Create a character based on this description: ${prompt}

JSON:`;
      break;

    case 'location':
      systemPrompt = `You are a creative writing assistant helping to develop locations for a story.

OUTPUT FORMAT (JSON):
{
  "name": "Location Name",
  "type": "world|country|region|city|town|village|building|room|landscape|other",
  "description": "2-3 sentence vivid description with sensory details",
  "notes": "History, significance, or story-relevant details"
}

RULES:
- Output ONLY valid JSON, no explanation or markdown code blocks
- Create an atmospheric, vivid location
- Include sensory details (sights, sounds, smells)
- Make it fit the story's tone if context provided
${existingContext ? `\nSTORY CONTEXT:${existingContext}` : ''}`;

      userPrompt = `Create a location based on this description: ${prompt}

JSON:`;
      break;

    case 'note':
      systemPrompt = `You are a creative writing assistant helping to organize story research and planning.

OUTPUT FORMAT (JSON):
{
  "title": "Note Title",
  "category": "research|plot|character|world|theme|other",
  "content": "The detailed note content - can be multiple paragraphs"
}

RULES:
- Output ONLY valid JSON, no explanation or markdown code blocks
- Create useful, actionable writing notes
- Be specific and detailed in the content
- Pick the most appropriate category
${existingContext ? `\nSTORY CONTEXT:${existingContext}` : ''}`;

      userPrompt = `Create a story note based on this: ${prompt}

JSON:`;
      break;

    default:
      return NextResponse.json({ error: 'Invalid element type' }, { status: 400 });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://spectreweave.com',
        'X-Title': 'SpectreWeave',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', errorData);
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    const cleanedContent = cleanJsonResponse(content);
    
    try {
      const parsed = JSON.parse(cleanedContent);
      
      // Return as framework tool call
      return NextResponse.json({
        type: 'framework_create',
        elementType,
        data: parsed,
        model: data.model
      });
    } catch (parseError) {
      console.error('Failed to parse framework JSON:', cleanedContent);
      return NextResponse.json({ 
        error: 'Failed to parse AI response as JSON',
        rawContent: content 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Framework creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Clean JSON response - remove markdown code blocks and trim
 */
function cleanJsonResponse(content: string): string {
  let cleaned = content.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```json?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  
  // Find the JSON object (handle extra text before/after)
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  return cleaned;
}
