// useGhostText Hook
// Manages inline AI suggestions in the editor

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  GhostTextSuggestion,
  GhostTextState,
  GhostTextSettings,
  GhostTextAction,
  DEFAULT_GHOST_TEXT_SETTINGS,
} from '../types';

interface UseGhostTextOptions {
  editor: Editor | null;
  settings?: Partial<GhostTextSettings>;
  // Called to generate a suggestion
  onGenerate?: (context: { before: string; after: string }) => Promise<string>;
  // Called when suggestion is accepted
  onAccept?: (suggestion: GhostTextSuggestion) => void;
  // Called when suggestion is dismissed
  onDismiss?: (suggestion: GhostTextSuggestion) => void;
}

interface UseGhostTextReturn {
  // Current suggestion
  suggestion: GhostTextSuggestion | null;
  // Is generating?
  isGenerating: boolean;
  // Actions
  accept: () => void;
  acceptWord: () => void;
  dismiss: () => void;
  trigger: () => void;
  // Settings
  settings: GhostTextSettings;
  updateSettings: (settings: Partial<GhostTextSettings>) => void;
  // Position for rendering
  position: { top: number; left: number } | null;
}

export function useGhostText(options: UseGhostTextOptions): UseGhostTextReturn {
  const { editor, settings: userSettings, onGenerate, onAccept, onDismiss } = options;
  
  const [suggestion, setSuggestion] = useState<GhostTextSuggestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<GhostTextSettings>({
    ...DEFAULT_GHOST_TEXT_SETTINGS,
    ...userSettings,
  });
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastPositionRef = useRef<number>(0);
  
  // Update settings
  const updateSettings = useCallback((newSettings: Partial<GhostTextSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);
  
  // Get context for generation
  const getContext = useCallback(() => {
    if (!editor) return null;
    
    const { state } = editor;
    const { from } = state.selection;
    const doc = state.doc;
    const docSize = doc.content.size;
    
    // Get ~500 chars before and ~200 after cursor
    const beforeStart = Math.max(0, from - 500);
    const before = doc.textBetween(beforeStart, from, ' ');
    
    const afterEnd = Math.min(docSize, from + 200);
    const after = doc.textBetween(from, afterEnd, ' ');
    
    return { before, after, position: from };
  }, [editor]);
  
  // Check if we should trigger based on context
  const shouldTrigger = useCallback((before: string): boolean => {
    if (!settings.enabled || !settings.autoTrigger) return false;
    
    // Check minimum characters
    if (before.length < settings.minChars) return false;
    
    // Check for trigger phrases
    const lastChars = before.slice(-20).toLowerCase();
    for (const phrase of settings.triggerPhrases) {
      if (lastChars.includes(phrase.toLowerCase())) {
        return true;
      }
    }
    
    // Trigger at end of sentences or paragraphs
    const endsWithPunctuation = /[.!?]\s*$/.test(before);
    const endsWithNewline = /\n\s*$/.test(before);
    
    return endsWithPunctuation || endsWithNewline;
  }, [settings]);
  
  // Generate a suggestion
  const generate = useCallback(async () => {
    if (!editor || !onGenerate || isGenerating) return;
    
    const context = getContext();
    if (!context) return;
    
    // Cancel any pending generation
    if (abortRef.current) {
      abortRef.current.abort();
    }
    
    abortRef.current = new AbortController();
    setIsGenerating(true);
    
    try {
      const text = await onGenerate({
        before: context.before,
        after: context.after,
      });
      
      if (text && text.trim()) {
        const newSuggestion: GhostTextSuggestion = {
          id: `ghost-${Date.now()}`,
          text: text.trim(),
          position: context.position,
          createdAt: Date.now(),
        };
        
        setSuggestion(newSuggestion);
        lastPositionRef.current = context.position;
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Ghost text generation error:', error);
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, [editor, onGenerate, isGenerating, getContext]);
  
  // Accept full suggestion
  const accept = useCallback(() => {
    if (!editor || !suggestion) return;
    
    editor.chain()
      .focus()
      .insertContent(suggestion.text)
      .run();
    
    onAccept?.(suggestion);
    setSuggestion(null);
  }, [editor, suggestion, onAccept]);
  
  // Accept just the first word
  const acceptWord = useCallback(() => {
    if (!editor || !suggestion) return;
    
    const words = suggestion.text.split(/\s+/);
    const firstWord = words[0] + ' ';
    
    editor.chain()
      .focus()
      .insertContent(firstWord)
      .run();
    
    // Update suggestion with remaining words
    const remainingText = words.slice(1).join(' ');
    if (remainingText.trim()) {
      setSuggestion({
        ...suggestion,
        text: remainingText,
        position: suggestion.position + firstWord.length,
      });
    } else {
      setSuggestion(null);
    }
  }, [editor, suggestion]);
  
  // Dismiss suggestion
  const dismiss = useCallback(() => {
    if (suggestion) {
      onDismiss?.(suggestion);
    }
    setSuggestion(null);
    
    // Cancel any pending generation
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, [suggestion, onDismiss]);
  
  // Manual trigger
  const trigger = useCallback(() => {
    generate();
  }, [generate]);
  
  // Update position when suggestion changes
  useEffect(() => {
    if (!editor || !suggestion) {
      setPosition(null);
      return;
    }
    
    // Get cursor coordinates from editor
    const coords = editor.view.coordsAtPos(suggestion.position);
    if (coords) {
      setPosition({
        top: coords.top,
        left: coords.left,
      });
    }
  }, [editor, suggestion]);
  
  // Listen for editor changes and auto-trigger
  useEffect(() => {
    if (!editor || !settings.enabled) return;
    
    const handleUpdate = () => {
      // Clear existing suggestion if cursor moved significantly
      const { from } = editor.state.selection;
      if (suggestion && Math.abs(from - suggestion.position) > 5) {
        dismiss();
      }
      
      // Debounce new suggestion generation
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      const context = getContext();
      if (context && shouldTrigger(context.before)) {
        debounceRef.current = setTimeout(() => {
          generate();
        }, settings.delay);
      }
    };
    
    editor.on('update', handleUpdate);
    
    return () => {
      editor.off('update', handleUpdate);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [editor, settings, suggestion, dismiss, getContext, shouldTrigger, generate]);
  
  // Keyboard shortcuts
  useEffect(() => {
    if (!suggestion) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab to accept
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        accept();
        return;
      }
      
      // Ctrl/Cmd + Right to accept word
      if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        acceptWord();
        return;
      }
      
      // Escape to dismiss
      if (e.key === 'Escape') {
        e.preventDefault();
        dismiss();
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suggestion, accept, acceptWord, dismiss]);
  
  return {
    suggestion,
    isGenerating,
    accept,
    acceptWord,
    dismiss,
    trigger,
    settings,
    updateSettings,
    position,
  };
}
