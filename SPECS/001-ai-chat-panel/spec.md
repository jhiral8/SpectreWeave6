# Feature Specification: AI Chat Panel (VS Code Copilot Style)

**Feature Branch**: `001-ai-chat-panel`  
**Created**: 2026-01-10  
**Status**: Draft  
**Input**: User description: "Implement AI Chat Panel matching VS Code Copilot design as per docs"

## Overview

Implement a VS Code Copilot-style AI Chat Panel as the primary AI interaction surface in SpectreWeave6's IDE. The panel serves as the "Ghost Writer" assistant, providing conversational AI assistance for fiction writing with context-aware suggestions, style coaching, and ghost-writing capabilities.

### Design Reference

The panel must match the exact layout shown in the attached screenshots and documented in `docs/VSCODE_UX_PLAN_PART5_6.md`:

```
┌─────────────────────────────────────┐
│ 🤖 Ghost Writer            [⚙️] [×] │
├─────────────────────────────────────┤
│ 📌 Context: Chapter 3, Scene 2      │
│    Characters: Alice, Bob           │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ You: Help me write a tense      │ │
│ │ dialogue between Alice and Bob  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 Here's a tense exchange:     │ │
│ │                                 │ │
│ │ "I know what you did," Alice    │ │
│ │ said, her voice barely above    │ │
│ │ a whisper...                    │ │
│ │                                 │ │
│ │ [Insert] [Copy] [Regenerate]    │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ Quick Actions:                      │
│ [Continue] [Rephrase] [Expand]      │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Ask the Ghost Writer...     [⏎] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## User Scenarios & Testing

### User Story 1 - Basic Conversation with Ghost Writer (Priority: P1)

A writer wants to ask the AI assistant for help with their creative writing, such as generating dialogue, descriptions, or plot ideas.

**Why this priority**: Core functionality - without conversational AI, the panel has no value. This is the foundational capability that all other features build upon.

**Independent Test**: Can be fully tested by opening the AI Chat Panel, typing a writing-related question, and receiving a streamed AI response that displays character-by-character.

**Acceptance Scenarios**:

1. **Given** the AI Chat Panel is open and the user has typed a message, **When** the user presses Enter or clicks Send, **Then** the message appears in the chat history as a user message with timestamp
2. **Given** a user message has been sent, **When** the AI generates a response, **Then** the response streams character-by-character with a visible "Writing..." indicator
3. **Given** an AI response is complete, **When** viewing the response, **Then** action buttons (Insert, Copy, Regenerate) appear on hover
4. **Given** the AI is generating, **When** the user attempts to send another message, **Then** the send button is disabled until generation completes

---

### User Story 2 - Insert AI Content into Editor (Priority: P1)

A writer receives AI-generated prose and wants to insert it directly into their manuscript at the current cursor position.

**Why this priority**: The primary value proposition - seamlessly incorporating AI assistance into the writing workflow. Without this, users must manually copy/paste.

**Independent Test**: Can be tested by generating an AI response, clicking Insert, and verifying the content appears at the cursor position in the active editor.

**Acceptance Scenarios**:

1. **Given** an AI response with prose content is displayed, **When** the user clicks the "Insert" button, **Then** the content is inserted at the current cursor position in the active editor
2. **Given** no editor is active (e.g., no chapter open), **When** the user clicks Insert, **Then** a non-intrusive notification indicates no active editor
3. **Given** content is inserted, **When** viewing the editor, **Then** the cursor is positioned at the end of the inserted content

---

### User Story 3 - Context-Aware Assistance (Priority: P1)

A writer wants the AI to understand what chapter, scene, and characters they're currently working with to provide relevant assistance.

**Why this priority**: Context-awareness makes the AI significantly more useful for fiction writing - it can reference character names, plot details, and maintain story consistency.

**Independent Test**: Can be tested by placing cursor in a specific chapter, observing context bar updates, then asking a question and verifying the AI response references the current context.

**Acceptance Scenarios**:

1. **Given** the user is editing Chapter 3, Scene 2, **When** viewing the AI Chat Panel, **Then** the context bar displays "Chapter 3, Scene 2" and relevant characters
2. **Given** context is displayed, **When** the user moves cursor to a different chapter, **Then** the context bar updates automatically within 500ms
3. **Given** characters Alice and Bob are mentioned in the current section, **When** the user asks for dialogue help, **Then** the AI references these specific characters

---

### User Story 4 - Quick Actions (Priority: P2)

A writer wants one-click access to common AI tasks like "Continue Story", "Write Dialogue", "Add Description", or "Add Tension".

**Why this priority**: Improves efficiency for common tasks, but core conversation functionality (P1) must work first.

**Independent Test**: Can be tested by clicking a quick action button and verifying a pre-populated prompt appears or is sent directly.

**Acceptance Scenarios**:

1. **Given** the chat panel is open and idle, **When** viewing the Quick Actions bar, **Then** buttons for Continue, Rephrase, Expand, Dialogue, Describe, Conflict are visible
2. **Given** the user clicks "Continue Story", **When** the action triggers, **Then** a prompt "Continue writing from where I left off, maintaining the same voice and style" is sent with editor context
3. **Given** text is selected in the editor, **When** the user clicks "Rephrase", **Then** the selected text is included in the prompt for rephrasing

---

### User Story 5 - Copy AI Response (Priority: P2)

A writer wants to copy AI-generated content to clipboard for use elsewhere (notes, other documents, etc.).

**Why this priority**: Standard utility feature - useful but not critical for core workflow.

**Independent Test**: Can be tested by generating a response, clicking Copy, and pasting into another application.

**Acceptance Scenarios**:

1. **Given** an AI response is displayed, **When** the user clicks "Copy", **Then** the response text is copied to system clipboard
2. **Given** copy succeeds, **When** viewing the button, **Then** it temporarily shows a checkmark with "Copied!" text for 2 seconds
3. **Given** markdown formatting exists in response, **When** copying, **Then** plain text without markdown syntax is copied

---

### User Story 6 - Welcome State (Priority: P2)

A new user opens the AI Chat Panel for the first time and needs guidance on what they can do.

**Why this priority**: Important for onboarding but not blocking core functionality.

**Independent Test**: Can be tested by opening chat panel with empty history and verifying welcome message and starter buttons appear.

**Acceptance Scenarios**:

1. **Given** the chat history is empty, **When** viewing the panel, **Then** a welcome message with Ghost Writer avatar and description appears
2. **Given** welcome state is shown, **When** viewing starter actions, **Then** grid of 4 quick-start buttons (Continue Story, Write Dialogue, Add Description, Add Tension) is displayed
3. **Given** user clicks a starter button, **When** the action triggers, **Then** the welcome state is replaced with the conversation

---

### User Story 7 - Clear Chat History (Priority: P3)

A writer wants to start a fresh conversation without accumulated context from previous exchanges.

**Why this priority**: Nice-to-have feature - conversation can continue indefinitely without clearing.

**Independent Test**: Can be tested by having a conversation, clicking clear, and verifying history resets to welcome state.

**Acceptance Scenarios**:

1. **Given** chat history contains messages, **When** the user clicks the Clear/Refresh icon in header, **Then** all messages are removed
2. **Given** history is cleared, **When** viewing the panel, **Then** the welcome state is displayed
3. **Given** clear is triggered, **When** user confirms (if confirmation required), **Then** the action completes within 100ms

---

### User Story 8 - Regenerate Response (Priority: P3)

A writer is unsatisfied with an AI response and wants to generate a different version.

**Why this priority**: Quality-of-life feature - users can work around by asking again manually.

**Independent Test**: Can be tested by generating a response, clicking Regenerate, and verifying a new response replaces the previous one.

**Acceptance Scenarios**:

1. **Given** an AI response is displayed, **When** the user clicks "Regenerate", **Then** a new response is generated using the same prompt
2. **Given** regeneration starts, **When** viewing the message, **Then** the previous content is replaced with new streaming content
3. **Given** regeneration completes, **When** comparing to original, **Then** the new response has meaningfully different content

---

### Edge Cases

- What happens when the AI service is unavailable? Display error message with retry option
- What happens when network connection is lost mid-generation? Show partial response with "Connection lost" indicator
- How does system handle very long responses (>2000 words)? Auto-collapse with "Show more" option
- What happens when user rapidly sends multiple messages? Queue messages, process sequentially
- How does system handle special characters or code in responses? Render with appropriate formatting (code blocks for code, quotes for dialogue)

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST display a right panel with header showing "Ghost Writer" title, settings icon, and close icon
- **FR-002**: System MUST display a context bar showing current chapter, scene, and detected characters from editor cursor position
- **FR-003**: System MUST update context bar within 500ms when editor cursor moves to new section
- **FR-004**: System MUST display user messages right-aligned with user avatar and timestamp
- **FR-005**: System MUST display AI messages left-aligned with bot avatar, timestamp, and action buttons
- **FR-006**: System MUST stream AI responses character-by-character with visible "Writing..." indicator
- **FR-007**: System MUST show action buttons (Insert, Copy, Regenerate) on hover for AI messages
- **FR-008**: System MUST insert AI response content at current cursor position when Insert is clicked
- **FR-009**: System MUST copy AI response to clipboard when Copy is clicked, showing confirmation
- **FR-010**: System MUST regenerate response when Regenerate is clicked
- **FR-011**: System MUST display Quick Actions bar with predefined prompt buttons
- **FR-012**: System MUST provide text input area with placeholder "Ask the Ghost Writer..."
- **FR-013**: System MUST send message on Enter key press (Shift+Enter for new line)
- **FR-014**: System MUST disable input during AI generation
- **FR-015**: System MUST persist chat history for the current session
- **FR-016**: System MUST clear chat history and show welcome state when clear button is clicked
- **FR-017**: System MUST display welcome message with quick-start buttons when history is empty
- **FR-018**: System MUST handle AI errors gracefully with user-friendly error messages
- **FR-019**: System MUST render dialogue text (quoted strings) with distinct styling
- **FR-020**: System MUST auto-scroll to newest message when chat updates

### Visual Requirements

- **VR-001**: Panel MUST use VS Code-style design tokens (--ide-sidebar-bg, --ide-border, etc.)
- **VR-002**: User message bubbles MUST use accent color background (--ide-activitybar-badge)
- **VR-003**: AI message bubbles MUST use subtle background (--ide-input-bg) with border
- **VR-004**: Input area MUST have focus ring matching VS Code input styling
- **VR-005**: Quick action buttons MUST be arranged horizontally with consistent spacing
- **VR-006**: Panel MUST be resizable with minimum width of 280px

### Key Entities

- **ChatMessage**: Represents a single message in the conversation
  - id: Unique identifier
  - role: 'user' | 'assistant'
  - content: Message text
  - timestamp: When message was created
  - context: Optional editor context at time of message
  - isGenerating: Boolean for streaming state
  - isError: Boolean for error state

- **ChatContext**: Represents the current editor context
  - chapter: Current chapter name/number
  - scene: Current scene identifier
  - characters: Array of detected character names
  - selectedText: Any selected text in editor

- **QuickAction**: Represents a predefined prompt action
  - id: Action identifier
  - label: Display text
  - icon: Icon component
  - prompt: The prompt text to send

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can send a message and receive a streamed AI response within 2 seconds of first token
- **SC-002**: Context bar updates within 500ms of cursor movement
- **SC-003**: Insert action places content in editor within 100ms of button click
- **SC-004**: Copy action completes within 50ms with visual confirmation
- **SC-005**: Panel renders initial state within 200ms of being opened
- **SC-006**: Chat history supports at least 100 messages without performance degradation
- **SC-007**: 95% of users can successfully send their first message without guidance
- **SC-008**: Quick actions reduce common task completion time by 50% vs. typing full prompts

### Quality Metrics

- **QM-001**: Component follows Constitution size limits (max 300 lines per file)
- **QM-002**: Zero TypeScript any types in implementation
- **QM-003**: All interactive elements have keyboard accessibility
- **QM-004**: All colors use design tokens, no hardcoded values
- **QM-005**: Component renders correctly in both light and dark themes

---

## Assumptions

1. AI backend service is available via existing useAI hook or similar
2. Editor context can be obtained from existing useEditorContext or similar hook
3. VS Code design tokens are already defined in CSS variables
4. TipTap editor provides cursor position and selection APIs
5. Panel system for right panel positioning already exists

---

## Out of Scope

- AI agent selection (different personas) - future feature
- Conversation history persistence across sessions - future feature
- Voice input/output - future feature
- Image generation - future feature
- Multi-model selection - future feature
- Advanced prompt customization - future feature

---

## Related Documentation

- docs/VSCODE_UX_PLAN_PART5_6.md - Full technical specification
- docs/VSCODE_UX_TRANSFORMATION_PLAN.md - Overall architecture
- src/components/IDE/AICopilotPanel/ - Existing related component
- src/components/IDE/VSCodeCopilot/ - Existing VS Code style components
