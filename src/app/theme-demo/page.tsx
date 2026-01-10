'use client';

import React from 'react';
import { ThemePicker } from '@/components/IDE/Theme/ThemePicker';
import { useTheme } from '@/components/IDE/Theme/ThemeProvider';
import { PanelProvider, usePanels } from '@/components/IDE/PanelSystem/PanelContext';
import { ResizablePanel } from '@/components/IDE/PanelSystem/ResizablePanel';
import { 
  BookOpen, 
  Users, 
  Globe, 
  Search, 
  Bot, 
  Settings,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';

function ThemeDemo() {
  const { currentTheme, isDark } = useTheme();
  
  return (
    <div className="min-h-screen bg-[--ide-background] text-[--ide-foreground] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[--ide-foreground] mb-2">
            SpectreWeave IDE Theme System
          </h1>
          <p className="text-[--ide-foreground-secondary]">
            Currently using: <strong>{currentTheme.name}</strong> ({isDark ? 'Dark' : 'Light'})
          </p>
        </div>

        {/* Theme Picker */}
        <div className="bg-[--ide-background-secondary] rounded-lg p-6 border border-[--ide-border]">
          <ThemePicker />
        </div>

        {/* Color Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Background Colors */}
          <ColorShowcase
            title="Backgrounds"
            colors={[
              { name: 'Primary', var: '--ide-background' },
              { name: 'Secondary', var: '--ide-background-secondary' },
              { name: 'Tertiary', var: '--ide-background-tertiary' },
            ]}
          />

          {/* Foreground Colors */}
          <ColorShowcase
            title="Foreground"
            colors={[
              { name: 'Primary', var: '--ide-foreground' },
              { name: 'Secondary', var: '--ide-foreground-secondary' },
              { name: 'Muted', var: '--ide-foreground-muted' },
            ]}
          />

          {/* Accent Colors */}
          <ColorShowcase
            title="Accents"
            colors={[
              { name: 'Accent', var: '--ide-accent' },
              { name: 'AI Accent', var: '--ide-ai-accent' },
              { name: 'Focus Border', var: '--ide-focus-border' },
            ]}
          />

          {/* Semantic Colors */}
          <ColorShowcase
            title="Semantic"
            colors={[
              { name: 'Error', var: '--ide-error' },
              { name: 'Warning', var: '--ide-warning' },
              { name: 'Info', var: '--ide-info' },
              { name: 'Success', var: '--ide-success' },
            ]}
          />

          {/* Writing Highlights */}
          <ColorShowcase
            title="Writing Highlights"
            colors={[
              { name: 'Character', var: '--ide-highlight-character' },
              { name: 'Location', var: '--ide-highlight-location' },
              { name: 'Action', var: '--ide-highlight-action' },
              { name: 'Emotion', var: '--ide-highlight-emotion' },
            ]}
          />

          {/* Panel Colors */}
          <ColorShowcase
            title="Panels"
            colors={[
              { name: 'Activity Bar', var: '--ide-activitybar-bg' },
              { name: 'Sidebar', var: '--ide-sidebar-bg' },
              { name: 'Status Bar', var: '--ide-statusbar-bg' },
            ]}
          />
        </div>

        {/* Component Showcase */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-[--ide-foreground]">Components</h2>

          {/* Buttons */}
          <div className="bg-[--ide-background-secondary] rounded-lg p-6 border border-[--ide-border]">
            <h3 className="text-lg font-semibold mb-4 text-[--ide-foreground]">Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-[--ide-button-primary-bg] text-[--ide-button-primary-fg] rounded-md hover:opacity-90 transition-opacity">
                Primary Button
              </button>
              <button className="px-4 py-2 bg-[--ide-button-secondary-bg] text-[--ide-button-secondary-fg] rounded-md border border-[--ide-border] hover:bg-[--ide-list-hover] transition-colors">
                Secondary Button
              </button>
              <button className="px-4 py-2 text-[--ide-accent] hover:bg-[--ide-list-hover] rounded-md transition-colors">
                Text Button
              </button>
            </div>
          </div>

          {/* Icons */}
          <div className="bg-[--ide-background-secondary] rounded-lg p-6 border border-[--ide-border]">
            <h3 className="text-lg font-semibold mb-4 text-[--ide-foreground]">Activity Bar Icons</h3>
            <div className="flex gap-4">
              {[BookOpen, Users, Globe, Search, Bot, Settings].map((Icon, i) => (
                <div
                  key={i}
                  className="w-12 h-12 flex items-center justify-center rounded hover:bg-[--ide-list-hover] transition-colors cursor-pointer group"
                >
                  <Icon className="w-6 h-6 text-[--ide-activitybar-inactive] group-hover:text-[--ide-activitybar-fg]" />
                </div>
              ))}
            </div>
          </div>

          {/* Problem Indicators */}
          <div className="bg-[--ide-background-secondary] rounded-lg p-6 border border-[--ide-border]">
            <h3 className="text-lg font-semibold mb-4 text-[--ide-foreground]">Problem Indicators</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[--ide-problem-error]">
                <AlertCircle className="w-5 h-5" />
                <span>Error: Character inconsistency detected</span>
              </div>
              <div className="flex items-center gap-3 text-[--ide-problem-warning]">
                <AlertCircle className="w-5 h-5" />
                <span>Warning: Passive voice overuse</span>
              </div>
              <div className="flex items-center gap-3 text-[--ide-problem-info]">
                <Info className="w-5 h-5" />
                <span>Info: Consider varying sentence structure</span>
              </div>
              <div className="flex items-center gap-3 text-[--ide-problem-hint]">
                <CheckCircle className="w-5 h-5" />
                <span>Hint: Strong character voice established</span>
              </div>
            </div>
          </div>

          {/* Input Fields */}
          <div className="bg-[--ide-background-secondary] rounded-lg p-6 border border-[--ide-border]">
            <h3 className="text-lg font-semibold mb-4 text-[--ide-foreground]">Input Fields</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search chapters..."
                className="w-full px-3 py-2 bg-[--ide-input-bg] text-[--ide-input-fg] border border-[--ide-input-border] rounded-md focus:outline-none focus:border-[--ide-input-focus] transition-colors"
              />
              <input
                type="text"
                placeholder="Character name..."
                className="w-full px-3 py-2 bg-[--ide-input-bg] text-[--ide-input-fg] border border-[--ide-input-border] rounded-md focus:outline-none focus:border-[--ide-input-focus] transition-colors"
              />
            </div>
          </div>

          {/* AI Effects */}
          <div className="bg-[--ide-background-secondary] rounded-lg p-6 border border-[--ide-border]">
            <h3 className="text-lg font-semibold mb-4 text-[--ide-foreground]">AI Effects</h3>
            <div className="space-y-4">
              <div className="p-4 bg-[--ide-ai-glow] rounded-lg border border-[--ide-ai-accent]">
                <p className="text-[--ide-foreground]">
                  AI suggestion with glow effect
                </p>
              </div>
              <div className="p-4 bg-[--ide-background-tertiary] rounded-lg ai-active">
                <p className="text-[--ide-foreground]">
                  AI active with pulse animation
                </p>
              </div>
              <div className="writing-surface">
                <p className="ghost-text ghost-text-appear">
                  Ghost text appears with fade-in animation...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ColorShowcaseProps {
  title: string;
  colors: Array<{ name: string; var: string }>;
}

function ColorShowcase({ title, colors }: ColorShowcaseProps) {
  return (
    <div className="bg-[--ide-background-secondary] rounded-lg p-4 border border-[--ide-border]">
      <h3 className="text-sm font-semibold mb-3 text-[--ide-foreground]">{title}</h3>
      <div className="space-y-2">
        {colors.map(({ name, var: cssVar }) => (
          <div key={cssVar} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded border border-[--ide-border] flex-shrink-0"
              style={{ backgroundColor: `var(${cssVar})` }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[--ide-foreground] truncate">{name}</div>
              <div className="text-[10px] text-[--ide-foreground-muted] font-mono truncate">
                {cssVar}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ThemeDemoPage() {
  return (
    <PanelProvider>
      <ThemeDemo />
    </PanelProvider>
  );
}
