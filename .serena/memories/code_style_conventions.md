# SpectreWeave5 Code Style and Conventions

## TypeScript Standards
- **Strict typing**: All code uses TypeScript with strict mode enabled
- **Interface naming**: PascalCase for interfaces (e.g., `AIRequest`, `EditorProps`)
- **Type definitions**: Centralized in `/src/types/` directories
- **Async/await**: Preferred over Promises for async operations

## React Patterns
- **Functional components**: All components use function syntax with hooks
- **Custom hooks**: Business logic extracted to hooks (`useAI`, `useBlockEditor`)
- **Context usage**: React Context for global state (AI, Editor contexts)
- **Component structure**: Props, state, effects, render in that order

## File and Directory Naming
- **Components**: PascalCase (e.g., `SpectreWeaveEditor.tsx`)
- **Hooks**: camelCase starting with 'use' (e.g., `useSmartSuggestions.ts`)
- **Utilities**: camelCase (e.g., `getRenderContainer.ts`)
- **Constants**: UPPER_SNAKE_CASE for constants, camelCase for config objects
- **Directories**: PascalCase for component folders, camelCase for utility folders

## Import Organization
```typescript
// 1. External libraries
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 2. Internal modules (absolute imports with @/ alias)
import { AIService } from '@/lib/services/ai'
import { Button } from '@/components/ui/Button'

// 3. Relative imports
import { EditorProps } from './types'
```

## Component Structure Pattern
```typescript
// Props interface
interface ComponentProps {
  // ... prop definitions
}

// Main component
export function Component({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks and state
  const [state, setState] = useState()
  const customHook = useCustomHook()
  
  // 2. Effects
  useEffect(() => {
    // effect logic
  }, [dependencies])
  
  // 3. Event handlers
  const handleClick = useCallback(() => {
    // handler logic
  }, [dependencies])
  
  // 4. Render
  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  )
}
```

## CSS and Styling
- **Tailwind CSS**: Primary styling approach with utility classes
- **CSS Modules**: Used for complex component-specific styles
- **CSS Custom Properties**: Used for dynamic theming and AI feature styling
- **Dark mode**: Built-in support with Tailwind dark: prefix

## Error Handling
- **API routes**: Consistent error response format with status codes
- **Custom errors**: `AIServiceError` class for AI-related errors
- **Try-catch**: Comprehensive error handling in async operations
- **User feedback**: Toast notifications for user-facing errors

## Documentation Standards
- **JSDoc**: Used for complex functions and hooks
- **README files**: Present in major feature directories
- **Type documentation**: Inline comments for complex type definitions
- **API documentation**: Comprehensive comments in API route files