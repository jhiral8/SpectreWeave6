// Editor Context Types for AI Integration
// Provides context from the editor to AI agents

import { Editor } from '@tiptap/react';

export interface EditorSelection {
  // Selected text content
  text: string;
  // Selection range
  from: number;
  to: number;
  // Is selection empty (cursor only)?
  isEmpty: boolean;
}

export interface EditorCursor {
  // Cursor position
  position: number;
  // Line number (1-based)
  line: number;
  // Column number (1-based)  
  column: number;
}

export interface EditorContent {
  // Full document as plain text
  plainText: string;
  // Full document as HTML
  html: string;
  // Word count
  wordCount: number;
  // Character count
  charCount: number;
}

export interface SurroundingContext {
  // Text before selection/cursor (up to limit)
  before: string;
  // Text after selection/cursor (up to limit)
  after: string;
  // Current paragraph text
  currentParagraph: string;
  // Current sentence (if detectable)
  currentSentence: string;
}

export interface StoryContext {
  // Current chapter title
  chapterTitle?: string;
  // Current scene number/name
  sceneName?: string;
  // Characters mentioned in surrounding text
  mentionedCharacters?: string[];
  // Locations mentioned
  mentionedLocations?: string[];
}

export interface EditorContextSnapshot {
  // Selection state
  selection: EditorSelection;
  // Cursor state
  cursor: EditorCursor;
  // Content stats
  content: EditorContent;
  // Surrounding text context
  surrounding: SurroundingContext;
  // Story context
  story: StoryContext;
  // Timestamp of snapshot
  timestamp: number;
}

// Amount of context to capture (characters)
export const CONTEXT_BEFORE_LIMIT = 1000;
export const CONTEXT_AFTER_LIMIT = 500;
