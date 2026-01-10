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
