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
        'relative w-12 h-12 flex items-center justify-center',
        'transition-colors duration-100',
        isActive
          ? 'text-[--ide-activitybar-fg]'
          : 'text-[--ide-activitybar-inactive] hover:text-[--ide-activitybar-fg]'
      )}
      aria-label={label}
      aria-pressed={isActive}
    >
      {/* Active indicator - white bar on left */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[--ide-activitybar-fg]" />
      )}
      
      {/* Icon - no scale effect for cleaner look */}
      <Icon className="w-6 h-6" />
      
      {/* Badge */}
      {badge !== undefined && (
        <div 
          className={cn(
            'absolute top-2 right-2',
            badge === 'dot'
              ? 'w-2 h-2 rounded-full'
              : 'min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center',
            badgeColor === 'error' && 'bg-[--ide-error] text-white',
            badgeColor === 'warning' && 'bg-[--ide-warning] text-black',
            badgeColor === 'info' && 'bg-[--ide-info] text-white',
            !badgeColor && 'bg-[--ide-activitybar-badge] text-white'
          )}
        >
          {badge !== 'dot' && badge}
        </div>
      )}
      
      {/* Tooltip */}
      {showTooltip && (
        <div 
          className={cn(
            'absolute left-full ml-2 py-1 px-2 rounded',
            'bg-[--ide-background-tertiary] text-[--ide-foreground]',
            'text-[11px] whitespace-nowrap pointer-events-none',
            'border border-[--ide-border] shadow-md z-50',
            'flex items-center gap-2'
          )}
        >
          <span>{label}</span>
          {shortcut && (
            <kbd className="px-1 py-0.5 rounded text-[10px] bg-[--ide-background] border border-[--ide-border] text-[--ide-foreground-muted]">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </button>
  );
};
