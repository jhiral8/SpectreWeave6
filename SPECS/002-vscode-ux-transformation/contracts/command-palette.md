# Contract: Command Palette API

**Feature**: `002-vscode-ux-transformation`  
**Component**: CommandPalette  
**Version**: 1.0.0

---

## Overview

The Command Palette provides a VS Code-style Cmd+Shift+P interface for discovering and executing commands.

---

## Types

```typescript
// Command categories
type CommandCategory = 
  | 'Navigation'
  | 'AI Agents'
  | 'View'
  | 'Edit'
  | 'File'
  | 'Debug';

// Command definition
interface Command {
  id: string;
  label: string;
  category: CommandCategory;
  description?: string;
  shortcut?: string;
  icon?: string;
  execute: () => void | Promise<void>;
  isEnabled?: () => boolean;
  isVisible?: () => boolean;
}

// Search result
interface CommandSearchResult {
  command: Command;
  score: number;
  matchedChars: number[];
}
```

---

## Registry API

### CommandRegistry

Singleton registry for all commands.

```typescript
import { CommandRegistry } from '@/components/IDE/CommandPalette';

// Get singleton instance
const registry = CommandRegistry.getInstance();

// Register a command
registry.register({
  id: 'view.toggleAIChat',
  label: 'Toggle AI Chat Panel',
  category: 'View',
  shortcut: 'Cmd+Shift+C',
  execute: () => { /* ... */ },
});

// Unregister a command
registry.unregister('view.toggleAIChat');

// Get all commands
const commands = registry.getAll();

// Get commands by category
const viewCommands = registry.getByCategory('View');

// Execute a command by id
await registry.execute('view.toggleAIChat');

// Search commands
const results = registry.search('toggle');
```

---

## Component API

### CommandPalette

The modal overlay component.

```typescript
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Usage:**

```tsx
import { CommandPalette } from '@/components/IDE/CommandPalette';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <CommandPalette 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

**Behavior:**
- Opens centered at 50% width
- Search input auto-focused
- Results filtered as you type
- Keyboard navigation (↑/↓)
- Enter executes selected command
- Escape closes palette

### useCommandPalette Hook

Convenience hook for common operations.

```typescript
import { useCommandPalette } from '@/components/IDE/CommandPalette';

function MyComponent() {
  const {
    isOpen,
    open,
    close,
    toggle,
  } = useCommandPalette();
}
```

---

## Registration Contract

### Command ID Format

Use dot notation: `category.action`

Examples:
- `file.save`
- `view.toggleSidebar`
- `ai.ghostWriter`
- `navigation.goToChapter`

### Registration Timing

Commands should be registered:
- On module load for static commands
- On mount for context-dependent commands
- Before user interaction

### Duplicate Handling

Re-registering with same ID replaces the command.

---

## Search Contract

### Algorithm

Fuzzy search with scoring:
1. Exact prefix match: +100
2. Consecutive character match: +10 per char
3. Non-consecutive match: +1 per char
4. Category match: +20

### Result Ordering

1. By score (descending)
2. By recent usage (descending)
3. By alphabetical label

### Recent Commands

Last 10 executed commands are stored in localStorage.

---

## Keyboard Shortcuts

### Global Shortcuts (always active)

| Shortcut | Command |
|----------|---------|
| Cmd+Shift+P | Open command palette |

### Palette-specific Shortcuts

| Shortcut | Action |
|----------|--------|
| ↑ / ↓ | Navigate results |
| Enter | Execute selected |
| Escape | Close palette |
| Cmd+K | Clear search |

---

## Built-in Commands

### Navigation
- `navigation.goToChapter` - Go to Chapter...
- `navigation.goToCharacter` - Go to Character...
- `navigation.goToLocation` - Go to Location...

### View
- `view.toggleStoryExplorer` - Toggle Story Explorer
- `view.toggleAIChat` - Toggle AI Chat
- `view.toggleBottomPanel` - Toggle Problems Panel
- `view.focusMode` - Enter Focus Mode
- `view.toggleMinimap` - Toggle Minimap

### AI Agents
- `ai.ghostWriter` - Ask Ghost Writer
- `ai.styleCoach` - Run Style Coach
- `ai.analyzeChapter` - Analyze Current Chapter

### File
- `file.save` - Save
- `file.export` - Export Document...
- `file.newChapter` - New Chapter

### Edit
- `edit.insertSceneBreak` - Insert Scene Break
- `edit.formatParagraph` - Format Paragraph

---

## Events

```typescript
// Listen to command execution
registry.on('execute', (command: Command) => {
  console.log(`Executed: ${command.id}`);
});

// Listen to registration
registry.on('register', (command: Command) => {
  console.log(`Registered: ${command.id}`);
});
```

---

## Error Handling

- Unknown command ID: Log warning, no action
- Command execution error: Show toast notification
- Invalid command definition: Throw during registration

---

## Accessibility

- `role="dialog"` on palette
- `aria-label` on search input
- `role="listbox"` on results
- `aria-selected` on focused item
- Focus trap within palette

---

## Testing Requirements

### Unit Tests
- [ ] Fuzzy search returns correct results
- [ ] Registration adds to registry
- [ ] Unregistration removes from registry
- [ ] Execute calls command's execute function

### Component Tests
- [ ] Opens on trigger
- [ ] Closes on Escape
- [ ] Keyboard navigation works
- [ ] Search filters results
- [ ] Enter executes command

### E2E Tests
- [ ] Cmd+Shift+P opens palette
- [ ] Execute command and verify effect

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-10 | Initial contract |
