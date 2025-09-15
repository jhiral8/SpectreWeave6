/**
 * Advanced Smart Suggestions Hook for SpectreWeave5
 * 
 * Provides context-aware, real-time writing suggestions with:
 * - Multiple trigger types (timer, punctuation, selection)
 * - Intelligent debouncing and throttling
 * - Context-aware suggestion generation
 * - Integration with TipTap editor
 * - Multi-provider AI routing
 * - User preference adaptation
 * - Performance optimization
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/core';
import { useAdvancedAI } from '../lib/ai/advancedAIContext';
import { 
  SmartSuggestion, 
  SmartSuggestionConfig, 
  SuggestionTrigger,
  AIContext,
} from '../lib/ai/types';

interface UseAdvancedSmartSuggestionsOptions {
  editor: Editor | null;
  enabled?: boolean;
  debounceMs?: number;
  minCharacters?: number;
  maxSuggestions?: number;
  contextWindow?: number;
  triggers?: SuggestionTrigger[];
  onSuggestionAccepted?: (suggestion: SmartSuggestion) => void;
  onSuggestionRejected?: (suggestion: SmartSuggestion) => void;
}

interface UseAdvancedSmartSuggestionsReturn {
  // Current suggestions
  suggestions: SmartSuggestion[];
  isGenerating: boolean;
  
  // Manual controls
  triggerSuggestions: () => Promise<void>;
  clearSuggestions: () => void;
  acceptSuggestion: (suggestionId: string) => void;
  rejectSuggestion: (suggestionId: string) => void;
  
  // Configuration
  updateConfig: (config: Partial<SmartSuggestionConfig>) => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  
  // Statistics
  stats: {
    totalSuggestions: number;
    acceptedSuggestions: number;
    rejectedSuggestions: number;
    acceptanceRate: number;
    averageConfidence: number;
  };
}

export function useAdvancedSmartSuggestions({
  editor,
  enabled = true,
  debounceMs = 300,
  minCharacters = 20,
  maxSuggestions = 3,
  contextWindow = 1000,
  triggers = [
    { type: 'timer', config: { delay: 2000 } },
    { type: 'punctuation', config: { characters: '.!?' } },
    { type: 'newline' },
  ],
  onSuggestionAccepted,
  onSuggestionRejected,
}: UseAdvancedSmartSuggestionsOptions): UseAdvancedSmartSuggestionsReturn {
  
  const {
    generateSmartSuggestions,
    updateSmartSuggestions,
    suggestionConfig,
    updateSuggestionConfig,
    buildContext,
    userPreferences,
    selectedGenre,
    selectedAuthors,
  } = useAdvancedAI();

  // State
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [stats, setStats] = useState({
    totalSuggestions: 0,
    acceptedSuggestions: 0,
    rejectedSuggestions: 0,
    acceptanceRate: 0,
    averageConfidence: 0,
  });

  // Refs for managing timers and state
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTriggerPositionRef = useRef<number>(-1);
  const lastContentRef = useRef<string>('');
  const generationInProgressRef = useRef<boolean>(false);
  const suggestionHistoryRef = useRef<SmartSuggestion[]>([]);

  // Update suggestion config when props change
  useEffect(() => {
    updateSuggestionConfig({
      enabled: isEnabled,
      debounceMs,
      minCharacters,
      maxSuggestions,
      contextWindow,
      triggers,
    });
  }, [isEnabled, debounceMs, minCharacters, maxSuggestions, contextWindow, triggers, updateSuggestionConfig]);

  // Generate suggestions
  const generateSuggestions = useCallback(async (
    content: string,
    cursorPosition: number,
    triggeredBy: string = 'manual'
  ): Promise<SmartSuggestion[]> => {
    if (!editor || !isEnabled || generationInProgressRef.current) {
      return [];
    }

    // Check minimum content length
    if (content.length < minCharacters) {
      return [];
    }

    // Avoid generating suggestions for the same position too frequently
    if (cursorPosition === lastTriggerPositionRef.current && content === lastContentRef.current) {
      return suggestions;
    }

    generationInProgressRef.current = true;
    setIsGenerating(true);

    try {
      // Build context for suggestion generation
      const context: AIContext = buildContext({
        selectedText: getSelectedText(content, cursorPosition),
        surroundingText: getSurroundingText(content, cursorPosition, contextWindow),
        documentContent: content,
        genre: selectedGenre || undefined,
        authorStyles: selectedAuthors,
      });

      // Add context about trigger type for better suggestions
      context.metadata = {
        triggeredBy,
        cursorPosition,
        contentLength: content.length,
        timeOfDay: new Date().getHours(),
        userPreferences,
      };

      // Generate suggestions using the AI context
      const newSuggestions = await generateSmartSuggestions(content, cursorPosition, context);

      // Filter and rank suggestions
      const filteredSuggestions = filterAndRankSuggestions(newSuggestions, content, cursorPosition);
      const limitedSuggestions = filteredSuggestions.slice(0, maxSuggestions);

      // Update state
      setSuggestions(limitedSuggestions);
      updateSmartSuggestions(limitedSuggestions);

      // Track statistics
      setStats(prev => ({
        ...prev,
        totalSuggestions: prev.totalSuggestions + limitedSuggestions.length,
        averageConfidence: calculateAverageConfidence([...suggestionHistoryRef.current, ...limitedSuggestions]),
      }));

      // Store for future reference
      lastTriggerPositionRef.current = cursorPosition;
      lastContentRef.current = content;
      suggestionHistoryRef.current.push(...limitedSuggestions);

      return limitedSuggestions;

    } catch (error) {
      console.error('Failed to generate smart suggestions:', error);
      return [];
    } finally {
      generationInProgressRef.current = false;
      setIsGenerating(false);
    }
  }, [
    editor,
    isEnabled,
    minCharacters,
    maxSuggestions,
    contextWindow,
    generateSmartSuggestions,
    updateSmartSuggestions,
    buildContext,
    selectedGenre,
    selectedAuthors,
    userPreferences,
    suggestions,
  ]);

  // Debounced suggestion generation
  const debouncedGenerateSuggestions = useCallback((
    content: string,
    cursorPosition: number,
    triggeredBy: string = 'typing'
  ) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      generateSuggestions(content, cursorPosition, triggeredBy);
    }, debounceMs);
  }, [generateSuggestions, debounceMs]);

  // Timer-based trigger
  const startTimerTrigger = useCallback(() => {
    if (triggerTimerRef.current) {
      clearTimeout(triggerTimerRef.current);
    }

    const timerTrigger = triggers.find(t => t.type === 'timer');
    if (!timerTrigger || !editor) return;

    const delay = timerTrigger.config?.delay || 2000;
    
    triggerTimerRef.current = setTimeout(() => {
      const content = editor.getText();
      const position = editor.state.selection.from;
      
      if (content.length >= minCharacters) {
        generateSuggestions(content, position, 'timer');
      }
    }, delay);
  }, [triggers, editor, minCharacters, generateSuggestions]);

  // Handle editor events
  useEffect(() => {
    if (!editor || !isEnabled) return;

    const handleUpdate = ({ editor: updatedEditor }: { editor: Editor }) => {
      const content = updatedEditor.getText();
      const position = updatedEditor.state.selection.from;
      
      // Check for punctuation triggers
      const punctuationTrigger = triggers.find(t => t.type === 'punctuation');
      if (punctuationTrigger) {
        const characters = punctuationTrigger.config?.characters || '.!?';
        const lastChar = content[position - 1];
        
        if (lastChar && characters.includes(lastChar)) {
          // Small delay to allow for continued typing
          setTimeout(() => {
            const currentContent = updatedEditor.getText();
            const currentPosition = updatedEditor.state.selection.from;
            
            // Only trigger if user stopped typing after punctuation
            if (currentPosition === position && currentContent === content) {
              generateSuggestions(content, position, 'punctuation');
            }
          }, 500);
          return;
        }
      }

      // Check for newline triggers
      const newlineTrigger = triggers.find(t => t.type === 'newline');
      if (newlineTrigger && content[position - 1] === '\n') {
        generateSuggestions(content, position, 'newline');
        return;
      }

      // Default debounced trigger for regular typing
      debouncedGenerateSuggestions(content, position, 'typing');
      
      // Restart timer trigger
      startTimerTrigger();
    };

    const handleSelectionUpdate = ({ editor: updatedEditor }: { editor: Editor }) => {
      const selectionTrigger = triggers.find(t => t.type === 'selection');
      if (selectionTrigger && updatedEditor.state.selection.from !== updatedEditor.state.selection.to) {
        const content = updatedEditor.getText();
        const position = updatedEditor.state.selection.from;
        generateSuggestions(content, position, 'selection');
      }
    };

    const handleFocus = () => {
      startTimerTrigger();
    };

    const handleBlur = () => {
      clearSuggestions();
      if (triggerTimerRef.current) {
        clearTimeout(triggerTimerRef.current);
      }
    };

    // Attach event listeners
    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('focus', handleFocus);
    editor.on('blur', handleBlur);

    // Start initial timer
    startTimerTrigger();

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('focus', handleFocus);
      editor.off('blur', handleBlur);
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (triggerTimerRef.current) {
        clearTimeout(triggerTimerRef.current);
      }
    };
  }, [
    editor,
    isEnabled,
    triggers,
    generateSuggestions,
    debouncedGenerateSuggestions,
    startTimerTrigger,
  ]);

  // Manual trigger
  const triggerSuggestions = useCallback(async () => {
    if (!editor) return;
    
    const content = editor.getText();
    const position = editor.state.selection.from;
    await generateSuggestions(content, position, 'manual');
  }, [editor, generateSuggestions]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    updateSmartSuggestions([]);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (triggerTimerRef.current) {
      clearTimeout(triggerTimerRef.current);
    }
  }, [updateSmartSuggestions]);

  // Accept suggestion
  const acceptSuggestion = useCallback((suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion || !editor) return;

    // Insert suggestion text at current cursor position
    const currentPos = editor.state.selection.from;
    editor.chain().focus().insertContentAt(currentPos, suggestion.text).run();

    // Update statistics
    setStats(prev => ({
      ...prev,
      acceptedSuggestions: prev.acceptedSuggestions + 1,
      acceptanceRate: (prev.acceptedSuggestions + 1) / prev.totalSuggestions,
    }));

    // Call callback
    onSuggestionAccepted?.(suggestion);

    // Clear suggestions after acceptance
    clearSuggestions();
  }, [suggestions, editor, onSuggestionAccepted, clearSuggestions]);

  // Reject suggestion
  const rejectSuggestion = useCallback((suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    // Remove from current suggestions
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));

    // Update statistics
    setStats(prev => ({
      ...prev,
      rejectedSuggestions: prev.rejectedSuggestions + 1,
      acceptanceRate: prev.acceptedSuggestions / prev.totalSuggestions,
    }));

    // Call callback
    onSuggestionRejected?.(suggestion);
  }, [suggestions, onSuggestionRejected]);

  // Update configuration
  const updateConfig = useCallback((config: Partial<SmartSuggestionConfig>) => {
    updateSuggestionConfig(config);
    
    if ('enabled' in config) {
      setIsEnabled(config.enabled!);
    }
  }, [updateSuggestionConfig]);

  // Helper functions
  const getSelectedText = (content: string, position: number): string => {
    if (!editor) return '';
    
    const selection = editor.state.selection;
    if (selection.from === selection.to) return '';
    
    return content.substring(selection.from, selection.to);
  };

  const getSurroundingText = (content: string, position: number, window: number): string => {
    const start = Math.max(0, position - window / 2);
    const end = Math.min(content.length, position + window / 2);
    return content.substring(start, end);
  };

  const filterAndRankSuggestions = (
    suggestions: SmartSuggestion[],
    content: string,
    position: number
  ): SmartSuggestion[] => {
    return suggestions
      .filter(s => s.text && s.text.trim().length > 0)
      .filter(s => s.confidence > 0.3) // Minimum confidence threshold
      .sort((a, b) => {
        // Sort by confidence and relevance
        const confidenceScore = b.confidence - a.confidence;
        const lengthScore = Math.abs(50 - a.text.length) - Math.abs(50 - b.text.length); // Prefer ~50 char suggestions
        
        return confidenceScore * 0.7 + lengthScore * 0.3;
      });
  };

  const calculateAverageConfidence = (suggestions: SmartSuggestion[]): number => {
    if (suggestions.length === 0) return 0;
    
    const totalConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0);
    return totalConfidence / suggestions.length;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (triggerTimerRef.current) {
        clearTimeout(triggerTimerRef.current);
      }
    };
  }, []);

  return {
    suggestions,
    isGenerating,
    triggerSuggestions,
    clearSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    updateConfig,
    isEnabled,
    setEnabled,
    stats,
  };
}