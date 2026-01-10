'use client';

import { useEffect, useCallback } from 'react';

export interface GlobalShortcutHandlers {
  /** ⌘K / ⌘P - Open command palette */
  onCommandPalette?: () => void;
  /** ⌘B - Toggle primary sidebar */
  onTogglePrimarySidebar?: () => void;
  /** ⌘J - Toggle bottom panel */
  onToggleBottomPanel?: () => void;
  /** ⌘\ - Toggle right panel (AI) */
  onToggleRightPanel?: () => void;
  /** ⌘S - Save */
  onSave?: () => void;
  /** ⌘⇧P - Command palette (alternate) */
  onCommandPaletteShift?: () => void;
  /** ⌘⇧F - Search in files */
  onSearchInFiles?: () => void;
  /** ⌘⇧E - Focus explorer */
  onFocusExplorer?: () => void;
  /** ⌘⇧G - Focus source control */
  onFocusSourceControl?: () => void;
  /** ⌘1 through ⌘9 - Switch editor tabs */
  onSwitchTab?: (tabIndex: number) => void;
  /** ⌘W - Close current tab */
  onCloseTab?: () => void;
  /** ⌘⇧T - Reopen closed tab */
  onReopenTab?: () => void;
  /** Escape - Close modals/panels */
  onEscape?: () => void;
}

interface UseGlobalShortcutsOptions {
  /** Handlers for various shortcuts */
  handlers: GlobalShortcutHandlers;
  /** Whether shortcuts are enabled */
  enabled?: boolean;
}

/**
 * Hook for handling all VS Code-style global keyboard shortcuts
 * 
 * @example
 * ```tsx
 * useGlobalShortcuts({
 *   handlers: {
 *     onCommandPalette: () => setCommandPaletteOpen(true),
 *     onTogglePrimarySidebar: () => toggleSidebar(),
 *     onSave: () => saveDocument(),
 *   },
 *   enabled: true,
 * });
 * ```
 */
export function useGlobalShortcuts({
  handlers,
  enabled = true,
}: UseGlobalShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Check for modifier keys
      const isMod = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;
      
      // Get the key in lowercase
      const key = e.key.toLowerCase();
      
      // Check if user is in an input field
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable;

      // ⌘K or ⌘P - Command palette (works even in inputs for ⌘K)
      if (isMod && !isShift && !isAlt && (key === 'k' || key === 'p')) {
        if (key === 'k' || !isInput) {
          e.preventDefault();
          handlers.onCommandPalette?.();
          return;
        }
      }

      // ⌘⇧P - Command palette (alternate)
      if (isMod && isShift && !isAlt && key === 'p') {
        e.preventDefault();
        handlers.onCommandPaletteShift?.() || handlers.onCommandPalette?.();
        return;
      }

      // Escape - Close things
      if (key === 'escape') {
        handlers.onEscape?.();
        return;
      }

      // Don't process other shortcuts if in input
      if (isInput && !isMod) return;

      // ⌘B - Toggle primary sidebar
      if (isMod && !isShift && !isAlt && key === 'b') {
        e.preventDefault();
        handlers.onTogglePrimarySidebar?.();
        return;
      }

      // ⌘J - Toggle bottom panel
      if (isMod && !isShift && !isAlt && key === 'j') {
        e.preventDefault();
        handlers.onToggleBottomPanel?.();
        return;
      }

      // ⌘\ - Toggle right panel
      if (isMod && !isShift && !isAlt && key === '\\') {
        e.preventDefault();
        handlers.onToggleRightPanel?.();
        return;
      }

      // ⌘S - Save
      if (isMod && !isShift && !isAlt && key === 's') {
        e.preventDefault();
        handlers.onSave?.();
        return;
      }

      // ⌘⇧F - Search in files
      if (isMod && isShift && !isAlt && key === 'f') {
        e.preventDefault();
        handlers.onSearchInFiles?.();
        return;
      }

      // ⌘⇧E - Focus explorer
      if (isMod && isShift && !isAlt && key === 'e') {
        e.preventDefault();
        handlers.onFocusExplorer?.();
        return;
      }

      // ⌘⇧G - Focus source control
      if (isMod && isShift && !isAlt && key === 'g') {
        e.preventDefault();
        handlers.onFocusSourceControl?.();
        return;
      }

      // ⌘W - Close tab
      if (isMod && !isShift && !isAlt && key === 'w') {
        e.preventDefault();
        handlers.onCloseTab?.();
        return;
      }

      // ⌘⇧T - Reopen closed tab
      if (isMod && isShift && !isAlt && key === 't') {
        e.preventDefault();
        handlers.onReopenTab?.();
        return;
      }

      // ⌘1 through ⌘9 - Switch tabs
      if (isMod && !isShift && !isAlt && /^[1-9]$/.test(key)) {
        e.preventDefault();
        handlers.onSwitchTab?.(parseInt(key, 10) - 1);
        return;
      }
    },
    [handlers, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

export default useGlobalShortcuts;
