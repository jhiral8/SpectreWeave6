# Part 9: Theme System & Visual Polish

> **Purpose**: Implement VS Code-style theming with writing-optimized dark/light modes.

---

## 9.1 Theme Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    THEME SYSTEM                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ CSS Custom   │    │   Theme      │    │    User      │  │
│  │  Properties  │ ←→ │   Provider   │ ←→ │  Preferences │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                              ↑                               │
│                              │                               │
│                    ┌─────────┴─────────┐                    │
│                    │   Theme Presets   │                    │
│                    ├───────────────────┤                    │
│                    │ • Spectre Dark    │                    │
│                    │ • Spectre Light   │                    │
│                    │ • Midnight Writer │                    │
│                    │ • Parchment       │                    │
│                    │ • Focus Mode      │                    │
│                    └───────────────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 9.2 CSS Custom Properties (Design Tokens)

```css
/* src/styles/theme-tokens.css */

/* ================================================================
   SPECTRE WEAVE THEME TOKENS
   Based on VS Code theming with writing-optimized colors
   ================================================================ */

:root {
  /* ────────────────────────────────────────
     Core Semantic Colors
     ──────────────────────────────────────── */
  --ide-error: #f44336;
  --ide-warning: #ff9800;
  --ide-info: #2196f3;
  --ide-success: #4caf50;
  
  /* ────────────────────────────────────────
     Focus/Accent
     ──────────────────────────────────────── */
  --ide-focus-border: #007acc;
  --ide-accent: #0078d4;
  --ide-accent-hover: #1e90ff;
  
  /* ────────────────────────────────────────
     Typography
     ──────────────────────────────────────── */
  --ide-font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --ide-font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --ide-font-family-writing: 'Georgia', 'Crimson Text', serif;
  
  --ide-font-size-xs: 10px;
  --ide-font-size-sm: 12px;
  --ide-font-size-base: 14px;
  --ide-font-size-lg: 16px;
  --ide-font-size-xl: 18px;
  
  /* ────────────────────────────────────────
     Spacing
     ──────────────────────────────────────── */
  --ide-spacing-1: 4px;
  --ide-spacing-2: 8px;
  --ide-spacing-3: 12px;
  --ide-spacing-4: 16px;
  --ide-spacing-5: 20px;
  --ide-spacing-6: 24px;
  
  /* ────────────────────────────────────────
     Border Radius
     ──────────────────────────────────────── */
  --ide-radius-sm: 2px;
  --ide-radius-md: 4px;
  --ide-radius-lg: 8px;
  --ide-radius-xl: 12px;
  
  /* ────────────────────────────────────────
     Shadows
     ──────────────────────────────────────── */
  --ide-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --ide-shadow-md: 0 4px 8px rgba(0, 0, 0, 0.15);
  --ide-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);
  --ide-shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.25);
  
  /* ────────────────────────────────────────
     Transitions
     ──────────────────────────────────────── */
  --ide-transition-fast: 100ms ease-out;
  --ide-transition-base: 200ms ease-out;
  --ide-transition-slow: 300ms ease-out;
  
  /* ────────────────────────────────────────
     Z-Index Scale
     ──────────────────────────────────────── */
  --ide-z-base: 1;
  --ide-z-dropdown: 100;
  --ide-z-modal: 200;
  --ide-z-tooltip: 300;
  --ide-z-notification: 400;
  --ide-z-command-palette: 500;
}

/* ================================================================
   THEME: SPECTRE DARK (Default)
   Inspired by VS Code Dark+ with futuristic accents
   ================================================================ */

[data-theme="spectre-dark"] {
  /* Background Colors */
  --ide-background: #0d1117;
  --ide-background-secondary: #161b22;
  --ide-background-tertiary: #21262d;
  
  /* Foreground Colors */
  --ide-foreground: #c9d1d9;
  --ide-foreground-secondary: #8b949e;
  --ide-foreground-muted: #6e7681;
  
  /* Border Colors */
  --ide-border: #30363d;
  --ide-border-secondary: #21262d;
  
  /* Panel Colors */
  --ide-titlebar-bg: #010409;
  --ide-titlebar-fg: #c9d1d9;
  
  --ide-activitybar-bg: #0d1117;
  --ide-activitybar-fg: #c9d1d9;
  --ide-activitybar-inactive: #6e7681;
  --ide-activitybar-badge: #0078d4;
  
  --ide-sidebar-bg: #0d1117;
  --ide-sidebar-fg: #c9d1d9;
  --ide-sidebar-header: #21262d;
  
  --ide-editor-bg: #0d1117;
  --ide-editor-fg: #c9d1d9;
  --ide-editor-lineNumber: #6e7681;
  --ide-editor-selection: rgba(33, 150, 243, 0.3);
  --ide-editor-cursor: #58a6ff;
  
  --ide-panel-bg: #0d1117;
  --ide-panel-fg: #c9d1d9;
  --ide-panel-border: #30363d;
  
  --ide-statusbar-bg: #0078d4;
  --ide-statusbar-fg: #ffffff;
  --ide-statusbar-item-hover: rgba(255, 255, 255, 0.15);
  
  /* Interactive Elements */
  --ide-input-bg: #21262d;
  --ide-input-fg: #c9d1d9;
  --ide-input-border: #30363d;
  --ide-input-focus: #58a6ff;
  
  --ide-button-primary-bg: #238636;
  --ide-button-primary-fg: #ffffff;
  --ide-button-secondary-bg: #21262d;
  --ide-button-secondary-fg: #c9d1d9;
  
  --ide-list-hover: rgba(177, 186, 196, 0.12);
  --ide-list-active: rgba(177, 186, 196, 0.2);
  --ide-list-selected: #316dca;
  
  /* Writing Surface */
  --ide-writing-bg: #161b22;
  --ide-writing-fg: #e6edf3;
  --ide-writing-heading: #58a6ff;
  --ide-writing-link: #58a6ff;
  --ide-writing-quote: #8b949e;
  --ide-writing-dialogue: #a5d6ff;
  
  /* Syntax-style Highlights */
  --ide-highlight-character: #f0883e;
  --ide-highlight-location: #7ee787;
  --ide-highlight-action: #ff7b72;
  --ide-highlight-emotion: #d2a8ff;
  --ide-highlight-time: #79c0ff;
  
  /* AI/Special */
  --ide-ai-accent: #9c6ade;
  --ide-ai-glow: rgba(156, 106, 222, 0.3);
  --ide-ghost-text: #6e7681;
  
  /* Problems/Diagnostics */
  --ide-problem-error: #f44336;
  --ide-problem-warning: #ff9800;
  --ide-problem-info: #2196f3;
  --ide-problem-hint: #4caf50;
}

/* ================================================================
   THEME: SPECTRE LIGHT
   Clean, high-contrast light theme for day writing
   ================================================================ */

[data-theme="spectre-light"] {
  /* Background Colors */
  --ide-background: #ffffff;
  --ide-background-secondary: #f6f8fa;
  --ide-background-tertiary: #f0f2f4;
  
  /* Foreground Colors */
  --ide-foreground: #24292f;
  --ide-foreground-secondary: #57606a;
  --ide-foreground-muted: #8c959f;
  
  /* Border Colors */
  --ide-border: #d0d7de;
  --ide-border-secondary: #e6e8eb;
  
  /* Panel Colors */
  --ide-titlebar-bg: #f6f8fa;
  --ide-titlebar-fg: #24292f;
  
  --ide-activitybar-bg: #f6f8fa;
  --ide-activitybar-fg: #24292f;
  --ide-activitybar-inactive: #8c959f;
  --ide-activitybar-badge: #0969da;
  
  --ide-sidebar-bg: #f6f8fa;
  --ide-sidebar-fg: #24292f;
  --ide-sidebar-header: #eaeef2;
  
  --ide-editor-bg: #ffffff;
  --ide-editor-fg: #24292f;
  --ide-editor-lineNumber: #8c959f;
  --ide-editor-selection: rgba(9, 105, 218, 0.2);
  --ide-editor-cursor: #0969da;
  
  --ide-panel-bg: #f6f8fa;
  --ide-panel-fg: #24292f;
  --ide-panel-border: #d0d7de;
  
  --ide-statusbar-bg: #0969da;
  --ide-statusbar-fg: #ffffff;
  --ide-statusbar-item-hover: rgba(0, 0, 0, 0.15);
  
  /* Interactive Elements */
  --ide-input-bg: #ffffff;
  --ide-input-fg: #24292f;
  --ide-input-border: #d0d7de;
  --ide-input-focus: #0969da;
  
  --ide-button-primary-bg: #2da44e;
  --ide-button-primary-fg: #ffffff;
  --ide-button-secondary-bg: #f6f8fa;
  --ide-button-secondary-fg: #24292f;
  
  --ide-list-hover: rgba(55, 65, 81, 0.08);
  --ide-list-active: rgba(55, 65, 81, 0.12);
  --ide-list-selected: #ddf4ff;
  
  /* Writing Surface */
  --ide-writing-bg: #ffffff;
  --ide-writing-fg: #1f2328;
  --ide-writing-heading: #0969da;
  --ide-writing-link: #0969da;
  --ide-writing-quote: #57606a;
  --ide-writing-dialogue: #0550ae;
  
  /* Syntax-style Highlights */
  --ide-highlight-character: #953800;
  --ide-highlight-location: #1a7f37;
  --ide-highlight-action: #cf222e;
  --ide-highlight-emotion: #8250df;
  --ide-highlight-time: #0550ae;
  
  /* AI/Special */
  --ide-ai-accent: #8250df;
  --ide-ai-glow: rgba(130, 80, 223, 0.2);
  --ide-ghost-text: #8c959f;
  
  /* Problems/Diagnostics */
  --ide-problem-error: #d1242f;
  --ide-problem-warning: #bf8700;
  --ide-problem-info: #0969da;
  --ide-problem-hint: #1a7f37;
}

/* ================================================================
   THEME: MIDNIGHT WRITER
   Deep blue, ultra-dark theme for late night sessions
   ================================================================ */

[data-theme="midnight-writer"] {
  /* Background Colors */
  --ide-background: #0a0e14;
  --ide-background-secondary: #0d1117;
  --ide-background-tertiary: #151b24;
  
  /* Foreground Colors */
  --ide-foreground: #b3b1ad;
  --ide-foreground-secondary: #73716c;
  --ide-foreground-muted: #494b4f;
  
  /* Border Colors */
  --ide-border: #1d242d;
  --ide-border-secondary: #151b24;
  
  /* Panel Colors */
  --ide-titlebar-bg: #050709;
  --ide-titlebar-fg: #b3b1ad;
  
  --ide-activitybar-bg: #0a0e14;
  --ide-activitybar-fg: #b3b1ad;
  --ide-activitybar-inactive: #494b4f;
  --ide-activitybar-badge: #ffb454;
  
  --ide-sidebar-bg: #0a0e14;
  --ide-sidebar-fg: #b3b1ad;
  --ide-sidebar-header: #151b24;
  
  --ide-editor-bg: #0a0e14;
  --ide-editor-fg: #b3b1ad;
  --ide-editor-lineNumber: #494b4f;
  --ide-editor-selection: rgba(255, 180, 84, 0.2);
  --ide-editor-cursor: #ffb454;
  
  --ide-panel-bg: #0a0e14;
  --ide-panel-fg: #b3b1ad;
  --ide-panel-border: #1d242d;
  
  --ide-statusbar-bg: #1d242d;
  --ide-statusbar-fg: #b3b1ad;
  --ide-statusbar-item-hover: rgba(255, 255, 255, 0.1);
  
  /* Writing Surface - Extra comfy */
  --ide-writing-bg: #0d1117;
  --ide-writing-fg: #d4d4d4;
  --ide-writing-heading: #ffb454;
  --ide-writing-link: #59c2ff;
  --ide-writing-quote: #73716c;
  --ide-writing-dialogue: #aad94c;
  
  /* Warm accent colors */
  --ide-highlight-character: #ffb454;
  --ide-highlight-location: #95e6cb;
  --ide-highlight-action: #f07178;
  --ide-highlight-emotion: #d2a6ff;
  --ide-highlight-time: #73d0ff;
  
  /* AI with warm glow */
  --ide-ai-accent: #ffb454;
  --ide-ai-glow: rgba(255, 180, 84, 0.2);
  --ide-ghost-text: #494b4f;
}

/* ================================================================
   THEME: PARCHMENT
   Warm, sepia-toned theme like aged paper
   ================================================================ */

[data-theme="parchment"] {
  /* Background Colors */
  --ide-background: #f5f0e6;
  --ide-background-secondary: #ebe5d7;
  --ide-background-tertiary: #e1d9c9;
  
  /* Foreground Colors */
  --ide-foreground: #3c3836;
  --ide-foreground-secondary: #665c54;
  --ide-foreground-muted: #928374;
  
  /* Border Colors */
  --ide-border: #d5cec0;
  --ide-border-secondary: #e1d9c9;
  
  /* Panel Colors */
  --ide-titlebar-bg: #ebe5d7;
  --ide-titlebar-fg: #3c3836;
  
  --ide-activitybar-bg: #ebe5d7;
  --ide-activitybar-fg: #3c3836;
  --ide-activitybar-inactive: #928374;
  --ide-activitybar-badge: #9d0006;
  
  --ide-sidebar-bg: #ebe5d7;
  --ide-sidebar-fg: #3c3836;
  --ide-sidebar-header: #e1d9c9;
  
  --ide-editor-bg: #f5f0e6;
  --ide-editor-fg: #3c3836;
  --ide-editor-lineNumber: #928374;
  --ide-editor-selection: rgba(157, 0, 6, 0.15);
  --ide-editor-cursor: #9d0006;
  
  --ide-statusbar-bg: #665c54;
  --ide-statusbar-fg: #f5f0e6;
  --ide-statusbar-item-hover: rgba(0, 0, 0, 0.1);
  
  /* Writing Surface - Warm paper */
  --ide-writing-bg: #f5f0e6;
  --ide-writing-fg: #282828;
  --ide-writing-heading: #9d0006;
  --ide-writing-link: #076678;
  --ide-writing-quote: #928374;
  --ide-writing-dialogue: #427b58;
  
  /* Earthy highlights */
  --ide-highlight-character: #af3a03;
  --ide-highlight-location: #79740e;
  --ide-highlight-action: #9d0006;
  --ide-highlight-emotion: #8f3f71;
  --ide-highlight-time: #076678;
  
  /* Subdued AI */
  --ide-ai-accent: #8f3f71;
  --ide-ai-glow: rgba(143, 63, 113, 0.15);
  --ide-ghost-text: #a89984;
}

/* ================================================================
   THEME: FOCUS MODE
   Minimal distractions, muted interface, bright editor
   ================================================================ */

[data-theme="focus-mode"] {
  /* Ultra dark chrome */
  --ide-background: #000000;
  --ide-background-secondary: #0a0a0a;
  --ide-background-tertiary: #141414;
  
  /* Muted chrome text */
  --ide-foreground: #555555;
  --ide-foreground-secondary: #444444;
  --ide-foreground-muted: #333333;
  
  /* Minimal borders */
  --ide-border: #1a1a1a;
  --ide-border-secondary: #141414;
  
  /* Super minimal chrome */
  --ide-titlebar-bg: #000000;
  --ide-titlebar-fg: #555555;
  
  --ide-activitybar-bg: #000000;
  --ide-activitybar-fg: #555555;
  --ide-activitybar-inactive: #333333;
  --ide-activitybar-badge: #4a4a4a;
  
  --ide-sidebar-bg: #000000;
  --ide-sidebar-fg: #555555;
  
  --ide-statusbar-bg: #0a0a0a;
  --ide-statusbar-fg: #555555;
  
  /* Bright editor (the focus) */
  --ide-editor-bg: #1a1a1a;
  --ide-editor-fg: #e0e0e0;
  
  /* Writing Surface - High contrast for focus */
  --ide-writing-bg: #1a1a1a;
  --ide-writing-fg: #f0f0f0;
  --ide-writing-heading: #ffffff;
  --ide-writing-link: #808080;
  --ide-writing-quote: #888888;
  --ide-writing-dialogue: #cccccc;
  
  /* Monochrome highlights */
  --ide-highlight-character: #ffffff;
  --ide-highlight-location: #c0c0c0;
  --ide-highlight-action: #e0e0e0;
  --ide-highlight-emotion: #d0d0d0;
  --ide-highlight-time: #b0b0b0;
  
  /* Subtle AI */
  --ide-ai-accent: #666666;
  --ide-ai-glow: rgba(255, 255, 255, 0.05);
  --ide-ghost-text: #404040;
}
```

---

## 9.3 Theme Provider

```typescript
// src/components/IDE/Theme/ThemeProvider.tsx

'use client';

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState,
  useCallback,
} from 'react';

export type ThemeId = 
  | 'spectre-dark' 
  | 'spectre-light' 
  | 'midnight-writer' 
  | 'parchment' 
  | 'focus-mode';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  category: 'dark' | 'light';
  preview: string; // Preview colors as CSS gradient
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'spectre-dark',
    name: 'Spectre Dark',
    description: 'Modern dark theme with futuristic accents',
    category: 'dark',
    preview: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0078d4 100%)',
  },
  {
    id: 'spectre-light',
    name: 'Spectre Light',
    description: 'Clean, high-contrast light theme',
    category: 'light',
    preview: 'linear-gradient(135deg, #ffffff 0%, #f6f8fa 50%, #0969da 100%)',
  },
  {
    id: 'midnight-writer',
    name: 'Midnight Writer',
    description: 'Ultra-dark theme for late night sessions',
    category: 'dark',
    preview: 'linear-gradient(135deg, #0a0e14 0%, #0d1117 50%, #ffb454 100%)',
  },
  {
    id: 'parchment',
    name: 'Parchment',
    description: 'Warm, sepia-toned like aged paper',
    category: 'light',
    preview: 'linear-gradient(135deg, #f5f0e6 0%, #ebe5d7 50%, #9d0006 100%)',
  },
  {
    id: 'focus-mode',
    name: 'Focus Mode',
    description: 'Minimal distractions, bright editor',
    category: 'dark',
    preview: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #ffffff 100%)',
  },
];

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeConfig[];
  currentTheme: ThemeConfig;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'spectreweave-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeId>('spectre-dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored && THEMES.find(t => t.id === stored)) {
      setThemeState(stored);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'spectre-dark' : 'spectre-light');
    }
    setIsLoaded(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!isLoaded) return;
    
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    
    // Also set color-scheme for native elements
    const themeConfig = THEMES.find(t => t.id === theme);
    document.documentElement.style.colorScheme = themeConfig?.category || 'dark';
  }, [theme, isLoaded]);

  const setTheme = useCallback((newTheme: ThemeId) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const currentConfig = THEMES.find(t => t.id === theme);
    if (currentConfig?.category === 'dark') {
      setThemeState('spectre-light');
    } else {
      setThemeState('spectre-dark');
    }
  }, [theme]);

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];
  const isDark = currentTheme.category === 'dark';

  // Prevent flash of wrong theme
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      themes: THEMES,
      currentTheme,
      isDark,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

---

## 9.4 Theme Picker Component

```typescript
// src/components/IDE/Theme/ThemePicker.tsx

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Moon, Sun } from 'lucide-react';
import { useTheme, THEMES, ThemeId } from './ThemeProvider';

interface ThemePickerProps {
  compact?: boolean;
}

export const ThemePicker: React.FC<ThemePickerProps> = ({ compact }) => {
  const { theme, setTheme, currentTheme, isDark, toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'p-2 rounded-md transition-colors',
          'hover:bg-[--ide-list-hover]',
          'text-[--ide-foreground-secondary]'
        )}
        title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <div className="theme-picker p-4">
      <h3 className="text-sm font-medium text-[--ide-foreground] mb-4">
        Color Theme
      </h3>
      
      <div className="grid grid-cols-1 gap-2">
        {THEMES.map((themeOption) => (
          <ThemeOption
            key={themeOption.id}
            theme={themeOption}
            isSelected={theme === themeOption.id}
            onSelect={() => setTheme(themeOption.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface ThemeOptionProps {
  theme: typeof THEMES[0];
  isSelected: boolean;
  onSelect: () => void;
}

const ThemeOption: React.FC<ThemeOptionProps> = ({
  theme,
  isSelected,
  onSelect,
}) => (
  <button
    onClick={onSelect}
    className={cn(
      'flex items-center gap-3 p-3 rounded-lg',
      'border transition-all',
      isSelected
        ? 'border-[--ide-accent] bg-[--ide-list-active]'
        : 'border-[--ide-border] hover:border-[--ide-foreground-muted]'
    )}
  >
    {/* Color preview */}
    <div
      className="w-10 h-10 rounded-md flex-shrink-0"
      style={{ background: theme.preview }}
    />
    
    {/* Theme info */}
    <div className="flex-1 text-left">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[--ide-foreground]">
          {theme.name}
        </span>
        <span className={cn(
          'text-[10px] px-1.5 py-0.5 rounded',
          theme.category === 'dark'
            ? 'bg-[--ide-background-tertiary] text-[--ide-foreground-muted]'
            : 'bg-[--ide-border] text-[--ide-foreground-secondary]'
        )}>
          {theme.category}
        </span>
      </div>
      <p className="text-xs text-[--ide-foreground-secondary] mt-0.5">
        {theme.description}
      </p>
    </div>
    
    {/* Selected indicator */}
    {isSelected && (
      <Check className="w-4 h-4 text-[--ide-accent] flex-shrink-0" />
    )}
  </button>
);
```

---

## 9.5 Writing Surface Styling

```css
/* src/styles/writing-surface.css */

/* ================================================================
   WRITING SURFACE STYLES
   Typography and styling optimized for fiction writing
   ================================================================ */

.writing-surface {
  font-family: var(--ide-font-family-writing);
  font-size: var(--ide-font-size-lg);
  line-height: 1.8;
  color: var(--ide-writing-fg);
  background: var(--ide-writing-bg);
  padding: var(--ide-spacing-6);
  max-width: 720px;
  margin: 0 auto;
}

/* ────────────────────────────────────────
   Paragraphs
   ──────────────────────────────────────── */
.writing-surface p {
  margin-bottom: 1.5em;
  text-indent: 1.5em;
}

.writing-surface p:first-of-type,
.writing-surface h1 + p,
.writing-surface h2 + p,
.writing-surface h3 + p {
  text-indent: 0;
}

/* Scene break indicator */
.writing-surface p.scene-break {
  text-indent: 0;
  text-align: center;
  margin: 2em 0;
  color: var(--ide-foreground-muted);
}

.writing-surface p.scene-break::before {
  content: '* * *';
  letter-spacing: 0.5em;
}

/* ────────────────────────────────────────
   Headings (Chapters, Scenes)
   ──────────────────────────────────────── */
.writing-surface h1 {
  font-size: 2em;
  font-weight: 700;
  color: var(--ide-writing-heading);
  margin: 2em 0 1em;
  text-align: center;
  letter-spacing: 0.05em;
}

.writing-surface h2 {
  font-size: 1.5em;
  font-weight: 600;
  color: var(--ide-writing-heading);
  margin: 1.5em 0 0.75em;
  padding-bottom: 0.25em;
  border-bottom: 1px solid var(--ide-border);
}

.writing-surface h3 {
  font-size: 1.25em;
  font-weight: 500;
  color: var(--ide-foreground);
  margin: 1.25em 0 0.5em;
  font-style: italic;
}

/* ────────────────────────────────────────
   Dialogue
   ──────────────────────────────────────── */
.writing-surface .dialogue {
  color: var(--ide-writing-dialogue);
}

/* Speaker attribution */
.writing-surface .dialogue-tag {
  font-style: italic;
  color: var(--ide-foreground-secondary);
}

/* ────────────────────────────────────────
   Emphasis and Style
   ──────────────────────────────────────── */
.writing-surface em {
  font-style: italic;
}

.writing-surface strong {
  font-weight: 600;
}

.writing-surface u {
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* ────────────────────────────────────────
   Blockquotes (Internal thoughts, letters)
   ──────────────────────────────────────── */
.writing-surface blockquote {
  margin: 1.5em 2em;
  padding-left: 1em;
  border-left: 3px solid var(--ide-border);
  color: var(--ide-writing-quote);
  font-style: italic;
}

/* ────────────────────────────────────────
   Ghost/AI Suggestions
   ──────────────────────────────────────── */
.writing-surface .ghost-text {
  color: var(--ide-ghost-text);
  opacity: 0.7;
  position: relative;
}

.writing-surface .ghost-text::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    var(--ide-ai-accent) 0%,
    transparent 100%
  );
  opacity: 0.5;
}

.writing-surface .ai-suggestion {
  background: var(--ide-ai-glow);
  border-radius: var(--ide-radius-sm);
  padding: 0 2px;
  box-shadow: 0 0 8px var(--ide-ai-glow);
}

/* ────────────────────────────────────────
   Entity Highlights
   ──────────────────────────────────────── */
.writing-surface .entity-character {
  color: var(--ide-highlight-character);
  border-bottom: 1px dotted var(--ide-highlight-character);
}

.writing-surface .entity-location {
  color: var(--ide-highlight-location);
  border-bottom: 1px dotted var(--ide-highlight-location);
}

.writing-surface .entity-time {
  color: var(--ide-highlight-time);
  border-bottom: 1px dotted var(--ide-highlight-time);
}

/* ────────────────────────────────────────
   Selection
   ──────────────────────────────────────── */
.writing-surface ::selection {
  background: var(--ide-editor-selection);
}

/* ────────────────────────────────────────
   Cursor Styling
   ──────────────────────────────────────── */
.writing-surface .ProseMirror-cursor {
  border-color: var(--ide-editor-cursor);
  border-width: 2px;
}

/* ────────────────────────────────────────
   Links
   ──────────────────────────────────────── */
.writing-surface a {
  color: var(--ide-writing-link);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color var(--ide-transition-fast);
}

.writing-surface a:hover {
  border-bottom-color: var(--ide-writing-link);
}

/* ────────────────────────────────────────
   Print-friendly adjustments
   ──────────────────────────────────────── */
@media print {
  .writing-surface {
    color: #000;
    background: #fff;
    max-width: none;
  }
  
  .writing-surface .ghost-text,
  .writing-surface .ai-suggestion {
    display: none;
  }
}

/* ────────────────────────────────────────
   Responsive Typography
   ──────────────────────────────────────── */
@media (max-width: 768px) {
  .writing-surface {
    font-size: var(--ide-font-size-base);
    padding: var(--ide-spacing-4);
    line-height: 1.7;
  }
  
  .writing-surface h1 {
    font-size: 1.5em;
  }
  
  .writing-surface h2 {
    font-size: 1.25em;
  }
}
```

---

## 9.6 Animation Utilities

```css
/* src/styles/animations.css */

/* ================================================================
   IDE ANIMATIONS
   Smooth, professional transitions for VS Code feel
   ================================================================ */

/* ────────────────────────────────────────
   Panel Transitions
   ──────────────────────────────────────── */
@keyframes panel-slide-in-left {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes panel-slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes panel-slide-in-bottom {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.panel-enter-left {
  animation: panel-slide-in-left var(--ide-transition-base);
}

.panel-enter-right {
  animation: panel-slide-in-right var(--ide-transition-base);
}

.panel-enter-bottom {
  animation: panel-slide-in-bottom var(--ide-transition-base);
}

/* ────────────────────────────────────────
   Fade Effects
   ──────────────────────────────────────── */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.fade-in {
  animation: fade-in var(--ide-transition-fast);
}

.fade-out {
  animation: fade-out var(--ide-transition-fast);
}

/* ────────────────────────────────────────
   AI Glow Effects
   ──────────────────────────────────────── */
@keyframes ai-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--ide-ai-glow);
  }
  50% {
    box-shadow: 0 0 20px 4px var(--ide-ai-glow);
  }
}

@keyframes ai-thinking {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.ai-active {
  animation: ai-pulse 2s ease-in-out infinite;
}

.ai-thinking {
  animation: ai-thinking 1.5s ease-in-out infinite;
}

/* ────────────────────────────────────────
   Ghost Text Appear
   ──────────────────────────────────────── */
@keyframes ghost-appear {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 0.7;
    transform: translateY(0);
  }
}

.ghost-text-appear {
  animation: ghost-appear 0.3s ease-out;
}

/* ────────────────────────────────────────
   Command Palette
   ──────────────────────────────────────── */
@keyframes command-palette-open {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.command-palette-enter {
  animation: command-palette-open 0.15s ease-out;
}

/* ────────────────────────────────────────
   List Item Highlight
   ──────────────────────────────────────── */
@keyframes item-highlight {
  0% {
    background-color: var(--ide-list-selected);
  }
  100% {
    background-color: transparent;
  }
}

.item-flash {
  animation: item-highlight 1s ease-out;
}

/* ────────────────────────────────────────
   Loading Skeleton
   ──────────────────────────────────────── */
@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--ide-background-secondary) 0%,
    var(--ide-background-tertiary) 50%,
    var(--ide-background-secondary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--ide-radius-sm);
}

/* ────────────────────────────────────────
   Status Bar Activity
   ──────────────────────────────────────── */
@keyframes status-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-active {
  animation: status-pulse 1s ease-in-out infinite;
}

/* ────────────────────────────────────────
   Resize Handle
   ──────────────────────────────────────── */
.resize-handle {
  transition: background-color var(--ide-transition-fast);
}

.resize-handle:hover,
.resize-handle:active {
  background-color: var(--ide-accent);
}

/* ────────────────────────────────────────
   Reduce Motion
   ──────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Part 9 Summary

### Theme System Features:
- **5 built-in themes**: Spectre Dark, Spectre Light, Midnight Writer, Parchment, Focus Mode
- **100+ CSS custom properties** for complete customization
- **Theme Provider** with persistence and system preference detection
- **Theme Picker** component with visual previews

### Writing-Specific Styling:
- **Optimized typography** for long-form prose
- **Semantic highlights** for characters, locations, time
- **Ghost text styling** for AI suggestions
- **Print-friendly** adjustments

### Animation System:
- **Panel transitions** for smooth UX
- **AI glow effects** for visual feedback
- **Ghost text animations** for suggestions
- **Reduced motion support** for accessibility

---

*Continue to Part 10 for Implementation Roadmap and Migration Strategy...*
