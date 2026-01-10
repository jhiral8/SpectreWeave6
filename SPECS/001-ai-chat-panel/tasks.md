# Tasks: AI Chat Panel (VS Code Copilot Style)

**Input**: Design documents from `/specs/001-ai-chat-panel/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not explicitly requested - implementation tasks only.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Includes exact file paths

## Path Conventions

Based on plan.md:
- Source: `src/components/IDE/AIChatPanel/`
- Types: `src/components/IDE/AIChatPanel/types.ts`
- Components: `src/components/IDE/AIChatPanel/components/`
- Hooks: `src/components/IDE/AIChatPanel/hooks/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create feature directory structure at `src/components/IDE/AIChatPanel/components/` and `src/components/IDE/AIChatPanel/hooks/`
- [x] T002 [P] Create type definitions from data-model in `src/components/IDE/AIChatPanel/types.ts`
- [x] T003 [P] Create constants file with quick actions config in `src/components/IDE/AIChatPanel/constants.ts`
- [x] T004 [P] Create barrel exports in `src/components/IDE/AIChatPanel/index.ts`

**Checkpoint**: Directory structure ready, types defined, ready for component implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hooks that ALL user stories depend on

**⚠️ CRITICAL**: No component work can begin until these hooks are complete

- [x] T005 Implement `useChatHistory` hook for message state management in `src/components/IDE/AIChatPanel/hooks/useChatHistory.ts`
- [x] T006 Implement `useAIChat` hook wrapping existing `useAI` for chat-specific logic in `src/components/IDE/AIChatPanel/hooks/useAIChat.ts`

**Checkpoint**: Foundation ready - component implementation can now begin

---

## Phase 3: User Story 1 - Basic Conversation with Ghost Writer (Priority: P1) 🎯 MVP

**Goal**: Writer can send messages and receive streamed AI responses

**Independent Test**: Open AI Chat Panel, type a question, press Enter, see streaming response appear character-by-character

### Implementation for User Story 1

- [x] T007 [P] [US1] Create `ChatInput` component with textarea and send button in `src/components/IDE/AIChatPanel/components/ChatInput.tsx`
- [x] T008 [P] [US1] Create `MessageBubble` component for displaying individual messages in `src/components/IDE/AIChatPanel/components/MessageBubble.tsx`
- [x] T009 [US1] Create `MessageList` component with scrollable container in `src/components/IDE/AIChatPanel/components/MessageList.tsx`
- [x] T010 [US1] Create main `AIChatPanel` component composing MessageList and ChatInput in `src/components/IDE/AIChatPanel/AIChatPanel.tsx`
- [x] T011 [US1] Wire up `useChatHistory` and `useAIChat` hooks in AIChatPanel for send/receive functionality
- [x] T012 [US1] Add streaming indicator ("Writing...") to MessageBubble during generation
- [x] T013 [US1] Add disabled state to ChatInput during AI generation
- [x] T014 [US1] Add auto-scroll to newest message in MessageList

**Checkpoint**: User can send messages and receive streamed AI responses - MVP complete!

---

## Phase 4: User Story 2 - Insert AI Content into Editor (Priority: P1)

**Goal**: Writer can insert AI-generated content at cursor position

**Independent Test**: Generate AI response, click Insert, verify content appears in editor at cursor

### Implementation for User Story 2

- [x] T015 [US2] Create `MessageActions` component with Insert/Copy/Regenerate buttons in `src/components/IDE/AIChatPanel/components/MessageActions.tsx`
- [x] T016 [US2] Add `MessageActions` to `MessageBubble` for assistant messages (show on hover)
- [x] T017 [US2] Implement `onInsert` handler using TipTap editor API in AIChatPanel
- [x] T018 [US2] Handle no active editor case with notification in `onInsert`
- [x] T019 [US2] Position cursor at end of inserted content after insert

**Checkpoint**: Insert functionality complete - users can add AI content to manuscript

---

## Phase 5: User Story 3 - Context-Aware Assistance (Priority: P1)

**Goal**: AI understands current chapter, scene, and characters

**Independent Test**: Place cursor in chapter, observe context bar update, verify AI references current context

### Implementation for User Story 3

- [x] T020 [US3] Implement `useEditorContext` hook for chapter/character detection in `src/components/IDE/AIChatPanel/hooks/useEditorContext.ts`
- [x] T021 [US3] Create `ContextBar` component displaying chapter/scene/characters in `src/components/IDE/AIChatPanel/components/ContextBar.tsx`
- [x] T022 [US3] Add `ContextBar` to `AIChatPanel` below header
- [x] T023 [US3] Include context in message prompts sent to AI via `useAIChat`
- [x] T024 [US3] Add 500ms debounce to context updates in `useEditorContext`

**Checkpoint**: Context-aware functionality complete - AI knows current manuscript location

---

## Phase 6: User Story 4 - Quick Actions (Priority: P2)

**Goal**: One-click access to common AI tasks (Continue, Rephrase, Expand, etc.)

**Independent Test**: Click "Continue Story" quick action, verify prompt is sent with context

### Implementation for User Story 4

- [x] T025 [US4] Create `QuickActions` component with action buttons in `src/components/IDE/AIChatPanel/components/QuickActions.tsx`
- [x] T026 [US4] Add `QuickActions` bar to `AIChatPanel` above input area
- [x] T027 [US4] Implement `onAction` handler to send quick action prompt via `useAIChat`
- [x] T028 [US4] Handle selection-dependent actions (e.g., Rephrase requires selection)
- [x] T029 [US4] Disable quick actions during AI generation

**Checkpoint**: Quick actions complete - common tasks accessible with one click

---

## Phase 7: User Story 5 - Copy AI Response (Priority: P2)

**Goal**: Writer can copy AI content to clipboard

**Independent Test**: Generate response, click Copy, paste into another app, verify content

### Implementation for User Story 5

- [x] T030 [US5] Implement `onCopy` handler using Clipboard API in `MessageActions`
- [x] T031 [US5] Add temporary "Copied!" checkmark feedback (2 seconds) to Copy button
- [x] T032 [US5] Strip markdown formatting when copying plain text

**Checkpoint**: Copy functionality complete

---

## Phase 8: User Story 6 - Welcome State (Priority: P2)

**Goal**: New users see guidance when chat is empty

**Independent Test**: Open panel with empty history, verify welcome message and starter buttons appear

### Implementation for User Story 6

- [x] T033 [US6] Create `WelcomeState` component with Ghost Writer intro in `src/components/IDE/AIChatPanel/components/WelcomeState.tsx`
- [x] T034 [US6] Add 4 quick-start buttons to WelcomeState (Continue Story, Write Dialogue, Add Description, Add Tension)
- [x] T035 [US6] Conditionally render WelcomeState when `messages.length === 0` in AIChatPanel
- [x] T036 [US6] Replace WelcomeState with conversation when user sends first message

**Checkpoint**: Welcome state complete - new users have clear onboarding

---

## Phase 9: User Story 7 - Clear Chat History (Priority: P3)

**Goal**: Writer can start fresh conversation

**Independent Test**: Have conversation, click clear in header, verify history resets to welcome state

### Implementation for User Story 7

- [x] T037 [US7] Create `ChatHeader` component with title, clear, and settings icons in `src/components/IDE/AIChatPanel/components/ChatHeader.tsx`
- [x] T038 [US7] Add `ChatHeader` to top of `AIChatPanel`
- [x] T039 [US7] Implement `clearHistory` call from header clear button via `useChatHistory`
- [x] T040 [US7] Show WelcomeState after clearing

**Checkpoint**: Clear history complete - users can reset conversation

---

## Phase 10: User Story 8 - Regenerate Response (Priority: P3)

**Goal**: Writer can generate different version of AI response

**Independent Test**: Generate response, click Regenerate, verify new content replaces previous

### Implementation for User Story 8

- [x] T041 [US8] Implement `regenerate` method in `useAIChat` hook using stored `originalPrompt`
- [x] T042 [US8] Wire `onRegenerate` handler in `MessageActions` to `useAIChat.regenerate`
- [x] T043 [US8] Replace old message content with new streamed content during regeneration

**Checkpoint**: Regenerate complete - all core features implemented

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, accessibility, integration

- [x] T044 [P] Add error state styling and retry button to `MessageBubble`
- [x] T045 [P] Add keyboard navigation (Tab, Enter, Escape) to `ChatInput` and `QuickActions`
- [x] T046 [P] Add ARIA labels and roles to all interactive components
- [x] T047 [P] Add long message collapse/expand (>2000 words) in `MessageBubble`
- [x] T048 [P] Register AIChatPanel with PanelSystem as right panel option in `src/components/IDE/RightPanelContent/`
- [x] T049 [P] Add panel toggle to StatusBar (Ghost Writer button with ⌘⇧G shortcut hint)
- [x] T050 Verify all components use `--ide-*` design tokens (no hardcoded colors)
- [x] T051 Verify all files under 300 lines per Constitution
- [ ] T052 Run quickstart.md validation - manual walkthrough

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)           → No dependencies
Phase 2 (Foundational)    → Depends on Phase 1
Phase 3-10 (User Stories) → All depend on Phase 2 completion
Phase 11 (Polish)         → Depends on desired user stories being complete
```

### User Story Dependencies

| Story | Priority | Can Start After | Notes |
|-------|----------|-----------------|-------|
| US1 - Basic Conversation | P1 | Phase 2 | MVP - no story dependencies |
| US2 - Insert Content | P1 | Phase 2 | Builds on MessageBubble from US1 |
| US3 - Context-Aware | P1 | Phase 2 | Independent, can parallel US1/US2 |
| US4 - Quick Actions | P2 | Phase 2 | Independent |
| US5 - Copy Response | P2 | US2 (shares MessageActions) | |
| US6 - Welcome State | P2 | Phase 2 | Independent |
| US7 - Clear History | P3 | Phase 2 | Independent |
| US8 - Regenerate | P3 | US1 + US2 | Needs useAIChat + MessageActions |

### Within Each User Story

1. Components marked [P] can be built in parallel
2. Wiring/integration tasks must follow component creation
3. Complete story before marking checkpoint

### Parallel Opportunities

```bash
# Phase 1 - All parallel:
T002, T003, T004 (types, constants, exports)

# Phase 3 (US1) - Parallel components:
T007, T008 (ChatInput, MessageBubble in parallel)

# Phase 11 (Polish) - All parallel:
T044, T045, T046, T047, T048, T049 (error states, a11y, panel integration)
```

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Step 1: Launch components in parallel
Task T007: "Create ChatInput component"  
Task T008: "Create MessageBubble component"

# Step 2: Sequential - depends on T007 and T008
Task T009: "Create MessageList component"
Task T010: "Create main AIChatPanel component"

# Step 3: Integration tasks
Tasks T011-T014: Sequential wiring and polish
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. ✅ Complete Phase 1: Setup (T001-T004)
2. ✅ Complete Phase 2: Foundational hooks (T005-T006)
3. ✅ Complete Phase 3: US1 - Basic Conversation (T007-T014)
4. **STOP and VALIDATE**: Test sending messages, receiving streamed responses
5. Complete Phase 4: US2 - Insert Content (T015-T019)
6. Complete Phase 5: US3 - Context-Aware (T020-T024)
7. **MVP COMPLETE**: All P1 stories done, deploy/demo

### Incremental Delivery

| Increment | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1 | Can chat with AI |
| MVP+ | US1 + US2 | Can insert AI content into manuscript |
| MVP++ | US1 + US2 + US3 | Context-aware AI assistance |
| Full P2 | + US4, US5, US6 | Quick actions, copy, welcome |
| Complete | + US7, US8 | Clear history, regenerate |

### Estimated Timeline

| Phase | Tasks | Estimate |
|-------|-------|----------|
| Setup | T001-T004 | 0.5 day |
| Foundational | T005-T006 | 0.5 day |
| US1 (P1) | T007-T014 | 1.5 days |
| US2 (P1) | T015-T019 | 0.5 day |
| US3 (P1) | T020-T024 | 1 day |
| US4-US6 (P2) | T025-T036 | 1 day |
| US7-US8 (P3) | T037-T043 | 0.5 day |
| Polish | T044-T052 | 1 day |
| **Total** | 52 tasks | **5-6 days** |

---

## Notes

- [P] tasks = different files, no dependencies, can run simultaneously
- [Story] label maps task to spec.md user story for traceability
- Each user story checkpoint validates independent functionality
- All colors MUST use `--ide-*` CSS variables (Constitution requirement)
- All files MUST stay under 300 lines (Constitution requirement)
- No `any` types allowed (Constitution requirement)
- Commit after each task or logical group
