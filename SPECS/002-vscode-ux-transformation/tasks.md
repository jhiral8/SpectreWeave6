# Tasks: VS Code UX Transformation

**Feature**: `002-vscode-ux-transformation`  
**Created**: 2026-01-10

---

## Phase 1: Foundation (Weeks 1-3)

### Week 1: Design System Setup

- [ ] **T1.1** Create theme token CSS file (`src/styles/theme-tokens.css`)
  - Define semantic color tokens (error, warning, info, success)
  - Define typography tokens
  - Define spacing scale
  - Define z-index scale

- [ ] **T1.2** Implement ThemeProvider (`src/components/IDE/Theme/ThemeProvider.tsx`)
  - React context for theme state
  - System preference detection
  - Theme persistence to localStorage

- [ ] **T1.3** Create theme variants
  - Spectre Dark (default)
  - Spectre Light
  - Midnight Writer
  - Parchment
  - Focus Mode

- [ ] **T1.4** Create ThemePicker component
  - Preview for each theme
  - Keyboard accessible selection
  - Smooth transition animation

### Week 2: Panel System Infrastructure

- [ ] **T2.1** Create panel types and interfaces (`src/components/IDE/PanelSystem/types.ts`)
  - PanelPosition type
  - PanelId type
  - PanelConfig interface
  - PanelState interface
  - PanelLayoutState interface

- [ ] **T2.2** Create PanelContext and PanelProvider
  - Central panel state management
  - Actions: togglePanel, showPanel, hidePanel, resizePanel
  - Queries: isPanelVisible, getActivePanel

- [ ] **T2.3** Create ResizablePanel component
  - Mouse drag resize
  - Min/max constraints
  - Collapse animation
  - Position-aware handles (left/right/bottom)

- [ ] **T2.4** Create usePanelPersistence hook
  - Save layout to localStorage
  - Restore layout on mount
  - Debounced saves

### Week 3: Activity Bar + Status Bar

- [ ] **T3.1** Create ActivityBar component
  - Vertical icon strip layout
  - Top items (Story, Characters, World, Search, AI)
  - Bottom items (Settings)

- [ ] **T3.2** Create ActivityBarItem component
  - Icon display
  - Active indicator (left border)
  - Badge support (count or dot)
  - Tooltip on hover

- [ ] **T3.3** Create StatusBar component
  - Fixed bottom strip
  - Left-aligned items
  - Right-aligned items
  - Blue background (VS Code style)

- [ ] **T3.4** Create status bar items
  - WordCountStatus
  - ChapterStatus
  - AIStatus
  - SyncStatus

---

## Phase 2: Core Panels (Weeks 4-7)

### Week 4-5: Story Explorer

- [ ] **T4.1** Create StoryExplorer component
  - Tab switching (Manuscript, Characters, World, Notes)
  - Search input
  - Toolbar actions

- [ ] **T4.2** Create StoryTree component
  - Generic tree view
  - Expand/collapse logic
  - Keyboard navigation

- [ ] **T4.3** Create TreeItem component
  - Icon + label display
  - Expand arrow
  - Selection state
  - AI status indicator

- [ ] **T4.4** Create ManuscriptTree
  - Parse chapters from editor
  - Extract scenes/sections
  - Show word counts

- [ ] **T4.5** Implement drag-and-drop reordering
  - Drag handle on items
  - Drop zone indicators
  - Reorder callback

- [ ] **T4.6** Implement context menus
  - Right-click menu
  - Rename, Delete, Duplicate actions
  - Add Child action

- [ ] **T4.7** Create useStoryStructure hook
  - Parse framework editor content
  - Extract character/location/note trees
  - Real-time sync with editor changes

### Week 6: Bottom Panel

- [ ] **T6.1** Create BottomPanel container
  - Tab bar (Problems, AI Output, Story Analysis, History)
  - Badge counts per tab
  - Maximize/minimize controls

- [ ] **T6.2** Create ProblemsPanel
  - Problem list with severity icons
  - Filtering by severity
  - Click to navigate

- [ ] **T6.3** Create useWritingProblems hook
  - Background text analysis
  - Debounced analysis
  - Problem severity classification

- [ ] **T6.4** Create AIOutputPanel
  - Generation log display
  - Timestamp formatting
  - Clear button

- [ ] **T6.5** Create StoryAnalysisPanel
  - Pacing analysis
  - Character consistency
  - Plot coherence metrics

### Week 7: AI Chat Panel

See `SPECS/001-ai-chat-panel/tasks.md` for detailed AI Chat tasks.

- [ ] **T7.1** Refactor AIChatSidebar to VS Code style
- [ ] **T7.2** Add context awareness bar
- [ ] **T7.3** Implement message streaming UI
- [ ] **T7.4** Add Insert/Copy/Regenerate actions
- [ ] **T7.5** Create quick action buttons

---

## Phase 3: Editor Enhancement (Weeks 8-10)

### Week 8: Tab System

- [ ] **T8.1** Create EditorTabs component
  - Horizontal tab bar
  - Drag-to-reorder
  - Close button per tab

- [ ] **T8.2** Create useEditorTabs hook
  - Tab state management
  - Open/close/activate
  - Dirty state tracking

- [ ] **T8.3** Implement tab context menu
  - Close Others
  - Close to the Right
  - Pin/Unpin

- [ ] **T8.4** Add keyboard navigation
  - Ctrl+Tab cycle
  - Ctrl+W close
  - Ctrl+1-9 quick switch

### Week 9: Breadcrumbs + Navigation

- [ ] **T9.1** Create EditorBreadcrumb component
  - Path display
  - Clickable segments
  - Dropdown menus

- [ ] **T9.2** Create useEditorBreadcrumb hook
  - Parse document structure
  - Track cursor position
  - Generate path items

- [ ] **T9.3** Create MiniMap component
  - Canvas render of document
  - Viewport indicator
  - Click to scroll

### Week 10: Writing Surface Polish

- [ ] **T10.1** Apply writing-surface theme tokens
  - Typography refinement
  - Entity highlighting colors
  - Ghost text styling

- [ ] **T10.2** Implement focus mode refinements
  - Paragraph dimming
  - Typewriter scrolling
  - Distraction-free sidebar collapse

---

## Phase 4: AI & Commands (Weeks 11-13)

### Week 11-12: AI Agent System

- [ ] **T11.1** Create agent type definitions
- [ ] **T11.2** Create AgentRegistry
- [ ] **T11.3** Create useAgentManager hook
- [ ] **T11.4** Implement Ghost Writer agent
- [ ] **T11.5** Implement Style Coach agent
- [ ] **T11.6** Implement Character Keeper agent
- [ ] **T11.7** Implement Plot Analyst agent
- [ ] **T11.8** Create AIAgentsPanel UI

### Week 13: Command Palette

- [ ] **T13.1** Create CommandRegistry
  - Register/unregister commands
  - Category organization
  - Shortcut mapping

- [ ] **T13.2** Create CommandPalette component
  - Modal overlay
  - Search input
  - Results list
  - Keyboard navigation

- [ ] **T13.3** Implement fuzzy search
  - Score-based ranking
  - Highlight matching characters

- [ ] **T13.4** Register core commands
  - Navigation commands
  - View commands
  - AI commands
  - File commands

- [ ] **T13.5** Implement keyboard shortcuts
  - Global shortcut listener
  - Conflict detection
  - Customizable bindings

---

## Phase 5: Polish & Migration (Weeks 14-16)

### Week 14: Data Layer

- [ ] **T14.1** Define StoryDocument schema
- [ ] **T14.2** Implement document serialization
- [ ] **T14.3** Add export formats (DOCX, PDF, ePub)

### Week 15: Testing

- [ ] **T15.1** Write unit tests for hooks
- [ ] **T15.2** Write component tests
- [ ] **T15.3** Write E2E tests for critical workflows
- [ ] **T15.4** Run accessibility audit
- [ ] **T15.5** Performance testing with large documents

### Week 16: Documentation & Launch

- [ ] **T16.1** Write user documentation
- [ ] **T16.2** Write developer documentation
- [ ] **T16.3** Create migration guide
- [ ] **T16.4** Final bug triage and fixes
- [ ] **T16.5** Remove legacy code (if stable)

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| P0 | Must have for MVP |
| P1 | Important for complete experience |
| P2 | Nice to have, can defer |

---

## Dependencies Graph

```
Theme System (T1.*)
    │
    ▼
Panel System (T2.*)
    │
    ├──▶ Activity Bar (T3.1, T3.2)
    │
    ├──▶ Status Bar (T3.3, T3.4)
    │
    ├──▶ Story Explorer (T4.*)
    │
    ├──▶ Bottom Panel (T6.*)
    │
    └──▶ Editor Area (T8.*, T9.*)
              │
              ▼
         Command Palette (T13.*)
```
