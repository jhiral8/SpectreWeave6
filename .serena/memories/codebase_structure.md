# SpectreWeave5 Codebase Structure

## Top-Level Organization
```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints (AI, auth, collaboration)
│   ├── [room]/            # Dynamic room pages for editor
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ai/               # AI-specific components
│   ├── auth/             # Authentication components  
│   ├── BlockEditor/      # Main editor components
│   ├── editor/           # Advanced editor features
│   ├── menus/            # Editor menus (text, link, content)
│   ├── panels/           # UI panels (colorpicker, link editor)
│   ├── ui/               # Reusable UI components
│   └── Sidebar/          # Editor sidebar
├── extensions/           # TipTap custom extensions
├── hooks/               # React hooks
├── lib/                 # Utility libraries
│   ├── ai/              # AI service implementations
│   ├── services/        # Backend service integrations
│   ├── supabase/        # Supabase client/server
│   └── utils/           # General utilities
├── contexts/            # React contexts
├── styles/              # CSS and styling
└── types/               # TypeScript type definitions
```

## Key Directories Deep Dive

### /app/api/ - API Routes
- `/ai/` - AI service endpoints (azure, gemini, databricks, etc.)
- `/auth/` - Authentication endpoints
- `/collaboration/` - Real-time collaboration
- `/test/` - Development testing endpoints

### /components/editor/ - Advanced Editor Features
- `AIToolbar/` - AI-powered toolbar
- `AIWorkspacePanel/` - AI workspace
- `SpectreWeaveEditor/` - Main editor component
- `WritingAnalytics/` - Writing analysis features

### /extensions/ - TipTap Extensions
- `AuthorStyleBlock/` - AI author style analysis
- `CharacterProfileBlock/` - Character development
- `FeedbackBlock/` - AI feedback system
- `ImageBlock/`, `Table/`, etc. - Standard rich text extensions

### /lib/ai/ - AI Service Architecture  
- `advancedAIServiceManager.ts` - Multi-provider orchestration
- `advancedAIContext.tsx` - React context for AI state
- `spectreWeaveAIBridge.ts` - Bridge to SpectreWeaveAIAlgorithm
- `ragSystem.ts` - Retrieval-Augmented Generation
- `types.ts` - AI type definitions