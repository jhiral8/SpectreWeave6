'use client';

import { useEffect } from 'react';

interface UseKeyboardShortcutsOptions {
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
  onToggleBottomPanel?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const { onToggleLeftPanel, onToggleRightPanel, onToggleBottomPanel } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B - Toggle left panel
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        onToggleLeftPanel?.();
      }
      // Cmd/Ctrl + J - Toggle right panel
      if ((e.metaKey || e.ctrlKey) && e.key === 'j' && !e.shiftKey) {
        e.preventDefault();
        onToggleRightPanel?.();
      }
      // Cmd/Ctrl + Shift + J - Toggle bottom panel
      if ((e.metaKey || e.ctrlKey) && e.key === 'j' && e.shiftKey) {
        e.preventDefault();
        onToggleBottomPanel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleLeftPanel, onToggleRightPanel, onToggleBottomPanel]);
}
