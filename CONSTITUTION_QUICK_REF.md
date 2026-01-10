# SpectreWeave6 Constitution - Quick Reference Card

> Print this out or keep it open while coding! 🚀

---

## 🎯 The Golden Rules

```typescript
const GOLDEN_RULES = {
  YAGNI: "Build only what you need NOW",
  KISS: "Simple > Clever",
  DRY: "One source of truth for everything",
  TypeScript: "Strict mode, no 'any', ever",
  VSCode: "Match VS Code UX patterns exactly"
} as const;
```

---

## 📏 Size Limits (Hard Stops)

| Item | Limit | Action |
|------|-------|--------|
| 📄 **File** | 500 lines | Split into modules |
| ⚛️ **Component** | 300 lines | Extract sub-components |
| 🔧 **Function** | 50 lines | Extract helpers |
| 🎛️ **Props** | 7 props | Use config object |
| 📊 **useState** | 5 calls | Use useReducer |
| ⚡ **useEffect** | 3 calls | Review side effects |
| 🔁 **Nesting** | 3 levels | Early returns |
| 🎨 **Complexity** | 10 | Simplify logic |

---

## ⚛️ React Component Checklist

```typescript
// ✅ Use this structure for EVERY component

// 1. Imports (5 groups)
import { useState } from 'react';           // 1. React/Next
import { Sparkles } from 'lucide-react';    // 2. External
import { Button } from '@/components/ui';   // 3. Internal
import { useCharacters } from '@/hooks';    // 4. Hooks
import type { Character } from '@/types';   // 5. Types

// 2. Constants
const MAX_ITEMS = 50;

// 3. Types (component-specific)
interface Props { /* ... */ }

// 4. Component
export function ComponentName({ props }: Props) {
  // 4a. Hooks (state, refs, context, custom)
  const [state, setState] = useState();
  const { data } = useCustomHook();
  
  // 4b. Derived values (useMemo if expensive)
  const computed = derive(data);
  
  // 4c. Event handlers (useCallback if passed down)
  const handleClick = useCallback(() => {}, []);
  
  // 4d. Effects (cleanup required)
  useEffect(() => {
    return () => cleanup();
  }, [deps]);
  
  // 4e. Early returns
  if (loading) return <Loading />;
  if (error) return <Error error={error} />;
  
  // 4f. Render
  return <div>{content}</div>;
}
```

---

## 🔄 State Management Decision Tree

```
Is this SERVER data? (API, database, etc.)
├─ YES → Use React Query
│  const { data } = useQuery({
│    queryKey: ['resource', id],
│    queryFn: () => api.get(id)
│  });
│
└─ NO → Is it GLOBAL UI state?
    ├─ YES → Use Context
    │  const value = useContext(ThemeContext);
    │
    └─ NO → Is it COMPLEX? (>3 related values)
        ├─ YES → Use useReducer
        │  const [state, dispatch] = useReducer(reducer, initial);
        │
        └─ NO → Use useState
            const [value, setValue] = useState(initial);
```

---

## 📝 TypeScript Quick Rules

```typescript
// ✅ DO
interface Character {              // Interface for objects
  id: string;
  name: string;
}

type Status = 'idle' | 'loading';  // Type for unions

function getName(char: Character): string {
  return char.name;
}

// ❌ DON'T
function process(data: any) { }    // Never use 'any'
const result = data!.value;        // Avoid ! without guard
enum Status { Idle, Loading }      // Avoid enums

// ✅ USE INSTEAD
function process(data: unknown) {
  if (isCharacter(data)) { }       // Type guard
}

const result = data?.value ?? '';  // Optional chaining

const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading'
} as const;
type Status = typeof STATUS[keyof typeof STATUS];
```

---

## 🎨 Styling Rules

```typescript
// ✅ DO - Use VS Code CSS variables
className="bg-[var(--vscode-editor-background)]"

// ✅ DO - Tailwind for layout
className="flex items-center gap-2 p-4"

// ❌ DON'T - Hardcode colors
className="bg-blue-500 text-white"

// ❌ DON'T - Inline styles
style={{ backgroundColor: '#1e1e1e' }}
```

**Hierarchy**: VS Code variables > Tailwind > Component CSS

---

## 🚫 Never Do This

```typescript
// 1. ❌ any type
const data: any = await fetch();

// 2. ❌ console.log in production
console.log('debug', user);

// 3. ❌ Hardcoded colors
className="bg-blue-500"

// 4. ❌ Magic numbers
if (count > 50) { }

// 5. ❌ Nested ternaries
{a ? (b ? x : y) : (c ? w : z)}

// 6. ❌ Non-null assertion without guard
const name = user!.name;

// 7. ❌ Missing dependencies
useEffect(() => {
  fetchData(id);  // 'id' not in deps!
}, []);

// 8. ❌ Derived state
const [full, setFull] = useState(first + last);
// Instead: const full = `${first} ${last}`;
```

---

## 🎯 Server vs Client Components

```typescript
// ✅ DEFAULT: Server Component
// app/page.tsx
async function Page() {
  const data = await fetch('...');
  return <List data={data} />;
}

// ✅ WHEN NEEDED: Client Component
// components/List.tsx
'use client';
function List({ data }) {
  const [selected, setSelected] = useState();
  return <div onClick={() => setSelected()}>{data}</div>;
}
```

**Use 'use client' ONLY if you need:**
- useState, useReducer, useEffect
- Event handlers (onClick, onChange)
- Browser APIs (window, localStorage)
- Custom hooks using the above

---

## ✅ Code Review Checklist

### Before Opening PR

- [ ] TypeScript compiles (`tsc --noEmit`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Prettier formatted (`npm run format`)
- [ ] All tests pass (`npm test`)
- [ ] No `console.log` statements
- [ ] No `any` types
- [ ] Component < 300 lines
- [ ] Function < 50 lines

### During Code Review

- [ ] Follows YAGNI (not over-engineered)
- [ ] Follows KISS (simple, readable)
- [ ] Follows DRY (no duplication)
- [ ] Uses VS Code CSS variables
- [ ] Proper error handling
- [ ] Tests included/updated
- [ ] Accessible (keyboard, ARIA)

---

## 🔍 Common Patterns

### React Query

```typescript
// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['characters', userId],
  queryFn: () => api.getCharacters(userId),
  staleTime: 5 * 60 * 1000,
});

// Mutation
const mutation = useMutation({
  mutationFn: (char: Character) => api.create(char),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['characters'] });
  },
});
```

### Custom Hook

```typescript
function useCharacter(id: string) {
  const [char, setChar] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    fetchCharacter(id)
      .then(setChar)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);
  
  return { char, loading, error };
}
```

### Error Boundary

```typescript
<ErrorBoundary fallback={<ErrorView />}>
  <CharacterPanel />
</ErrorBoundary>
```

---

## 📊 Testing Coverage Goals

| Area | Target |
|------|--------|
| **Utilities** | 95% |
| **Hooks** | 90% |
| **Components** | 80% |
| **API Routes** | 90% |
| **Overall** | 85% |

---

## 🚀 Performance Optimization

```typescript
// Memoize expensive computations
const sorted = useMemo(() => 
  data.sort((a, b) => a.name.localeCompare(b.name))
, [data]);

// Memoize callbacks passed to children
const onClick = useCallback((id: string) => {
  setSelected(id);
}, []);

// Memoize components
const Item = memo(function Item({ data }) {
  return <div>{data.name}</div>;
});

// Code split large features
const Wizard = dynamic(() => import('./Wizard'), {
  loading: () => <Loading />,
  ssr: false
});
```

---

## 🎨 VS Code CSS Variables (Most Used)

```css
/* Backgrounds */
--vscode-editor-background
--vscode-sideBar-background
--vscode-activityBar-background

/* Foregrounds */
--vscode-editor-foreground
--vscode-sideBar-foreground

/* Interactive */
--vscode-button-background
--vscode-button-foreground
--vscode-button-hoverBackground
--vscode-focusBorder

/* Lists */
--vscode-list-activeSelectionBackground
--vscode-list-hoverBackground
```

---

## 🔧 File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Component** | PascalCase | `CharacterList.tsx` |
| **Hook** | camelCase + use | `useCharacters.ts` |
| **Utility** | camelCase | `string-utils.ts` |
| **Type** | PascalCase | `Character` |
| **Constant** | SCREAMING_SNAKE | `MAX_CHARACTERS` |

---

## 📚 When in Doubt

1. **Check the constitution** (full document)
2. **Look at existing code** (find similar patterns)
3. **Ask in PR** (get team input)
4. **Default to simple** (KISS principle)
5. **Match VS Code** (when applicable)

---

## 🎓 Daily Mantras

```typescript
// Morning standup
"I will write simple, readable code today"

// Before committing
"Have I followed YAGNI, KISS, and DRY?"

// During code review
"Is this the simplest solution that works?"

// Before merging
"Would VS Code do it this way?"
```

---

**Keep this reference handy!**  
Full constitution: `/CONSTITUTION.md`  
Questions? Open an issue with tag `constitution`

---

*Version 2.0.0 | Updated: 2026-01-10* 🚀
