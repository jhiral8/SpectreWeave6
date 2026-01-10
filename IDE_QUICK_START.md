# SpectreWeave IDE - Quick Start Guide

## 🎨 Theme System

### Available Themes

1. **Spectre Dark** (Default)
   - Modern GitHub-inspired dark theme
   - Blue accent (#0078d4)
   - Best for: All-day writing

2. **Spectre Light**
   - Clean high-contrast light theme
   - Blue accent (#0969da)
   - Best for: Daytime writing, high ambient light

3. **Midnight Writer**
   - Ultra-dark with warm accents
   - Orange accent (#ffb454)
   - Best for: Late night writing sessions

4. **Parchment**
   - Warm sepia tones
   - Red accent (#9d0006)
   - Best for: Historical fiction, nostalgic feel

5. **Focus Mode**
   - Black chrome, bright editor
   - Monochrome UI
   - Best for: Maximum concentration

### Switching Themes

**Via Settings Panel**:
1. Click Settings icon in Activity Bar (bottom)
2. Select theme from visual picker
3. Theme persists across sessions

**Via Code**:
```typescript
import { useTheme } from '@/components/IDE';

function MyComponent() {
  const { theme, setTheme, toggleTheme } = useTheme();
  
  // Switch to specific theme
  setTheme('midnight-writer');
  
  // Toggle between light/dark
  toggleTheme();
}
```

## 🎛️ Panel System

### Panel Positions

```
┌──┬────────┬─────────┬───┐
│A │  Left  │ Editor  │ R │
│C │ Panel  │         │ i │
│T │        │         │ g │
│  │        ├─────────┤ h │
│B │        │ Bottom  │ t │
│A │        │  Panel  │   │
│R │        │         │   │
├──┴────────┴─────────┴───┤
│      Status Bar          │
└──────────────────────────┘
```

### Activity Bar Icons

| Icon | Panel | Description |
|------|-------|-------------|
| 📖 | Story Explorer | Manuscript chapters & structure |
| 👤 | Characters | Character profiles & tracking |
| 🌍 | World Building | Locations, cultures, rules |
| 🔍 | Search | Find across project |
| 🤖 | AI Agents | AI writing assistants |
| ⚙️ | Settings | Theme, preferences |

### Panel Interactions

**Open/Close Panel**:
- Click Activity Bar icon
- Panel opens on left side
- Click again to toggle off

**Resize Panel**:
1. Hover over panel edge (cursor changes to resize)
2. Click and drag to desired size
3. Size persists in localStorage

**Keyboard Shortcuts** (Coming):
- `Cmd+B` - Toggle left panel
- `Cmd+J` - Toggle bottom panel
- `Cmd+Shift+E` - Open Story Explorer
- `Cmd+Shift+F` - Open Search

## 📊 Status Bar

### Left Section
- **Project Name**: Current document/project
- **Problems**: Error/warning count (click to open Problems panel)

### Right Section
- **AI Status**: Shows when AI is working
- **Word Count**: Real-time word count
- **Cursor Position**: Line and column number
- **Sync Status**: Cloud sync indicator
- **Network Status**: Online/offline indicator

## 🏗️ IDE Shell Usage

### Basic Setup

```typescript
import { PanelProvider, IDEShell } from '@/components/IDE';

export default function WriterPage() {
  return (
    <PanelProvider>
      <IDEShell
        projectTitle="My Novel"
        problemCount={{ errors: 0, warnings: 0 }}
        leftPanel={<StoryExplorer />}
        rightPanel={<AIChat />}
        bottomPanel={<Problems />}
      >
        <YourEditor />
      </IDEShell>
    </PanelProvider>
  );
}
```

### With Theme Provider

```typescript
import { ThemeProvider, PanelProvider, IDEShell } from '@/components/IDE';

export default function App({ children }) {
  return (
    <ThemeProvider>
      <PanelProvider>
        <IDEShell {...props}>
          {children}
        </IDEShell>
      </PanelProvider>
    </ThemeProvider>
  );
}
```

### Panel Slots

**Left Panel** - Navigation/Organization:
- Story Explorer (chapters, scenes)
- Character list
- World building
- Search results
- Settings

**Right Panel** - AI & Assistance:
- AI Chat
- Document outline
- Reference materials
- Notes

**Bottom Panel** - Problems & Output:
- Writing problems (grammar, style, plot)
- AI feedback
- Terminal output
- Search results

**Main Editor** - Writing Surface:
- Manuscript editor
- Framework editor (side-by-side)
- Preview mode

## 🎯 CSS Custom Properties

### Using Theme Tokens

```css
.my-component {
  background: var(--ide-background);
  color: var(--ide-foreground);
  border: 1px solid var(--ide-border);
  padding: var(--ide-spacing-4);
  border-radius: var(--ide-radius-md);
  transition: var(--ide-transition-base);
}

.my-component:hover {
  background: var(--ide-list-hover);
}

.my-button {
  background: var(--ide-button-primary-bg);
  color: var(--ide-button-primary-fg);
  font-size: var(--ide-font-size-sm);
}
```

### Common Token Categories

**Backgrounds**:
- `--ide-background` - Primary background
- `--ide-background-secondary` - Secondary background
- `--ide-background-tertiary` - Tertiary background

**Foreground**:
- `--ide-foreground` - Primary text
- `--ide-foreground-secondary` - Secondary text
- `--ide-foreground-muted` - Muted text

**Semantic**:
- `--ide-error` - Error state
- `--ide-warning` - Warning state
- `--ide-info` - Info state
- `--ide-success` - Success state

**Interactive**:
- `--ide-accent` - Primary accent
- `--ide-accent-hover` - Accent hover
- `--ide-focus-border` - Focus outline

**AI/Special**:
- `--ide-ai-accent` - AI features
- `--ide-ai-glow` - AI glow effect
- `--ide-ghost-text` - Ghost/placeholder text

## 🎨 Writing Surface Styling

### Applying Writing Surface

```tsx
<div className="writing-surface">
  <h1>Chapter Title</h1>
  <p>Your prose here...</p>
  <p className="scene-break" />
  <p>More content...</p>
</div>
```

### Special Classes

```tsx
// Ghost text (AI continuation)
<p className="ghost-text ghost-text-appear">
  AI-generated continuation...
</p>

// AI suggestion
<span className="ai-suggestion">
  Suggested improvement
</span>

// Entity highlights
<span className="entity-character">Alex</span>
<span className="entity-location">Victorian house</span>
<span className="entity-time">midnight</span>

// Dialogue
<span className="dialogue">"Hello," she said.</span>
<span className="dialogue-tag">she said softly</span>
```

## 🚀 Performance Tips

1. **Lazy Load Panels**: Only render active panels
2. **Virtualize Lists**: Use virtual scrolling for long lists
3. **Debounce Resize**: Debounce panel resize handlers
4. **Memoize Components**: Use React.memo for static content
5. **Code Split**: Split large features into chunks

## 🐛 Troubleshooting

### Theme Not Persisting
- Check localStorage: `localStorage.getItem('spectreweave-theme')`
- Ensure ThemeProvider wraps your app
- Clear cache and reload

### Panels Not Resizing
- Verify PanelProvider is wrapping IDEShell
- Check console for resize errors
- Ensure panel size is within constraints

### Status Bar Not Updating
- Pass editor prop to IDEShell
- Verify editor is not null
- Check editor state updates

## 📚 API Reference

### useTheme()
```typescript
const {
  theme,          // Current theme ID
  setTheme,       // (id: ThemeId) => void
  themes,         // ThemeConfig[]
  currentTheme,   // ThemeConfig
  isDark,         // boolean
  toggleTheme,    // () => void
} = useTheme();
```

### usePanels()
```typescript
const {
  layout,              // PanelLayout
  setActivePanel,      // (pos, panel) => void
  togglePanel,         // (pos) => void
  setPanelSize,        // (pos, size) => void
  setPanelHeight,      // (height) => void
  resetLayout,         // () => void
} = usePanels();
```

---

**Demos**:
- Theme System: http://localhost:3003/theme-demo
- IDE Shell: http://localhost:3003/ide-demo

**Next**: Implement Story Explorer tree view and AI panels!
