'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { MenuBar } from './MenuBar';
import { CommandPaletteSearch } from './CommandPaletteSearch';
import { TitleBarProps, DEFAULT_MENU_ITEMS } from './types';

/**
 * TitleBar Component
 * 
 * VS Code-style title bar with platform branding, menu bar, and command palette search.
 * Height: 30px (exact VS Code match)
 * 
 * Layout:
 * [Window Controls] | [Logo/Name] | [Menu Bar] | [Command Palette Search] | [User]
 */
export const TitleBar: React.FC<TitleBarProps> = ({
  platformName = 'SpectreWeave',
  platformLogo,
  menuItems = DEFAULT_MENU_ITEMS,
  showCommandPalette = true,
  commandPaletteShortcut = '⌘K',
  onCommandPaletteOpen,
  showWindowControls = false,
  userInfo,
  onUserClick,
  className,
}) => {
  return (
    <header
      className={cn(
        'vscode-titlebar',
        'h-[30px] min-h-[30px] max-h-[30px]',
        'flex items-center',
        'bg-[var(--ide-bg,#3c3c3c)]',
        'border-b border-[var(--ide-border,#2b2b2b)]',
        'select-none',
        // Allow window dragging in Electron
        '[app-region:drag]',
        className
      )}
      role="banner"
      aria-label="Title Bar"
    >
      {/* Window Controls (macOS traffic lights) - optional for web */}
      {showWindowControls && (
        <div 
          className={cn(
            'titlebar__window-controls',
            'flex items-center gap-2 px-3',
            // Prevent dragging on controls
            '[app-region:no-drag]'
          )}
        >
          <button
            className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90"
            aria-label="Close"
          />
          <button
            className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-90"
            aria-label="Minimize"
          />
          <button
            className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-90"
            aria-label="Maximize"
          />
        </div>
      )}

      {/* Platform Logo / Name */}
      <div
        className={cn(
          'titlebar__logo',
          'flex items-center gap-2 px-4',
          'text-[var(--ide-foreground,#cccccc)]',
          'font-surgena font-semibold text-[13px]',
          '[app-region:no-drag]'
        )}
      >
        {platformLogo && (
          <span className="titlebar__logo-icon w-4 h-4">
            {platformLogo}
          </span>
        )}
        <span className="titlebar__logo-text">{platformName}</span>
      </div>

      {/* Menu Bar */}
      <MenuBar
        items={menuItems}
        className="titlebar__menubar [app-region:no-drag]"
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Command Palette Search (centered) */}
      {showCommandPalette && (
        <div
          className={cn(
            'titlebar__command-palette',
            'flex-1 flex justify-center',
            'px-4',
            '[app-region:no-drag]'
          )}
        >
          <CommandPaletteSearch
            placeholder={`${commandPaletteShortcut} Command Palette...`}
            shortcut={commandPaletteShortcut}
            onOpen={onCommandPaletteOpen}
          />
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Account */}
      {userInfo && (
        <button
          className={cn(
            'titlebar__user',
            'flex items-center gap-2 px-3',
            'text-[var(--ide-foreground,#cccccc)]',
            'hover:bg-[var(--ide-hover-bg,#5a5d5e50)]',
            'rounded',
            '[app-region:no-drag]'
          )}
          onClick={onUserClick}
          aria-label={`User: ${userInfo.name}`}
        >
          {userInfo.avatar ? (
            <img
              src={userInfo.avatar}
              alt={userInfo.name}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[var(--ide-accent,#007acc)] flex items-center justify-center text-xs text-white">
              {userInfo.name.charAt(0).toUpperCase()}
            </div>
          )}
          <svg
            className="w-3 h-3"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M4 6l4 4 4-4H4z" />
          </svg>
        </button>
      )}

      {/* Right padding */}
      <div className="w-3" />
    </header>
  );
};

export default TitleBar;
