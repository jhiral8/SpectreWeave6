# Data Model: AI Chat Panel

## Core Types

```typescript
// src/components/IDE/AIChatPanel/types.ts

/**
 * Role of a message in the chat
 */
export type MessageRole = 'user' | 'assistant';

/**
 * A single message in the chat history
 */
export interface ChatMessage {
  /** Unique identifier */
  id: string;
  /** Message author role */
  role: MessageRole;
  /** Message content (may include markdown) */
  content: string;
  /** When the message was created */
  timestamp: Date;
  /** Editor context when message was sent (for user messages) */
  context?: ChatContext;
  /** Whether AI is still generating this message */
  isGenerating?: boolean;
  /** Whether this message represents an error */
  isError?: boolean;
  /** Original prompt (for regeneration) */
  originalPrompt?: string;
}

/**
 * Current editor context
 */
export interface ChatContext {
  /** Current chapter name/number */
  chapter?: string;
  /** Current scene identifier */
  scene?: string;
  /** Detected character names in current section */
  characters: string[];
  /** Currently selected text in editor */
  selectedText?: string;
  /** Word count of current document */
  wordCount?: number;
}

/**
 * Quick action button configuration
 */
export interface QuickAction {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Lucide icon name */
  icon: string;
  /** Prompt template to send */
  prompt: string;
  /** Whether this action requires selection */
  requiresSelection?: boolean;
}

/**
 * Chat panel state
 */
export interface ChatPanelState {
  /** All messages in current session */
  messages: ChatMessage[];
  /** Current editor context */
  context: ChatContext;
  /** Whether AI is generating a response */
  isGenerating: boolean;
  /** Current input value */
  inputValue: string;
}
```

## Entity Relationships

```
┌─────────────────┐     ┌─────────────────┐
│   ChatMessage   │────▶│   ChatContext   │
│                 │ 0..1│                 │
│ - id            │     │ - chapter       │
│ - role          │     │ - scene         │
│ - content       │     │ - characters[]  │
│ - timestamp     │     │ - selectedText  │
│ - isGenerating  │     └─────────────────┘
│ - isError       │
└─────────────────┘
         │
         │ triggered by
         ▼
┌─────────────────┐
│   QuickAction   │
│                 │
│ - id            │
│ - label         │
│ - icon          │
│ - prompt        │
└─────────────────┘
```

## Validation Rules

### ChatMessage
- `id`: Non-empty string, UUID format
- `role`: Must be 'user' or 'assistant'
- `content`: Can be empty during streaming, max 50,000 characters
- `timestamp`: Valid Date object
- `isGenerating`: Only true for assistant messages during streaming

### ChatContext
- `characters`: Array of strings, each 1-100 characters
- `selectedText`: Max 10,000 characters
- `chapter`: Optional string, max 200 characters

### QuickAction
- `id`: Non-empty, lowercase with hyphens
- `label`: 1-50 characters
- `prompt`: Non-empty, max 500 characters

## State Transitions

### Message Lifecycle

```
[User types message]
       │
       ▼
┌─────────────────┐
│  USER MESSAGE   │ role: 'user', context: current
│    CREATED      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   AI MESSAGE    │ role: 'assistant', isGenerating: true
│   GENERATING    │ content: '' (empty initially)
└────────┬────────┘
         │ (streaming chunks)
         ▼
┌─────────────────┐
│   AI MESSAGE    │ isGenerating: false
│   COMPLETE      │ content: full response
└────────┬────────┘
         │
         ├──── [Regenerate] ───▶ Back to GENERATING
         │
         └──── [Error] ───▶ isError: true
```

### Context Updates

```
[Editor event: selectionUpdate]
       │
       ▼
┌─────────────────┐
│  PARSE CONTENT  │ Extract chapter heading
│                 │ Extract characters from nearby text
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ UPDATE CONTEXT  │ Debounced (500ms)
│                 │ Only if changed
└─────────────────┘
```

## Storage

- **Session storage**: React state (lost on page refresh)
- **Layout persistence**: localStorage for panel sizes
- **No persistence**: Chat history not persisted (per spec)

## Future Extensions (Out of Scope)

These are intentionally NOT modeled:
- `agentId` on messages (future agent selection)
- `sessionId` for conversation persistence
- `parentMessageId` for threaded conversations
- `reactions` or `ratings` on messages
