# Implementation Plan: AI Chat Panel (VS Code Copilot Style)

**Branch**: `001-ai-chat-panel` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-chat-panel/spec.md`

## Summary

Implement a VS Code Copilot-style AI Chat Panel ("Ghost Writer") as the primary AI interaction surface in SpectreWeave6's IDE. The panel provides conversational AI assistance for fiction writing with context-aware suggestions, streaming responses, quick actions, and seamless editor integration. This feature builds on existing components (`AICopilotPanel`, `VSCodeCopilot`) but creates a unified, VS Code-styled implementation matching the design spec.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x, Next.js 14.x  
**Primary Dependencies**: TipTap v3.x (editor), Radix UI (primitives), Lucide (icons), TanStack Query (state)  
**Storage**: React state (session), localStorage (layout persistence)  
**Testing**: Playwright (E2E), React Testing Library (unit)  
**Target Platform**: Web (modern browsers), Next.js App Router  
**Project Type**: Web application (monorepo frontend)  
**Performance Goals**: <200ms panel render, <500ms context update, <2s first AI token  
**Constraints**: Max 300 lines/file, zero `any` types, VS Code design tokens only  
**Scale/Scope**: Single panel component, 100+ messages without degradation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **YAGNI** | ✅ Pass | Only implementing P1/P2 user stories; future features (agents, persistence) explicitly out of scope |
| **KISS** | ✅ Pass | Reusing existing hooks (`useAI`), simple component composition |
| **DRY** | ✅ Pass | Centralized message types, shared context hook, unified styling |
| **TypeScript Strict** | ✅ Pass | All types defined, zero `any` tolerance |
| **Component Size** | ✅ Pass | Main panel <300 lines, extracted subcomponents |
| **State Management** | ✅ Pass | Session state via useState, server state via existing useAI |
| **VS Code UX** | ✅ Pass | Exact design match per spec diagram |
| **Design Tokens** | ✅ Pass | All colors via CSS variables (--ide-*) |

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-chat-panel/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (types)
├── quickstart.md        # Phase 1 output (dev guide)
├── contracts/           # Phase 1 output (API contracts)
│   └── ai-chat.ts       # TypeScript interfaces
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/components/IDE/
├── AIChatPanel/                    # NEW: Main feature directory
│   ├── AIChatPanel.tsx             # Main panel component (<300 lines)
│   ├── index.ts                    # Public exports
│   ├── types.ts                    # Type definitions
│   ├── constants.ts                # Quick actions, prompts
│   ├── components/
│   │   ├── ChatHeader.tsx          # Panel header with title, actions
│   │   ├── ContextBar.tsx          # Chapter/scene/character context
│   │   ├── MessageList.tsx         # Scrollable message container
│   │   ├── MessageBubble.tsx       # Individual message display
│   │   ├── MessageActions.tsx      # Insert/Copy/Regenerate buttons
│   │   ├── QuickActions.tsx        # Continue/Rephrase/Expand bar
│   │   ├── ChatInput.tsx           # Text input with send button
│   │   └── WelcomeState.tsx        # Empty state with starter buttons
│   └── hooks/
│       ├── useChatHistory.ts       # Message state management
│       ├── useAIChat.ts            # AI integration wrapper
│       └── useEditorContext.ts     # Chapter/character detection

├── PanelSystem/                    # EXISTING: Panel management
│   └── PanelContext.tsx            # usePanels hook (reuse)

├── AICopilotPanel/                 # EXISTING: Reference/deprecate
│   └── (existing files)            # May extract reusable parts

└── VSCodeCopilot/                  # EXISTING: Reference/deprecate
    └── (existing files)            # May extract ChatMessage component
```

**Structure Decision**: Single feature directory under `src/components/IDE/AIChatPanel/` following existing IDE component patterns. Reuses existing `PanelSystem` for layout integration.

## Complexity Tracking

> No constitution violations to justify.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Component split | 9 subcomponents | Keeps each under 300 lines per constitution |
| State location | Local + context | Session-only requirement, no global state needed |
| Existing code | Extract, don't duplicate | Reuse types/utils from VSCodeCopilot where applicable |

---

## Phase 0: Research

### Research Tasks

1. **Editor Context Detection** - How to get current chapter/scene/characters from TipTap
2. **AI Streaming Pattern** - Current useAI streaming implementation review
3. **Panel Integration** - How to register new panel with PanelSystem

### Research Findings

#### 1. Editor Context Detection

**Decision**: Create `useEditorContext` hook that subscribes to TipTap editor events

**Rationale**: TipTap provides `selectionUpdate` event. Content structure uses headings for chapters, can parse surrounding text for character names.

**Alternatives considered**:
- Polling editor state (rejected: inefficient)
- Global store sync (rejected: complexity)
- Direct DOM parsing (rejected: fragile)

#### 2. AI Streaming Pattern

**Decision**: Wrap existing `useAI.streamText()` with chat-specific logic

**Rationale**: `useAI` hook already supports streaming via `/api/ai/generate` endpoint. Add message-level state management on top.

**Implementation**: 
```typescript
// From src/hooks/useAI.ts
const { streamText, isLoading } = useAI({
  provider: 'openrouter',
  enableStreaming: true
});
```

**Alternatives considered**:
- New streaming implementation (rejected: DRY violation)
- SSE direct connection (rejected: existing solution works)

#### 3. Panel Integration

**Decision**: Use existing `usePanels` context, register as right panel option

**Rationale**: `PanelContext.tsx` already supports right panel management. Pattern from ActivityBar shows how to toggle panels.

**Implementation**:
```typescript
// From src/components/IDE/PanelSystem/PanelContext.tsx
const { setActivePanel, togglePanel } = usePanels();
setActivePanel('right', 'ai-chat');
```

**Alternatives considered**:
- New panel system (rejected: existing works)
- Standalone floating panel (rejected: inconsistent UX)

---

## Phase 1: Design & Contracts

### Data Model

See `data-model.md` for complete TypeScript interfaces.

**Core Types**:

```typescript
// Message in chat history
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: ChatContext;
  isGenerating?: boolean;
  isError?: boolean;
}

// Editor context at message time
interface ChatContext {
  chapter?: string;
  scene?: string;
  characters: string[];
  selectedText?: string;
}

// Quick action configuration
interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  prompt: string;
}
```

### Component Contracts

See `contracts/ai-chat.ts` for complete interface definitions.

**Main Component**:
```typescript
interface AIChatPanelProps {
  className?: string;
}
```

**Subcomponents**:
```typescript
interface ChatHeaderProps {
  isGenerating: boolean;
  onClear: () => void;
  onSettings: () => void;
}

interface ContextBarProps {
  context: ChatContext;
}

interface MessageBubbleProps {
  message: ChatMessage;
  onInsert: (content: string) => void;
  onCopy: (content: string) => void;
  onRegenerate: (messageId: string) => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (action: QuickAction) => void;
  disabled?: boolean;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}
```

### Hook Contracts

```typescript
// useChatHistory
interface UseChatHistoryReturn {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, update: Partial<ChatMessage>) => void;
  clearHistory: () => void;
}

// useAIChat
interface UseAIChatOptions {
  onError?: (error: Error) => void;
}

interface UseAIChatReturn {
  sendMessage: (content: string, context?: ChatContext) => Promise<void>;
  regenerate: (messageId: string) => Promise<void>;
  isGenerating: boolean;
  cancel: () => void;
}

// useEditorContext
interface UseEditorContextReturn {
  context: ChatContext;
  updateContext: () => void;
}
```

---

## Implementation Phases

### Phase 1: Core Structure (P1 Stories)

**Goal**: Basic conversation with streaming AI responses

**Files to create**:
1. `src/components/IDE/AIChatPanel/types.ts` - Type definitions
2. `src/components/IDE/AIChatPanel/constants.ts` - Quick actions config
3. `src/components/IDE/AIChatPanel/hooks/useChatHistory.ts` - Message state
4. `src/components/IDE/AIChatPanel/hooks/useAIChat.ts` - AI integration
5. `src/components/IDE/AIChatPanel/components/ChatInput.tsx` - Input area
6. `src/components/IDE/AIChatPanel/components/MessageBubble.tsx` - Messages
7. `src/components/IDE/AIChatPanel/components/MessageList.tsx` - Container
8. `src/components/IDE/AIChatPanel/AIChatPanel.tsx` - Main component
9. `src/components/IDE/AIChatPanel/index.ts` - Exports

**Acceptance**: User can send message and receive streamed response

### Phase 2: Editor Integration (P1 Stories)

**Goal**: Insert content, context awareness

**Files to create/modify**:
1. `src/components/IDE/AIChatPanel/hooks/useEditorContext.ts` - Context detection
2. `src/components/IDE/AIChatPanel/components/ContextBar.tsx` - Context display
3. `src/components/IDE/AIChatPanel/components/MessageActions.tsx` - Insert/Copy/Regen

**Acceptance**: Context bar shows chapter/characters, Insert works

### Phase 3: Quick Actions & Welcome (P2 Stories)

**Goal**: Quick action buttons, welcome state

**Files to create**:
1. `src/components/IDE/AIChatPanel/components/QuickActions.tsx` - Action bar
2. `src/components/IDE/AIChatPanel/components/WelcomeState.tsx` - Empty state
3. `src/components/IDE/AIChatPanel/components/ChatHeader.tsx` - Header with clear

**Acceptance**: Quick actions work, welcome shows on empty

### Phase 4: Polish & Edge Cases (P3 Stories)

**Goal**: Regenerate, error handling, accessibility

**Updates**:
1. Add regenerate functionality to useAIChat
2. Error states in MessageBubble
3. Keyboard navigation
4. Long message handling

**Acceptance**: All edge cases handled gracefully

---

## Dependencies & Risks

### Dependencies (Existing)

| Dependency | Status | Risk |
|------------|--------|------|
| `useAI` hook | ✅ Available | Low - well tested |
| `PanelSystem` | ✅ Available | Low - in active use |
| Design tokens | ✅ Defined | Low - VS Code styles exist |
| TipTap editor | ✅ Available | Medium - context extraction untested |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TipTap context extraction complex | Medium | Medium | Fallback to manual chapter selection |
| Streaming perf with long messages | Low | Low | Virtualized list if needed |
| Existing component conflicts | Low | Low | New directory, clean separation |

---

## Testing Strategy

### Unit Tests
- `useChatHistory` - message CRUD operations
- `useEditorContext` - context parsing
- Component rendering with mocked data

### Integration Tests
- Full conversation flow
- Insert into editor
- Quick actions triggering prompts

### E2E Tests (Playwright)
- Send message, verify response
- Insert content, verify in editor
- Context bar updates on navigation

---

## Estimates

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1: Core Structure | 2-3 days | P1 |
| Phase 2: Editor Integration | 1-2 days | P1 |
| Phase 3: Quick Actions & Welcome | 1 day | P2 |
| Phase 4: Polish & Edge Cases | 1 day | P3 |
| **Total** | **5-7 days** | |

---

## Next Steps

1. Run `/speckit.tasks` to break this plan into implementation tasks
2. Start with Phase 1 types and hooks
3. Build components bottom-up (inputs → messages → panel)
4. Integrate with PanelSystem last

---

## Generated Artifacts

- ✅ `plan.md` - This implementation plan
- 📝 `research.md` - Research findings (see above, consolidated here)
- 📝 `data-model.md` - Type definitions
- 📝 `contracts/ai-chat.ts` - Component interfaces
- 📝 `quickstart.md` - Developer setup guide
