import { Command } from './types';

export const defaultCommands: Command[] = [
  {
    id: 'toggle-left-panel',
    title: 'Toggle Left Panel',
    category: 'view',
    shortcut: 'Cmd+B',
    action: () => {},
  },
  {
    id: 'toggle-right-panel',
    title: 'Toggle Right Panel',
    category: 'view',
    shortcut: 'Cmd+J',
    action: () => {},
  },
  {
    id: 'toggle-bottom-panel',
    title: 'Toggle Bottom Panel',
    category: 'view',
    shortcut: 'Cmd+Shift+J',
    action: () => {},
  },
];
