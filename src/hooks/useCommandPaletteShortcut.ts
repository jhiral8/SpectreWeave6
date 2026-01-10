'use client';

import { useEffect, useCallback } from 'react';

interface UseCommandPaletteShortcutOptions {
  /** Callback when command palette should open */
  onOpen: () => void;
  /** Whether the shortcut is enabled */
  enabled?: boolean;
}

/**
 * Hook to handle ⌘K / Ctrl+K keyboard shortcut for Command Palette
 * 
 * Also handles ⌘P for quick file open (same as VS Code)
 */
export function useCommandPaletteShortcut({
  onOpen,
  enabled = true,
}: UseCommandPaletteShortcutOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMod = e.metaKey || e.ctrlKey;
      
      // ⌘K or ⌘P opens command palette
      if (isMod && (e.key === 'k' || e.key === 'K' || e.key === 'p' || e.key === 'P')) {
        // Don't trigger if user is typing in an input
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.isContentEditable;
        
        // Allow ⌘K even in editor (VS Code behavior)
        if (e.key.toLowerCase() === 'k' || !isInput) {
          e.preventDefault();
          onOpen();
        }
      }
    },
    [onOpen, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

export default useCommandPaletteShortcut;
