// useEditorAgentContext Hook
// Extracts rich context from TipTap editor for AI agents

'use client';

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  EditorContextSnapshot,
  EditorSelection,
  EditorCursor,
  EditorContent,
  SurroundingContext,
  StoryContext,
  CONTEXT_BEFORE_LIMIT,
  CONTEXT_AFTER_LIMIT,
} from '../types';

interface UseEditorAgentContextOptions {
  editor: Editor | null;
  // Optional story metadata
  chapterTitle?: string;
  sceneName?: string;
  characters?: string[];
  locations?: string[];
}

interface EditorAgentContext {
  // Get current context snapshot
  getSnapshot: () => EditorContextSnapshot | null;
  
  // Get selection
  selection: EditorSelection | null;
  
  // Get cursor position
  cursor: EditorCursor | null;
  
  // Get surrounding context
  getSurrounding: () => SurroundingContext | null;
  
  // Check if there's a selection
  hasSelection: boolean;
  
  // Get selected text
  selectedText: string;
  
  // Insert text at cursor
  insertAtCursor: (text: string) => void;
  
  // Replace selection
  replaceSelection: (text: string) => void;
  
  // Insert after current paragraph
  insertAfterParagraph: (text: string) => void;
}

export function useEditorAgentContext(options: UseEditorAgentContextOptions): EditorAgentContext {
  const { editor, chapterTitle, sceneName, characters = [], locations = [] } = options;
  const [selection, setSelection] = useState<EditorSelection | null>(null);
  const [cursor, setCursor] = useState<EditorCursor | null>(null);
  
  // Track selection changes
  useEffect(() => {
    if (!editor) {
      setSelection(null);
      setCursor(null);
      return;
    }
    
    const updateState = () => {
      const { state } = editor;
      const { from, to, empty } = state.selection;
      
      // Get selected text
      const text = empty ? '' : state.doc.textBetween(from, to, ' ');
      
      setSelection({
        text,
        from,
        to,
        isEmpty: empty,
      });
      
      // Calculate line/column
      const resolvedPos = state.doc.resolve(from);
      const line = resolvedPos.depth > 0 ? resolvedPos.index(0) + 1 : 1;
      const lineStart = resolvedPos.start(1);
      const column = from - lineStart + 1;
      
      setCursor({
        position: from,
        line,
        column,
      });
    };
    
    // Initial update
    updateState();
    
    // Listen for selection changes
    editor.on('selectionUpdate', updateState);
    editor.on('update', updateState);
    
    return () => {
      editor.off('selectionUpdate', updateState);
      editor.off('update', updateState);
    };
  }, [editor]);
  
  // Get surrounding context
  const getSurrounding = useCallback((): SurroundingContext | null => {
    if (!editor) return null;
    
    const { state } = editor;
    const { from, to } = state.selection;
    const doc = state.doc;
    const docSize = doc.content.size;
    
    // Get text before cursor/selection
    const beforeStart = Math.max(0, from - CONTEXT_BEFORE_LIMIT);
    const before = doc.textBetween(beforeStart, from, ' ');
    
    // Get text after cursor/selection  
    const afterEnd = Math.min(docSize, to + CONTEXT_AFTER_LIMIT);
    const after = doc.textBetween(to, afterEnd, ' ');
    
    // Get current paragraph
    const $from = doc.resolve(from);
    let currentParagraph = '';
    if ($from.parent.type.name === 'paragraph' || $from.parent.type.name === 'text') {
      currentParagraph = $from.parent.textContent;
    }
    
    // Try to extract current sentence (simple heuristic)
    const fullContext = before + after;
    const sentences = fullContext.split(/[.!?]+\s+/);
    const cursorInContext = before.length;
    let charCount = 0;
    let currentSentence = '';
    for (const sentence of sentences) {
      if (charCount + sentence.length >= cursorInContext) {
        currentSentence = sentence.trim();
        break;
      }
      charCount += sentence.length + 2; // +2 for punctuation and space
    }
    
    return {
      before,
      after,
      currentParagraph,
      currentSentence,
    };
  }, [editor]);
  
  // Get full snapshot
  const getSnapshot = useCallback((): EditorContextSnapshot | null => {
    if (!editor || !selection || !cursor) return null;
    
    const { state } = editor;
    const doc = state.doc;
    
    // Content stats
    const plainText = doc.textContent;
    const html = editor.getHTML();
    const words = plainText.trim().split(/\s+/).filter(w => w.length > 0);
    
    const content: EditorContent = {
      plainText,
      html,
      wordCount: words.length,
      charCount: plainText.length,
    };
    
    // Get surrounding
    const surrounding = getSurrounding() || {
      before: '',
      after: '',
      currentParagraph: '',
      currentSentence: '',
    };
    
    // Extract mentioned characters/locations from surrounding text
    const contextText = surrounding.before + surrounding.after;
    const mentionedCharacters = characters.filter(c => 
      contextText.toLowerCase().includes(c.toLowerCase())
    );
    const mentionedLocations = locations.filter(l =>
      contextText.toLowerCase().includes(l.toLowerCase())
    );
    
    const story: StoryContext = {
      chapterTitle,
      sceneName,
      mentionedCharacters,
      mentionedLocations,
    };
    
    return {
      selection,
      cursor,
      content,
      surrounding,
      story,
      timestamp: Date.now(),
    };
  }, [editor, selection, cursor, getSurrounding, chapterTitle, sceneName, characters, locations]);
  
  // Insert text at cursor position
  const insertAtCursor = useCallback((text: string) => {
    if (!editor) return;
    
    editor.chain()
      .focus()
      .insertContent(text)
      .run();
  }, [editor]);
  
  // Replace current selection with text
  const replaceSelection = useCallback((text: string) => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    
    editor.chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(text)
      .run();
  }, [editor]);
  
  // Insert after current paragraph
  const insertAfterParagraph = useCallback((text: string) => {
    if (!editor) return;
    
    const { state } = editor;
    const { $from } = state.selection;
    
    // Find end of current block
    let endOfBlock = $from.end();
    
    editor.chain()
      .focus()
      .setTextSelection(endOfBlock)
      .insertContent([
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ type: 'text', text }] },
      ])
      .run();
  }, [editor]);
  
  return {
    getSnapshot,
    selection,
    cursor,
    getSurrounding,
    hasSelection: selection ? !selection.isEmpty : false,
    selectedText: selection?.text || '',
    insertAtCursor,
    replaceSelection,
    insertAfterParagraph,
  };
}
