import { KeyBinding } from './types';

export const AGENT_SHORTCUTS: Record<string, KeyBinding> = {};
export const PANEL_SHORTCUTS: Record<string, KeyBinding> = {};
export const DEFAULT_SHORTCUTS: Record<string, KeyBinding> = {};

class ShortcutManagerClass {
  register(id: string, binding: KeyBinding): void {}
  unregister(id: string): void {}
}

export const shortcutManager = new ShortcutManagerClass();

export function formatKeyBinding(binding: KeyBinding): string {
  const parts: string[] = [];
  if (binding.modifiers?.includes('meta')) parts.push('⌘');
  if (binding.modifiers?.includes('ctrl')) parts.push('Ctrl');
  if (binding.modifiers?.includes('alt')) parts.push('Alt');
  if (binding.modifiers?.includes('shift')) parts.push('⇧');
  parts.push(binding.key.toUpperCase());
  return parts.join('+');
}

export function matchesBinding(event: KeyboardEvent, binding: KeyBinding): boolean {
  if (event.key.toLowerCase() !== binding.key.toLowerCase()) return false;
  const mods = binding.modifiers || [];
  if (mods.includes('meta') !== event.metaKey) return false;
  if (mods.includes('ctrl') !== event.ctrlKey) return false;
  if (mods.includes('alt') !== event.altKey) return false;
  if (mods.includes('shift') !== event.shiftKey) return false;
  return true;
}
