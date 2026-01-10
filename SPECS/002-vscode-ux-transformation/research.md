# Research: VS Code UX Transformation

**Feature**: `002-vscode-ux-transformation`  
**Created**: 2026-01-10

---

## Source Documentation Analysis

This specification was synthesized from the following source documents in `/docs/`:

### Document Summary

| Document | Content | Lines |
|----------|---------|-------|
| `VSCODE_UX_TRANSFORMATION_PLAN.md` | Executive summary, architecture overview, Part 1 panel system | 543 |
| `VSCODE_UX_PLAN_PART2.md` | Story Explorer (left panel) | 1298 |
| `VSCODE_UX_PLAN_PART3.md` | Main Editor enhancements | 1124 |
| `VSCODE_UX_PLAN_PART4.md` | AI Feedback Panel (bottom) | 1356 |
| `VSCODE_UX_PLAN_PART5_6.md` | AI Chat Panel + Command System | 1481 |
| `VSCODE_UX_PLAN_PART7_8.md` | Activity Bar, Status Bar, AI Agent System | 1314 |
| `VSCODE_UX_PLAN_PART9.md` | Theme System & Visual Polish | 1246 |
| `VSCODE_UX_PLAN_PART10.md` | Implementation Roadmap & Migration | 631 |

**Total**: ~9,000 lines of documentation consolidated into this spec.

---

## VS Code UX Patterns Referenced

### 1. Layout Structure

VS Code's layout is the template:
- **Activity Bar**: 48px wide vertical icon strip
- **Primary Sidebar**: 200-500px resizable tree view
- **Editor Group**: Central area with tabs
- **Panel**: Bottom resizable area (Problems, Output, Terminal)
- **Secondary Sidebar**: Optional right panel
- **Status Bar**: 22px fixed bottom strip

### 2. Interaction Patterns

- **Click Activity Bar**: Toggle sidebar or switch view
- **Drag resize handles**: Resize panels with constraints
- **Cmd+Shift+P**: Open command palette
- **Ctrl+Tab**: Cycle through tabs
- **Ctrl+B**: Toggle primary sidebar

### 3. Visual Language

- **Active indicator**: 2px left border on Activity Bar
- **Dirty indicator**: Dot on tab title
- **Badge counts**: Notification bubbles on icons
- **Hover states**: Subtle background changes
- **Focus rings**: Blue 1px outlines

---

## Existing Codebase Analysis

### Components to Migrate

| Existing | Purpose | Migration Target |
|----------|---------|------------------|
| `LeftNavigationView.tsx` | Chapter list | `StoryExplorer` |
| `WritingFeedback.tsx` | AI feedback | `ProblemsPanel` |
| `AIChatSidebar.tsx` | AI chat | `AIChatPanel` |
| `DualBlockEditor.tsx` | Editor wrapper | `IDELayout` integration |

### Hooks to Leverage

| Hook | Purpose | Integration |
|------|---------|-------------|
| `useChapterNavigation` | Parse chapters | Story tree data |
| `useAI` | AI requests | Agent system |
| `useFramework` | Framework data | World/characters |
| `useBlockEditor` | TipTap instance | Editor area |

### Contexts Available

| Context | Purpose | Usage |
|---------|---------|-------|
| `UnifiedEditorContext` | Editor instances | All panels needing editor |
| `ProjectContext` | Project data | Story Explorer |
| `ThemeContext` | Theme state | (New context for this feature) |

---

## Technical Decisions

### Decision 1: Panel State Management

**Options Considered**:
1. Zustand store
2. React Context + useReducer
3. URL state

**Decision**: React Context + useReducer

**Rationale**:
- Constitution prohibits Redux-style global stores
- Context is sufficient for panel state
- Persistence via localStorage hook
- Aligns with existing patterns

### Decision 2: CSS Theming Approach

**Options Considered**:
1. Tailwind config themes
2. CSS custom properties
3. CSS-in-JS

**Decision**: CSS custom properties

**Rationale**:
- Constitution prohibits CSS-in-JS
- Custom properties allow runtime switching
- Works with existing Tailwind setup
- VS Code uses similar approach

### Decision 3: Tree View Implementation

**Options Considered**:
1. `react-arborist` library
2. Custom implementation
3. VS Code's tree view component (web port)

**Decision**: Custom implementation

**Rationale**:
- Story-specific metadata needs
- AI status indicators per node
- Full control over styling
- Avoid external dependencies

---

## Performance Considerations

### Large Document Handling

Documents may reach 100,000+ words. Strategies:

1. **Virtualized tree rendering** for Story Explorer
2. **Debounced AI analysis** (500ms after typing stops)
3. **Web worker** for problem detection
4. **Incremental updates** rather than full re-analysis

### Panel Resize Performance

1. Use CSS transforms during drag, not layout properties
2. Limit re-renders to resize handler component
3. Persist final size on mouse up, not during drag

---

## Accessibility Requirements

### Keyboard Navigation

- All panels keyboard accessible
- Tab order follows visual order
- Arrow keys navigate trees
- Escape closes overlays

### Screen Reader Support

- Proper ARIA roles on panels
- Announce panel visibility changes
- Describe tree structure hierarchically

### Focus Management

- Focus trapped in command palette
- Visible focus indicators
- Focus returned to trigger on modal close

---

## Related Specifications

- `SPECS/001-ai-chat-panel/` - Detailed AI Chat Panel spec
- `CONSTITUTION.md` - Development standards
- `VSCODE_IDE_TASKS.md` - Additional task tracking

---

## Open Questions

### Resolved

1. **Q**: Should we use a UI component library for panels?
   **A**: No, custom implementation for full control.

2. **Q**: How to handle mobile/tablet layouts?
   **A**: Out of scope for initial implementation. IDE is desktop-focused.

### Pending

1. **Q**: Should breadcrumbs support keyboard dropdown navigation?
   **A**: TBD - implement basic version first.

2. **Q**: Command palette recent commands - how many to store?
   **A**: TBD - start with 10, adjust based on UX testing.
