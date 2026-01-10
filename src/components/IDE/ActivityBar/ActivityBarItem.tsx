'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ActivityBarItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  badge?: number | 'dot';
  badgeColor?: 'error' | 'warning' | 'info';
  shortcut?: string;
  onClick: () => void;
}

export const ActivityBarItem: React.FC<ActivityBarItemProps> = ({
  icon: Icon,
  label,
  isActive,
  badge,
  badgeColor,
  shortcut,
  onClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Show tooltip after a short delay
  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => setShowTooltip(true), 400);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'vscode-activitybar__item relative flex items-center justify-center',
        'w-[48px] h-[48px]', // Exact VS Code dimensions
        'transition-colors duration-100',
        isActive
          ? 'text-[var(--ide-foreground,#ffffff)]'
          : 'text-[var(--ide-foreground-muted,#8c8c8c)] hover:text-[var(--ide-foreground,#ffffff)]'
      )}
      aria-label={label}
      aria-pressed={isActive}
    >
      {/* Active indicator - white bar on left (VS Code style) */}
      {isActive && (
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-[var(--ide-accent,#ffffff)]" 
        />
      )}
      
      {/* Icon - 24px VS Code standard */}
      <Icon className="w-6 h-6" />
      
      {/* Badge - VS Code style */}
      {badge !== undefined && (
        <div 
          className={cn(
            'vscode-activitybar__badge absolute top-2 right-2',
            badge === 'dot'
              ? 'w-2 h-2 rounded-full'
              : 'min-w-[18px] h-[18px] px-1 rounded-[9px] text-[11px] font-medium flex items-center justify-center',
            badgeColor === 'error' && 'bg-red-500 text-white',
            badgeColor === 'warning' && 'bg-yellow-500 text-black',
            badgeColor === 'info' && 'bg-[var(--ide-accent,#007acc)] text-white',
            !badgeColor && 'bg-[var(--ide-accent,#007acc)] text-white'
          )}
        >
          {badge !== 'dot' && badge}
        </div>
      )}
      
      {/* Tooltip - VS Code style */}
      {showTooltip && (
        <div 
          className={cn(
            'absolute left-full ml-2 py-1.5 px-2.5 rounded',
            'bg-[var(--ide-bg-elevated,#252526)]',
            'text-[var(--ide-foreground,#cccccc)]',
            'text-[12px] whitespace-nowrap pointer-events-none',
            'border border-[var(--ide-border,#454545)]',
            'shadow-lg z-50',
            'flex items-center gap-3'
          )}
        >
          <span>{label}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.5 rounded text-[11px] bg-[var(--ide-bg,#464647)] border border-[var(--ide-border,#3c3c3c)] text-[var(--ide-foreground-muted,#cccccc)]">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </button>
  );
};
