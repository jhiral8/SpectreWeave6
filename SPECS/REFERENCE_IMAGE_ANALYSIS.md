# VS Code Reference Image Analysis

> **Primary Image**: `image-1767821174386.png`  
> **Secondary Image**: Title Bar detail (showing Command Palette)  
> **Location**: User's desktop/attachments  
> **Purpose**: Primary visual reference for IDE rework

---

## Screenshot Breakdown

> ⚠️ **IMPORTANT**: These images show the **TARGET VS Code IDE** that SpectreWeave6 must replicate - NOT the current SpectreWeave6 state. Use these as the authoritative reference for all UI decisions.

The reference images show a VS Code IDE interface that SpectreWeave6 must match exactly. This document breaks down every visible element for implementation reference.

---

## 0. Title Bar (TOP - P0 PRIORITY)

**Observed from Secondary Reference Image**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ● ● ●   SpectreWeave   File Edit View ...   🔍 Command Palette ⌘K   ▾  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Properties**:
- Height: 30px
- Background: #3c3c3c (matches VS Code `titleBar.activeBackground`)
- Layout: Flexbox with space-between

**Sections (Left to Right)**:
1. **Window Controls** (macOS): Traffic light buttons (close/minimize/zoom)
2. **Platform Name**: "SpectreWeave" - bold, white text
3. **Menu Bar**: File, Edit, View, Characters, AI, Help
4. **Command Palette Search**: Centered search input with ⌘K hint
5. **User Account**: Profile dropdown (right edge)

**Command Palette Input**:
- Width: ~400px centered
- Placeholder: "🔍 Command Palette..."
- Keyboard shortcut visible: ⌘K (or ⌘P)
- Background: #3c3c3c (slightly darker than title bar)
- Border: 1px solid #454545
- Border-radius: 4px

**Implementation Notes**:
```
- Title bar is draggable area for window
- Search input opens full Command Palette modal on click
- Menu items use standard shortcuts
- This establishes brand identity - MUST be implemented
```

---

## 1. Activity Bar (Left Edge)

**Observed Properties**:
- Width: ~48px (standard VS Code)
- Background: Dark gray (#333333)
- Icons visible from top to bottom:
  1. 📁 Files (Explorer) - Active
  2. 🔍 Search
  3. 🤖 AI icon with badge "157"
  4. 📝 Writing/Document icon
  5. ⚙️ Settings (bottom)

**Sections Below Icons**:
- OUTLINE (collapsed)
- TIMELINE (collapsed)
- CONTAINERS
- IMAGES
- REGISTRIES
- NETWORKS
- VOLUMES

**Implementation Notes**:
```
- Active item has white left border indicator
- Badge shows "157" - indicates pending items
- Icons are ~24px, centered in 48px bar
- Hover state not visible but should lighten icon
```

---

## 2. Primary Sidebar (File Explorer)

**Header**: "OPEN EDITORS" with "50 unsaved" badge

**Visible Open Editors**:
```
📄 index.ts src/components/IDE/SearchPa...
📄 SearchPanel.tsx src/components/IDE/...
📄 index.ts src/components/IDE/Character...
📄 CharactersPanel.tsx src/components/I...
📄 page.tsx src/app/portal/writer/[docid]
🌐 Simple Browser
📄 StatusBar.tsx src/components/IDE/Stat...
📄 BottomPanel.tsx src/components/IDE/...
📄 ActivityBarItem.tsx src/components/IDE/A...
📄 ActivityBar.tsx src/components/IDE/Ac...
📄 globals.css src/app (with 9+, M indicators)
📄 vscode-layout.css src/styles (U indicator)
📄 image-1767821174386.png ~/Library...
```

**Project Section**: "SPECTREWEAVE6"
```
▼ src
  ▼ app
    ▼ portal
      ▼ writer
        ▼ [docid]
          📄 layout.tsx (M indicator)
    ▶ projects
    ▶ theme-demo
    # editor.css
    📄 error.tsx
    📄 force-dynamic.ts
    # globals.css (9+, M indicators)
    📄 layout.tsx
    📄 not-found.tsx
    📸 opengraph-image.png
    📄 page.tsx
    📄 robots.ts
  ▼ components
    ▶ admin
    ▶ AIChatSidebar
    ▶ auth
```

**Implementation Notes**:
```
- File icons indicate file type (ts, tsx, css, png)
- "M" badge = modified/unsaved
- "U" badge = untracked (git)
- "9+" badge = more than 9 changes
- Indentation shows folder hierarchy
- Folder icons: filled when expanded, outline when collapsed
- Truncation with "..." for long paths
```

---

## 3. Tab Bar

**Visible Tabs** (left to right):
```
1. ActivityBarItem.tsx (truncated)
2. ActivityBar.tsx (active)
3. # globals.css 9+, M (modified indicator)
4. # vscode-layout.css U (untracked)
5. 🖼️ image-1767821174386.png
```

**Observed Properties**:
- Height: ~35px
- Active tab: lighter background (#1e1e1e)
- Inactive tabs: darker (#2d2d2d)
- File icons match explorer
- Modified indicator: dot before close button
- Scroll arrows would appear if overflow

**Implementation Notes**:
```
- Tab shows file icon + filename
- Active tab has no bottom border (seamless with editor)
- Close button (×) on hover
- Tab can show dirty state (●)
- Drag to reorder supported
```

---

## 4. Editor Area

**Breadcrumb Path**:
```
src > app > # globals.css > ...
```

**Visible Content** (globals.css):
```css
1  @tailwind base;
2  @tailwind components;
3  @tailwind utilities;
4
5
6  @import '../styles/theme.css';
7  @import '../styles/theme-tokens.css';
8  @import '../styles/vscode-layout.css';
9  @import '../styles/writing-surface.css';
10 @import '../styles/animations.css';
11 @import '../styles/ide-polish.css';
12
13 @import './editor.css';
14 @import '../styles/bubble-menu-fixes.css';
15 @import '../styles/layout-safety.css';
16 @import '../styles/ai-border-effects.css';
17 @import '../styles/futuristic-surface-override.css';
18 @import '../styles/floating-action-buttons.css';
19 @import '../styles/dashboard-dark-theme.css';
20
21 /* Contextual Peek Highlight */
22 .peek-highlight {
23   animation: peek-pulse 2s ease-in-out;
24   border-radius: 0.5rem;
25 }
26
27 @keyframes peek-pulse {
28   0% {
29     background-color: transparent;
30     box-shadow: 0 0 0 0 rgba(147, 51, 234, 0);
31   }
32   20% {
33     background-color: rgba(147, 51, 234, 0.1);
34     box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.2);
35   }
...
```

**Observed Properties**:
- Line numbers: gray (#858585)
- Current line: highlighted background
- Syntax highlighting:
  - `@tailwind`, `@import` - purple (keyword)
  - Strings in quotes - orange
  - Comments - green
  - Properties - light blue
  - Values - various colors

**Implementation Notes**:
```
- Line numbers right-aligned
- Current line number brighter
- Gutter is ~50px wide (5 characters)
- No minimap visible in this screenshot
- Editor font: monospace (likely Consolas or Monaco)
- Font size: ~13px
```

---

## 5. Bottom Panel

**Tab Bar**:
```
[PROBLEMS 54] [OUTPUT] [DEBUG CONSOLE] [TERMINAL] [PORTS]
```

**Active Tab**: TERMINAL

**Terminal Content**:
```
zsh prompt showing:
jhiral@Craigs-MacBook-Air SpectreWeave6 %
```

**Panel Actions** (right side):
- Split terminal icon
- Kill terminal icon
- Maximize/restore icon
- Close panel icon

**Implementation Notes**:
```
- PROBLEMS has badge "54" (error count)
- Active tab has underline indicator
- Terminal shows zsh shell
- Height is resizable (drag border)
- Multiple terminal instances supported
```

---

## 6. Secondary Sidebar (Chat Panel)

**Header**: "CHAT" with close button

**Current State**:
```
/speckit.constitution prompt visible
Text: "Create a constitution with common UX standards..."

Working indicator: "⟳ Working..."

Context chips at bottom:
- # globals.css +

Agent selector: "Claude Opus 4.5 ▾"
```

**Implementation Notes**:
```
- Header has "CHAT" title
- Slash command visible (/speckit.constitution)
- User message in bubble
- Working spinner animation
- Context chip shows attached file
- Agent dropdown at bottom
- Input area below (not fully visible)
```

---

## 7. Status Bar

**Left Section**:
```
🔀 main*+ | ⊙ 51 | ⚠ 13
```

**Right Section**:
```
Ln 19, Col 1 | Spaces: 2 | UTF-8 | LF | {} CSS
```

**Observed Properties**:
- Background: Blue (#007acc)
- Height: 22px
- Font size: 12px
- Icons inline with text

**Status Items**:
| Position | Content | Meaning |
|----------|---------|---------|
| Left | `main*+` | Git branch with changes |
| Left | `⊙ 51` | 51 errors |
| Left | `⚠ 13` | 13 warnings |
| Right | `Ln 19, Col 1` | Cursor position |
| Right | `Spaces: 2` | Indentation |
| Right | `UTF-8` | File encoding |
| Right | `LF` | Line endings |
| Right | `{} CSS` | Language mode |

---

## 8. Color Palette Extracted

From the reference image:

```css
/* Backgrounds */
--bg-activitybar: #333333;
--bg-sidebar: #252526;
--bg-editor: #1e1e1e;
--bg-panel: #1e1e1e;
--bg-statusbar: #007acc;
--bg-tab-active: #1e1e1e;
--bg-tab-inactive: #2d2d2d;

/* Foregrounds */
--fg-primary: #cccccc;
--fg-secondary: #858585;
--fg-active: #ffffff;
--fg-inactive: #ffffff80;

/* Accents */
--accent-blue: #007acc;
--accent-purple: rgba(147, 51, 234, 1);
--accent-orange: #ce9178;
--accent-green: #6a9955;

/* Borders */
--border-subtle: #80808059;
--border-active: #ffffff;
```

---

## 9. Exact Measurements

Based on VS Code standards and image analysis:

| Element | Measurement |
|---------|-------------|
| Activity Bar width | 48px |
| Sidebar width | ~250px (resizable) |
| Tab bar height | 35px |
| Breadcrumb height | 22px |
| Panel height | ~150px (resizable) |
| Status bar height | 22px |
| Line number gutter | ~50px |
| Tree item height | 22px |
| Tree indentation | 8px per level |
| Icon size | 16px |
| Font size (editor) | 13px |
| Font size (UI) | 13px |
| Font size (status) | 12px |

---

## 10. Implementation Checklist

Use this checklist when implementing each section:

### Activity Bar
- [ ] Exactly 48px wide
- [ ] Icons centered (24px)
- [ ] Active indicator (white left border)
- [ ] Badge support with count
- [ ] Hover state
- [ ] Tooltip on hover

### Sidebar
- [ ] Resizable (170px - 500px)
- [ ] Section headers collapsible
- [ ] Tree view with icons
- [ ] File badges (M, U, 9+)
- [ ] Selection highlight
- [ ] Context menu on right-click

### Tab Bar
- [ ] 35px height
- [ ] File icon + name
- [ ] Modified indicator (●)
- [ ] Close button on hover
- [ ] Active tab styling
- [ ] Drag to reorder

### Editor
- [ ] Line numbers (right-aligned)
- [ ] Current line highlight
- [ ] Syntax highlighting
- [ ] Breadcrumb navigation
- [ ] Gutter decorations

### Panel
- [ ] Resizable height
- [ ] Tab bar with badges
- [ ] Multiple panel types
- [ ] Close/maximize buttons

### Status Bar
- [ ] 22px height
- [ ] Blue background
- [ ] Left/right sections
- [ ] Clickable items
- [ ] Icon support

---

## Reference Commands

To view the reference image during development:

```bash
# Open the reference image
open ~/Desktop/image-1767821174386.png

# Or if stored in project
open ./SPECS/reference-images/vscode-reference.png
```

---

*This document should be consulted frequently during implementation. Every pixel matters for VS Code authenticity.*
