# SpectreWeave6 Development Constitution

> **Mission**: Build the VS Code of fiction writing — a professional-grade creative writing IDE powered by modern React patterns, TypeScript excellence, and AI-assisted authorship.

**Version**: 2.0.0 | **Date**: 2026-01-10

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
13. [Decision Framework](#decision-framework)

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
  // Fetches data, validates, manages form, handles API, renders UI
  const { data: characters } = useQuery('characters', fetchCharacters);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [name, setName] = useState('');
  const handleSave = async () => { /* ... */ };
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
    <button className={cn('vscode-button', variantStyles[variant])} {...props} />
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
  return api.save(editor.getContent());
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
    return await openai.completions.create({ /* ... */ });
  }
}

class AnthropicProvider implements AIProvider {
  async complete(prompt: string) {
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

1. **Children Prop**: Most flexible
   ```typescript
   <Panel><PanelHeader /><PanelContent /></Panel>
   ```

2. **Render Props**: Dynamic composition
   ```typescript
   <DataProvider render={(data) => <CharacterList data={data} />} />
   ```

3. **Custom Hooks** (preferred):
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
  const { data: characters } = await supabase.from('characters').select('*');
  
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

**Route Handlers (API Routes):**

```typescript
// app/api/characters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.from('characters').select('*');
    
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
  const subscription = api.subscribeToCharacterUpdates(characterId, (data) => {
    setCharacter(data);
  });
  
  return () => subscription.unsubscribe();
}, [characterId]);

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
- ✅ Use optimistic updates for instant UI feedback
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

---

## TypeScript Standards

### Strict Mode Configuration

**SpectreWeave6 uses TypeScript in strict mode. No exceptions.**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Type Definitions

#### Interfaces vs Types

```typescript
// ✅ PREFER: Interfaces for object shapes (extensible)
interface Character {
  id: string;
  name: string;
  backstory: string;
}

// Can be extended
interface DetailedCharacter extends Character {
  relationships: Relationship[];
  referenceImages: ReferenceImage[];
}

// ✅ USE: Types for unions, intersections, primitives
type CharacterId = string;
type AIModel = 'gpt-4' | 'claude-3' | 'claude-sonnet';
type Result<T> = { success: true; data: T } | { success: false; error: string };

// ✅ USE: Types for mapped/conditional types
type Readonly<T> = { readonly [P in keyof T]: T[P] };
```

#### Explicit Return Types

```typescript
// ✅ RIGHT: Explicit return types for functions
function calculateWordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

async function fetchCharacter(id: string): Promise<Character | null> {
  const response = await fetch(`/api/characters/${id}`);
  if (!response.ok) return null;
  return response.json();
}

// ✅ RIGHT: Explicit return types for React components
function CharacterCard({ character }: { character: Character }): JSX.Element {
  return <div>{character.name}</div>;
}
```

#### Const Assertions

```typescript
// ✅ RIGHT: Use const assertions for literal types
const AI_MODELS = ['gpt-4', 'claude-3-opus', 'claude-3-sonnet'] as const;
type AIModel = typeof AI_MODELS[number];

const PANEL_MODES = {
  DISCUSS: 'discuss',
  GHOSTWRITE: 'ghostwrite',
  FRAMEWORK: 'framework'
} as const;
type PanelMode = typeof PANEL_MODES[keyof typeof PANEL_MODES];
```

### Type Guards

```typescript
// ✅ RIGHT: Type guards for runtime type checking
function isCharacter(value: unknown): value is Character {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof value.id === 'string' &&
    typeof value.name === 'string'
  );
}

// Usage
function processData(data: unknown) {
  if (isCharacter(data)) {
    console.log(data.name); // TypeScript knows data is Character
  }
}
```

### Avoiding `any`

```typescript
// ❌ FORBIDDEN: Using any
function process(data: any) {
  return data.value; // No type safety!
}

// ✅ RIGHT: Use unknown and type guards
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: unknown }).value;
  }
  throw new Error('Invalid data structure');
}

// ✅ BETTER: Define proper types
interface DataWithValue {
  value: string;
}

function process(data: DataWithValue) {
  return data.value; // Type-safe!
}
```

### Utility Types

```typescript
// ✅ RIGHT: Use built-in utility types

// Partial: Make all properties optional
type PartialCharacter = Partial<Character>;

// Pick: Select specific properties
type CharacterSummary = Pick<Character, 'id' | 'name'>;

// Omit: Exclude specific properties
type CharacterWithoutId = Omit<Character, 'id'>;

// Record: Create object type with specific keys
type CharacterMap = Record<string, Character>;

// ReturnType: Extract return type
type CharacterReturnType = ReturnType<typeof getCharacter>;

// Awaited: Unwrap Promise type
type Character = Awaited<ReturnType<typeof fetchCharacter>>;
```

---

## Component Architecture

### Component Structure Template

Every component MUST follow this structure:

```typescript
// 1. Imports (grouped and ordered)
// 1a. React & Next.js
import { useState, useCallback } from 'react';
import Link from 'next/link';

// 1b. External libraries
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// 1c. Internal components
import { Button } from '@/components/ui/button';

// 1d. Hooks & utilities
import { useCharacters } from '@/hooks/useCharacters';

// 1e. Types
import type { Character } from '@/types/character';

// 2. Constants (if component-specific)
const MAX_CHARACTERS = 50;

// 3. Types/Interfaces (if component-specific)
interface CharacterListProps {
  userId: string;
  onSelect?: (character: Character) => void;
}

// 4. Component Definition
export function CharacterList({ userId, onSelect }: CharacterListProps) {
  // 4a. Hooks
  const [selected, setSelected] = useState<string | null>(null);
  const { characters, loading, error } = useCharacters(userId);
  
  // 4b. Event handlers
  const handleSelect = useCallback((character: Character) => {
    setSelected(character.id);
    onSelect?.(character);
  }, [onSelect]);
  
  // 4c. Early returns
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  // 4d. Main render
  return (
    <div className="monaco-list">
      {characters.map(character => (
        <CharacterListItem
          key={character.id}
          character={character}
          onClick={() => handleSelect(character)}
        />
      ))}
    </div>
  );
}
```

### Component Size Guidelines

| Metric | Limit | Action if Exceeded |
|--------|-------|-------------------|
| **Lines of code** | 300 | Split into smaller components |
| **Props** | 7 | Use composition or config object |
| **useState calls** | 5 | Use useReducer or lift state up |
| **useEffect calls** | 3 | Review side effect logic |
| **Nesting depth** | 3 | Extract nested JSX to components |

### Component Naming

**Pattern**: `[Domain][Descriptor][Type].tsx`

```typescript
// ✅ RIGHT: Clear, descriptive names
CharacterListItem.tsx      // Domain: Character, Type: List Item
AICopilotPanel.tsx         // Domain: AI, Descriptor: Copilot, Type: Panel
EditorToolbar.tsx          // Domain: Editor, Type: Toolbar

// ❌ WRONG: Vague names
Item.tsx          // What kind of item?
Panel.tsx         // Which panel?
Component.tsx     // Too generic
```

---

## State Management Strategy

### State Classification

```
┌─────────────────────────────────────────────┐
│           APPLICATION STATE                 │
├─────────────────┬───────────────────────────┤
│  SERVER STATE   │     CLIENT STATE          │
├─────────────────┼──────────────┬────────────┤
│ - Characters    │ UI State     │ Form State │
│ - Documents     │ - isOpen     │ - inputs   │
│ - AI messages   │ - selected   │ - errors   │
│ - User profile  │ - theme      │ - touched  │
├─────────────────┼──────────────┼────────────┤
│ React Query     │ useState     │ useState   │
│ (TanStack)      │ Context      │ useReducer │
└─────────────────┴──────────────┴────────────┘
```

### Server State (React Query)

**Use React Query for ALL server data.**

```typescript
// ✅ RIGHT: React Query for server state
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useCharacters(userId: string) {
  return useQuery({
    queryKey: ['characters', userId],
    queryFn: async () => {
      const response = await fetch(`/api/characters?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function useCreateCharacter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (character: NewCharacter) => {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character)
      });
      if (!response.ok) throw new Error('Failed to create');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    }
  });
}
```

### UI State (useState/Context)

**Keep UI state local when possible, lift to context when shared.**

```typescript
// ✅ RIGHT: Local state for component-specific UI
function CharacterPanel() {
  const [selected, setSelected] = useState<string | null>(null);
  return <CharacterList selected={selected} onSelect={setSelected} />;
}

// ✅ RIGHT: Context for globally shared UI state
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### State Location Decision Tree

```
Is this data from the server?
├─ YES → Use React Query
└─ NO → Is it shared across many components?
    ├─ YES → Use Context
    └─ NO → Is it complex (>3 related values)?
        ├─ YES → Use useReducer
        └─ NO → Use useState
```

---

## Performance & Optimization

### React Performance Rules

1. **Default to React's built-in performance**
2. **Measure before optimizing**
3. **Optimize only hot paths**

### Code Splitting

```typescript
// ✅ RIGHT: Code split large features
import dynamic from 'next/dynamic';

const FrameworkWizard = dynamic(() => import('@/components/FrameworkWizard'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
```

### Memoization

```typescript
// ✅ RIGHT: Memoize expensive computations
const sortedCharacters = useMemo(() => {
  return characters.sort((a, b) => a.name.localeCompare(b.name));
}, [characters]);

// ✅ RIGHT: Memoize callbacks to prevent re-renders
const handleSelect = useCallback((id: string) => {
  setSelected(id);
  onSelect?.(id);
}, [onSelect]);

// ✅ RIGHT: Memo components with complex props
export const CharacterListItem = memo(function CharacterListItem({ character }: Props) {
  return <div>{character.name}</div>;
});
```

### Image Optimization

```typescript
// ✅ RIGHT: Use Next.js Image component
import Image from 'next/image';

function CharacterAvatar({ character }: Props) {
  return (
    <Image
      src={character.imageUrl}
      alt={character.name}
      width={48}
      height={48}
      priority={false}
    />
  );
}
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
className="bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)]"

// ❌ FORBIDDEN: Hardcoded colors
className="bg-blue-500 text-white"

// ❌ FORBIDDEN: Arbitrary color values
className="bg-[#1e1e1e]"
```

### VS Code Color System

**MANDATORY**: All colors must use CSS variables from the VS Code theme:

```css
/* Primary backgrounds */
--vscode-editor-background
--vscode-sideBar-background
--vscode-activityBar-background
--vscode-panel-background

/* Text colors */
--vscode-editor-foreground
--vscode-sideBar-foreground
--vscode-descriptionForeground

/* Interactive states */
--vscode-button-background
--vscode-button-hoverBackground
--vscode-focusBorder
--vscode-list-activeSelectionBackground
```

**NEVER** hardcode colors:
```typescript
// ❌ WRONG
className="bg-[#1e1e1e] text-[#cccccc]"

// ✅ RIGHT
className="bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)]"
```

### Responsive Design

SpectreWeave6 is **desktop-first** (like VS Code):

```typescript
// Default styles are for desktop
className="flex gap-4 md:gap-2 sm:flex-col"
```

**Breakpoints:**
- Desktop: ≥1280px (primary target)
- Tablet: 768px-1279px (simplified layout)
- Mobile: <768px (reading only, no editing)

---

## Testing Philosophy

### Testing Pyramid

```
    /\        Unit Tests (70%)
   /  \       - Pure functions
  /────\      - Utilities
 / E2E  \     - Type guards
/────────\    
│  Int.  │    Integration Tests (20%)
│ Tests  │    - Component + hooks
└────────┘    - API routes
   │ │         
   │ │         E2E Tests (10%)
   │ │         - Critical user flows
   └─┘         - Playwright
```

### Test Structure

```typescript
// ✅ RIGHT: Arrange-Act-Assert pattern
describe('CharacterService', () => {
  describe('getCharacter', () => {
    it('should return character when found', async () => {
      // Arrange
      const mockCharacter = { id: '1', name: 'Alice', backstory: '...' };
      mockFetch.mockResolvedValueOnce({ json: async () => mockCharacter });
      
      // Act
      const result = await getCharacter('1');
      
      // Assert
      expect(result).toEqual(mockCharacter);
    });
    
    it('should return null when not found', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      
      // Act
      const result = await getCharacter('999');
      
      // Assert
      expect(result).toBeNull();
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
// ✅ RIGHT: Test critical user flows
import { test, expect } from '@playwright/test';

test.describe('Character Creation Flow', () => {
  test('should create a new character', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Open character creation
    await page.click('button:has-text("New Character")');
    
    // Fill form
    await page.fill('input[name="name"]', 'Alice');
    await page.fill('textarea[name="backstory"]', 'A brave warrior');
    
    // Submit
    await page.click('button:has-text("Create")');
    
    // Verify character appears in list
    await expect(page.locator('text=Alice')).toBeVisible();
  });
});
```

### Test Coverage Goals

| Area | Minimum Coverage | Target Coverage |
|------|-----------------|-----------------|
| Utilities/Lib | 90% | 95% |
| Hooks | 80% | 90% |
| Components | 70% | 80% |
| API Routes | 85% | 90% |
| Overall | 75% | 85% |

---

## Code Quality Gates

### Pre-commit Checks

```bash
# Must pass before committing
1. TypeScript compilation: tsc --noEmit
2. ESLint: npm run lint
3. Prettier: npm run format --check
4. Unit tests: npm test
```

### PR Requirements

✅ **Required for merge:**
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] ESLint warnings resolved
- [ ] Code review approval (1+ reviewer)
- [ ] No merge conflicts
- [ ] Branch up-to-date with main

⚠️ **Recommended:**
- [ ] Test coverage maintained or improved
- [ ] Performance impact assessed
- [ ] Accessibility tested
- [ ] Documentation updated

### Code Review Checklist

**Functionality:**
- [ ] Does it work as intended?
- [ ] Are edge cases handled?
- [ ] Is error handling appropriate?

**Code Quality:**
- [ ] Follows YAGNI/KISS/DRY principles?
- [ ] TypeScript types are correct?
- [ ] No `any` types used?
- [ ] Functions < 50 lines?
- [ ] Components < 300 lines?

**Performance:**
- [ ] No unnecessary re-renders?
- [ ] Large lists virtualized?
- [ ] Images optimized?
- [ ] Code splitting applied?

**UX:**
- [ ] Follows VS Code patterns?
- [ ] Uses VS Code CSS variables?
- [ ] Accessible (keyboard navigation, ARIA)?
- [ ] Responsive (if applicable)?

**Testing:**
- [ ] Unit tests added/updated?
- [ ] E2E tests for critical flows?
- [ ] Test coverage maintained?

---

## VS Code UX Alignment

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

### Required CSS Classes (from VS Code)

All UI must use these VS Code-derived classes:

```css
/* Layout containers */
.monaco-workbench
.part.sidebar
.part.editor
.part.panel
.part.statusbar
.part.activitybar

/* Interactive elements */
.interactive-session
.interactive-list
.monaco-list
.monaco-list-row
```

### Key Dimensions (from VS Code)

| Element | Size |
|---------|------|
| Activity Bar | 48px wide |
| Tab Bar | 35px height |
| Status Bar | 22px height |
| Sidebar min | 170px |
| Sidebar max | 500px |

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

3. Is this layout or spacing?
   → YES: Use Tailwind utilities
   → NO: Consider component-scoped CSS
```

### When Managing State

```
1. Is this data from the server?
   → YES: Use React Query
   → NO: Continue

2. Is it shared across many components?
   → YES: Use Context API
   → NO: Continue

3. Is it complex (>3 related values)?
   → YES: Use useReducer
   → NO: Use useState
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-01-10 | Complete rewrite with modern practices |
| 1.2.0 | 2026-01-07 | Added active specifications |
| 1.1.0 | 2026-01-07 | Added function registry |
| 1.0.0 | 2026-01-07 | Initial constitution |

---

*This constitution is a living document. Propose changes via PR with justification based on real-world usage and team feedback.*

**Core Maintainers**: Review this document quarterly and update based on:
- New React/Next.js best practices
- Team pain points and learnings
- Performance metrics and user feedback
- Industry standards evolution
