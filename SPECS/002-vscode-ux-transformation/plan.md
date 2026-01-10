# Implementation Plan: VS Code UX Transformation

**Feature**: `002-vscode-ux-transformation`  
**Created**: 2026-01-10  
**Duration**: 12-16 weeks

---

## Timeline Overview

```
Week 1   2   3   4   5   6   7   8   9   10  11  12  13  14  15  16
├───┴───┴───┼───┴───┴───┴───┼───┴───┴───┼───┴───┴───┼───┴───┴───┤
│ Phase 1   │   Phase 2     │  Phase 3  │  Phase 4  │  Phase 5  │
│Foundation │  Core Panels  │  Editor   │ AI+Cmds   │  Polish   │
└───────────┴───────────────┴───────────┴───────────┴───────────┘
```

---

## Phase 1: Foundation (Weeks 1-3)

### Goal
Establish the design system and panel infrastructure that all subsequent components depend on.

### Week 1: Design System Setup

| Day | Task | Deliverable | Owner |
|-----|------|-------------|-------|
| 1-2 | Create theme token CSS | `src/styles/theme-tokens.css` | - |
| 2-3 | Implement ThemeProvider | `src/components/IDE/Theme/ThemeProvider.tsx` | - |
| 3-4 | Create 5 theme variants | Theme CSS in tokens file | - |
| 4-5 | Theme picker component | `src/components/IDE/Theme/ThemePicker.tsx` | - |

**Dependencies**: None (greenfield)

**Testing Checkpoint**:
```typescript
// tests/theme.spec.ts
test('Theme persistence across sessions');
test('System preference detection');
test('All 5 themes render correctly');
```

### Week 2: Panel System Infrastructure

| Day | Task | Deliverable |
|-----|------|-------------|
| 1-2 | Panel types and context | `src/components/IDE/PanelSystem/` |
| 2-3 | ResizablePanel component | Drag resize handles |
| 3-4 | Panel persistence | localStorage save/restore |
| 4-5 | Integration scaffold | Update entry point |

**Dependencies**: Theme system (Week 1)

**Key Files**:
```
src/components/IDE/PanelSystem/
├── types.ts
├── PanelContext.tsx
├── PanelProvider.tsx
├── ResizablePanel.tsx
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
| 4-5 | Status items | Word count, AI status, etc. |

**Dependencies**: Panel system (Week 2)

**Milestone Deliverable**: IDE shell renders with Activity Bar, empty panels, and Status Bar.

---

## Phase 2: Core Panels (Weeks 4-7)

### Goal
Build the three main panel contents: Story Explorer, Bottom Panel, and AI Chat.

### Week 4-5: Story Explorer (Left Panel)

| Task | Days | Priority |
|------|------|----------|
| Story tree data model | 1 | P0 |
| TreeView component | 2 | P0 |
| TreeItem component | 1 | P0 |
| Drag-and-drop | 2 | P1 |
| Context menus | 1 | P1 |
| Quick actions | 1 | P1 |
| useChapterNavigation integration | 1 | P0 |

**Migration Target**:
```typescript
// FROM: src/components/LeftNavigation/LeftNavigationView.tsx
// TO:   src/components/IDE/StoryExplorer/StoryExplorer.tsx
```

### Week 6: Bottom Panel (AI Feedback)

| Task | Days | Priority |
|------|------|----------|
| Panel structure + tabs | 1 | P0 |
| ProblemsPanel | 1 | P0 |
| useWritingProblems hook | 2 | P0 |
| Real-time analysis | 2 | P1 |
| Quick fix actions | 1 | P1 |

**Migration Target**:
```typescript
// FROM: src/components/editor/WritingFeedback.tsx
// TO:   src/components/IDE/BottomPanel/ProblemsPanel.tsx
```

### Week 7: AI Chat Panel (Right Panel)

See `SPECS/001-ai-chat-panel/plan.md` for detailed breakdown.

| Task | Days | Priority |
|------|------|----------|
| Refactor AIChatSidebar | 2 | P0 |
| Message streaming UI | 1 | P0 |
| Context pills | 2 | P1 |
| Quick actions | 1 | P1 |
| History persistence | 1 | P2 |

**Milestone Deliverable**: All three panels functional with basic features.

---

## Phase 3: Editor Enhancement (Weeks 8-10)

### Goal
Add VS Code-style tabs, breadcrumbs, and polish the writing surface.

### Week 8: Tab System

| Task | Days | Deliverable |
|------|------|-------------|
| Tab data model | 1 | `types/tabs.ts` |
| TabBar component | 2 | `IDE/EditorArea/EditorTabs.tsx` |
| Tab context menu | 1 | Close others, etc. |
| Dirty indicator | 0.5 | Unsaved dot |
| Keyboard nav | 0.5 | Ctrl+Tab |

### Week 9: Breadcrumbs + Navigation

| Task | Days | Deliverable |
|------|------|-------------|
| Breadcrumb component | 1 | `IDE/EditorArea/EditorBreadcrumb.tsx` |
| Document structure parser | 2 | Extract headings |
| Breadcrumb navigation | 1 | Click to navigate |
| Minimap | 2 | Canvas overview |
| Minimap highlighting | 1 | Current viewport |

### Week 10: Writing Surface Polish

| Task | Days | Priority |
|------|------|----------|
| Apply writing tokens | 1 | P0 |
| Typography refinement | 1 | P0 |
| Ghost text styling | 1 | P0 |
| Entity highlighting | 2 | P1 |
| Focus mode | 1 | P2 |

**Milestone Deliverable**: Full editor experience with tabs, breadcrumbs, minimap.

---

## Phase 4: AI & Commands (Weeks 11-13)

### Goal
Implement AI agent infrastructure and command palette.

### Week 11-12: AI Agent System

| Task | Days | Priority |
|------|------|----------|
| Agent registry | 1 | P0 |
| Agent interfaces | 1 | P0 |
| useAgentManager hook | 2 | P0 |
| Ghost Writer agent | 1 | P0 |
| Style Coach agent | 1 | P0 |
| Character Keeper | 1 | P1 |
| Plot Analyst | 1 | P1 |
| AIAgentsPanel UI | 2 | P1 |
| Task history | 1 | P2 |

**Integration Points**:
```typescript
// Leverage existing:
// - src/lib/ai/spectreWeaveAIBridge.ts
// - src/hooks/useAI.ts
```

### Week 13: Command Palette

| Task | Days | Priority |
|------|------|----------|
| Command registry | 1 | P0 |
| CommandPalette UI | 2 | P0 |
| Fuzzy search | 1 | P0 |
| Keyboard shortcuts | 1 | P0 |
| Context-aware commands | 1 | P1 |

**Milestone Deliverable**: Cmd+Shift+P opens command palette with AI and navigation commands.

---

## Phase 5: Polish & Migration (Weeks 14-16)

### Goal
Complete testing, migration, and documentation.

### Week 14: Data Layer

| Task | Days | Deliverable |
|------|------|-------------|
| StoryDocument schema | 2 | Type definitions |
| Serialization | 1 | Save/load logic |
| Export formats | 2 | DOCX, PDF, ePub |

### Week 15: Testing & QA

| Test Type | Scope | Coverage Target |
|-----------|-------|-----------------|
| Unit tests | Hooks, utilities | 80% |
| Component tests | IDE components | 70% |
| Integration tests | Panel interactions | Key flows |
| E2E tests | Critical workflows | 5-10 scenarios |
| Accessibility audit | WCAG 2.1 AA | Pass |
| Performance | Large docs (100k words) | <100ms updates |

**Critical E2E Workflows**:
1. New project → chapter writing → AI assistance
2. Character profile creation → manuscript integration
3. Full document export
4. Theme switching + persistence
5. Panel resize + persistence

### Week 16: Documentation & Launch

| Task | Days | Deliverable |
|------|------|-------------|
| User documentation | 2 | Usage guide |
| Developer docs | 1 | Architecture |
| Migration guide | 1 | From old UI |
| Bug triage | 2 | Critical fixes |

---

## Migration Strategy

### Approach: Incremental with Feature Flag

```typescript
// src/config/features.ts
export const FEATURE_FLAGS = {
  USE_NEW_IDE: process.env.NEXT_PUBLIC_USE_NEW_IDE === 'true',
};

// In app router
if (FEATURE_FLAGS.USE_NEW_IDE) {
  return <IDELayout {...props} />;
} else {
  return <LegacyLayout {...props} />;
}
```

### Migration Timeline

| Weeks | Approach | Flag State |
|-------|----------|------------|
| 1-7 | Parallel development | `USE_NEW_IDE=false` |
| 8-10 | Gradual component replacement | `USE_NEW_IDE=false` |
| 11-13 | Full switchover testing | `USE_NEW_IDE=true` |
| 14-16 | Legacy removal | Remove flag |

### Component Mapping

| Legacy Component | New Component |
|------------------|---------------|
| `LeftNavigationView.tsx` | `IDE/StoryExplorer/` |
| `WritingFeedback.tsx` | `IDE/BottomPanel/ProblemsPanel.tsx` |
| `AIChatSidebar.tsx` | `IDE/RightPanel/AIChatPanel.tsx` |
| Inline styles | CSS custom properties |
| Ad-hoc state | PanelContext |

---

## Risk Mitigation

### Risk 1: Performance with Large Documents

**Mitigation**: 
- Virtualized lists for tree views
- Debounced AI analysis
- Web worker for heavy computations

### Risk 2: Breaking Existing Workflows

**Mitigation**:
- Feature flag rollback
- Comprehensive E2E tests before switchover
- User feedback period with flag enabled

### Risk 3: Scope Creep

**Mitigation**:
- Strict adherence to YAGNI
- Weekly scope review
- Phase deliverables as hard checkpoints

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Theme switching works with persistence
- [ ] Panels resize with constraints
- [ ] Activity Bar toggles panels
- [ ] Status Bar shows basic info

### Phase 2 Complete When:
- [ ] Story Explorer shows manuscript structure
- [ ] Problems panel shows AI feedback
- [ ] AI Chat sends/receives messages

### Phase 3 Complete When:
- [ ] Tabs open/close/dirty indicator work
- [ ] Breadcrumbs show location
- [ ] Editor polish matches design

### Phase 4 Complete When:
- [ ] Command palette searches and executes
- [ ] AI agents can be invoked
- [ ] Keyboard shortcuts work

### Phase 5 Complete When:
- [ ] All critical E2E tests pass
- [ ] Accessibility audit passes
- [ ] Documentation complete
- [ ] Legacy code removed
