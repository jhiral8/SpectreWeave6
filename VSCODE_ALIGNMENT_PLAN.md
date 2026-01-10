# SpectreWeave6 VS Code Alignment Plan

## Overview

This document outlines a plan to align SpectreWeave6's UI with VS Code's design patterns, using:
- **VS Code UX Guidelines**: https://code.visualstudio.com/api/ux-guidelines/overview
- **code-server**: https://github.com/coder/code-server (VS Code running in browser)

## VS Code Architecture (Our Target)

Based on the UX guidelines, VS Code has these core containers:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Title Bar                                 │
├────┬──────────────────────┬────────────────────┬────────────────┤
│ A  │                      │                    │ Secondary      │
│ c  │    Primary           │     Editor         │ Sidebar        │
│ t  │    Sidebar           │     Area           │ (AI Copilot    │
│ i  │    (Explorer,        │                    │  Panel here)   │
│ v  │     Search,          │                    │                │
│ i  │     StoryExplorer)   │                    │                │
│ t  │                      │                    │                │
│ y  ├──────────────────────┴────────────────────┴────────────────┤
│    │                       Panel                                 │
│ B  │              (Problems, Output, Terminal)                   │
│ a  │                                                             │
│ r  ├────────────────────────────────────────────────────────────┤
│    │                     Status Bar                              │
└────┴────────────────────────────────────────────────────────────┘
```

## Current SpectreWeave6 Structure (What We Have)

We already have most of this! Our `IDEShell` component mirrors this structure:
- `ActivityBar` ✅ (left icons)
- `Primary Sidebar` ✅ (StoryExplorer, etc.)
- `Editor Area` ✅ (TipTap editor with tabs)
- `Secondary Sidebar/Right Panel` ✅ (AICopilotPanel)
- `Bottom Panel` ✅ (Problems, AI feedback)
- `Status Bar` ✅

## Key Improvements Needed

### 1. CSS Variable System (Like code-server)

code-server uses CSS custom properties with `light-dark()` function. We should adopt similar patterns:

```css
/* From code-server's global.css */
:root {
  color-scheme: light dark;
}

body {
  background: light-dark(rgb(244, 247, 252), #111827);
  color: light-dark(#111, #ddd);
}
```

**Our current system uses:**
```css
--ide-bg
--ide-foreground
--ide-border
--ide-accent
```

**Recommended enhancement:**
```css
/* Base VS Code colors */
--vscode-editor-background
--vscode-editor-foreground
--vscode-sideBar-background
--vscode-sideBar-foreground
--vscode-activityBar-background
--vscode-activityBar-foreground
--vscode-panel-background
--vscode-statusBar-background
--vscode-input-background
--vscode-input-foreground
--vscode-input-border
--vscode-button-background
--vscode-button-foreground
--vscode-list-hoverBackground
--vscode-list-activeSelectionBackground
```

### 2. AI Chat Panel (Secondary Sidebar)

VS Code's Copilot Chat uses the **Secondary Sidebar** pattern. Our `AICopilotPanel` should:

#### Layout
```
┌────────────────────────────────┐
│ [Mode Tabs: Discuss|Write|...]│
├────────────────────────────────┤
│ Model: [Dropdown ▼]            │
├────────────────────────────────┤
│                                │
│    Chat Messages Area          │
│    (scrollable)                │
│                                │
│                                │
├────────────────────────────────┤
│ ┌────────────────────────────┐ │
│ │ @ context chips            │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ Type your message...       │ │
│ │                      [Send]│ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

#### VS Code Copilot Chat Features to Implement:
1. **@ mentions** for context (files, symbols, selections)
2. **/ slash commands** for actions
3. **Model selector** at top
4. **Context chips** showing what's included
5. **Streaming responses** with animated typing
6. **Code blocks** with copy/insert buttons
7. **Collapsible responses** for long content

### 3. Activity Bar Icons

VS Code standard icons for Activity Bar:
- Explorer (files icon)
- Search (magnifying glass)
- Source Control (branch icon)
- Run & Debug (play with bug)
- Extensions (blocks)

**Our writing-focused equivalents:**
- 📁 Story Explorer (chapters, scenes)
- 🔍 Search
- 👥 Characters
- 🗺️ World Building
- ✨ AI Agents
- ⚙️ Settings

### 4. Command Palette

VS Code's Command Palette (`Cmd+Shift+P`) pattern:
- Quick input at top center
- Fuzzy search through commands
- Shows keyboard shortcuts
- Categories (>, @, #, etc.)

We have `CommandPalette` - ensure it matches VS Code's behavior:
```
┌─────────────────────────────────────────────┐
│ > Show All Commands                         │
├─────────────────────────────────────────────┤
│ 🔍 Toggle Side Bar            ⌘B            │
│ 📁 Open File                  ⌘O            │
│ ✨ AI: Generate Chapter       ⌘⇧G           │
│ 👤 Character: Create New      ⌘⇧C           │
└─────────────────────────────────────────────┘
```

### 5. Editor Tabs

VS Code tab behavior:
- Tabs show file icons
- Modified indicator (dot)
- Close button on hover
- Tab context menu
- Pin tabs
- Split editor groups

Our `EditorTabs` should match:
```
┌─────────────────────────────────────────────────────────────┐
│ [📄 Chapter 1] [📄 Chapter 2 •] [📊 Framework] [x]         │
└─────────────────────────────────────────────────────────────┘
```

### 6. Problems Panel (Bottom)

VS Code Problems panel pattern:
```
┌─────────────────────────────────────────────────────────────┐
│ PROBLEMS  OUTPUT  DEBUG CONSOLE  TERMINAL                   │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ 2 Warnings  ❌ 0 Errors  ℹ️ 1 Info                       │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ Passive voice detected (line 42)                         │
│    Chapter 1 > Paragraph 4                                   │
│ ⚠️ Consider stronger verb (line 15)                          │
│    Chapter 1 > Paragraph 2                                   │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: CSS Variable Alignment (1-2 days)
1. Create `src/styles/vscode-theme.css` with VS Code-compatible variables
2. Map our existing `--ide-*` variables to VS Code equivalents
3. Add light/dark mode using `light-dark()` CSS function
4. Test all components with new variables

### Phase 2: Activity Bar Polish (1 day)
1. Match VS Code icon sizes (22x22)
2. Add tooltip on hover
3. Add active indicator (left border)
4. Add badge support (notification counts)

### Phase 3: AI Chat Panel Overhaul (3-4 days)
1. Implement @ mention context system
2. Add slash commands (/)
3. Improve streaming UI
4. Add code block rendering with actions
5. Match VS Code Copilot Chat styling exactly

### Phase 4: Command Palette Enhancement (1-2 days)
1. Add fuzzy search
2. Add command categories
3. Show recent commands
4. Add keyboard shortcut display

### Phase 5: Editor Tabs & Status Bar (1-2 days)
1. Add file type icons to tabs
2. Add modified indicator
3. Status bar items positioning
4. Add word count, line count to status bar

## CSS Theme Reference

Based on VS Code's default dark theme:

```css
:root {
  /* Editor */
  --vscode-editor-background: #1e1e1e;
  --vscode-editor-foreground: #d4d4d4;
  
  /* Sidebar */
  --vscode-sideBar-background: #252526;
  --vscode-sideBar-foreground: #cccccc;
  --vscode-sideBarTitle-foreground: #bbbbbb;
  --vscode-sideBarSectionHeader-background: #383838;
  
  /* Activity Bar */
  --vscode-activityBar-background: #333333;
  --vscode-activityBar-foreground: #ffffff;
  --vscode-activityBar-inactiveForeground: #ffffff66;
  --vscode-activityBarBadge-background: #007acc;
  --vscode-activityBarBadge-foreground: #ffffff;
  
  /* Tabs */
  --vscode-tab-activeBackground: #1e1e1e;
  --vscode-tab-activeForeground: #ffffff;
  --vscode-tab-inactiveBackground: #2d2d2d;
  --vscode-tab-inactiveForeground: #ffffff80;
  
  /* Panel */
  --vscode-panel-background: #1e1e1e;
  --vscode-panelTitle-activeForeground: #e7e7e7;
  --vscode-panelTitle-inactiveForeground: #e7e7e799;
  
  /* Status Bar */
  --vscode-statusBar-background: #007acc;
  --vscode-statusBar-foreground: #ffffff;
  
  /* Input */
  --vscode-input-background: #3c3c3c;
  --vscode-input-foreground: #cccccc;
  --vscode-input-border: #3c3c3c;
  --vscode-inputOption-activeBorder: #007acc;
  
  /* Lists */
  --vscode-list-hoverBackground: #2a2d2e;
  --vscode-list-activeSelectionBackground: #094771;
  --vscode-list-activeSelectionForeground: #ffffff;
  
  /* Buttons */
  --vscode-button-background: #0e639c;
  --vscode-button-foreground: #ffffff;
  --vscode-button-hoverBackground: #1177bb;
  
  /* Borders */
  --vscode-contrastBorder: transparent;
  --vscode-focusBorder: #007fd4;
}
```

## code-server Reference

Key files from code-server to reference:
- `src/browser/pages/global.css` - Base styles with light-dark()
- `src/browser/pages/login.css` - Form input styling
- `src/node/routes/vscode.ts` - How they inject into VS Code

## Files to Create/Modify

### New Files
- `src/styles/vscode-variables.css` - VS Code CSS variables
- `src/styles/vscode-components.css` - Component-specific styles
- `src/components/IDE/CopilotChat/` - New chat implementation

### Files to Modify
- `src/components/IDE/index.ts` - Export new components
- `src/components/IDE/IDEShell.tsx` - Apply new styling
- `src/components/IDE/ActivityBar/` - Match VS Code exactly
- `src/components/IDE/AICopilotPanel/` - Major overhaul
- `src/components/IDE/Theme/ThemeProvider.tsx` - Add VS Code variables
- `src/app/globals.css` - Import VS Code styles

## Next Steps

1. **Approve this plan** - Review and confirm direction
2. **Create CSS foundation** - VS Code variables and base styles
3. **Iterate on AI Chat** - This is the most impactful change
4. **Polish other components** - Activity bar, tabs, panels
5. **Test thoroughly** - Ensure consistent look across all pages

## Resources

- VS Code UX Guidelines: https://code.visualstudio.com/api/ux-guidelines/overview
- VS Code Theme Color Reference: https://code.visualstudio.com/api/references/theme-color
- code-server source: https://github.com/coder/code-server
- VS Code source (reference): https://github.com/microsoft/vscode

---

*This plan transforms SpectreWeave6 into a familiar, professional IDE experience that writers and developers will find intuitive.*
