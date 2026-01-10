'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TIMING } from '../constants';
import type { ChatContext, UseEditorContextOptions, UseEditorContextReturn } from '../types';

/**
 * Default empty context
 */
const DEFAULT_CONTEXT: ChatContext = {
  characters: [],
};

/**
 * Try to get editor instance from context
 */
function getActiveEditor(): {
  state: { selection: { from: number }; doc: { textBetween: (from: number, to: number) => string; nodeSize: number } };
  getText: () => string;
} | null {
  try {
    // Try to import dynamically
    const editorContext = require('@/components/BlockEditor/context/UnifiedEditorContext');
    const { useEditors } = editorContext;
    
    // This won't work directly in a hook, so we return null
    // The actual implementation will need to receive the editor as a prop
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract chapter heading from document
 * Looks for heading nodes and extracts the one containing cursor
 */
function extractChapter(doc: string, cursorPosition: number): string | undefined {
  // Simple regex to find chapter headings
  const chapterRegex = /^#{1,3}\s+(.+)$/gm;
  const matches: { index: number; text: string }[] = [];
  
  let match;
  while ((match = chapterRegex.exec(doc)) !== null) {
    matches.push({ index: match.index, text: match[1].trim() });
  }
  
  // Find the chapter that contains the cursor (last heading before cursor)
  let currentChapter: string | undefined;
  for (const m of matches) {
    if (m.index <= cursorPosition) {
      currentChapter = m.text;
    } else {
      break;
    }
  }
  
  return currentChapter;
}

/**
 * Extract character names from text
 * Uses simple heuristics - proper nouns and dialogue attribution
 */
function extractCharacters(text: string): string[] {
  const characters = new Set<string>();
  
  // Pattern 1: Dialogue attribution - "said Alice" or "Alice said"
  const dialoguePattern = /(?:said|asked|replied|whispered|shouted|exclaimed)\s+([A-Z][a-z]+)|([A-Z][a-z]+)\s+(?:said|asked|replied|whispered|shouted|exclaimed)/g;
  
  let match;
  while ((match = dialoguePattern.exec(text)) !== null) {
    const name = match[1] || match[2];
    if (name && name.length >= 2 && name.length <= 20) {
      characters.add(name);
    }
  }
  
  // Pattern 2: Possessive with proper noun - "Alice's" or "Bob's"
  const possessivePattern = /([A-Z][a-z]+)'s/g;
  while ((match = possessivePattern.exec(text)) !== null) {
    const name = match[1];
    if (name && name.length >= 2 && name.length <= 20) {
      characters.add(name);
    }
  }
  
  return Array.from(characters).slice(0, 5); // Limit to 5 characters
}

/**
 * Hook for detecting editor context
 *
 * Extracts:
 * - Current chapter (based on heading hierarchy)
 * - Characters in nearby text
 * - Selected text
 *
 * Updates are debounced to avoid performance issues.
 */
export function useEditorContext(
  options: UseEditorContextOptions = {}
): UseEditorContextReturn {
  const { debounceMs = TIMING.contextDebounce } = options;
  
  const [context, setContext] = useState<ChatContext>(DEFAULT_CONTEXT);
  const [hasEditor, setHasEditor] = useState(false);
  
  // For now, this is a simplified implementation
  // In a real implementation, the editor would be passed as a prop or via context

  /**
   * Update context from editor state
   */
  const updateContext = useCallback(() => {
    // Placeholder - will be connected to editor in integration
    // This would normally read from the editor's state
    setContext(DEFAULT_CONTEXT);
  }, []);

  /**
   * Set up editor subscription (when editor is available)
   */
  useEffect(() => {
    // This effect would set up editor event listeners
    // For now, just set hasEditor to false since we're not connected
    setHasEditor(false);
    
    return () => {
      // Cleanup subscriptions
    };
  }, []);

  return useMemo(
    () => ({
      context,
      updateContext,
      hasEditor,
    }),
    [context, updateContext, hasEditor]
  );
}

/**
 * Enhanced version that accepts editor instance directly
 */
export function useEditorContextWithEditor(
  editor: { 
    state: { selection: { from: number; to: number }; doc: { textBetween: (from: number, to: number) => string; nodeSize: number } };
    getText: () => string;
    on: (event: string, handler: () => void) => void;
    off: (event: string, handler: () => void) => void;
  } | null,
  options: UseEditorContextOptions = {}
): UseEditorContextReturn {
  const { debounceMs = TIMING.contextDebounce } = options;
  
  const [context, setContext] = useState<ChatContext>(DEFAULT_CONTEXT);
  
  /**
   * Update context from editor state
   */
  const updateContext = useCallback(() => {
    if (!editor) {
      setContext(DEFAULT_CONTEXT);
      return;
    }
    
    try {
      const { selection, doc } = editor.state;
      const cursorPos = selection.from;
      
      // Get surrounding text (500 chars before and after cursor)
      const start = Math.max(0, cursorPos - 500);
      const end = Math.min(doc.nodeSize - 2, cursorPos + 500);
      const nearbyText = doc.textBetween(start, end);
      
      // Get full document text for chapter detection
      const fullText = editor.getText();
      
      // Extract context
      const chapter = extractChapter(fullText, cursorPos);
      const characters = extractCharacters(nearbyText);
      
      // Get selected text if any
      const selectedText = selection.from !== selection.to
        ? doc.textBetween(selection.from, selection.to)
        : undefined;
      
      setContext({
        chapter,
        characters,
        selectedText,
      });
    } catch (error) {
      console.error('[useEditorContext] Failed to update context:', error);
      setContext(DEFAULT_CONTEXT);
    }
  }, [editor]);

  /**
   * Set up debounced editor subscription
   */
  useEffect(() => {
    if (!editor) return;
    
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateContext, debounceMs);
    };
    
    // Initial update
    updateContext();
    
    // Subscribe to editor events
    editor.on('selectionUpdate', handleUpdate);
    editor.on('update', handleUpdate);
    
    return () => {
      clearTimeout(timeoutId);
      editor.off('selectionUpdate', handleUpdate);
      editor.off('update', handleUpdate);
    };
  }, [editor, updateContext, debounceMs]);

  return useMemo(
    () => ({
      context,
      updateContext,
      hasEditor: !!editor,
    }),
    [context, updateContext, editor]
  );
}
