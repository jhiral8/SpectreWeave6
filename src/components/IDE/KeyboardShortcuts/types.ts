// Keyboard Shortcuts Types
// Global keyboard shortcut system for IDE actions

export interface KeyBinding {
  // Key combination
  key: string; // Main key (e.g., 'g', 'k', 'p')
  modifiers: KeyModifier[];
  
  // Action
  commandId: string;
  
  // Context - when should this shortcut be active?
  when?: ShortcutContext;
  
  // Description for keyboard shortcut hints
  description?: string;
}

export type KeyModifier = 'cmd' | 'ctrl' | 'alt' | 'shift' | 'meta';

export interface ShortcutContext {
  // Only active when editor is focused
  editorFocus?: boolean;
  // Only active when specific panel is open
  panelOpen?: 'left' | 'right' | 'bottom';
  // Only active when text is selected
  hasSelection?: boolean;
  // Only active when command palette is open
  commandPaletteOpen?: boolean;
  // Custom context check
  custom?: () => boolean;
}

export interface ShortcutEvent {
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
}

// Platform-aware modifier
export type PlatformModifier = 'cmdOrCtrl' | KeyModifier;

// Shortcut display format
export interface ShortcutDisplay {
  mac: string;
  windows: string;
  current: string;
}

// Format a key binding for display
export function formatKeyBinding(binding: KeyBinding): ShortcutDisplay {
  const isMac = typeof window !== 'undefined' && navigator.platform.includes('Mac');
  
  const modSymbols = {
    mac: {
      cmd: '⌘',
      ctrl: '⌃',
      alt: '⌥',
      shift: '⇧',
      meta: '⌘',
    },
    windows: {
      cmd: 'Ctrl+',
      ctrl: 'Ctrl+',
      alt: 'Alt+',
      shift: 'Shift+',
      meta: 'Win+',
    },
  };
  
  const formatFor = (platform: 'mac' | 'windows') => {
    const symbols = modSymbols[platform];
    const mods = binding.modifiers
      .map(m => symbols[m])
      .join(platform === 'mac' ? '' : '');
    const key = binding.key.toUpperCase();
    return `${mods}${key}`;
  };
  
  return {
    mac: formatFor('mac'),
    windows: formatFor('windows'),
    current: formatFor(isMac ? 'mac' : 'windows'),
  };
}

// Check if a keyboard event matches a binding
export function matchesBinding(event: KeyboardEvent | ShortcutEvent, binding: KeyBinding): boolean {
  const isMac = typeof window !== 'undefined' && navigator.platform.includes('Mac');
  
  // Check key (case-insensitive)
  if (event.key.toLowerCase() !== binding.key.toLowerCase()) {
    return false;
  }
  
  // Check modifiers
  const hasCmd = binding.modifiers.includes('cmd') || binding.modifiers.includes('meta');
  const hasCtrl = binding.modifiers.includes('ctrl');
  const hasAlt = binding.modifiers.includes('alt');
  const hasShift = binding.modifiers.includes('shift');
  
  // On Mac, cmd is metaKey. On Windows, cmd should be ctrlKey
  const cmdPressed = isMac ? event.metaKey : event.ctrlKey;
  const ctrlPressed = isMac ? event.ctrlKey : false; // Ctrl separate on Mac
  
  if (hasCmd && !cmdPressed) return false;
  if (!hasCmd && cmdPressed) return false;
  if (hasCtrl && !ctrlPressed) return false;
  if (hasAlt !== event.altKey) return false;
  if (hasShift !== event.shiftKey) return false;
  
  return true;
}
