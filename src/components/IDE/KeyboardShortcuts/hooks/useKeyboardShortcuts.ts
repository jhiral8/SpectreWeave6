// useKeyboardShortcuts Hook
// React hook for registering and handling keyboard shortcuts

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { shortcutManager, DEFAULT_SHORTCUTS } from '../ShortcutManager';
import { KeyBinding, ShortcutContext } from '../types';
import { useAgents } from '../../AIAgents/context/AgentContext';

interface UseKeyboardShortcutsOptions {
  // Enable/disable shortcuts
  enabled?: boolean;
  
  // Context provider for conditional shortcuts
  contextProvider?: () => ShortcutContext;
  
  // Custom handlers (overrides default)
  handlers?: Record<string, () => void | Promise<void>>;
  
  // Callback when command palette should open
  onOpenCommandPalette?: () => void;
  
  // Panel toggles
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
  onToggleBottomPanel?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    enabled = true,
    contextProvider,
    handlers = {},
    onOpenCommandPalette,
    onToggleLeftPanel,
    onToggleRightPanel,
    onToggleBottomPanel,
  } = options;
  
  const { runAgent } = useAgents();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  
  // Register default shortcuts on mount
  useEffect(() => {
    // Register all default shortcuts
    DEFAULT_SHORTCUTS.forEach(binding => {
      const handler = getDefaultHandler(binding.commandId);
      if (handler) {
        shortcutManager.register(binding, handler);
      }
    });
    
    // Set context provider
    if (contextProvider) {
      shortcutManager.setContextProvider(contextProvider);
    }
    
    return () => {
      // Cleanup - unregister all
      DEFAULT_SHORTCUTS.forEach(binding => {
        shortcutManager.unregister(binding.commandId);
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Default handler factory
  const getDefaultHandler = useCallback((commandId: string): (() => void | Promise<void>) | undefined => {
    // Check for custom handler first
    if (handlersRef.current[commandId]) {
      return handlersRef.current[commandId];
    }
    
    // Agent commands
    if (commandId.startsWith('agent:')) {
      const agentId = commandId.replace('agent:', '') as any;
      return async () => { await runAgent(agentId); };
    }
    
    // Command palette
    if (commandId === 'command-palette:open') {
      return () => onOpenCommandPalette?.();
    }
    
    // Panel toggles
    if (commandId === 'view:toggle-left-panel') {
      return () => onToggleLeftPanel?.();
    }
    if (commandId === 'view:toggle-right-panel') {
      return () => onToggleRightPanel?.();
    }
    if (commandId === 'view:toggle-bottom-panel') {
      return () => onToggleBottomPanel?.();
    }
    
    return undefined;
  }, [runAgent, onOpenCommandPalette, onToggleLeftPanel, onToggleRightPanel, onToggleBottomPanel]);
  
  // Global keydown handler
  useEffect(() => {
    if (!enabled) {
      shortcutManager.setEnabled(false);
      return;
    }
    
    shortcutManager.setEnabled(true);
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea (unless it's the editor)
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isContentEditable = target.isContentEditable;
      
      // Allow shortcuts even in editor for agent commands
      const isAgentShortcut = event.shiftKey && (event.metaKey || event.ctrlKey);
      
      if (isInput && !isAgentShortcut) {
        return;
      }
      
      shortcutManager.handleKeyDown(event);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
  
  // Expose methods
  return {
    registerShortcut: (binding: KeyBinding, handler: () => void) => {
      shortcutManager.register(binding, handler);
    },
    unregisterShortcut: (commandId: string) => {
      shortcutManager.unregister(commandId);
    },
    getAll: () => shortcutManager.getAll(),
    getBinding: (commandId: string) => shortcutManager.getBinding(commandId),
  };
}
