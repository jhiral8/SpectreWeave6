# Quickstart: AI Chat Panel Development

## Prerequisites

- Node.js 18+ installed
- pnpm or npm installed
- SpectreWeave6 repository cloned
- On branch `001-ai-chat-panel`

## Getting Started

### 1. Install Dependencies

```bash
cd /path/to/SpectreWeave6
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000/ide-demo to see the IDE shell.

### 3. Create Feature Directory

```bash
mkdir -p src/components/IDE/AIChatPanel/components
mkdir -p src/components/IDE/AIChatPanel/hooks
```

## Development Workflow

### File Creation Order

1. **Types first** (`types.ts`)
   - Define all interfaces before implementation
   - Copy from `specs/001-ai-chat-panel/contracts/ai-chat.ts`

2. **Constants** (`constants.ts`)
   - Quick actions configuration
   - Default values

3. **Hooks** (in `hooks/`)
   - `useChatHistory.ts` - State management
   - `useAIChat.ts` - AI integration
   - `useEditorContext.ts` - Editor context detection

4. **Components** (in `components/`, bottom-up)
   - `ChatInput.tsx` - Input textarea
   - `MessageBubble.tsx` - Single message
   - `MessageActions.tsx` - Insert/Copy/Regen buttons
   - `MessageList.tsx` - Message container
   - `ContextBar.tsx` - Chapter/character context
   - `QuickActions.tsx` - Action buttons
   - `WelcomeState.tsx` - Empty state
   - `ChatHeader.tsx` - Panel header

5. **Main component** (`AIChatPanel.tsx`)
   - Compose all subcomponents
   - Wire up hooks

6. **Exports** (`index.ts`)
   - Public API

### Constitution Checklist

Before each commit, verify:

- [ ] No file exceeds 300 lines
- [ ] No function exceeds 50 lines
- [ ] No `any` types
- [ ] All colors use `--ide-*` tokens
- [ ] Component has < 7 props
- [ ] No inline styles (except dynamic values)

## Key Imports

```typescript
// Styling utility
import { cn } from '@/lib/utils';

// Icons
import { Bot, Send, Copy, RefreshCw, Settings } from 'lucide-react';

// Panel system
import { usePanels } from '../PanelSystem/PanelContext';

// AI hook
import { useAI } from '@/hooks/useAI';
```

## Design Tokens Reference

```css
/* Backgrounds */
--ide-sidebar-bg       /* Panel background */
--ide-input-bg         /* AI message bubble, input area */
--ide-activitybar-badge /* User message bubble, accent */

/* Borders */
--ide-border           /* Standard borders */
--ide-input-border     /* Input borders */
--ide-input-focus-border /* Focus state */

/* Text */
--ide-foreground       /* Primary text */
--ide-activitybar-inactive /* Secondary text */
--ide-activitybar-fg   /* Active/highlighted text */

/* States */
--ide-list-hover-bg    /* Hover backgrounds */
--ide-success          /* Success states */
--ide-error            /* Error states */
--ide-info             /* Info/generating state */
```

## Testing

### Run Unit Tests

```bash
npm run test -- --testPathPattern=AIChatPanel
```

### Run E2E Tests

```bash
npm run test:e2e -- --grep "AI Chat"
```

## Common Patterns

### Streaming Response Pattern

```typescript
const handleSendMessage = async (content: string) => {
  // Add user message
  const userMsgId = addMessage({ role: 'user', content, context });
  
  // Add placeholder AI message
  const aiMsgId = addMessage({ role: 'assistant', content: '', isGenerating: true });
  
  // Stream response
  await streamText(content, (chunk) => {
    updateMessage(aiMsgId, (prev) => ({
      ...prev,
      content: prev.content + chunk
    }));
  });
  
  // Mark complete
  updateMessage(aiMsgId, { isGenerating: false });
};
```

### Context Detection Pattern

```typescript
useEffect(() => {
  if (!editor) return;
  
  const updateContext = debounce(() => {
    const { from } = editor.state.selection;
    const chapter = findChapterHeading(editor, from);
    const characters = detectCharacters(editor, from);
    setContext({ chapter, characters });
  }, 500);
  
  editor.on('selectionUpdate', updateContext);
  return () => editor.off('selectionUpdate', updateContext);
}, [editor]);
```

## Troubleshooting

### Panel doesn't appear
- Check `PanelContext` is wrapping the IDE
- Verify `setActivePanel('right', 'ai-chat')` is called

### AI responses not streaming
- Check `/api/ai/generate` endpoint is running
- Verify `enableStreaming: true` in `useAI` options

### Styles not applying
- Ensure CSS variables are defined in globals.css
- Check Tailwind classes are being processed

## Related Documentation

- [Feature Spec](./spec.md)
- [Implementation Plan](./plan.md)
- [Data Model](./data-model.md)
- [Type Contracts](./contracts/ai-chat.ts)
- [VS Code UX Plan](../../docs/VSCODE_UX_PLAN_PART5_6.md)
