'use client';

import { useState, useCallback } from 'react';
import { GhostTextState, GhostTextSuggestion } from '../types';

export function useGhostText() {
  const [state, setState] = useState<GhostTextState>({
    isVisible: false,
    suggestion: null,
    position: null,
  });

  const showSuggestion = useCallback((suggestion: GhostTextSuggestion, position: { line: number; column: number }) => {
    setState({ isVisible: true, suggestion, position });
  }, []);

  const hideSuggestion = useCallback(() => {
    setState({ isVisible: false, suggestion: null, position: null });
  }, []);

  const acceptSuggestion = useCallback(() => {
    const text = state.suggestion?.text || '';
    hideSuggestion();
    return text;
  }, [state.suggestion, hideSuggestion]);

  return {
    ...state,
    showSuggestion,
    hideSuggestion,
    acceptSuggestion,
  };
}
