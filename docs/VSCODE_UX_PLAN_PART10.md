# Part 10: Implementation Roadmap & Migration Strategy

> **Purpose**: Detailed sprint breakdown, dependencies, migration path, and testing strategy.

---

## 10.1 Implementation Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION TIMELINE                           │
│                         (12-16 weeks)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Phase 1: Foundation (Weeks 1-3)                                    │
│  ├─ Theme system + design tokens                                    │
│  ├─ Panel system infrastructure                                      │
│  └─ Activity Bar + Status Bar                                       │
│                                                                      │
│  Phase 2: Core Panels (Weeks 4-7)                                   │
│  ├─ Story Explorer (left panel)                                     │
│  ├─ Bottom Panel (AI Feedback)                                      │
│  └─ AI Chat Panel (right panel)                                     │
│                                                                      │
│  Phase 3: Editor Enhancement (Weeks 8-10)                           │
│  ├─ Tab system                                                       │
│  ├─ Breadcrumbs                                                      │
│  ├─ Minimap                                                          │
│  └─ Writing surface polish                                          │
│                                                                      │
│  Phase 4: AI & Commands (Weeks 11-13)                               │
│  ├─ AI Agent system                                                  │
│  ├─ Command Palette                                                  │
│  └─ Keyboard shortcuts                                               │
│                                                                      │
│  Phase 5: Polish & Migration (Weeks 14-16)                          │
│  ├─ Data migration                                                   │
│  ├─ Testing & bug fixes                                              │
│  └─ Documentation                                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10.2 Phase 1: Foundation (Weeks 1-3)

### Week 1: Design System Setup

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Create theme token CSS file | `src/styles/theme-tokens.css` |
| 2-3 | Implement ThemeProvider | `src/components/IDE/Theme/ThemeProvider.tsx` |
| 3-4 | Create all 5 theme variants | Theme CSS variables |
| 4-5 | Theme picker component | `src/components/IDE/Theme/ThemePicker.tsx` |

**Dependencies**: None (greenfield)

**Testing**:
```typescript
// tests/theme.spec.ts
test('Theme persistence across sessions', async () => {
  // Set theme to midnight-writer
  // Refresh page
  // Verify theme persists
});

test('System preference detection', async () => {
  // Mock prefers-color-scheme: light
  // Verify light theme selected on first visit
});
```

### Week 2: Panel System Infrastructure

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Panel context and types | `src/components/IDE/PanelSystem/` |
| 2-3 | ResizablePanel component | Panel resize handles |
| 3-4 | Panel persistence (localStorage) | Size/visibility persistence |
| 4-5 | Integration with existing layout | Update `DualBlockEditor.tsx` |

**Dependencies**: Theme system (Week 1)

**Key Files to Create**:
```
src/components/IDE/PanelSystem/
├── PanelContext.tsx
├── PanelProvider.tsx
├── PanelContainer.tsx
├── ResizablePanel.tsx
├── types.ts
└── hooks/
    ├── usePanelResize.ts
    └── usePanelPersistence.ts
```

### Week 3: Activity Bar + Status Bar

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | ActivityBar component | Icon strip implementation |
| 2-3 | ActivityBarItem + badges | Interactive items |
| 3-4 | StatusBar component | Bottom status strip |
| 4-5 | StatusBar items (word count, etc.) | Dynamic status items |

**Dependencies**: Panel system (Week 2)

**Integration Points**:
```typescript
// Update src/components/BlockEditor/DualBlockEditor.tsx
import { ActivityBar } from '../IDE/ActivityBar/ActivityBar';
import { StatusBar } from '../IDE/StatusBar/StatusBar';

// Wrap existing content with IDE shell
```

---

## 10.3 Phase 2: Core Panels (Weeks 4-7)

### Week 4-5: Story Explorer (Left Panel)

| Task | Time | Priority |
|------|------|----------|
| Story tree data model | 2 days | P0 |
| TreeView component | 2 days | P0 |
| TreeItem component | 1 day | P0 |
| Drag-and-drop reordering | 2 days | P1 |
| Context menus | 1 day | P1 |
| Quick actions (rename, delete) | 1 day | P1 |
| Integration with `useChapterNavigation` | 1 day | P0 |

**Key Migration**:
```typescript
// Migrate from:
// src/components/LeftNavigation/LeftNavigationView.tsx

// To:
// src/components/IDE/StoryExplorer/StoryExplorer.tsx

// Key integration:
// - useChapterNavigation hook already extracts chapters
// - Need to add manuscript/framework switching
// - Add visual hierarchy (chapters > scenes > beats)
```

### Week 6: Bottom Panel (AI Feedback)

| Task | Time | Priority |
|------|------|----------|
| Problems panel structure | 1 day | P0 |
| Problem severity filtering | 1 day | P0 |
| `useWritingProblems` hook | 2 days | P0 |
| Real-time problem detection | 2 days | P1 |
| Quick fix actions | 2 days | P1 |

**Migration from WritingFeedback.tsx**:
```typescript
// Current: src/components/editor/WritingFeedback.tsx
// Uses useAI to analyze text

// New approach:
// - Background analysis worker
// - Debounced content analysis
// - Structured problem output
// - VS Code-style problem list
```

### Week 7: AI Chat Panel (Right Panel)

| Task | Time | Priority |
|------|------|----------|
| Refactor AIChatSidebar | 2 days | P0 |
| Message streaming UI | 1 day | P0 |
| Context pills (selection, chapter) | 2 days | P1 |
| Quick actions in responses | 1 day | P1 |
| History persistence | 1 day | P2 |

**Current State Analysis**:
```typescript
// src/components/AIChatSidebar/AIChatSidebar.tsx
// Already has:
// - ChatInterface component
// - Responsive design
// - Basic messaging

// Needs:
// - VS Code-style visual polish
// - Context awareness (what's selected)
// - Insert/replace actions
// - Streaming response display
```

---

## 10.4 Phase 3: Editor Enhancement (Weeks 8-10)

### Week 8: Tab System

| Task | Time | Deliverable |
|------|------|-------------|
| Tab data model | 1 day | `types/tabs.ts` |
| TabBar component | 2 days | `IDE/Tabs/TabBar.tsx` |
| Tab context menu | 1 day | Close others, etc. |
| Dirty indicator | 0.5 day | Unsaved dot |
| Keyboard navigation | 0.5 day | Ctrl+Tab |

**Implementation Details**:
```typescript
interface Tab {
  id: string;
  type: 'manuscript' | 'framework' | 'character' | 'settings';
  title: string;
  icon: string;
  isDirty: boolean;
  isPinned: boolean;
  documentId?: string;
  // For navigation
  scrollPosition?: number;
  cursorPosition?: number;
}
```

### Week 9: Breadcrumbs + Navigation

| Task | Time | Deliverable |
|------|------|-------------|
| Breadcrumb component | 1 day | `IDE/Breadcrumbs/` |
| Document structure parser | 2 days | Extract headings |
| Breadcrumb navigation | 1 day | Click to navigate |
| Minimap component | 2 days | `IDE/Minimap/` |
| Minimap highlighting | 1 day | Current viewport |

### Week 10: Writing Surface Polish

| Task | Time | Priority |
|------|------|----------|
| Apply writing-surface.css | 1 day | P0 |
| Typography refinement | 1 day | P0 |
| Ghost text styling | 1 day | P0 |
| Entity highlighting | 2 days | P1 |
| Focus mode refinements | 1 day | P2 |

---

## 10.5 Phase 4: AI & Commands (Weeks 11-13)

### Week 11: AI Agent System

| Task | Time | Priority |
|------|------|----------|
| Agent registry | 1 day | P0 |
| Agent types/interfaces | 1 day | P0 |
| `useAgentManager` hook | 2 days | P0 |
| Ghost Writer agent | 1 day | P0 |
| Style Coach agent | 1 day | P0 |
| Character Keeper agent | 1 day | P1 |

**Integration with Existing AI**:
```typescript
// Leverage existing:
// - src/lib/ai/spectreWeaveAIBridge.ts
// - src/lib/ai/dualSurfaceContextManager.ts
// - src/hooks/useAI.ts

// Each agent wraps these with specific prompts/behavior
```

### Week 12: Remaining Agents + Panel

| Task | Time | Deliverable |
|------|------|-------------|
| Plot Analyst agent | 1 day | Analysis prompts |
| Dialogue Master agent | 1 day | Dialogue generation |
| World Builder agent | 1 day | Consistency checks |
| AIAgentsPanel UI | 2 days | Agent management UI |
| Task history | 1 day | Recent operations |

### Week 13: Command Palette

| Task | Time | Priority |
|------|------|----------|
| Command registry | 1 day | P0 |
| CommandPalette component | 2 days | P0 |
| Fuzzy search | 1 day | P0 |
| Keyboard shortcuts | 1 day | P0 |
| Context-aware commands | 1 day | P1 |

**Command Categories**:
```typescript
const COMMAND_CATEGORIES = [
  'Navigation',      // Go to chapter, Go to character
  'AI Agents',       // Run Ghost Writer, Style Coach
  'View',            // Toggle panels, Focus mode
  'Edit',            // Insert scene break, Format
  'File',            // Save, Export, New chapter
];
```

---

## 10.6 Phase 5: Polish & Migration (Weeks 14-16)

### Week 14: Data Layer

| Task | Time | Deliverable |
|------|------|-------------|
| Story document schema | 2 days | Type definitions |
| Document serialization | 1 day | Save/load logic |
| Export formats | 2 days | DOCX, PDF, ePub |

**Story Document Format**:
```typescript
interface StoryDocument {
  version: '1.0';
  metadata: {
    title: string;
    author: string;
    created: Date;
    modified: Date;
    wordCount: number;
    genre?: string;
  };
  
  manuscript: {
    content: JSONContent; // TipTap JSON
    chapters: ChapterMeta[];
  };
  
  framework: {
    structure: string; // Framework type
    content: JSONContent;
  };
  
  characters: CharacterProfile[];
  locations: Location[];
  notes: Note[];
  
  settings: {
    theme: ThemeId;
    panelLayout: PanelLayout;
  };
}
```

### Week 15: Testing & Bug Fixes

| Test Category | Scope | Priority |
|---------------|-------|----------|
| Unit tests | Hooks, utilities | P0 |
| Component tests | All IDE components | P0 |
| Integration tests | Panel interactions | P0 |
| E2E tests | Critical workflows | P1 |
| Accessibility audit | WCAG compliance | P1 |
| Performance tests | Large documents | P1 |

**Critical Workflows to Test**:
1. New project creation → chapter writing → AI assistance
2. Character profile creation → manuscript integration
3. Full document export
4. Theme switching + persistence
5. Panel resize + persistence
6. Command palette navigation

### Week 16: Documentation & Launch

| Task | Time | Deliverable |
|------|------|-------------|
| User documentation | 2 days | Usage guide |
| Developer documentation | 1 day | Architecture docs |
| Migration guide | 1 day | From old UI |
| Bug triage & fixes | 2 days | Critical fixes |

---

## 10.7 Migration Strategy

### Incremental Migration Approach

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIGRATION APPROACH                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Parallel Development (Weeks 1-7)                       │
│  ├─ Build new IDE components in /src/components/IDE/             │
│  ├─ Keep existing components working                             │
│  └─ Feature flag: USE_NEW_IDE=false                             │
│                                                                  │
│  Step 2: Component Migration (Weeks 8-10)                       │
│  ├─ Gradually replace old components                             │
│  ├─ Map old props to new interfaces                              │
│  └─ Update imports incrementally                                 │
│                                                                  │
│  Step 3: Full Switchover (Weeks 11-13)                          │
│  ├─ Feature flag: USE_NEW_IDE=true                              │
│  ├─ Monitor for regressions                                      │
│  └─ Keep old code for rollback                                   │
│                                                                  │
│  Step 4: Cleanup (Weeks 14-16)                                  │
│  ├─ Remove deprecated components                                 │
│  ├─ Archive old code                                             │
│  └─ Final polish                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Mapping

| Old Component | New Component | Migration Notes |
|---------------|---------------|-----------------|
| `LeftNavigationView.tsx` | `StoryExplorer.tsx` | Extract tree logic |
| `AIChatSidebar.tsx` | `AIChatPanel.tsx` | Enhance with context |
| `WritingFeedback.tsx` | `ProblemsPanel.tsx` | Restructure data model |
| `DualBlockEditor.tsx` | `IDEShell.tsx` | New layout wrapper |
| `ContextAwareEditorHeader.tsx` | `EditorToolbar.tsx` + `Breadcrumbs.tsx` | Split concerns |

### Feature Flag Implementation

```typescript
// src/lib/featureFlags.ts

export const FEATURE_FLAGS = {
  USE_NEW_IDE: process.env.NEXT_PUBLIC_USE_NEW_IDE === 'true',
  NEW_AI_AGENTS: process.env.NEXT_PUBLIC_NEW_AI_AGENTS === 'true',
  COMMAND_PALETTE: process.env.NEXT_PUBLIC_COMMAND_PALETTE === 'true',
};

// Usage in components:
// src/app/portal/(dash)/writer/[docId]/page.tsx

import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { DualBlockEditor } from '@/components/BlockEditor/DualBlockEditor';
import { IDEShell } from '@/components/IDE/IDEShell';

export default function WriterPage() {
  return FEATURE_FLAGS.USE_NEW_IDE ? (
    <IDEShell projectId={projectId} />
  ) : (
    <DualBlockEditor projectId={projectId} />
  );
}
```

---

## 10.8 Risk Mitigation

### Identified Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| TipTap compatibility | High | Test extensively with v3.x |
| Y.js sync issues | High | Maintain separate test environment |
| AI rate limits | Medium | Implement queuing and caching |
| Performance regression | Medium | Continuous benchmarking |
| Breaking changes | High | Feature flags + rollback |

### Performance Budgets

```typescript
// Performance targets
const PERFORMANCE_BUDGETS = {
  // Time to interactive
  tti: 2000, // 2 seconds
  
  // First contentful paint
  fcp: 1000, // 1 second
  
  // Editor responsiveness
  keystrokeLatency: 16, // 60fps
  
  // Panel resize
  resizeLatency: 100, // ms
  
  // AI response start
  aiFirstToken: 500, // 0.5 seconds
  
  // Large document (50k words)
  loadTime: 3000, // 3 seconds
};
```

### Rollback Plan

```bash
# If critical issues discovered:

# 1. Disable feature flag
NEXT_PUBLIC_USE_NEW_IDE=false

# 2. Deploy immediately (no code changes needed)

# 3. Investigate issues in staging

# 4. Re-enable when fixed
```

---

## 10.9 Team Allocation (Suggested)

### If Team of 3:

| Developer | Focus | Weeks |
|-----------|-------|-------|
| Dev 1 (Lead) | Architecture, Panel System, Integration | 1-16 |
| Dev 2 (Frontend) | Components, Theme, Polish | 1-16 |
| Dev 3 (AI/Backend) | AI Agents, Commands, Data Layer | 4-16 |

### If Solo Developer:

- **Weeks 1-5**: Foundation + Story Explorer (P0 items only)
- **Weeks 6-9**: Panels + Basic Editor (P0 items only)
- **Weeks 10-12**: AI Agents (Ghost Writer + Style Coach)
- **Weeks 13-16**: Polish + Migration

---

## 10.10 Success Metrics

### User Experience Metrics

```typescript
const SUCCESS_METRICS = {
  // Engagement
  dailyActiveUsers: '+20%', // vs old UI
  sessionDuration: '+30%',  // Time in editor
  wordsWrittenPerSession: '+15%',
  
  // Satisfaction
  npsScore: 50, // Target NPS
  featureAdoption: {
    aiAgents: '60%',     // Users who try AI
    commandPalette: '40%', // Power users
    themes: '30%',        // Customization
  },
  
  // Performance
  crashRate: '<0.1%',
  loadTime: '<2s',
  aiLatency: '<1s',
};
```

### Technical Health Metrics

```typescript
const TECH_METRICS = {
  // Code quality
  testCoverage: '>80%',
  typescriptStrict: true,
  noAnyTypes: true,
  
  // Bundle size
  mainBundle: '<500KB', // gzipped
  initialLoad: '<200KB',
  
  // Dependencies
  vulnerabilities: 0,
  outdatedDeps: '<5',
};
```

---

## Part 10 Summary

### Implementation Timeline:
- **16 weeks total** (can compress to 12 with team)
- **5 phases**: Foundation → Panels → Editor → AI → Polish
- **Incremental migration** with feature flags

### Key Deliverables by Phase:

| Phase | Weeks | Key Outputs |
|-------|-------|-------------|
| 1 | 1-3 | Theme system, Panel infrastructure, Activity/Status bars |
| 2 | 4-7 | Story Explorer, AI Feedback, Chat Panel |
| 3 | 8-10 | Tabs, Breadcrumbs, Minimap, Writing polish |
| 4 | 11-13 | 6 AI Agents, Command Palette, Shortcuts |
| 5 | 14-16 | Data layer, Testing, Documentation |

### Critical Path:
1. Theme tokens → 2. Panel system → 3. Story Explorer → 4. AI integration

---

*This completes the VS Code UX Transformation Plan. See the master index below.*

---

# Master Document Index

| Part | Title | Location |
|------|-------|----------|
| 1 | Overall Architecture & Shell Layout | `docs/VSCODE_UX_TRANSFORMATION_PLAN.md` |
| 2 | Story Explorer (Left Panel) | `docs/VSCODE_UX_PLAN_PART2.md` |
| 3 | Main Editor Enhancements | `docs/VSCODE_UX_PLAN_PART3.md` |
| 4 | AI Feedback Panel (Bottom Panel) | `docs/VSCODE_UX_PLAN_PART4.md` |
| 5-6 | AI Chat Panel + Command System | `docs/VSCODE_UX_PLAN_PART5_6.md` |
| 7-8 | Activity Bar, Status Bar, AI Agents | `docs/VSCODE_UX_PLAN_PART7_8.md` |
| 9 | Theme System & Visual Polish | `docs/VSCODE_UX_PLAN_PART9.md` |
| 10 | Implementation Roadmap | `docs/VSCODE_UX_PLAN_PART10.md` |

---

## Quick Start Checklist

```
□ Review all 10 parts of the plan
□ Set up feature flag infrastructure
□ Create /src/components/IDE/ directory structure
□ Begin with theme-tokens.css
□ Implement ThemeProvider
□ Build PanelContext
□ Iterate through phases
```

---

**Total Lines of Specification**: ~4,000+
**Components Defined**: 40+
**Hooks Defined**: 15+
**AI Agents**: 6
**Themes**: 5
**CSS Custom Properties**: 100+

This transformation will give SpectreWeave6 a professional, VS Code-inspired interface optimized for creative writing, with powerful AI assistance integrated throughout.
