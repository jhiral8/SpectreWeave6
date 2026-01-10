export type KeyModifier = 'ctrl' | 'alt' | 'shift' | 'meta';

export interface KeyBinding {
  key: string;
  modifiers?: KeyModifier[];
}

export interface ShortcutContext {
  activePanel?: string;
  hasSelection?: boolean;
}

export interface ShortcutDisplay {
  id: string;
  label: string;
  binding: KeyBinding;
}
