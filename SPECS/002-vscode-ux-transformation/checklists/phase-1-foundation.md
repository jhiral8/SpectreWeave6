# Phase 1 Checklist: Foundation

**Feature**: `002-vscode-ux-transformation`  
**Phase**: 1 - Foundation  
**Duration**: Weeks 1-3

---

## Week 1: Design System Setup

### Theme Tokens CSS
- [ ] Create `src/styles/theme-tokens.css`
- [ ] Define semantic color tokens (error, warning, info, success)
- [ ] Define focus/accent tokens
- [ ] Define typography tokens (font families, sizes)
- [ ] Define spacing scale (1-6)
- [ ] Define border radius tokens
- [ ] Define shadow tokens
- [ ] Define transition tokens
- [ ] Define z-index scale

### Theme Provider
- [ ] Create `src/components/IDE/Theme/ThemeProvider.tsx`
- [ ] Implement theme context with current theme ID
- [ ] Add system preference detection (`prefers-color-scheme`)
- [ ] Add localStorage persistence for theme choice
- [ ] Add `useTheme` hook export

### Theme Variants
- [ ] Spectre Dark theme (default)
- [ ] Spectre Light theme
- [ ] Midnight Writer theme
- [ ] Parchment theme
- [ ] Focus Mode theme

### Theme Picker
- [ ] Create `src/components/IDE/Theme/ThemePicker.tsx`
- [ ] Show all 5 theme options
- [ ] Preview swatch for each theme
- [ ] Keyboard accessible selection
- [ ] Smooth transition on change

### Testing
- [ ] Theme persistence test
- [ ] System preference detection test
- [ ] All themes render without error

---

## Week 2: Panel System Infrastructure

### Types & Interfaces
- [ ] Create `src/components/IDE/PanelSystem/types.ts`
- [ ] Define `PanelPosition` type
- [ ] Define `PanelId` type
- [ ] Define `PanelConfig` interface
- [ ] Define `PanelState` interface
- [ ] Define `PanelLayoutState` interface

### Panel Context
- [ ] Create `src/components/IDE/PanelSystem/PanelContext.tsx`
- [ ] Implement `PanelProvider` with `useReducer`
- [ ] Implement `togglePanel` action
- [ ] Implement `showPanel` action
- [ ] Implement `hidePanel` action
- [ ] Implement `resizePanel` action
- [ ] Implement `setActivePanel` action
- [ ] Export `usePanels` hook

### ResizablePanel Component
- [ ] Create `src/components/IDE/PanelSystem/ResizablePanel.tsx`
- [ ] Support `position` prop (left/right/bottom)
- [ ] Implement mouse drag resize
- [ ] Enforce `minSize` constraint
- [ ] Enforce `maxSize` constraint
- [ ] Add collapse animation
- [ ] Position-aware resize handles

### Persistence Hook
- [ ] Create `src/components/IDE/PanelSystem/hooks/usePanelPersistence.ts`
- [ ] Save layout to localStorage on change
- [ ] Restore layout from localStorage on mount
- [ ] Debounce saves (300ms)
- [ ] Handle missing/invalid stored data

### Testing
- [ ] Panel resize stays within constraints
- [ ] Panel state persists after refresh
- [ ] Panel collapse/expand works

---

## Week 3: Activity Bar + Status Bar

### Activity Bar
- [ ] Create `src/components/IDE/ActivityBar/ActivityBar.tsx`
- [ ] Render vertical icon strip (48px wide)
- [ ] Top section: main navigation items
- [ ] Bottom section: settings
- [ ] Connect to panel context

### Activity Bar Item
- [ ] Create `src/components/IDE/ActivityBar/ActivityBarItem.tsx`
- [ ] Icon rendering
- [ ] Active state (left border indicator)
- [ ] Badge support (number or dot)
- [ ] Tooltip on hover
- [ ] Click handler to toggle panel

### Activity Bar Config
- [ ] Create `src/components/IDE/ActivityBar/activityBarConfig.ts`
- [ ] Story Explorer item
- [ ] Characters item
- [ ] World Building item
- [ ] Search item
- [ ] AI Agents item
- [ ] Settings item

### Status Bar
- [ ] Create `src/components/IDE/StatusBar/StatusBar.tsx`
- [ ] Fixed height (22px)
- [ ] Blue background (VS Code style)
- [ ] Left-aligned items section
- [ ] Right-aligned items section

### Status Bar Items
- [ ] Create `src/components/IDE/StatusBar/WordCountStatus.tsx`
- [ ] Create `src/components/IDE/StatusBar/ChapterStatus.tsx`
- [ ] Create `src/components/IDE/StatusBar/AIStatus.tsx`
- [ ] Create `src/components/IDE/StatusBar/SyncStatus.tsx`

### Testing
- [ ] Activity Bar toggles panels correctly
- [ ] Active indicator shows on correct item
- [ ] Status bar items update in real-time

---

## Phase 1 Completion Criteria

### Functional
- [ ] Theme switching works between 5 themes
- [ ] Theme persists after page refresh
- [ ] All panels can be resized with drag
- [ ] Panel sizes persist after refresh
- [ ] Activity Bar correctly toggles panel visibility
- [ ] Status bar displays word count

### Technical
- [ ] No TypeScript errors
- [ ] No `any` types used
- [ ] All components < 300 lines
- [ ] CSS uses theme tokens (no hardcoded colors)

### Documentation
- [ ] Component JSDoc comments
- [ ] Types exported from index files
- [ ] Storybook stories (if applicable)

---

## Sign-off

| Reviewer | Date | Status |
|----------|------|--------|
| Developer | - | Pending |
| Lead | - | Pending |
