/**
 * useGhostTextTrigger Hook
 * 
 * Manages automatic ghost text generation based on typing patterns
 * and manual triggers in a TipTap editor.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { ghostTextPluginKey } from './GhostTextExtension';

interface UseGhostTextTriggerOptions {
  editor: Editor | null;
  // Function that generates text given context
  generateText: (context: GenerationContext) => Promise<string>;
  // Delay before auto-triggering (ms)
  delay?: number;
  // Minimum characters before triggering
  minChars?: number;
  // Whether auto-trigger is enabled
  autoTrigger?: boolean;
  // Trigger phrases that immediately trigger generation
  triggerPhrases?: string[];
  // Maximum context to send (chars)
  maxContextBefore?: number;
  maxContextAfter?: number;
}

interface GenerationContext {
  before: string;
  after: string;
  cursorPosition: number;
}

interface UseGhostTextTriggerReturn {
  // Manually trigger generation
  trigger: () => void;
  // Is currently generating?
  isGenerating: boolean;
  // Cancel current generation
  cancel: () => void;
  // Accept current suggestion
  accept: () => void;
  // Dismiss current suggestion
  dismiss: () => void;
  // Current suggestion text
  suggestion: string | null;
}

export function useGhostTextTrigger(
  options: UseGhostTextTriggerOptions
): UseGhostTextTriggerReturn {
  const {
    editor,
    generateText,
    delay = 1500,
    minChars = 20,
    autoTrigger = true,
    triggerPhrases = ['...', '—', '" ', '\n\n'],
    maxContextBefore = 1500,
    maxContextAfter = 500,
  } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastPositionRef = useRef<number>(0);

  // Get editor context
  const getContext = useCallback((): GenerationContext | null => {
    if (!editor) return null;

    const { state } = editor;
    const { from } = state.selection;
    const doc = state.doc;
    const docSize = doc.content.size;

    const beforeStart = Math.max(0, from - maxContextBefore);
    const before = doc.textBetween(beforeStart, from, '\n');

    const afterEnd = Math.min(docSize, from + maxContextAfter);
    const after = doc.textBetween(from, afterEnd, '\n');

    return { before, after, cursorPosition: from };
  }, [editor, maxContextBefore, maxContextAfter]);

  // Check if we should auto-trigger
  const shouldAutoTrigger = useCallback((before: string): boolean => {
    if (!autoTrigger) return false;
    if (before.length < minChars) return false;

    // Check for trigger phrases at end
    const lastChars = before.slice(-10);
    for (const phrase of triggerPhrases) {
      if (lastChars.endsWith(phrase)) {
        return true;
      }
    }

    // Trigger at end of sentences (with some buffer)
    if (/[.!?]\s*$/.test(before)) {
      return true;
    }

    // Trigger at paragraph breaks
    if (/\n\s*$/.test(before)) {
      return true;
    }

    return false;
  }, [autoTrigger, minChars, triggerPhrases]);

  // Generate suggestion
  const generate = useCallback(async () => {
    if (!editor || isGenerating) return;

    const context = getContext();
    if (!context) return;

    // Cancel any pending generation
    if (abortRef.current) {
      abortRef.current.abort();
    }

    abortRef.current = new AbortController();
    setIsGenerating(true);
    lastPositionRef.current = context.cursorPosition;

    try {
      const text = await generateText(context);

      // Check if cursor moved during generation
      const currentPos = editor.state.selection.from;
      if (currentPos !== lastPositionRef.current) {
        return; // Discard stale suggestion
      }

      if (text && text.trim()) {
        setSuggestion(text);
        editor.commands.setGhostText(text);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Ghost text generation error:', error);
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [editor, isGenerating, getContext, generateText]);

  // Manual trigger
  const trigger = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    generate();
  }, [generate]);

  // Cancel generation
  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setIsGenerating(false);
  }, []);

  // Accept suggestion
  const accept = useCallback(() => {
    if (editor && suggestion) {
      editor.commands.acceptGhostText();
      setSuggestion(null);
    }
  }, [editor, suggestion]);

  // Dismiss suggestion
  const dismiss = useCallback(() => {
    if (editor) {
      editor.commands.dismissGhostText();
      setSuggestion(null);
    }
    cancel();
  }, [editor, cancel]);

  // Listen for editor updates to auto-trigger
  useEffect(() => {
    if (!editor || !autoTrigger) return;

    const handleUpdate = () => {
      // Clear existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Clear suggestion on edit
      const pluginState = ghostTextPluginKey.getState(editor.state);
      if (pluginState?.suggestion) {
        setSuggestion(null);
      }

      // Check if we should trigger
      const context = getContext();
      if (context && shouldAutoTrigger(context.before)) {
        debounceRef.current = setTimeout(() => {
          generate();
        }, delay);
      }
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [editor, autoTrigger, delay, getContext, shouldAutoTrigger, generate]);

  // Sync suggestion state with plugin
  useEffect(() => {
    if (!editor) return;

    const handleTransaction = () => {
      const pluginState = ghostTextPluginKey.getState(editor.state);
      if (pluginState?.suggestion !== suggestion) {
        setSuggestion(pluginState?.suggestion || null);
      }
    };

    editor.on('transaction', handleTransaction);
    return () => {
      editor.off('transaction', handleTransaction);
    };
  }, [editor, suggestion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    trigger,
    isGenerating,
    cancel,
    accept,
    dismiss,
    suggestion,
  };
}
