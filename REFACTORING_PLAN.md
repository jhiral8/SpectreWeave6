# SpectreWeave6 Refactoring Plan

## Overview

This document outlines a comprehensive refactoring plan following **YAGNI** (You Ain't Gonna Need It), **SOLID** (Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion), **DRY** (Don't Repeat Yourself), and **KISS** (Keep It Simple, Stupid) principles.

### Current Codebase Statistics
- **617 TypeScript/TSX files** in `/src`
- **93 Netlify functions** + **86 Next.js API routes** (redundant deployment strategies)
- **28+ hooks** with significant overlap
- **~4,870 modules** on compilation
- Multiple editor components doing similar things

---

## Phase 1: Remove Dead/Demo Code (YAGNI)

### Priority: High | Effort: Low | Risk: Low

**Rationale:** These files exist for development/demo purposes and are not used in production.

### 1.1 Remove Demo Pages
| Path | Size | Reason |
|------|------|--------|
| `src/app/dual-surface-demo/` | 46 lines | Demo page, not linked anywhere |
| `src/app/ide-demo/` | 570 lines | Demo page with mock data |
| `src/app/theme-demo/` | ~100 lines | Theme demonstration |
| `src/app/test/[id]/` | N/A | Test routes |

**Action:** 
```bash
rm -rf src/app/dual-surface-demo
rm -rf src/app/ide-demo
rm -rf src/app/theme-demo
rm -rf src/app/test
```

### 1.2 Remove Disabled Netlify Functions
| Path | Reason |
|------|--------|
| `netlify/functions/disabled/` | Explicitly marked as disabled |

**Action:**
```bash
rm -rf netlify/functions/disabled
```

### 1.3 Remove Duplicate Deployment Architecture
Currently running **both** Netlify Functions AND Next.js API routes for the same endpoints.

**Keep:** Next.js API routes (`/src/app/api/`)
**Remove:** Entire `netlify/functions/` directory (93 files)

**Rationale:** Next.js API routes are simpler, better integrated, and Netlify supports them natively.

---

## Phase 2: Consolidate Hooks (DRY)

### Priority: High | Effort: Medium | Risk: Medium

### 2.1 AI-Related Hooks Consolidation

**Current State:**
- `useAI.ts` - Base AI hook
- `useDualSurfaceAI.ts` - 646 lines, dual surface version
- `useSmartSuggestions.ts` - 301 lines
- `useAdvancedSmartSuggestions.ts` - Duplicate functionality
- `useProductionGhostText.ts` - 270 lines

**Proposed Structure:**
```
src/hooks/ai/
├── index.ts          # Unified exports
├── useAI.ts          # Core AI hook (single point of entry)
├── types.ts          # Shared AI types
└── utils.ts          # Shared utilities
```

**Consolidation Plan:**
1. Merge `useSmartSuggestions` + `useAdvancedSmartSuggestions` → single `useSmartSuggestions`
2. Merge `useDualSurfaceAI` into `useAI` with optional config
3. Keep `useProductionGhostText` but simplify

### 2.2 Editor Hooks Consolidation

**Current State:**
- `useBlockEditor.ts`
- `useDualBlockEditors.ts`
- `useEditorState.ts`
- `useEditorFactory.ts`
- `useEditorContent.ts`
- `useEditorWorker.ts`

**Proposed Structure:**
```
src/hooks/editor/
├── index.ts
├── useEditor.ts       # Single unified hook
├── useEditorState.ts  # Read-only state
└── types.ts
```

### 2.3 Surface/Manager Hooks

**Current State (REDUNDANT):**
- `useDualSurface.ts` - 30 lines
- `useUnifiedSurfaceManager.ts` - 87 lines
- `useUnifiedUIManager.ts` - Unknown

**Action:** Merge into single `useSurfaceManager.ts`

---

## Phase 3: Consolidate AI Services (DRY + SOLID)

### Priority: High | Effort: High | Risk: Medium

### 3.1 AI Service Layer Redundancy

**Current State in `/src/lib/ai/`:**
| File | Lines | Overlaps With |
|------|-------|---------------|
| `advancedAIContext.tsx` | ~400 | AIContext |
| `advancedAIServiceManager.ts` | ~300 | resilientAIService |
| `resilientAIService.ts` | ~200 | advancedAIServiceManager |
| `spectreWeaveAIBridge.ts` | 935 | Everything |
| `dualSurfaceContextManager.ts` | 782 | spectreWeaveAIBridge |
| `aiMonitoring.ts` | 563 | aiAnalyticsAndMonitoring |

**Proposed Simplified Architecture:**
```
src/lib/ai/
├── index.ts              # Clean exports
├── client.ts             # Single AI client (OpenRouter wrapper)
├── context.ts            # React context for AI state
├── prompts.ts            # All prompt templates
├── types.ts              # Unified AI types
└── utils/
    ├── fallback.ts       # Model fallback logic
    └── stream.ts         # Streaming utilities
```

**Files to Remove:**
- `advancedAIServiceManager.ts` → merge into `client.ts`
- `resilientAIService.ts` → merge fallback into `client.ts`
- `spectreWeaveAIBridge.ts` → extract essentials, delete rest
- `dualSurfaceContextManager.ts` → simplify into `context.ts`
- `aiAnalyticsAndMonitoring.ts` → keep only if metrics needed
- `aiMonitoring.ts` → delete or merge with above

### 3.2 Mock/Test Files in Production

**Remove:**
- `mockChildrensBookAI.ts` - Should be in tests only

---

## Phase 4: Consolidate Editor Components (DRY + KISS)

### Priority: Medium | Effort: High | Risk: High

### 4.1 Current Editor Chaos

**Multiple editor implementations:**
| Component | Location | Purpose |
|-----------|----------|---------|
| `BlockEditor` | `/components/BlockEditor/` | Main editor |
| `DualBlockEditor` | `/components/BlockEditor/` | Dual surface version |
| `NotionEditor` | `/components/NotionEditor/` | Alternative editor |
| `DualWritingSurface` | `/components/DualWritingSurface/` | Another dual editor |
| `AIWritingSurface` | `/components/IDE/AIWritingSurface/` | IDE editor |
| `SpectreWeaveEditor` | `/components/editor/SpectreWeaveEditor/` | Yet another |

**Proposed Structure:**
```
src/components/Editor/
├── Editor.tsx            # Single unified editor
├── EditorToolbar.tsx     # Formatting toolbar
├── EditorContent.tsx     # Content area
├── hooks/
│   └── useEditor.ts
└── extensions/           # Move from top-level
```

**Components to Remove:**
- `NotionEditor/` - Only used in one demo route
- `DualWritingSurface/` - Duplicate of DualBlockEditor functionality
- `SpectreWeaveEditor/` - Legacy, unused

### 4.2 IDE Components Cleanup

**Keep:**
- `components/IDE/` - This is the main app structure

**Review and potentially remove unused components within IDE:**
- Check each subfolder for actual usage

---

## Phase 5: API Route Simplification (KISS + SOLID)

### Priority: Medium | Effort: Medium | Risk: Low

### 5.1 Current API Structure

86 route files with many doing minimal work or being proxies.

**Proposed Simplified Structure:**
```
src/app/api/
├── ai/
│   ├── chat/route.ts       # All chat (merge framework/chat, general chat)
│   ├── generate/route.ts   # Text generation
│   └── stream/route.ts     # Streaming endpoint
├── auth/
│   └── [...]/route.ts
├── projects/
│   └── [...]/route.ts
└── health/route.ts         # Single health check
```

**Routes to Remove/Merge:**
- `api/ai/azure/` → merge into `api/ai/generate/` with provider param
- `api/ai/databricks/` → merge into `api/ai/generate/`
- `api/ai/gemini/` → merge into `api/ai/generate/`
- `api/ai/openrouter/` → merge into `api/ai/generate/`
- `api/ai/stability/` → merge into `api/ai/generate/`
- `api/bridge/*` → These duplicate Netlify functions, consolidate

---

## Phase 6: Extension Cleanup (SOLID)

### Priority: Low | Effort: Medium | Risk: Low

### 6.1 TipTap Extensions

**Current:** 30+ custom extensions in `/src/extensions/`

**Audit for:**
- Unused extensions (check imports)
- Extensions doing same thing differently
- Extensions that could use TipTap built-ins

**Known duplicates:**
- `SlashCommands.ts` vs `SlashCommand/` folder
- `GhostText/` vs `GhostCompletion/`

---

## Phase 7: Type System Cleanup (SOLID - Interface Segregation)

### Priority: Low | Effort: Low | Risk: Low

### 7.1 Type Definition Locations

**Current scattered types:**
- `src/types/`
- `src/lib/ai/types.ts`
- Types declared in component files
- Types declared in hook files

**Proposed:**
```
src/types/
├── index.ts       # Re-exports
├── ai.ts          # All AI types
├── editor.ts      # All editor types
├── project.ts     # Project/document types
└── database.ts    # Supabase types
```

---

## Implementation Order & Timeline

### Week 1: Quick Wins (Phase 1)
- [ ] Delete demo pages
- [ ] Delete disabled functions
- [ ] Decide on Netlify vs Next.js API (keep one)

### Week 2-3: Hook Consolidation (Phase 2)
- [ ] Create new hook structure
- [ ] Migrate AI hooks
- [ ] Migrate editor hooks
- [ ] Update all imports

### Week 4-5: AI Service Simplification (Phase 3)
- [ ] Design new AI client
- [ ] Extract working code from existing services
- [ ] Create unified context
- [ ] Migrate components

### Week 6-7: Editor Consolidation (Phase 4)
- [ ] Audit actual editor usage
- [ ] Create unified editor
- [ ] Migrate existing pages
- [ ] Remove unused editors

### Week 8: Final Cleanup (Phases 5-7)
- [ ] Consolidate API routes
- [ ] Extension audit
- [ ] Type cleanup

---

## What to KEEP (Works Well)

### ✅ Keep As-Is
1. **IDE Shell Architecture** (`/components/IDE/`) - Clean, works well
2. **Panel System** - Good abstraction
3. **Theme System** - Functional
4. **Supabase Integration** - Works
5. **TipTap Core Setup** - Solid foundation
6. **Portal Page Structure** (`/app/portal/`) - Main app entry

### ✅ Keep with Minor Refactoring
1. **FrameworkEditor** - Recently created, good structure
2. **AICopilotPanel** - Works, could simplify
3. **StoryExplorer** - Works well
4. **EditorTabs** - Good abstraction

---

## Estimated Impact

| Metric | Before | After (Est.) | Reduction |
|--------|--------|--------------|-----------|
| TypeScript files | 617 | ~350 | 43% |
| Hooks | 28+ | ~12 | 57% |
| AI service files | 18 | 5 | 72% |
| Editor components | 6+ | 2 | 67% |
| API routes | 86 | ~25 | 71% |
| Build modules | 4,870 | ~3,000 | 38% |

---

## Risk Mitigation

1. **Create feature branches** for each phase
2. **Keep tests passing** at each phase
3. **Document removed code** location in git
4. **Incremental deployment** - one phase at a time
5. **Rollback plan** - git tags before each phase

---

## Principle Violations Found

### YAGNI Violations
- Demo pages never deployed
- Disabled functions still in codebase
- Duplicate API architectures
- Mock AI service in production code

### DRY Violations
- 6+ AI-related hooks doing similar things
- Multiple editor implementations
- Netlify + Next.js API routes duplicating endpoints
- Multiple "unified" managers that aren't unified

### SOLID Violations
- **Single Responsibility:** AI services do too much
- **Interface Segregation:** Large hook returns with unused properties
- **Dependency Inversion:** Components directly import specific implementations

### KISS Violations
- 782-line context manager
- 935-line AI bridge
- 646-line dual surface AI hook
- Complex provider nesting

---

## Next Steps

1. **Review this plan** with the team
2. **Prioritize** based on pain points
3. **Create GitHub issues** for each phase
4. **Start with Phase 1** - lowest risk, immediate gains
5. **Iterate** - adjust plan based on findings

---

*Generated: $(date)*
*Principles: YAGNI, SOLID, DRY, KISS*
