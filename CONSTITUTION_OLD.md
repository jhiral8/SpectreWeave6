# SpectreWeave6 Development Constitution

> **Mission**: Build the VS Code of fiction writing — a professional-grade creative writing IDE powered by modern React patterns, TypeScript excellence, and AI-assisted authorship.

---

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Modern Development Principles](#modern-development-principles)
3. [React & Next.js Best Practices](#react--nextjs-best-practices)
4. [TypeScript Standards](#typescript-standards)
5. [Component Architecture](#component-architecture)
6. [State Management Strategy](#state-management-strategy)
7. [Performance & Optimization](#performance--optimization)
8. [CSS & Styling Standards](#css--styling-standards)
9. [Testing Philosophy](#testing-philosophy)
10. [Code Quality Gates](#code-quality-gates)
11. [VS Code UX Alignment](#vs-code-ux-alignment)
12. [Prohibited Patterns](#prohibited-patterns)

---

## Core Philosophy

### The Product Vision

SpectreWeave6 IS VS Code for writers. Every UX decision should answer:

> "How would VS Code handle this, and how do we adapt it for creative writing?"

**Users Experience:**
- 🎯 **Instant familiarity** for VS Code users
- 🏗️ **Professional tooling**, not a "toy" writing app  
- 🎮 **Full control** over their workspace
- ✍️ **Focused writing** without UI friction
- 🤖 **AI augmentation** that feels native

### The Three Pillars

```
┌─────────────────────────────────────────────────────────┐
│                    SPECTREWEAVE6                        │
├─────────────────┬─────────────────┬─────────────────────┤
│   FAMILIARITY   │   FOCUS         │   POWER             │
│   (VS Code UX)  │   (Writing)     │   (AI Assistance)   │
├─────────────────┼─────────────────┼─────────────────────┤
│ - Layout parity │ - Distraction   │ - Copilot-style     │
│ - Interaction   │   free editor   │   completions       │
│ - Shortcuts     │ - Story context │ - Smart analysis    │
│ - Theme system  │ - Character DB  │ - Style matching    │
└─────────────────┴─────────────────┴─────────────────────┘
```

### Development Values

```typescript
const DEVELOPMENT_VALUES = {
  simplicity: "KISS - Solve today's problem, not tomorrow's",
  pragmatism: "YAGNI - Build only what users need now",
  maintainability: "DRY - Single source of truth for everything",
  performance: "React best practices - Fast by default",
  quality: "TypeScript strict mode - Catch errors at compile time",
  ux: "VS Code patterns - Familiar and powerful"
} as const;
```

---

## Modern Development Principles

### 1. YAGNI (You Aren't Gonna Need It)

**Definition**: Don't implement functionality until it's actually needed.

**Application in SpectreWeave6:**

```typescript
// ❌ WRONG: Over-engineering for hypothetical futures
interface Character {
  id: string;
  name: string;
  backstory: string;
  relationships: Relationship[];
  inventory: Item[];              // YAGNI - not needed yet
  multiverseVariants: Character[]; // YAGNI - speculative feature
  combatStats: CombatStats;        // YAGNI - wrong domain
  socialMediaHandles: string[];    // YAGNI - premature
}

// ✅ RIGHT: Build what you need now, extend later
interface Character {
  id: string;
  name: string;
  backstory: string;
  relationships: Relationship[];
}

// ✅ WHEN NEEDED: Add fields incrementally
interface CharacterWithImages extends Character {
  referenceImages: ReferenceImage[];  // Added when feature ships
}
```

**YAGNI Decision Matrix:**

| Question | Answer | Action |
|----------|--------|--------|
| Is this feature in the current sprint? | No | Don't build it |
| Has a user requested this? | No | Don't build it |
| Does removing this break existing features? | Yes | Keep it |
| Can this be added later without major refactoring? | Yes | Don't build it now |
| Is this needed for the core user workflow? | Yes | Build it |

### 2. KISS (Keep It Simple, Stupid)

**Definition**: Favor simplicity over clever complexity.

```typescript
// ❌ WRONG: Over-abstracted factory pattern
class AIMessageFactory {
  private strategyRegistry: Map<string, MessageStrategy>;
  private decoratorChain: MessageDecorator[];
  
  createMessage(config: MessageConfig): AIMessage {
    const strategy = this.strategyRegistry.get(config.type);
    const builder = new MessageBuilder(strategy);
    return this.decoratorChain.reduce(
      (msg, decorator) => decorator.decorate(msg),
      builder.build(config)
    );
  }
}

// ✅ RIGHT: Simple, direct, readable
interface CreateMessageParams {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
}

function createMessage(params: CreateMessageParams): AIMessage {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    ...params
  };
}
```

**Simplicity Checklist:**
- ✅ Can a junior developer understand this in 30 seconds?
- ✅ Does this function do ONE thing?
- ✅ Can I explain this without drawing a diagram?
- ✅ Would deleting comments make this harder to understand?

**Complexity Budget:**
- Functions: ≤ 50 lines
- Components: ≤ 300 lines  
- Nesting depth: ≤ 3 levels
- Function parameters: ≤ 5 (use object if more)
- Cyclomatic complexity: ≤ 10

### 3. DRY (Don't Repeat Yourself)

**Definition**: Every piece of knowledge must have a single, unambiguous, authoritative representation.

```typescript
// ❌ WRONG: Repeated validation logic
// In AICopilotPanel.tsx
function validateMessage(text: string): boolean {
  return text.trim().length > 0 && text.length <= 4000;
}

// In ChatInput.tsx
function isValidMessage(input: string): boolean {
  return input.trim() !== '' && input.length <= 4000;
}

// ✅ RIGHT: Single source of truth
// src/lib/validation.ts
const MESSAGE_CONSTRAINTS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 4000
} as const;

export function validateMessage(text: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmed = text.trim();
  
  if (trimmed.length < MESSAGE_CONSTRAINTS.MIN_LENGTH) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (trimmed.length > MESSAGE_CONSTRAINTS.MAX_LENGTH) {
    return { isValid: false, error: `Message too long (max ${MESSAGE_CONSTRAINTS.MAX_LENGTH})` };
  }
  
  return { isValid: true };
}
```

**DRY Application Areas:**

| Domain | Single Source of Truth | Location |
|--------|------------------------|----------|
| **Colors** | CSS variables | `src/styles/vscode-layout.css` |
| **Types** | TypeScript interfaces | `src/types/*.ts` |
| **API calls** | Service functions | `src/services/*.ts` |
| **Validation** | Validation utilities | `src/lib/validation.ts` |
| **Constants** | Constant files | `src/lib/constants.ts` |
| **UI Components** | Shared components | `src/components/ui/*.tsx` |
| **Hooks** | Custom hooks | `src/hooks/*.ts` |
| **Business logic** | Service layer | `src/services/*.ts` |

**Rule of Three**: If you copy-paste code 3 times, it's time to abstract it.

### 4. SOLID Principles (React Adaptation)

#### S - Single Responsibility Principle

```typescript
// ❌ WRONG: Component doing too much
function CharacterPanel() {
  // Fetches data
  const { data: characters } = useQuery('characters', fetchCharacters);
  
  // Handles validation
  const [errors, setErrors] = useState<ValidationError[]>([]);
  
  // Manages form state
  const [name, setName] = useState('');
  const [backstory, setBackstory] = useState('');
  
  // Handles API calls
  const handleSave = async () => {
    await fetch('/api/characters', { /* ... */ });
  };
  
  // Renders UI
  return <div>{/* Complex JSX */}</div>;
}

// ✅ RIGHT: Single responsibility per component/hook
function CharacterPanel() {
  const characters = useCharacters();
  const form = useCharacterForm();
  
  return (
    <div className="part sidebar">
      <CharacterList characters={characters} />
      <CharacterForm form={form} />
    </div>
  );
}
```

#### O - Open/Closed Principle

```typescript
// ✅ Components open for extension, closed for modification
interface BaseButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

function Button({ variant = 'primary', ...props }: BaseButtonProps) {
  return (
    <button
      className={cn(
        'vscode-button',
        variantStyles[variant]
      )}
      {...props}
    />
  );
}

// Extend without modifying
function AIButton(props: BaseButtonProps) {
  return (
    <Button {...props}>
      <Sparkles className="w-4 h-4 mr-2" />
      {props.children}
    </Button>
  );
}
```

#### L - Liskov Substitution Principle

```typescript
// ✅ RIGHT: Subtypes are substitutable
interface Editor {
  getContent(): string;
  setContent(content: string): void;
}

class TiptapEditor implements Editor {
  getContent() { return this.editor.getHTML(); }
  setContent(content: string) { this.editor.commands.setContent(content); }
}

class MarkdownEditor implements Editor {
  getContent() { return this.markdown; }
  setContent(content: string) { this.markdown = content; }
}

// Any Editor implementation works here
function saveDocument(editor: Editor) {
  const content = editor.getContent();
  return api.save(content);
}
```

#### I - Interface Segregation Principle

```typescript
// ❌ WRONG: Fat interface
interface Document {
  save(): Promise<void>;
  load(): Promise<void>;
  export(): Promise<Blob>;
  share(): Promise<string>;
  collaborate(): void;
  analyze(): Promise<Analysis>;
}

// ✅ RIGHT: Segregated interfaces
interface Saveable {
  save(): Promise<void>;
  load(): Promise<void>;
}

interface Exportable {
  export(format: ExportFormat): Promise<Blob>;
}

interface Shareable {
  share(): Promise<string>;
}

// Components only depend on what they use
function AutoSave({ document }: { document: Saveable }) {
  useAutoSave(document);
  return null;
}
```

#### D - Dependency Inversion Principle

```typescript
// ✅ RIGHT: Depend on abstractions, not concretions
interface AIProvider {
  complete(prompt: string): Promise<string>;
}

class OpenAIProvider implements AIProvider {
  async complete(prompt: string) {
    // OpenAI-specific implementation
    return await openai.completions.create({ /* ... */ });
  }
}

class AnthropicProvider implements AIProvider {
  async complete(prompt: string) {
    // Anthropic-specific implementation
    return await anthropic.messages.create({ /* ... */ });
  }
}

// Component depends on abstraction
function AICompletion({ provider }: { provider: AIProvider }) {
  const [result, setResult] = useState('');
  
  const generate = async () => {
    const completion = await provider.complete(input);
    setResult(completion);
  };
  
  return <div>{result}</div>;
}
```

### 5. Composition Over Inheritance

**React is built on composition. Embrace it.**

```typescript
// ❌ WRONG: Class inheritance (anti-pattern in React)
class BasePanel extends React.Component {
  renderHeader() { /* ... */ }
  renderContent() { /* ... */ }
}

class CharacterPanel extends BasePanel {
  renderContent() { /* Override */ }
}

// ✅ RIGHT: Composition with React components
interface PanelProps {
  header: React.ReactNode;
  content: React.ReactNode;
  footer?: React.ReactNode;
}

function Panel({ header, content, footer }: PanelProps) {
  return (
    <div className="part sidebar">
      <div className="panel-header">{header}</div>
      <div className="panel-content">{content}</div>
      {footer && <div className="panel-footer">{footer}</div>}
    </div>
  );
}

// Compose specific panels
function CharacterPanel() {
  return (
    <Panel
      header={<PanelHeader title="Characters" icon={<Users />} />}
      content={<CharacterList />}
      footer={<AddCharacterButton />}
    />
  );
}
```

**Composition Patterns:**

1. **Children Prop**: Most flexible composition
   ```typescript
   <Panel>
     <PanelHeader />
     <PanelContent />
   </Panel>
   ```

2. **Render Props**: Dynamic composition
   ```typescript
   <DataProvider render={(data) => <CharacterList data={data} />} />
   ```

3. **Higher-Order Components** (use sparingly):
   ```typescript
   const withAuth = (Component) => (props) => {
     const { user } = useAuth();
     return user ? <Component {...props} /> : <LoginPrompt />;
   };
   ```

4. **Custom Hooks** (preferred):
   ```typescript
   function CharacterPanel() {
     const { characters, loading } = useCharacters();
     const { save, saving } = useSaveCharacter();
     
     return <Panel>...</Panel>;
   }
   ```

---

## React & Next.js Best Practices

### React Server Components (RSC) Strategy

**Default to Server Components, opt into Client Components only when needed.**

```typescript
// ✅ DEFAULT: Server Component (no 'use client')
// app/dashboard/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { CharacterList } from '@/components/characters/CharacterList';

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: characters } = await supabase
    .from('characters')
    .select('*');
  
  return (
    <div className="monaco-workbench">
      <CharacterList characters={characters} />
    </div>
  );
}

// ✅ WHEN NEEDED: Client Component
// components/CharacterList.tsx
'use client';

import { useState } from 'react';

export function CharacterList({ characters }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  
  return (
    <div className="monaco-list">
      {characters.map(char => (
        <CharacterListItem
          key={char.id}
          character={char}
          selected={selected === char.id}
          onClick={() => setSelected(char.id)}
        />
      ))}
    </div>
  );
}
```

**Client Component Decision Tree:**

```
Need 'use client' if using:
├─ ✅ useState, useReducer, useEffect
├─ ✅ Browser APIs (localStorage, window, etc.)
├─ ✅ Event handlers (onClick, onChange, etc.)
├─ ✅ Custom hooks that use the above
└─ ❌ None of the above? → Use Server Component
```

### Next.js App Router Patterns

**File Structure:**

```
src/app/
├── layout.tsx                 # Root layout (Server Component)
├── page.tsx                   # Home page (Server Component)
├── globals.css                # Global styles
├── dashboard/
│   ├── layout.tsx             # Dashboard layout
│   ├── page.tsx               # Dashboard home
│   └── characters/
│       ├── page.tsx           # Characters list
│       └── [id]/
│           └── page.tsx       # Character detail
└── api/
    ├── characters/
    │   └── route.ts           # API route
    └── ai/
        └── complete/
            └── route.ts       # Serverless function
```

**Route Handlers (API Routes):**

```typescript
// app/api/characters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('characters')
      .select('*');
    
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to fetch characters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('characters')
      .insert(body)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Failed to create character:', error);
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    );
  }
}
```

### React Hooks Best Practices

#### useState: Simple State Management

```typescript
// ✅ RIGHT: Primitive values
const [isOpen, setIsOpen] = useState(false);
const [count, setCount] = useState(0);

// ✅ RIGHT: Complex state with clear structure
const [formData, setFormData] = useState({
  name: '',
  backstory: '',
  traits: []
});

// ✅ RIGHT: Functional updates for computed state
setCount(prev => prev + 1);
setFormData(prev => ({ ...prev, name: newName }));

// ❌ WRONG: Derived state (compute from props instead)
const [fullName, setFullName] = useState(firstName + ' ' + lastName);
// ✅ RIGHT: Compute on render
const fullName = `${firstName} ${lastName}`;
```

#### useEffect: Side Effect Management

```typescript
// ✅ RIGHT: Focused effects with proper dependencies
useEffect(() => {
  // Single responsibility: sync with external system
  const subscription = api.subscribeToCharacterUpdates(characterId, (data) => {
    setCharacter(data);
  });
  
  // Cleanup function
  return () => {
    subscription.unsubscribe();
  };
}, [characterId]); // Correct dependencies

// ❌ WRONG: Missing dependencies
useEffect(() => {
  fetchCharacter(characterId); // characterId not in deps!
}, []);

// ❌ WRONG: Too many responsibilities
useEffect(() => {
  fetchCharacter();
  subscribeToUpdates();
  syncToLocalStorage();
  trackAnalytics();
}, []);

// ✅ RIGHT: Split into focused effects
useEffect(() => { /* fetch */ }, [characterId]);
useEffect(() => { /* subscribe */ }, [characterId]);
useEffect(() => { /* localStorage */ }, [character]);
useEffect(() => { /* analytics */ }, [pageView]);
```

**useEffect Rules:**
1. ✅ Always specify dependencies array
2. ✅ Always return cleanup function if needed
3. ✅ One effect = one side effect
4. ❌ Never call hooks conditionally
5. ❌ Don't use for derived state

#### useMemo & useCallback: Optimization Hooks

```typescript
// ✅ RIGHT: Memoize expensive computations
const sortedCharacters = useMemo(() => {
  return characters.sort((a, b) => a.name.localeCompare(b.name));
}, [characters]);

// ✅ RIGHT: Memoize callbacks passed to children
const handleSelect = useCallback((id: string) => {
  setSelected(id);
  onCharacterSelect?.(id);
}, [onCharacterSelect]);

// ❌ WRONG: Premature optimization
const sum = useMemo(() => a + b, [a, b]); // Too cheap to memoize
```

**Memoization Decision Matrix:**

| Scenario | Use Memo? | Reason |
|----------|-----------|--------|
| Expensive calculation (>10ms) | ✅ Yes | Prevents re-computation |
| Callback to memoized child | ✅ Yes | Prevents child re-render |
| Simple arithmetic | ❌ No | Memoization overhead > computation |
| Object/array literal | ⚠️ Maybe | If causing re-renders |

#### Custom Hooks: Reusable Logic

```typescript
// ✅ RIGHT: Extract reusable stateful logic
function useCharacters(userId: string) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function fetchCharacters() {
      try {
        setLoading(true);
        const data = await api.getCharacters(userId);
        setCharacters(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCharacters();
  }, [userId]);
  
  return { characters, loading, error };
}

// Usage is clean and declarative
function CharacterPanel() {
  const { characters, loading, error } = useCharacters(userId);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <CharacterList characters={characters} />;
}
```

**Custom Hook Best Practices:**
- ✅ Start with `use` prefix
- ✅ Return object with named properties (not array)
- ✅ Handle loading/error states
- ✅ Clean up side effects
- ❌ Don't call other hooks conditionally

### Component Patterns

#### Compound Components Pattern

```typescript
// ✅ RIGHT: Related components that work together
function CharacterPanel({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null);
  
  return (
    <CharacterPanelContext.Provider value={{ selected, setSelected }}>
      <div className="part sidebar">{children}</div>
    </CharacterPanelContext.Provider>
  );
}

CharacterPanel.Header = function CharacterPanelHeader({ title }: { title: string }) {
  return <div className="panel-header">{title}</div>;
};

CharacterPanel.List = function CharacterPanelList({ characters }: Props) {
  const { selected, setSelected } = useCharacterPanelContext();
  return <div className="monaco-list">{/* ... */}</div>;
};

// Usage: Flexible and composable
<CharacterPanel>
  <CharacterPanel.Header title="Characters" />
  <CharacterPanel.List characters={characters} />
</CharacterPanel>
```

#### Render Props Pattern (use sparingly)

```typescript
// ✅ WHEN NEEDED: Flexible rendering control
interface DataProviderProps<T> {
  fetch: () => Promise<T>;
  render: (data: T, loading: boolean) => React.ReactNode;
}

function DataProvider<T>({ fetch, render }: DataProviderProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch().then(setData).finally(() => setLoading(false));
  }, [fetch]);
  
  return <>{render(data, loading)}</>;
}

// Usage
<DataProvider
  fetch={fetchCharacters}
  render={(characters, loading) => 
    loading ? <Spinner /> : <CharacterList characters={characters} />
  }
/>
```

#### Container/Presenter Pattern

```typescript
// ✅ RIGHT: Separate logic from presentation

// Container: Handles logic and state
function CharacterListContainer() {
  const { characters, loading, error } = useCharacters();
  const { deleteCharacter } = useDeleteCharacter();
  
  return (
    <CharacterListPresenter
      characters={characters}
      loading={loading}
      error={error}
      onDelete={deleteCharacter}
    />
  );
}

// Presenter: Pure presentation logic
interface CharacterListPresenterProps {
  characters: Character[];
  loading: boolean;
  error: Error | null;
  onDelete: (id: string) => void;
}

function CharacterListPresenter({
  characters,
  loading,
  error,
  onDelete
}: CharacterListPresenterProps) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (characters.length === 0) return <EmptyState />;
  
  return (
    <div className="monaco-list">
      {characters.map(char => (
        <CharacterListItem
          key={char.id}
          character={char}
          onDelete={() => onDelete(char.id)}
        />
      ))}
    </div>
  );
}
```

### React Query / TanStack Query Integration

**SpectreWeave6 uses TanStack Query for server state management.**

```typescript
// ✅ RIGHT: Use React Query for server state
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useCharacters(userId: string) {
  return useQuery({
    queryKey: ['characters', userId],
    queryFn: () => api.getCharacters(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function useCreateCharacter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (character: NewCharacter) => api.createCharacter(character),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

// Usage in component
function CharacterPanel() {
  const { data: characters, isLoading, error } = useCharacters(userId);
  const createMutation = useCreateCharacter();
  
  const handleCreate = async (character: NewCharacter) => {
    await createMutation.mutateAsync(character);
  };
  
  return (
    <div>
      {isLoading ? <Spinner /> : <CharacterList characters={characters} />}
      <CreateCharacterForm onSubmit={handleCreate} />
    </div>
  );
}
```

**React Query Best Practices:**
- ✅ Use query keys for cache management
- ✅ Set appropriate `staleTime` based on data volatility
- ✅ Invalidate queries after mutations
- ✅ Use `optimistic updates` for instant UI feedback
- ❌ Don't mix React Query with useState for server data

### Error Boundaries

```typescript
// ✅ RIGHT: Catch React errors gracefully
'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    // Log to error tracking service (e.g., Sentry)
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Usage: Wrap risky components
<ErrorBoundary fallback={<ErrorFallback />}>
  <CharacterPanel />
</ErrorBoundary>
```

### Layout Architecture

SpectreWeave6 follows VS Code's exact layout structure:

```
┌──────────────────────────────────────────────────────────────┐
│ Title Bar (optional on macOS)                                │
├────┬─────────────────────────────────────────────────┬───────┤
│    │ Tab Bar                                         │       │
│ A  ├─────────────────────────────────────────────────┤   S   │
│ C  │                                                 │   E   │
│ T  │                                                 │   C   │
│ I  │           EDITOR AREA                           │   O   │
│ V  │           (Writing Surface)                     │   N   │
│ I  │                                                 │   D   │
│ T  │                                                 │   A   │
│ Y  │                                                 │   R   │
│    │                                                 │   Y   │
│ B  ├─────────────────────────────────────────────────┤       │
│ A  │ Panel (Terminal / Problems / AI Chat)           │   S   │
│ R  │                                                 │   I   │
│    │                                                 │   D   │
├────┴─────────────────────────────────────────────────┤   E   │
│ Status Bar                                           │   B   │
└──────────────────────────────────────────────────────┴───────┘
```

### VS Code Component Mapping

| VS Code Component | SpectreWeave6 Equivalent |
|-------------------|--------------------------|
| Activity Bar | Left icon rail (Explorer, Search, Characters, AI) |
| Primary Sidebar | File explorer, Chapter navigator |
| Editor | Notion-style writing surface |
| Secondary Sidebar | AI Copilot Panel |
| Panel | AI Chat, Output, Problems |
| Status Bar | Word count, sync status, AI status |
| Command Palette | Quick actions (Cmd+K) |
| Settings | Story/Project settings |

### Required CSS Classes (from VS Code)

All UI must use these VS Code-derived classes:

```css
/* Layout containers */
.monaco-workbench { }
.part.sidebar { }
.part.editor { }
.part.panel { }
.part.statusbar { }
.part.activitybar { }

/* Interactive elements */
.interactive-session { }
.interactive-list { }
.interactive-item-container { }
.interactive-input-part { }
.chat-input-container { }

/* Welcome views */
.chat-welcome-view-container { }
.chat-welcome-view { }
.chat-welcome-view-icon { }
.chat-welcome-view-title { }
.chat-welcome-view-message { }

/* Tree views */
.monaco-list { }
.monaco-list-row { }
.monaco-icon-label { }
```

### VS Code Color System

**MANDATORY**: All colors must use CSS variables from the VS Code theme:

```css
/* Primary backgrounds */
--vscode-editor-background
--vscode-sideBar-background
--vscode-activityBar-background
--vscode-panel-background
--vscode-statusBar-background

/* Text colors */
--vscode-editor-foreground
--vscode-sideBar-foreground
--vscode-descriptionForeground

/* Interactive states */
--vscode-button-background
--vscode-button-foreground
--vscode-button-hoverBackground
--vscode-focusBorder
--vscode-list-activeSelectionBackground
--vscode-list-hoverBackground

/* Semantic colors */
--vscode-errorForeground
--vscode-warningForeground
--vscode-textLink-foreground
```

**NEVER** hardcode colors:
```typescript
// ❌ WRONG
className="bg-[#1e1e1e] text-[#cccccc]"

// ✅ RIGHT
className="bg-[--vscode-editor-background] text-[--vscode-editor-foreground]"
```

---

## Fiction Writing Adaptations

### Editor Adaptations

| VS Code Feature | SpectreWeave6 Adaptation |
|-----------------|--------------------------|
| Code completion | Sentence/paragraph completion |
| IntelliSense | Character name suggestions, story context |
| Problems panel | Consistency checker, plot holes |
| Find & Replace | Character rename across documents |
| Git diff | Revision comparison |
| Minimap | Chapter/scene overview |

### AI Copilot Panel Modes

The AI panel adapts VS Code's Copilot Chat for fiction:

```
┌─────────────────────────────────────┐
│ [Discuss] [Ghostwrite] [Framework]  │  ← Mode tabs (VS Code pattern)
├─────────────────────────────────────┤
│                                     │
│     🔮 Ask Copilot                  │  ← Welcome view (VS Code pattern)
│                                     │
│  Ask questions about your story,    │
│  characters, or writing.            │
│                                     │
│  [🪄 Start Framework Wizard]        │  ← Fiction-specific CTA
│                                     │
├─────────────────────────────────────┤
│ Model: [Claude Sonnet ▾]            │  ← VS Code model selector
├─────────────────────────────────────┤
│ │ Type your message...         [➤] │  ← Input (VS Code pattern)
└─────────────────────────────────────┘
```

### Fiction-Specific Features

These features have NO VS Code equivalent and require careful design:

1. **Framework Wizard** - Story structure builder
2. **Character Database** - Character profiles with AI generation
3. **Ghost Completion** - Inline writing suggestions
4. **Style Analysis** - Author voice matching
5. **Consistency Checker** - Plot/character validation

**Design Rule**: When no VS Code pattern exists, prefer:
1. Modal dialogs (VS Code uses these for complex wizards)
2. Side panels (VS Code's webview pattern)
3. Inline suggestions (VS Code's IntelliSense pattern)

---

## Component Standards

### Component Structure

Every component MUST follow this structure:

```typescript
// 1. Imports (grouped: react, external, internal, types)
import { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Message } from '@/types';

// 2. Types (if component-specific)
interface Props {
  messages: Message[];
  onSend: (content: string) => void;
}

// 3. Component (named export preferred)
export function ChatPanel({ messages, onSend }: Props) {
  // 3a. Hooks
  const [input, setInput] = useState('');
  
  // 3b. Callbacks (memoized if passed to children)
  const handleSend = useCallback(() => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  }, [input, onSend]);
  
  // 3c. Render
  return (
    <div className="interactive-session">
      {/* Component JSX */}
    </div>
  );
}
```

### Component Size Limits

| Metric | Limit | Action if Exceeded |
|--------|-------|-------------------|
| Lines of code | 300 | Split into sub-components |
| Props | 7 | Create a config object |
| useState calls | 5 | Use useReducer or context |
| useEffect calls | 3 | Review for side-effect consolidation |
| Nesting depth | 3 | Extract to sub-component |

### Component Naming

```
Pattern: [Domain][Descriptor][Type]

Examples:
- AICopilotPanel.tsx      (Domain: AI, Descriptor: Copilot, Type: Panel)
- CharacterProfileCard.tsx (Domain: Character, Descriptor: Profile, Type: Card)  
- EditorToolbar.tsx       (Domain: Editor, Type: Toolbar)
```

---

## CSS & Styling Standards

### Styling Hierarchy

1. **VS Code CSS variables** (highest priority)
2. **Tailwind utilities** (for layout/spacing)
3. **Component-scoped CSS** (rare, for complex animations)
4. **Global CSS** (avoided except for VS Code overrides)

### Tailwind Usage Rules

```typescript
// ✅ ALLOWED: Layout and spacing
className="flex items-center gap-2 p-4"

// ✅ ALLOWED: With VS Code variables
className="bg-[--vscode-button-background] text-[--vscode-button-foreground]"

// ❌ FORBIDDEN: Hardcoded colors
className="bg-blue-500 text-white"

// ❌ FORBIDDEN: Arbitrary values for colors
className="bg-[#1e1e1e]"
```

### CSS File Organization

```
src/styles/
├── globals.css           # Tailwind base + minimal global styles
├── vscode-layout.css     # ALL VS Code CSS variables and patterns
├── editor.css            # Tiptap/ProseMirror editor overrides
└── components/           # Component-specific CSS (rarely needed)
    └── framework-wizard.css
```

### Responsive Design

SpectreWeave6 is **desktop-first** (like VS Code):

```typescript
// Default styles are for desktop
// Only add responsive modifiers for graceful degradation
className="flex gap-4 md:gap-2 sm:flex-col"
```

**Breakpoints:**
- Desktop: ≥1280px (primary target)
- Tablet: 768px-1279px (simplified layout)
- Mobile: <768px (reading only, no editing)

---

## Code Quality Standards

### TypeScript Requirements

```typescript
// ✅ REQUIRED: Explicit return types for functions
function calculateWordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// ✅ REQUIRED: Interface over type for objects
interface Character {
  id: string;
  name: string;
}

// ✅ REQUIRED: Const assertions for literals
const MODES = ['discuss', 'ghostwrite', 'framework'] as const;
type Mode = typeof MODES[number];

// ❌ FORBIDDEN: any type
function process(data: any) { } // NO!

// ✅ ALLOWED: unknown with type guards
function process(data: unknown) {
  if (isMessage(data)) {
    // safely use data as Message
  }
}
```

### Error Handling

```typescript
// ✅ REQUIRED: Explicit error handling
async function fetchCharacter(id: string): Promise<Character | null> {
  try {
    const response = await fetch(`/api/characters/${id}`);
    if (!response.ok) {
      console.error(`Failed to fetch character: ${response.status}`);
      return null;
    }
    return response.json();
  } catch (error) {
    console.error('Network error fetching character:', error);
    return null;
  }
}

// ❌ FORBIDDEN: Swallowed errors
async function fetchCharacter(id: string) {
  try {
    return await fetch(`/api/characters/${id}`).then(r => r.json());
  } catch {
    // Silent failure - NO!
  }
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `AICopilotPanel` |
| Functions | camelCase | `handleSendMessage` |
| Constants | SCREAMING_SNAKE | `MAX_MESSAGE_LENGTH` |
| CSS variables | kebab-case | `--vscode-button-background` |
| Files (components) | PascalCase | `AICopilotPanel.tsx` |
| Files (utilities) | kebab-case | `string-utils.ts` |
| Hooks | camelCase with use | `useCharacterData` |

---

## Prohibited Patterns

### Absolutely Forbidden

```typescript
// 1. ❌ FORBIDDEN: Inline styles
<div style={{ backgroundColor: '#1e1e1e' }}>

// 2. ❌ FORBIDDEN: any type
const data: any = fetchData();

// 3. ❌ FORBIDDEN: Non-VS Code colors
className="bg-blue-500"

// 4. ❌ FORBIDDEN: console.log in production
console.log('debug:', data);

// 5. ❌ FORBIDDEN: Magic numbers
if (messages.length > 50) { } // What is 50?
// ✅ USE: const MAX_MESSAGES = 50;

// 6. ❌ FORBIDDEN: Nested ternaries
{a ? (b ? x : y) : (c ? w : z)}

// 7. ❌ FORBIDDEN: Direct DOM manipulation
document.getElementById('editor').innerHTML = content;

// 8. ❌ FORBIDDEN: Non-null assertions without guard
const name = user!.name; // Dangerous!
// ✅ USE: const name = user?.name ?? 'Unknown';
```

### Code Smells to Refactor

| Smell | Solution |
|-------|----------|
| File > 300 lines | Split into modules |
| Function > 50 lines | Extract helper functions |
| Component > 7 props | Use composition or context |
| Repeated code (3+) | Extract to shared utility |
| Deep nesting (>3) | Early returns or extraction |
| Long import lists | Barrel exports or split component |

---

## Decision Framework

### When Adding a Feature

```
┌─────────────────────────────────────┐
│ 1. Is there a VS Code equivalent?   │
├──────────────┬──────────────────────┤
│     YES      │         NO           │
│      ↓       │          ↓           │
│ Copy pattern │ Is it essential for  │
│ exactly      │ fiction writing?     │
│              ├──────────┬───────────┤
│              │   YES    │    NO     │
│              │    ↓     │     ↓     │
│              │ Design   │  YAGNI    │
│              │ minimal  │  Skip it  │
│              │ solution │           │
└──────────────┴──────────┴───────────┘
```

### When Styling a Component

```
1. Can I use an existing VS Code class?
   → YES: Use it
   → NO: Continue

2. Can I use VS Code CSS variables?
   → YES: Use Tailwind with variables
   → NO: Add variable to vscode-layout.css first

3. Is this a one-off style?
   → YES: Tailwind arbitrary value with variable
   → NO: Create reusable class in vscode-layout.css
```

### When Choosing Architecture

```
Complexity needed?
├── Simple state → useState
├── Related state → useReducer  
├── Shared state → Context
├── Server state → React Query / SWR
├── Global app state → Zustand (last resort)
└── Form state → React Hook Form
```

---

## Appendix: Quick Reference

### Essential VS Code CSS Variables

```css
/* Copy this to any new component's comments for reference */

/* Backgrounds */
--vscode-editor-background: #1e1e1e
--vscode-sideBar-background: #252526
--vscode-activityBar-background: #333333
--vscode-input-background: #3c3c3c

/* Foregrounds */
--vscode-editor-foreground: #cccccc
--vscode-descriptionForeground: #8b8b8b
--vscode-input-placeholderForeground: #8b8b8b

/* Buttons */
--vscode-button-background: #0e639c
--vscode-button-foreground: #ffffff
--vscode-button-hoverBackground: #1177bb

/* Borders & Focus */
--vscode-focusBorder: #007fd4
--vscode-input-border: #3c3c3c
--vscode-panel-border: #80808059

/* List/Tree */
--vscode-list-activeSelectionBackground: #04395e
--vscode-list-hoverBackground: #2a2d2e
```

### Component Checklist

Before submitting any component:

- [ ] Uses VS Code CSS classes where applicable
- [ ] All colors use CSS variables
- [ ] No hardcoded colors in Tailwind
- [ ] TypeScript strict mode compliant
- [ ] No `any` types
- [ ] File is under 300 lines
- [ ] Functions are under 50 lines
- [ ] Props are under 7
- [ ] No console.log statements
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Accessibility attributes present (aria-*, role)
- [ ] Keyboard navigation works

---

## Function & Component Registry

> **Last Updated**: 2026-01-07  
> **Total Exports**: 350+ functions, components, hooks, and services

This registry documents all exported functions across the SpectreWeave6 codebase, organized by domain.

---

### 1. React Hooks (`src/hooks/`)

| Hook | File | Purpose |
|------|------|---------|
| `useAI` | `useAI.ts` | Primary AI integration hook |
| `useQuickAI` | `useAI.ts` | Simplified AI calls |
| `useAIChat` | `useAI.ts` | Chat-specific AI hook |
| `useAIChatSidebar` | `useAIChatSidebar.tsx` | AI sidebar state management |
| `useAIBorderEffects` | `useAIBorderEffects.ts` | AI activity border animations |
| `useManuscriptBorderEffects` | `useAIBorderEffects.ts` | Manuscript-specific borders |
| `useFrameworkBorderEffects` | `useAIBorderEffects.ts` | Framework-specific borders |
| `useAdaptiveAIEffects` | `useAIBorderEffects.ts` | Adaptive AI visual effects |
| `useBlockEditor` | `useBlockEditor.ts` | TipTap editor initialization |
| `useChapterNavigation` | `useChapterNavigation.ts` | Chapter/heading navigation |
| `useEditorContent` | `useEditorContent.ts` | Editor content management |
| `useFrameworkManager` | `useFrameworkManager.ts` | Story framework state |
| `useIDEProject` | `useIDEProject.ts` | Full IDE project management |
| `useLeftNavigation` | `useLeftNavigation.ts` | Left sidebar navigation |
| `useMobileResponsive` | `useMobileResponsive.ts` | Responsive breakpoints |
| `useProductionGhostText` | `useProductionGhostText.ts` | Production ghost text |
| `useAutoGhostText` | `useProductionGhostText.ts` | Auto-triggering ghost text |
| `useProject` | `useProjects.ts` | Single project data |
| `useProjectFilters` | `useProjects.ts` | Project filtering |
| `useSidebar` | `useSidebar.tsx` | Sidebar visibility |
| `useSidebarState` | `useSidebarState.ts` | Sidebar state machine |
| `useSmartSuggestions` | `useSmartSuggestions.ts` | AI-powered suggestions |
| `useTheme` | `useTheme.ts` | Theme switching |

#### Mobile & Responsive Hooks (`useMobileResponsive.ts`)

| Hook | Purpose |
|------|---------|
| `useBreakpoint` | Current breakpoint detection |
| `useTouchDevice` | Touch capability detection |
| `useSwipeGesture` | Swipe gesture handling |
| `useMobilePanels` | Mobile panel management |
| `useKeyboardVisibility` | Virtual keyboard detection |
| `useOrientation` | Device orientation |
| `usePreventBodyScroll` | Scroll lock utility |

---

### 2. IDE Components (`src/components/IDE/`)

#### Core IDE Shell

| Component | File | Purpose |
|-----------|------|---------|
| `IDEShell` | `IDEShell.tsx` | Main IDE layout container |
| `ActivityBar` | `ActivityBar/ActivityBar.tsx` | Left activity bar |
| `ActivityBarItem` | `ActivityBar/ActivityBarItem.tsx` | Activity bar icons |
| `StatusBar` | `StatusBar/StatusBar.tsx` | Bottom status bar |
| `BottomPanel` | `BottomPanel/BottomPanel.tsx` | Collapsible bottom panel |
| `CommandPalette` | `CommandPalette/CommandPalette.tsx` | Cmd+K command palette |

#### AI Copilot Panel (`AICopilotPanel/`)

| Export | File | Purpose |
|--------|------|---------|
| `AICopilotPanel` | `AICopilotPanel.tsx` | Main AI chat panel |
| `ModelSelector` | `ModelSelector.tsx` | AI model dropdown |
| `ToolsToolbar` | `ToolsToolbar.tsx` | Editor tools toolbar |
| `toolCallToEditOperation` | `editorTools.ts` | Convert tool calls to edits |
| `formatToolsForOpenRouter` | `editorTools.ts` | Format tools for API |
| `parseToolCallsFromResponse` | `editorTools.ts` | Parse tool call responses |
| `EDITOR_TOOLS` | `editorTools.ts` | Available editor tools |
| `GHOSTWRITE_SYSTEM_PROMPT` | `editorTools.ts` | Ghostwrite system prompt |
| `FUNCTION_CALLING_MODELS` | `editorTools.ts` | Models with function calling |
| `FREE_MODELS` | `types.ts` | Free AI model list |
| `DEFAULT_MODEL` | `types.ts` | Default AI model |

#### AI Agents (`AIAgents/`)

| Export | File | Purpose |
|--------|------|---------|
| `AgentProvider` | `context/AgentContext.tsx` | Agent context provider |
| `useAgents` | `context/AgentContext.tsx` | All agents hook |
| `useAgent` | `context/AgentContext.tsx` | Single agent hook |
| `ProductionAgentProvider` | `ProductionAgentProvider.tsx` | Production agent context |
| `useProductionAgents` | `ProductionAgentProvider.tsx` | Production agents hook |
| `useProductionAgent` | `ProductionAgentProvider.tsx` | Single production agent |
| `useAgentManager` | `hooks/useAgentManager.ts` | Agent lifecycle management |
| `getAgentConfig` | `AgentRegistry.ts` | Get agent configuration |
| `getAllAgents` | `AgentRegistry.ts` | Get all agent configs |
| `getAgentsByCategory` | `AgentRegistry.ts` | Filter by category |
| `getToolbarAgents` | `AgentRegistry.ts` | Toolbar-visible agents |
| `getBackgroundAgents` | `AgentRegistry.ts` | Background agents |
| `getAgentIds` | `AgentRegistry.ts` | All agent IDs |
| `buildAgentPrompt` | `AgentPromptBuilder.ts` | Build agent prompts |
| `formatFullPrompt` | `AgentPromptBuilder.ts` | Format complete prompt |
| `ConnectionStatusIndicator` | `ConnectionStatusIndicator.tsx` | Connection status UI |
| `StatusBarConnectionStatus` | `ConnectionStatusIndicator.tsx` | Status bar indicator |
| `ConnectionStatusPanel` | `ConnectionStatusIndicator.tsx` | Connection panel |

#### Framework Tools

| Component | File | Purpose |
|-----------|------|---------|
| `FrameworkWizard` | `FrameworkWizard/FrameworkWizard.tsx` | Story framework wizard |
| `FrameworkBuilder` | `FrameworkBuilder/FrameworkBuilder.tsx` | Framework builder UI |
| `FrameworkEditor` | `FrameworkEditor/FrameworkEditor.tsx` | Framework editing |
| `OutlineBuilder` | `OutlineBuilder/OutlineBuilder.tsx` | Story outline builder |
| `WorldBuildingPanel` | `WorldBuilding/WorldBuildingPanel.tsx` | World building tools |

#### Ghost Text (`GhostText/`)

| Export | File | Purpose |
|--------|------|---------|
| `useGhostText` | `hooks/useGhostText.ts` | Ghost text hook |
| `GhostTextOverlay` | `GhostTextOverlay.tsx` | Ghost text display |
| `InlineGhostText` | `GhostTextOverlay.tsx` | Inline ghost text |
| `StreamingGhostText` | `GhostTextOverlay.tsx` | Streaming ghost text |
| `DEFAULT_GHOST_TEXT_SETTINGS` | `types.ts` | Default settings |

#### Keyboard & Commands

| Export | File | Purpose |
|--------|------|---------|
| `commandRegistry` | `CommandPalette/CommandRegistry.ts` | Command registry singleton |
| `defaultCommands` | `CommandPalette/defaultCommands.ts` | Default commands |
| `shortcutManager` | `KeyboardShortcuts/ShortcutManager.ts` | Shortcut manager |
| `formatKeyBinding` | `KeyboardShortcuts/ShortcutManager.ts` | Format key binding |
| `matchesBinding` | `KeyboardShortcuts/ShortcutManager.ts` | Match keyboard event |
| `useKeyboardShortcuts` | `KeyboardShortcuts/hooks/useKeyboardShortcuts.ts` | Shortcuts hook |
| `AGENT_SHORTCUTS` | `KeyboardShortcuts/ShortcutManager.ts` | Agent shortcuts |
| `PANEL_SHORTCUTS` | `KeyboardShortcuts/ShortcutManager.ts` | Panel shortcuts |
| `DEFAULT_SHORTCUTS` | `KeyboardShortcuts/ShortcutManager.ts` | Default shortcuts |

#### Panels & Views

| Component | File | Purpose |
|-----------|------|---------|
| `NotesPanel` | `Notes/NotesPanel.tsx` | Notes sidebar |
| `AgentReviewsPanel` | `AgentReviews/AgentReviewsPanel.tsx` | Agent reviews |
| `usePanels` | `PanelSystem/PanelContext.tsx` | Panel management hook |
| `PANEL_CONSTRAINTS` | `PanelSystem/types.ts` | Panel size constraints |
| `useTheme` | `Theme/ThemeProvider.tsx` | IDE theme hook |

#### Story Explorer (`StoryExplorer/`)

| Export | File | Purpose |
|--------|------|---------|
| `getNodeIcon` | `StoryTreeNode.tsx` | Node type icons |
| `getStatusIcon` | `StoryTreeNode.tsx` | Status icons |
| `getStatusColor` | `StoryTreeNode.tsx` | Status colors |
| `getCompletionColor` | `StoryTreeNode.tsx` | Completion colors |

#### Editor Integration (`EditorIntegration/`)

| Export | File | Purpose |
|--------|------|---------|
| `useEditorAgentContext` | `hooks/useEditorAgentContext.ts` | Editor-agent context |
| `CONTEXT_BEFORE_LIMIT` | `types.ts` | Context char limit (before) |
| `CONTEXT_AFTER_LIMIT` | `types.ts` | Context char limit (after) |

---

### 3. Editor Components (`src/components/editor/`)

| Component | File | Purpose |
|-----------|------|---------|
| `AIWritingAssistant` | `AIWritingAssistant.tsx` | AI writing assistant |
| `ContentGenerator` | `ContentGenerator.tsx` | Content generation UI |
| `EnhancedWritingAnalytics` | `EnhancedWritingAnalytics.tsx` | Writing statistics |
| `WritingFeedback` | `WritingFeedback.tsx` | Writing feedback panel |
| `AdvancedFormatting` | `AdvancedFormatting.tsx` | Advanced formatting tools |
| `SaveButton` | `SaveButton.tsx` | Save with versioning |
| `VersionHistory` | `VersionHistory.tsx` | Version history UI |
| `SlashCommandsList` | `SlashCommandsList/SlashCommandsList.tsx` | Slash command UI |
| `AIToolbar` | `AIToolbar/AIToolbar.tsx` | AI toolbar |
| `CustomAIToolbar` | `AIToolbar/CustomAIToolbar.tsx` | Custom AI toolbar |
| `useAIToolbar` | `AIToolbar/AIToolbar.tsx` | AI toolbar hook |

#### Lazy Components (`LazyEditorComponents.tsx`)

| Export | Purpose |
|--------|---------|
| `LazyAIWritingAssistant` | Lazy-loaded AI assistant |
| `LazyAdvancedFormatting` | Lazy-loaded formatting |
| `LazyWritingAnalytics` | Lazy-loaded analytics |
| `EditorFeatures` | Feature flags |

---

### 4. Block Editor (`src/components/BlockEditor/`)

#### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| `BlockEditor` | `BlockEditor.tsx` | Main block editor |
| `ManuscriptSurface` | `components/ManuscriptSurface.tsx` | Manuscript editor surface |
| `FrameworkSurface` | `components/FrameworkSurface.tsx` | Framework editor surface |
| `MenuManager` | `components/MenuManager.tsx` | Menu management |
| `LazyMenuManager` | `components/LazyMenuManager.tsx` | Lazy-loaded menus |
| `OptimizedMenuManager` | `components/OptimizedMenuManager.tsx` | Optimized menus |
| `EditorInfo` | `components/EditorInfo.tsx` | Editor statistics |
| `FloatingTopToolbar` | `components/FloatingTopToolbar.tsx` | Floating toolbar |
| `BorderEffectsManager` | `components/BorderEffectsManager.tsx` | AI border effects |
| `ContextAwareEditorHeader` | `components/ContextAwareEditorHeader.tsx` | Context header |
| `ContextAwareSurfaces` | `components/ContextAwareSurfaces.tsx` | Context surfaces |
| `DualSurfaceView` | `components/ContextAwareSurfaces.tsx` | Dual surface view |

#### Concurrent Editor

| Export | File | Purpose |
|--------|------|---------|
| `ConcurrentDualEditor` | `components/ConcurrentDualEditor.tsx` | Concurrent dual editor |
| `ConcurrentSurfaceRenderer` | `components/ConcurrentDualEditor.tsx` | Concurrent surfaces |
| `ConcurrentMenuManager` | `components/ConcurrentDualEditor.tsx` | Concurrent menus |

#### Editor Contexts

| Export | File | Purpose |
|--------|------|---------|
| `useEditorContext` | `context/UnifiedEditorContext.tsx` | Editor context hook |
| `useEditors` | `context/UnifiedEditorContext.tsx` | Editors hook |
| `useViewState` | `context/UnifiedEditorContext.tsx` | View state hook |
| `useSidebars` | `context/UnifiedEditorContext.tsx` | Sidebars hook |
| `useDualEditor` | `context/DualEditorContext.tsx` | Dual editor hook |
| `useEditorState` | `context/SplitEditorContext.tsx` | Editor state |
| `useUIState` | `context/SplitEditorContext.tsx` | UI state |
| `useProjectContext` | `context/SplitEditorContext.tsx` | Project context |
| `useFrameworkContext` | `context/SplitEditorContext.tsx` | Framework context |
| `useRefsContext` | `context/SplitEditorContext.tsx` | Refs context |

#### Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useViewportOptimization` | `hooks/useViewportOptimization.ts` | Viewport optimization |
| `useBorderEffects` | `components/BorderEffectsManager.tsx` | Border effects hook |
| `useMemoryTracking` | `components/MemoryTracker.tsx` | Memory tracking |

---

### 5. UI Components (`src/components/ui/`)

#### Core UI

| Component | File | Purpose |
|-----------|------|---------|
| `Button` | `Button/Button.tsx` | Button component |
| `Input` | `Input/Input.tsx` | Input field |
| `Textarea` | `Textarea/Textarea.tsx` | Textarea |
| `Select` | `Select/Select.tsx` | Select dropdown |
| `Badge` | `Badge/Badge.tsx` | Badge/tag |
| `Spinner` | `Spinner/Spinner.tsx` | Loading spinner |
| `Loader` | `Loader/Loader.tsx` | Full-page loader |
| `LogoLoader` | `LogoLoader.tsx` | Branded loader |
| `Toggle` | `Toggle/Toggle.tsx` | Toggle switch |
| `Separator` | `Separator/Separator.tsx` | Divider |
| `Surface` | `Surface.tsx` | Surface container |
| `Icon` | `Icon.tsx` | Icon wrapper |
| `Avatar` | `Avatar/Avatar.tsx` | User avatar |
| `AvatarImage` | `Avatar/Avatar.tsx` | Avatar image |
| `AvatarFallback` | `Avatar/Avatar.tsx` | Avatar fallback |

#### Panel System

| Export | File | Purpose |
|--------|------|---------|
| `Panel` | `Panel/index.tsx` | Panel container |
| `PanelDivider` | `Panel/index.tsx` | Panel divider |
| `PanelHeader` | `Panel/index.tsx` | Panel header |
| `PanelSection` | `Panel/index.tsx` | Panel section |
| `PanelHeadline` | `Panel/index.tsx` | Panel headline |
| `PanelFooter` | `Panel/index.tsx` | Panel footer |

#### Dropdown & Popover

| Export | File | Purpose |
|--------|------|---------|
| `DropdownMenu` | `DropdownMenu/DropdownMenu.tsx` | Dropdown menu |
| `DropdownMenuTrigger` | `DropdownMenu/DropdownMenu.tsx` | Dropdown trigger |
| `DropdownMenuContent` | `DropdownMenu/DropdownMenu.tsx` | Dropdown content |
| `DropdownMenuItem` | `DropdownMenu/DropdownMenu.tsx` | Dropdown item |
| `DropdownMenuLabel` | `DropdownMenu/DropdownMenu.tsx` | Dropdown label |
| `DropdownMenuSeparator` | `DropdownMenu/DropdownMenu.tsx` | Dropdown separator |
| `DropdownCategoryTitle` | `Dropdown/Dropdown.tsx` | Category title |
| `DropdownButton` | `Dropdown/Dropdown.tsx` | Dropdown button |
| `Menu` | `PopoverMenu.tsx` | Popover menu |
| `Item` | `PopoverMenu.tsx` | Menu item |
| `CategoryTitle` | `PopoverMenu.tsx` | Category title |
| `Divider` | `PopoverMenu.tsx` | Menu divider |
| `Trigger` | `PopoverMenu.tsx` | Menu trigger |
| `Portal` | `PopoverMenu.tsx` | Menu portal |

#### Surface Switcher

| Export | File | Purpose |
|--------|------|---------|
| `SurfaceSwitcher` | `SurfaceSwitcher/SurfaceSwitcher.tsx` | Surface switcher |
| `FloatingSurfaceDock` | `SurfaceSwitcher/FloatingSurfaceDock.tsx` | Floating dock |

#### Error Handling

| Export | File | Purpose |
|--------|------|---------|
| `ErrorBoundary` | `ErrorBoundary.tsx` | Error boundary |
| `withErrorBoundary` | `ErrorBoundary.tsx` | HOC wrapper |
| `EditorErrorBoundary` | `EditorErrorBoundary.tsx` | Editor-specific boundary |

#### Modals

| Component | File | Purpose |
|-----------|------|---------|
| `FrameworkConfirmModal` | `FrameworkConfirmModal.tsx` | Framework confirmation |

---

### 6. Notion Editor (`src/components/NotionEditor/`)

| Component | File | Purpose |
|-----------|------|---------|
| `NotionEditor` | `NotionEditor.tsx` | Main Notion-style editor |
| `NotionToolbar` | `components/NotionToolbar.tsx` | Notion toolbar |
| `NotionSidebar` | `components/NotionSidebar.tsx` | Notion sidebar |
| `AIToolsPalette` | `components/AIToolsPalette.tsx` | AI tools palette |
| `BlockMenu` | `components/BlockMenu.tsx` | Block menu |
| `AIToolsGrid` | `components/AIToolsGrid/AIToolsGrid.tsx` | AI tools grid |
| `AIToolButton` | `components/AIToolsGrid/components/AIToolButton.tsx` | AI tool button |

#### AI Tools Grid Services

| Export | File | Purpose |
|--------|------|---------|
| `AIService` | `services/aiService.ts` | AI service class |
| `createAIService` | `services/aiService.ts` | Create AI service |
| `replaceSelectedText` | `services/aiService.ts` | Replace selected text |
| `insertAfterSelection` | `services/aiService.ts` | Insert after selection |
| `replaceParagraph` | `services/aiService.ts` | Replace paragraph |
| `OpenAIService` | `services/aiService.ts` | OpenAI service |
| `useTextSelection` | `hooks/useTextSelection.ts` | Text selection hook |
| `isSelectionWithinEditor` | `hooks/useTextSelection.ts` | Selection check |
| `getSelectionText` | `hooks/useTextSelection.ts` | Get selection text |

#### Positioning Utilities

| Export | File | Purpose |
|--------|------|---------|
| `calculateToolbarPosition` | `utils/positioning.ts` | Calculate toolbar position |
| `calculateSmartPosition` | `utils/positioning.ts` | Smart positioning |
| `wouldOverflow` | `utils/positioning.ts` | Overflow detection |
| `constrainToViewport` | `utils/positioning.ts` | Viewport constraint |
| `calculateAnimatedPosition` | `utils/positioning.ts` | Animated positioning |
| `getViewportInfo` | `utils/positioning.ts` | Viewport information |
| `isSelectionNearEdge` | `utils/positioning.ts` | Edge proximity check |

---

### 7. Menu Components (`src/components/menus/`)

| Component | File | Purpose |
|-----------|------|---------|
| `TextMenu` | `TextMenu/TextMenu.tsx` | Text formatting menu |
| `ContentItemMenu` | `ContentItemMenu/ContentItemMenu.tsx` | Content item menu |
| `LinkMenu` | `LinkMenu/LinkMenu.tsx` | Link editing menu |
| `EditLinkPopover` | `TextMenu/components/EditLinkPopover.tsx` | Link editor popover |
| `ContentTypePicker` | `TextMenu/components/ContentTypePicker.tsx` | Content type picker |
| `FontFamilyPicker` | `TextMenu/components/FontFamilyPicker.tsx` | Font family picker |
| `FontSizePicker` | `TextMenu/components/FontSizePicker.tsx` | Font size picker |

#### Menu Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useTextmenuContentTypes` | `TextMenu/hooks/useTextmenuContentTypes.ts` | Content types |
| `useTextmenuStates` | `TextMenu/hooks/useTextmenuStates.ts` | Menu states |
| `useTextmenuCommands` | `TextMenu/hooks/useTextmenuCommands.ts` | Menu commands |
| `useData` | `ContentItemMenu/hooks/useData.tsx` | Menu data |

---

### 8. Panel Components (`src/components/panels/`)

| Component | File | Purpose |
|-----------|------|---------|
| `ColorPicker` | `Colorpicker/Colorpicker.tsx` | Color picker |
| `ColorButton` | `Colorpicker/ColorButton.tsx` | Color button |
| `LinkEditorPanel` | `LinkEditorPanel/LinkEditorPanel.tsx` | Link editor |
| `useLinkEditorState` | `LinkEditorPanel/LinkEditorPanel.tsx` | Link editor state |
| `LinkPreviewPanel` | `LinkPreviewPanel/LinkPreviewPanel.tsx` | Link preview |

---

### 9. TipTap Extensions (`src/extensions/`)

#### Core Extensions

| Extension | File | Purpose |
|-----------|------|---------|
| `ExtensionKit` | `extension-kit.ts` | Main extension bundle |
| `ImageUpload` | `ImageUpload/ImageUpload.ts` | Image upload node |
| `ImageBlock` | `ImageBlock/ImageBlock.ts` | Image block node |
| `Table` | `Table/Table.ts` | Table extension |
| `TableCell` | `Table/Cell.ts` | Table cell node |
| `TableRow` | `Table/Row.ts` | Table row node |
| `TableHeader` | `Table/Header.ts` | Table header |
| `FeedbackBlock` | `FeedbackBlock/FeedbackBlock.ts` | Feedback block |

#### Ghost Text Extension

| Export | File | Purpose |
|--------|------|---------|
| `GhostTextExtension` | `GhostText/GhostTextExtension.ts` | Ghost text extension |
| `ghostTextPluginKey` | `GhostText/GhostTextExtension.ts` | Plugin key |
| `getGhostTextState` | `GhostText/GhostTextExtension.ts` | Get ghost text state |
| `useGhostTextTrigger` | `GhostText/useGhostTextTrigger.ts` | Ghost text trigger |

#### AI Slash Commands

| Export | File | Purpose |
|--------|------|---------|
| `AISlashCommands` | `AISlashCommands/AISlashCommands.tsx` | AI slash commands |
| `aiSlashCommandsPluginKey` | `AISlashCommands/AISlashCommands.tsx` | Plugin key |
| `SlashCommandList` | `AISlashCommands/AISlashCommands.tsx` | Command list UI |
| `DEFAULT_SLASH_COMMANDS` | `AISlashCommands/AISlashCommands.tsx` | Default commands |

#### Image Upload

| Export | File | Purpose |
|--------|------|---------|
| `ImageUpload` | `ImageUpload/view/ImageUpload.tsx` | Upload component |
| `ImageUploader` | `ImageUpload/view/ImageUploader.tsx` | Uploader UI |
| `useUploader` | `ImageUpload/view/hooks.ts` | Uploader hook |
| `useFileUpload` | `ImageUpload/view/hooks.ts` | File upload hook |
| `useDropZone` | `ImageUpload/view/hooks.ts` | Drop zone hook |

#### Table Utilities

| Export | File | Purpose |
|--------|------|---------|
| `isRectSelected` | `Table/utils.ts` | Rectangle selection check |
| `findTable` | `Table/utils.ts` | Find table in selection |
| `isCellSelection` | `Table/utils.ts` | Cell selection check |
| `isColumnSelected` | `Table/utils.ts` | Column selection check |
| `isRowSelected` | `Table/utils.ts` | Row selection check |
| `isTableSelected` | `Table/utils.ts` | Table selection check |
| `getCellsInColumn` | `Table/utils.ts` | Get cells in column |
| `getCellsInRow` | `Table/utils.ts` | Get cells in row |
| `isRowGripSelected` | `Table/menus/TableRow/utils.ts` | Row grip check |
| `TableRowMenu` | `Table/menus/TableRow/index.tsx` | Row menu |

#### Other Extensions

| Export | File | Purpose |
|--------|------|---------|
| `emojiSuggestion` | `EmojiSuggestion/suggestion.ts` | Emoji suggestions |
| `ImageBlockWidth` | `ImageBlock/components/ImageBlockWidth.tsx` | Image width control |
| `ImageBlockMenu` | `ImageBlock/components/ImageBlockMenu.tsx` | Image block menu |
| `FeedbackBlockComponent` | `FeedbackBlock/components/FeedbackBlockComponent.tsx` | Feedback UI |

---

### 10. Services (`src/services/`)

| Service | File | Purpose |
|---------|------|---------|
| `AIAgentService` | `AIAgentService.ts` | AI agent orchestration |
| `aiAgentService` | `AIAgentService.ts` | Singleton instance |
| `DeepResearchService` | `deepResearchService.ts` | Deep research service |
| `deepResearchService` | `deepResearchService.ts` | Singleton instance |
| `ResearchEventHandler` | `researchEventHandler.ts` | Research events |
| `researchEventHandler` | `researchEventHandler.ts` | Singleton instance |
| `WritingPromptsService` | `writingPrompts.ts` | Writing prompts |
| `writingPrompts` | `writingPrompts.ts` | Singleton instance |

---

### 11. Library Services (`src/lib/services/`)

| Service | File | Purpose |
|---------|------|---------|
| `AIService` | `ai.ts` | AI service class |
| `aiService` | `ai.ts` | AI service object |
| `AzureAIService` | `ai.ts` | Azure AI service |
| `GeminiService` | `ai.ts` | Gemini service |
| `DatabricksService` | `ai.ts` | Databricks service |
| `StabilityService` | `ai.ts` | Stability AI service |
| `AIFoundryService` | `ai.ts` | AI Foundry service |
| `OpenRouterService` | `openrouter.ts` | OpenRouter service |
| `AgentsRepo` | `agentsRepo.ts` | Agents repository |
| `agentsRepo` | `agentsRepo.ts` | Singleton instance |

---

### 12. AI Library (`src/lib/ai/`)

#### Core AI

| Export | File | Purpose |
|--------|------|---------|
| `AdvancedAIProvider` | `advancedAIContext.tsx` | Advanced AI context |
| `useAdvancedAI` | `advancedAIContext.tsx` | Advanced AI hook |
| `ResilientAIService` | `resilientAIService.ts` | Resilient AI service |
| `resilientAIService` | `resilientAIService.ts` | Singleton instance |
| `DualSurfaceContextManager` | `dualSurfaceContextManager.ts` | Dual surface context |
| `dualSurfaceContextManager` | `dualSurfaceContextManager.ts` | Singleton instance |
| `DEFAULT_FUSION_CONFIG` | `dualSurfaceContextManager.ts` | Default fusion config |

#### AI Types & Utilities

| Export | File | Purpose |
|--------|------|---------|
| `isAIError` | `types.ts` | Type guard for AI errors |
| `isAIResponse` | `types.ts` | Type guard for responses |
| `hasStreamingCapability` | `types.ts` | Check streaming capability |
| `callOpenRouterWithFallback` | `openrouter-utils.ts` | OpenRouter with fallback |
| `handleAIError` | `openrouter-utils.ts` | Error handling |
| `FREE_MODELS` | `openrouter-utils.ts` | Free models list |
| `POWER_MODELS` | `openrouter-utils.ts` | Power models list |

#### Text Insertion

| Export | File | Purpose |
|--------|------|---------|
| `getTargetEditor` | `textInsertion.ts` | Get target editor |
| `getAvailableSurfaces` | `textInsertion.ts` | Get available surfaces |
| `getSurfaceLabel` | `textInsertion.ts` | Get surface label |
| `insertTextIntoSurface` | `textInsertion.ts` | Insert text |
| `getInsertionModeLabel` | `textInsertion.ts` | Get mode label |
| `getInsertionModeIcon` | `textInsertion.ts` | Get mode icon |

#### Prompt Templates

| Export | File | Purpose |
|--------|------|---------|
| `PROMPT_TEMPLATES` | `promptTemplates.ts` | Prompt templates |
| `CONTEXTUAL_PROMPTS` | `promptTemplates.ts` | Contextual prompts |
| `promptEngine` | `promptTemplates.ts` | Prompt engine |
| `WRITING_STYLES` | `promptTemplates.ts` | Writing styles |
| `CONTENT_TYPES` | `promptTemplates.ts` | Content types |

#### Monitoring & Testing

| Export | File | Purpose |
|--------|------|---------|
| `AIMonitoringService` | `aiMonitoring.ts` | AI monitoring |
| `aiMonitoring` | `aiMonitoring.ts` | Singleton instance |
| `AIIntegrationTester` | `aiMonitoring.ts` | Integration tester |
| `aiTester` | `aiMonitoring.ts` | Singleton instance |

#### RAG System

| Export | File | Purpose |
|--------|------|---------|
| `ragSystem` | `ragSystem.ts` | RAG system singleton |

---

### 13. Utility Libraries (`src/lib/utils/`)

| Export | File | Purpose |
|--------|------|---------|
| `cn` | `index.ts` | Class name merger |
| `randomElement` | `index.ts` | Random array element |
| `markdownToHtml` | `markdownToHtml.ts` | Markdown to HTML |
| `getConnectionText` | `getConnectionText.ts` | Connection text |
| `isTextSelected` | `isTextSelected.ts` | Text selection check |
| `getRenderContainer` | `getRenderContainer.ts` | Render container |
| `cssVar` | `cssVar.ts` | CSS variable utility |
| `isTableGripSelected` | `isCustomNodeSelected.ts` | Table grip check |
| `isCustomNodeSelected` | `isCustomNodeSelected.ts` | Custom node check |
| `setupConsoleFilters` | `console-warnings.ts` | Console filtering |
| `restoreConsole` | `console-warnings.ts` | Restore console |

#### Cost Tracking

| Export | File | Purpose |
|--------|------|---------|
| `AI_PRICING` | `cost-tracking.ts` | AI pricing data |
| `CostTracker` | `cost-tracking.ts` | Cost tracking class |
| `costTracker` | `cost-tracking.ts` | Singleton instance |
| `BudgetManager` | `cost-tracking.ts` | Budget management |
| `budgetManager` | `cost-tracking.ts` | Singleton instance |

#### Database

| Export | File | Purpose |
|--------|------|---------|
| `createQuery` | `database.ts` | Create database query |
| `createTransaction` | `database.ts` | Create transaction |

#### Editor Memory

| Export | File | Purpose |
|--------|------|---------|
| `EditorMemoryManager` | `editorMemoryManager.ts` | Memory manager |
| `editorMemoryManager` | `editorMemoryManager.ts` | Singleton instance |
| `useEditorMemoryTracking` | `editorMemoryManager.ts` | Memory tracking hook |

#### Bundle Optimization

| Export | File | Purpose |
|--------|------|---------|
| `BundleAnalyzer` | `bundleOptimizer.ts` | Bundle analyzer |
| `bundleAnalyzer` | `bundleOptimizer.ts` | Singleton instance |
| `webpackBundleConfig` | `bundleOptimizer.ts` | Webpack config |
| `trackedDynamicImport` | `bundleOptimizer.ts` | Tracked dynamic import |
| `optimizedTipTapImports` | `bundleOptimizer.ts` | TipTap imports |
| `cssOptimizations` | `bundleOptimizer.ts` | CSS optimizations |
| `PerformanceBudget` | `bundleOptimizer.ts` | Performance budget |
| `performanceBudget` | `bundleOptimizer.ts` | Singleton instance |

---

### 14. Performance (`src/lib/performance/`)

#### Core Performance

| Export | File | Purpose |
|--------|------|---------|
| `debounce` | `index.ts` | Debounce function |
| `throttle` | `index.ts` | Throttle function |
| `createIntersectionObserver` | `index.ts` | Intersection observer |
| `createWebWorker` | `index.ts` | Web worker creator |
| `requestIdleCallback` | `index.ts` | Idle callback |
| `createObjectPool` | `index.ts` | Object pool |
| `calculateVirtualItems` | `index.ts` | Virtual list items |
| `PerformanceMonitor` | `index.ts` | Performance monitor |
| `performanceMonitor` | `index.ts` | Singleton instance |
| `loadChunk` | `index.ts` | Chunk loader |
| `addResourceHints` | `index.ts` | Resource hints |
| `initializePerformanceOptimizations` | `index.ts` | Init optimizations |

#### React Performance

| Export | File | Purpose |
|--------|------|---------|
| `useDebounce` | `ReactPerformance.ts` | Debounced callback hook |
| `useDebouncedValue` | `ReactPerformance.ts` | Debounced value hook |
| `useThrottle` | `ReactPerformance.ts` | Throttled callback hook |
| `useStableCallback` | `ReactPerformance.ts` | Stable callback hook |
| `usePrevious` | `ReactPerformance.ts` | Previous value hook |
| `shallowEqual` | `ReactPerformance.ts` | Shallow equality check |
| `useMemoCompare` | `ReactPerformance.ts` | Memo with compare |
| `useStableObject` | `ReactPerformance.ts` | Stable object hook |
| `useUpdateEffect` | `ReactPerformance.ts` | Update-only effect |
| `useBatchedUpdates` | `ReactPerformance.ts` | Batched updates hook |
| `useRenderCount` | `ReactPerformance.ts` | Render count debug |
| `withDisplayName` | `ReactPerformance.ts` | HOC display name |

#### Lazy Extensions

| Export | File | Purpose |
|--------|------|---------|
| `LazyExtensionManager` | `LazyExtensionLoader.ts` | Lazy extension manager |
| `lazyExtensionManager` | `LazyExtensionLoader.ts` | Singleton instance |
| `createLazyExtension` | `LazyExtensionLoader.ts` | Create lazy extension |
| `LAZY_EXTENSIONS` | `LazyExtensionLoader.ts` | Lazy extension configs |

---

### 15. Accessibility (`src/lib/accessibility/`)

| Export | File | Purpose |
|--------|------|---------|
| `useAnnouncer` | `index.tsx` | Screen reader announcer |
| `useFocusTrap` | `index.tsx` | Focus trap hook |
| `useRovingTabindex` | `index.tsx` | Roving tabindex |
| `usePrefersReducedMotion` | `index.tsx` | Reduced motion pref |
| `usePrefersHighContrast` | `index.tsx` | High contrast pref |
| `SkipToContent` | `index.tsx` | Skip to content link |
| `useAriaId` | `index.tsx` | ARIA ID generator |
| `AccessibleButtonGroup` | `index.tsx` | Button group a11y |
| `getAgentStatusDescription` | `index.tsx` | Agent status for SR |
| `getProblemsDescription` | `index.tsx` | Problems for SR |
| `useKeyboardFocus` | `index.tsx` | Keyboard focus hook |

---

### 16. Middleware (`src/lib/middleware/`)

#### Rate Limiting

| Export | File | Purpose |
|--------|------|---------|
| `AI_RATE_LIMITS` | `rate-limit.ts` | Rate limit configs |
| `createRateLimit` | `rate-limit.ts` | Create rate limiter |
| `textGenerationRateLimit` | `rate-limit.ts` | Text gen rate limit |
| `imageGenerationRateLimit` | `rate-limit.ts` | Image gen rate limit |
| `streamingRateLimit` | `rate-limit.ts` | Streaming rate limit |
| `chatCompletionRateLimit` | `rate-limit.ts` | Chat rate limit |
| `healthCheckRateLimit` | `rate-limit.ts` | Health check limit |
| `dailyRateLimit` | `rate-limit.ts` | Daily rate limit |
| `createCompositeRateLimit` | `rate-limit.ts` | Composite limiter |
| `withRateLimit` | `rate-limit.ts` | Rate limit wrapper |

#### Authentication

| Export | File | Purpose |
|--------|------|---------|
| `getAuthenticatedUser` | `auth.ts` | Get authenticated user |
| `getUserProjectPermissions` | `auth.ts` | Get project permissions |
| `createAuthContext` | `auth.ts` | Create auth context |
| `requireAuth` | `auth.ts` | Require authentication |
| `requireProjectAccess` | `auth.ts` | Require project access |
| `requireSubscriptionTier` | `auth.ts` | Require subscription |
| `rateLimit` | `auth.ts` | Rate limit middleware |
| `combineMiddleware` | `auth.ts` | Combine middlewares |
| `createProtectedRoute` | `auth.ts` | Create protected route |

---

### 17. Supabase (`src/lib/supabase/`)

| Export | File | Purpose |
|--------|------|---------|
| `createClient` | `client.ts` | Browser client |
| `createClient` | `server.ts` | Server client |
| `createClientWithAuth` | `server.ts` | Auth client |
| `createServiceRoleClient` | `server.ts` | Service role client |
| `createServiceClient` | `service.ts` | Service client |
| `updateSession` | `middleware.ts` | Session middleware |

---

### 18. Contexts (`src/contexts/`)

| Export | File | Purpose |
|--------|------|---------|
| `EditorContext` | `EditorContext.ts` | Editor context |
| `useEditorContext` | `EditorContext.ts` | Editor context hook |
| `EditorProvider` | `EditorProvider.tsx` | Editor provider |
| `AIProvider` | `AIContext.tsx` | AI context provider |
| `useAIContext` | `AIContext.tsx` | AI context hook |

---

### 19. API Routes (`src/app/api/`)

#### AI Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ai/generate` | POST | Text generation |
| `/api/ai/chat` | POST | Chat completion |
| `/api/ai/stream` | POST | Streaming response |
| `/api/ai/ghostwrite` | POST | Ghost writing |
| `/api/ai/health` | GET, POST | AI health check |
| `/api/ai/outline/generate` | POST | Outline generation |
| `/api/ai/agents/review` | GET, POST | Agent reviews |
| `/api/ai/framework/chat` | POST | Framework chat |
| `/api/ai/framework/wizard` | POST | Framework wizard |
| `/api/ai/framework/import` | POST | Framework import |

#### Bridge Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/bridge/generate-text` | POST | Text generation |
| `/api/bridge/health` | GET | Bridge health |
| `/api/bridge/novel-framework` | GET, POST | Novel framework |
| `/api/bridge/chapter-generation/[id]/export` | GET | Export chapter |
| `/api/bridge/style-profiles/generate` | POST | Generate style |
| `/api/bridge/ai/provider-health` | GET | Provider health |
| `/api/bridge/ai/provider-analytics` | GET | Provider analytics |
| `/api/bridge/ai/generate-intelligent` | POST | Intelligent gen |
| `/api/bridge/ai/cost-optimization` | GET | Cost optimization |

#### GraphRAG Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/bridge/graphrag/status` | GET | GraphRAG status |
| `/api/bridge/graphrag/search` | POST | GraphRAG search |
| `/api/bridge/graphrag/ingest-framework` | POST | Ingest framework |
| `/api/bridge/graphrag/ingest-all` | POST | Ingest all |
| `/api/bridge/graphrag/character/search` | POST | Character search |
| `/api/bridge/graphrag/character/update` | POST | Update character |
| `/api/bridge/graphrag/character/initialize` | POST | Init character |

#### Neo4j Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/bridge/neo4j/health` | GET | Neo4j health |
| `/api/bridge/neo4j/status` | GET | Neo4j status |
| `/api/bridge/neo4j/constraints` | GET | Constraints |
| `/api/bridge/neo4j/indexes` | GET | Indexes |

#### RAG Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/bridge/rag/stats` | GET | RAG statistics |

#### Auth Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/sign-out` | POST | Sign out |
| `/api/bridge/auth/login` | POST | Login |
| `/api/bridge/auth/register` | POST | Register |

#### Other Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/projects` | GET, POST | Projects CRUD |
| `/api/rooms/new` | POST | Create room |
| `/api/collaboration` | POST | Collaboration |

---

### 20. Netlify Functions (`netlify/functions/`)

| Function | File | Purpose |
|----------|------|---------|
| `handler` | `ai/openrouter.ts` | OpenRouter proxy |
| `handler` | `children-books/generate-images.ts` | Image generation |
| `handler` | `characters/profiles/[id].ts` | Character profiles |

---

### 21. Portal Components (`src/components/portal/`)

| Component | File | Purpose |
|-----------|------|---------|
| `PortalLayout` | `PortalLayout.tsx` | Portal layout |
| `AuthGuard` | `AuthGuard.tsx` | Auth protection |
| `CommandPalette` | `CommandPalette.tsx` | Portal command palette |
| `BridgeStatus` | `BridgeStatus.tsx` | Bridge status |
| `ThemeToggle` | `ThemeToggle.tsx` | Theme toggle |
| `TabbedNav` | `TabbedNav.tsx` | Tabbed navigation |
| `GenerationPipelineWidget` | `GenerationPipelineWidget.tsx` | Generation pipeline |
| `ActiveGenerationStream` | `ActiveGenerationStream.tsx` | Active generation |
| `ProjectContextProvider` | `ProjectContextProvider.tsx` | Project context |
| `useProjectContext` | `ProjectContextProvider.tsx` | Project context hook |
| `usePortalNavigation` | `hooks/usePortalNavigation.ts` | Portal navigation |
| `useToast` | `ui/toast.tsx` | Toast notifications |
| `ToastProvider` | `ui/toast.tsx` | Toast provider |

---

### 22. Project Components (`src/components/projects/`)

| Component | File | Purpose |
|-----------|------|---------|
| `ProjectsDashboard` | `ProjectsDashboard.tsx` | Projects dashboard |
| `ProjectTable` | `ProjectTable.tsx` | Projects table |
| `ProjectCard` | `ProjectCard.tsx` | Project card |
| `ProjectFilters` | `ProjectFilters.tsx` | Project filters |
| `ProjectModal` | `ProjectModal.tsx` | Project modal |
| `DashboardLayout` | `DashboardLayout.tsx` | Dashboard layout |

---

### 23. Auth Components (`src/components/auth/`)

| Component | File | Purpose |
|-----------|------|---------|
| `AuthButton` | `AuthButton.tsx` | Auth button |
| `IconAuthButton` | `IconAuthButton.tsx` | Icon auth button |
| `LoginForm` | `LoginForm.tsx` | Login form |

---

### 24. Layout Components (`src/components/layout/`)

| Component | File | Purpose |
|-----------|------|---------|
| `ClientLayout` | `ClientLayout.tsx` | Client-side layout |
| `EditorAppHeader` | `EditorAppHeader.tsx` | Editor header |

---

### 25. Other Components

| Component | File | Purpose |
|-----------|------|---------|
| `AIChatSidebar` | `AIChatSidebar/AIChatSidebar.tsx` | AI chat sidebar |
| `ChatMessage` | `AIChatSidebar/components/ChatMessage.tsx` | Chat message |
| `ChatInterface` | `AIChatSidebar/components/ChatInterface.tsx` | Chat interface |
| `ChatInput` | `AIChatSidebar/components/ChatInput.tsx` | Chat input |
| `ChapterNavigationPanel` | `ChapterNavigation/ChapterNavigationPanel.tsx` | Chapter nav |
| `LeftNavigation` | `LeftNavigation/` | Left navigation |
| `NavigationItem` | `LeftNavigation/NavigationItem.tsx` | Nav item |
| `ProjectIndicator` | `LeftNavigation/ProjectIndicator.tsx` | Project indicator |
| `Sidebar` | `Sidebar/Sidebar.tsx` | Generic sidebar |
| `TableOfContents` | `TableOfContents/TableOfContents.tsx` | TOC |

---

### 26. Agents Store (`src/lib/agents/`)

| Export | File | Purpose |
|--------|------|---------|
| `agentStore` | `agentStore.ts` | Agent store singleton |

---

### 27. Constants & Data (`src/lib/`)

| Export | File | Purpose |
|--------|------|---------|
| `userNames` | `constants.tsx` | Collaboration usernames |
| `userColors` | `constants.tsx` | User colors |
| `themeColors` | `constants.tsx` | Theme colors |
| `emptyContent` | `data/emptyContent.tsx` | Empty document |
| `emptyFrameworkContent` | `data/emptyContent.tsx` | Empty framework |
| `initialContent` | `data/initialContent.tsx` | Initial content |

---

### 28. API Response Utilities (`src/lib/utils/`)

| Export | File | Purpose |
|--------|------|---------|
| `HttpStatus` | `api-response.ts` | HTTP status codes |
| `ErrorMessages` | `api-response.ts` | Error messages |

---

### 29. Shims (`src/shims/`)

| Export | File | Purpose |
|--------|------|---------|
| `WebSocketStatus` | `hocuspocus-provider.ts` | WebSocket status |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Initial constitution |
| 1.1.0 | 2026-01-07 | Added complete function registry |
| 1.2.0 | 2026-01-07 | Added active specifications section |

---

## Active Specifications

> **Important**: Always consult these specifications before making IDE changes.

### VS Code IDE Rework

**Goal**: Rework SpectreWeave6's manuscript IDE to be visually and functionally indistinguishable from VS Code.

| Document | Purpose |
|----------|---------|
| `SPECS/VSCODE_IDE_REWORK.md` | Master specification with component designs |
| `SPECS/REFERENCE_IMAGE_ANALYSIS.md` | Detailed breakdown of reference image |
| `SPECS/VSCODE_IDE_TASKS.md` | Implementation task checklist |

### Reference Image

**File**: `image-1767821174386.png`

This image shows the target VS Code layout and should be referenced frequently during implementation. Key elements captured:

```
┌────────────────────────────────────────────────────────────┐
│ Activity Bar │ Primary Sidebar │ Editor + Tabs │ AI Panel │
│    (48px)    │    (~250px)     │   (flexible)  │ (~300px) │
├──────────────┴─────────────────┴───────────────┴──────────┤
│                    Bottom Panel                           │
├───────────────────────────────────────────────────────────┤
│                    Status Bar (22px)                      │
└───────────────────────────────────────────────────────────┘
```

### Implementation Phases

| Phase | Focus | Duration |
|-------|-------|----------|
| Phase 1 | Core Layout Shell | 3-4 days |
| Phase 2 | Tab System | 2-3 days |
| Phase 3 | Primary Sidebar | 4-5 days |
| Phase 4 | Editor Enhancements | 3-4 days |
| Phase 5 | AI Copilot Panel | 3-4 days |
| Phase 6 | Polish & Integration | 3-4 days |

### Key Dimensions (from VS Code)

| Element | Size |
|---------|------|
| Activity Bar | 48px wide |
| Tab Bar | 35px height |
| Status Bar | 22px height |
| Sidebar min | 170px |
| Sidebar max | 500px |
| Panel min | 100px |

---

*This constitution is a living document. Propose changes via PR with justification.*
