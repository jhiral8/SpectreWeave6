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
  | 'focus-mode'
  | 'graphite-portal';

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
  {
    id: 'graphite-portal',
    name: 'Graphite Portal',
    description: 'Modern graphite with purple accents',
    category: 'dark',
    preview: 'linear-gradient(135deg, #0f1115 0%, #10141b 50%, #6e7dfc 100%)',
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
