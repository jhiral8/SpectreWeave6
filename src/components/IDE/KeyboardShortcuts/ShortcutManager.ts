// Keyboard Shortcuts Manager
// Centralized management of all keyboard shortcuts

import { KeyBinding, matchesBinding, ShortcutContext } from './types';

class ShortcutManagerImpl {
  private bindings: Map<string, KeyBinding> = new Map();
  private handlers: Map<string, () => void | Promise<void>> = new Map();
  private contextProvider: (() => ShortcutContext) | null = null;
  private isEnabled: boolean = true;
  
  // Register a shortcut
  register(binding: KeyBinding, handler: () => void | Promise<void>): void {
    const key = this.getBindingKey(binding);
    this.bindings.set(key, binding);
    this.handlers.set(binding.commandId, handler);
  }
  
  // Unregister a shortcut by command ID
  unregister(commandId: string): void {
    // Find and remove binding
    for (const [key, binding] of this.bindings.entries()) {
      if (binding.commandId === commandId) {
        this.bindings.delete(key);
        break;
      }
    }
    this.handlers.delete(commandId);
  }
  
  // Set context provider for conditional shortcuts
  setContextProvider(provider: () => ShortcutContext): void {
    this.contextProvider = provider;
  }
  
  // Enable/disable all shortcuts
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  // Handle a keyboard event
  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.isEnabled) return false;
    
    const currentContext = this.contextProvider?.() || {};
    
    for (const binding of this.bindings.values()) {
      if (matchesBinding(event, binding)) {
        // Check context conditions
        if (!this.checkContext(binding.when, currentContext)) {
          continue;
        }
        
        // Execute handler
        const handler = this.handlers.get(binding.commandId);
        if (handler) {
          event.preventDefault();
          event.stopPropagation();
          handler();
          return true;
        }
      }
    }
    
    return false;
  }
  
  // Check if context conditions are met
  private checkContext(when: ShortcutContext | undefined, current: ShortcutContext): boolean {
    if (!when) return true;
    
    if (when.editorFocus !== undefined && when.editorFocus !== current.editorFocus) {
      return false;
    }
    
    if (when.hasSelection !== undefined && when.hasSelection !== current.hasSelection) {
      return false;
    }
    
    if (when.panelOpen !== undefined && when.panelOpen !== current.panelOpen) {
      return false;
    }
    
    if (when.commandPaletteOpen !== undefined && when.commandPaletteOpen !== current.commandPaletteOpen) {
      return false;
    }
    
    if (when.custom && !when.custom()) {
      return false;
    }
    
    return true;
  }
  
  // Get all bindings
  getAll(): KeyBinding[] {
    return Array.from(this.bindings.values());
  }
  
  // Get binding for a command
  getBinding(commandId: string): KeyBinding | undefined {
    for (const binding of this.bindings.values()) {
      if (binding.commandId === commandId) {
        return binding;
      }
    }
    return undefined;
  }
  
  // Generate a unique key for a binding
  private getBindingKey(binding: KeyBinding): string {
    const mods = [...binding.modifiers].sort().join('+');
    return `${mods}+${binding.key.toLowerCase()}`;
  }
}

// Singleton instance
export const shortcutManager = new ShortcutManagerImpl();

// Default agent shortcuts
export const AGENT_SHORTCUTS: KeyBinding[] = [
  {
    key: 'g',
    modifiers: ['cmd', 'shift'],
    commandId: 'agent:ghost-writer',
    description: 'Run Ghost Writer',
  },
  {
    key: 's',
    modifiers: ['cmd', 'shift'],
    commandId: 'agent:style-coach',
    description: 'Run Style Coach',
  },
  {
    key: 'd',
    modifiers: ['cmd', 'shift'],
    commandId: 'agent:dialogue-master',
    description: 'Run Dialogue Master',
  },
  {
    key: 'p',
    modifiers: ['cmd', 'shift'],
    commandId: 'agent:plot-analyst',
    description: 'Run Plot Analyst',
  },
  {
    key: 'c',
    modifiers: ['cmd', 'shift'],
    commandId: 'agent:character-keeper',
    description: 'Run Character Keeper',
  },
  {
    key: 'w',
    modifiers: ['cmd', 'shift'],
    commandId: 'agent:world-builder',
    description: 'Run World Builder',
  },
];

// Panel shortcuts
export const PANEL_SHORTCUTS: KeyBinding[] = [
  {
    key: 'b',
    modifiers: ['cmd'],
    commandId: 'view:toggle-left-panel',
    description: 'Toggle Left Panel',
  },
  {
    key: 'b',
    modifiers: ['cmd', 'shift'],
    commandId: 'view:toggle-right-panel',
    description: 'Toggle Right Panel',
  },
  {
    key: 'j',
    modifiers: ['cmd'],
    commandId: 'view:toggle-bottom-panel',
    description: 'Toggle Bottom Panel',
  },
  {
    key: '`',
    modifiers: ['cmd'],
    commandId: 'view:toggle-terminal',
    description: 'Toggle Terminal/Output',
  },
];

// Navigation shortcuts
export const NAVIGATION_SHORTCUTS: KeyBinding[] = [
  {
    key: 'g',
    modifiers: ['cmd'],
    commandId: 'navigation:go-to-chapter',
    description: 'Go to Chapter',
  },
  {
    key: 'e',
    modifiers: ['cmd', 'shift'],
    commandId: 'navigation:explorer',
    description: 'Focus Story Explorer',
  },
];

// Command palette shortcuts
export const COMMAND_PALETTE_SHORTCUTS: KeyBinding[] = [
  {
    key: 'k',
    modifiers: ['cmd'],
    commandId: 'command-palette:open',
    description: 'Open Command Palette',
  },
  {
    key: 'p',
    modifiers: ['cmd', 'shift'],
    commandId: 'command-palette:open',
    description: 'Open Command Palette',
  },
];

// All default shortcuts
export const DEFAULT_SHORTCUTS: KeyBinding[] = [
  ...AGENT_SHORTCUTS,
  ...PANEL_SHORTCUTS,
  ...NAVIGATION_SHORTCUTS,
  ...COMMAND_PALETTE_SHORTCUTS,
];
