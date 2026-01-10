# Research: AI Chat Panel

## Findings Summary

This document captures research findings from analyzing the existing codebase to inform the AI Chat Panel implementation.

---

## 1. Existing AI Components

### AICopilotPanel (src/components/ai/AICopilotPanel.tsx)
- **Lines**: 565 (exceeds 300 line limit)
- **Issues**: 
  - Too large, needs decomposition
  - Mixes concerns (state, UI, API logic)
- **Reusable patterns**:
  - Message rendering structure
  - Streaming response handling
  - Insert/Copy/Regenerate actions
- **Decision**: Extract patterns, build new components

### VSCodeCopilotPanel (src/components/ai/VSCodeCopilotPanel.tsx)
- **Lines**: 216 (within limits)
- **Features**:
  - Tabs for Chat/Edits/Agent
  - Quick action buttons
  - Context indicators
- **Reusable**: Tab structure, icon patterns

### AIChatSidebar (src/components/AIChatSidebar/)
- **Pattern**: Component directory structure
- **Structure**:
  ```
  AIChatSidebar/
  ├── index.ts
  ├── AIChatSidebar.tsx
  └── ChatMessage.tsx
  ```
- **Decision**: Follow this directory pattern

---

## 2. Panel System Architecture

### PanelSystem (src/components/IDE/PanelSystem/)
- **Key files**:
  - `PanelContext.tsx` - State management
  - `BottomPanel.tsx` - Panel rendering
- **Hook**: `usePanels()` for panel state

### Integration Pattern
```typescript
import { usePanels } from '../PanelSystem/PanelContext';

const { activeRightPanel, setActivePanel } = usePanels();

// Open AI Chat
setActivePanel('right', 'ai-chat');
```

### Panel Registration
The AI Chat Panel will be registered in the right panel zone, similar to how existing panels work.

---

## 3. AI Hook Analysis

### useAI (src/hooks/useAI.ts)
- **Capabilities**:
  - Streaming text generation
  - Abort controller for cancellation
  - Error handling
  - Loading states
- **API**: `/api/ai/generate`
- **Options**:
  ```typescript
  interface UseAIOptions {
    enableStreaming?: boolean;
    onStreamChunk?: (chunk: string) => void;
    onComplete?: (text: string) => void;
    onError?: (error: Error) => void;
  }
  ```

### Reuse Strategy
Wrap `useAI` in a new `useAIChat` hook that adds:
- Message history management
- Context injection
- Quick action handling

---

## 4. Design System Analysis

### VS Code Theme Tokens
From `src/app/globals.css`:
```css
--ide-sidebar-bg: var(--vscode-sideBar-background);
--ide-foreground: var(--vscode-foreground);
--ide-border: var(--vscode-panel-border);
--ide-input-bg: var(--vscode-input-background);
--ide-input-border: var(--vscode-input-border);
--ide-input-focus-border: var(--vscode-focusBorder);
--ide-activitybar-badge: var(--vscode-activityBarBadge-background);
```

### Icon Library
- **Primary**: Lucide icons (already in use)
- **Key icons**: `Bot`, `Send`, `Copy`, `RefreshCw`, `Check`, `X`

### Utility Classes
From `src/lib/utils.ts`:
```typescript
import { cn } from '@/lib/utils';
// Usage: cn('base-class', condition && 'conditional-class')
```

---

## 5. TipTap Editor Integration

### Editor Access
- Via `useEditor` hook from TipTap
- Selection available via `editor.state.selection`
- Content access via `editor.getJSON()` or `editor.getText()`

### Context Detection Strategy
```typescript
// Get current selection text
const selection = editor.state.selection;
const text = editor.state.doc.textBetween(selection.from, selection.to);

// Get cursor position for chapter detection
const pos = selection.from;
const resolvedPos = editor.state.doc.resolve(pos);
```

### Proposed Hook: useEditorContext
```typescript
interface EditorContext {
  hasSelection: boolean;
  selectedText: string;
  chapter: string | null;
  nearbyCharacters: string[];
  cursorPosition: number;
}
```

---

## 6. ASCII Design Reference

From `docs/VSCODE_UX_PLAN_PART5_6.md`:
```
┌─────────────────────────────────────────────┐
│ 🤖 Ghost Writer                    [⚙️] [×] │
├─────────────────────────────────────────────┤
│ Chapter 12 · Characters: Alice, Bob         │
├─────────────────────────────────────────────┤
│ [Continue Writing] [Improve] [Rephrase]     │
│ [Dialogue] [Describe] [Brainstorm]          │
├─────────────────────────────────────────────┤
│                                             │
│ 👤 User: How should the confrontation       │
│    between Alice and the shadow figure      │
│    unfold?                                  │
│                                             │
│ 🤖 AI: Consider building tension through    │
│    three beats...                           │
│    [Insert] [Copy] [Regenerate]             │
│                                             │
├─────────────────────────────────────────────┤
│ [📎 Context] Ask Ghost Writer...     [Send] │
└─────────────────────────────────────────────┘
```

---

## 7. Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Component location | `src/components/IDE/AIChatPanel/` | Aligns with VS Code IDE structure |
| State management | TanStack Query + useState | Constitution mandate |
| Styling approach | Tailwind + CSS variables | Constitution mandate |
| Streaming | Reuse `useAI` hook | DRY principle |
| Message history | localStorage with hook | Simple, no backend needed initially |
| Component size | Max 300 lines | Constitution limit |

---

## 8. Risk Mitigations

| Risk | Mitigation |
|------|------------|
| AICopilotPanel migration conflicts | Build fresh, migrate patterns only |
| TipTap version incompatibility | Check version in package.json before implementation |
| Panel system changes | Coordinate with existing panel structure |
| Performance with long history | Implement virtualization if >100 messages |

---

## 9. Dependencies Confirmed

Already in package.json:
- `@tiptap/react` - Editor integration ✅
- `@tanstack/react-query` - Server state ✅
- `lucide-react` - Icons ✅
- `tailwindcss` - Styling ✅

No new dependencies required.

---

## 10. Open Questions (Resolved)

1. **Q**: Should chat history persist across sessions?
   **A**: Yes, use localStorage for MVP. Backend sync in future phase.

2. **Q**: How many quick actions?
   **A**: 6 actions based on spec: Continue, Improve, Rephrase, Dialogue, Describe, Brainstorm

3. **Q**: Context detection scope?
   **A**: Current chapter heading + detected character names within 500 words of cursor

---

## References

- [Existing AI Components Analysis](../../src/components/ai/)
- [Panel System](../../src/components/IDE/PanelSystem/)
- [VS Code UX Plan](../../docs/VSCODE_UX_PLAN_PART5_6.md)
- [Project Constitution](../../CONSTITUTION.md)
