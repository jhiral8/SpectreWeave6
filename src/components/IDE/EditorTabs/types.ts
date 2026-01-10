// Editor Tabs Types

export interface EditorTab {
  id: string;
  label: string;
  path?: string; // Chapter path in story structure
  type: 'chapter' | 'scene' | 'character' | 'note' | 'settings' | 'framework' | 'location';
  isDirty?: boolean; // Has unsaved changes
  isPinned?: boolean;
  isPreview?: boolean; // Single-click preview tab (italicized)
}

export interface EditorTabsState {
  tabs: EditorTab[];
  activeTabId: string | null;
}
