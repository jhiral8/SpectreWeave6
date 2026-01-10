/**
 * Editor Tools - MCP-style tools for AI to manipulate the manuscript
 * 
 * These tools allow the AI to suggest precise edits to the document,
 * similar to how VSCode Copilot works.
 */

export interface EditorTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface EditOperation {
  type: 'replace' | 'insert' | 'delete';
  startOffset?: number;
  endOffset?: number;
  oldText?: string;
  newText?: string;
  position?: 'cursor' | 'start' | 'end';
}

// Define the tools available to the AI for editing
export const EDITOR_TOOLS: EditorTool[] = [
  {
    name: 'replace_selection',
    description: 'Replace the currently selected text with new text. Use this when the user has selected text and wants it rewritten or modified.',
    parameters: {
      type: 'object',
      properties: {
        new_text: {
          type: 'string',
          description: 'The new text to replace the selection with'
        },
        explanation: {
          type: 'string',
          description: 'Brief explanation of what was changed and why'
        }
      },
      required: ['new_text']
    }
  },
  {
    name: 'insert_at_cursor',
    description: 'Insert new text at the current cursor position. Use this to add new content like continuing a scene or adding a new paragraph.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to insert at the cursor position'
        },
        explanation: {
          type: 'string',
          description: 'Brief explanation of what was added'
        }
      },
      required: ['text']
    }
  },
  {
    name: 'replace_range',
    description: 'Replace a specific range of text in the document. Use when you need to edit a specific passage.',
    parameters: {
      type: 'object',
      properties: {
        search_text: {
          type: 'string',
          description: 'The exact text to find and replace (must match exactly)'
        },
        new_text: {
          type: 'string',
          description: 'The new text to replace it with'
        },
        explanation: {
          type: 'string',
          description: 'Brief explanation of what was changed'
        }
      },
      required: ['search_text', 'new_text']
    }
  },
  {
    name: 'append_to_document',
    description: 'Add new text at the end of the document. Use for continuing the story.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to append to the document'
        },
        explanation: {
          type: 'string',
          description: 'Brief explanation of what was added'
        }
      },
      required: ['text']
    }
  }
];

// Convert tool calls to edit operations
export function toolCallToEditOperation(
  toolCall: ToolCall,
  context: {
    selectedText?: string;
    cursorPosition?: number;
    documentContent?: string;
  }
): EditOperation | null {
  const { name, arguments: args } = toolCall;

  switch (name) {
    case 'replace_selection':
      if (!context.selectedText) {
        console.warn('replace_selection called but no text is selected');
        return null;
      }
      return {
        type: 'replace',
        oldText: context.selectedText,
        newText: args.new_text
      };

    case 'insert_at_cursor':
      return {
        type: 'insert',
        position: 'cursor',
        newText: args.text,
        startOffset: context.cursorPosition
      };

    case 'replace_range':
      if (!context.documentContent) return null;
      const startOffset = context.documentContent.indexOf(args.search_text);
      if (startOffset === -1) {
        console.warn('replace_range: search_text not found in document');
        return null;
      }
      return {
        type: 'replace',
        startOffset,
        endOffset: startOffset + args.search_text.length,
        oldText: args.search_text,
        newText: args.new_text
      };

    case 'append_to_document':
      return {
        type: 'insert',
        position: 'end',
        newText: args.text
      };

    default:
      console.warn(`Unknown tool: ${name}`);
      return null;
  }
}

// Format tools for OpenRouter function calling
export function formatToolsForOpenRouter() {
  return EDITOR_TOOLS.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}

// Parse tool calls from OpenRouter response
export function parseToolCallsFromResponse(response: any): ToolCall[] {
  const toolCalls: ToolCall[] = [];
  
  // Handle OpenRouter/OpenAI style tool calls
  if (response.choices?.[0]?.message?.tool_calls) {
    for (const tc of response.choices[0].message.tool_calls) {
      if (tc.type === 'function') {
        try {
          toolCalls.push({
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments)
          });
        } catch (e) {
          console.error('Failed to parse tool call arguments:', e);
        }
      }
    }
  }
  
  return toolCalls;
}

// System prompt that instructs the AI how to use tools
export const GHOSTWRITE_SYSTEM_PROMPT = `You are an AI writing assistant embedded in a fiction writing IDE. You can directly edit the manuscript using tools.

AVAILABLE TOOLS:
- replace_selection: Replace selected text with your rewrite
- insert_at_cursor: Insert new content at the cursor position  
- replace_range: Find and replace specific text
- append_to_document: Add text to the end

IMPORTANT RULES:
1. ALWAYS use a tool to make changes - never just describe what you would change
2. Match the existing style, tone, and voice
3. Be creative and literary when writing prose
4. Keep explanations brief
5. If the user has selected text, prefer replace_selection
6. If no selection but asking to continue, use insert_at_cursor or append_to_document

You are writing actual manuscript text that will go directly into the book.`;

// Models that support function calling on OpenRouter
export const FUNCTION_CALLING_MODELS = [
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-haiku',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/gpt-3.5-turbo',
  'google/gemini-pro-1.5',
  'google/gemini-flash-1.5',
  'mistralai/mistral-large',
  'meta-llama/llama-3.1-70b-instruct', // Some versions support
];
