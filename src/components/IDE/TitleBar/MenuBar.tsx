'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MenuBarProps, MenuBarItem, MenuBarItemProps } from './types';

/**
 * MenuBar Component
 * 
 * VS Code-style menu bar with dropdown menus.
 * Opens on click (not hover), closes on blur or escape.
 */
export const MenuBar: React.FC<MenuBarProps> = ({
  items,
  onItemClick,
  className,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleMenuClick = (item: MenuBarItem) => {
    if (item.submenu && item.submenu.length > 0) {
      setOpenMenuId(openMenuId === item.id ? null : item.id);
    } else {
      item.action?.();
      onItemClick?.(item);
      setOpenMenuId(null);
    }
  };

  const handleSubmenuClick = (item: MenuBarItem) => {
    item.action?.();
    onItemClick?.(item);
    setOpenMenuId(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.menubar')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  // Close menu on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [openMenuId]);

  return (
    <nav
      className={cn(
        'menubar',
        'flex items-center gap-0.5',
        'px-1',
        className
      )}
      role="menubar"
      aria-label="Menu Bar"
    >
      {items.map((item) => (
        <MenuBarButton
          key={item.id}
          item={item}
          isOpen={openMenuId === item.id}
          onClick={() => handleMenuClick(item)}
          onSubmenuClick={handleSubmenuClick}
        />
      ))}
    </nav>
  );
};

/**
 * MenuBarButton Component
 * 
 * Individual menu button with dropdown support.
 */
const MenuBarButton: React.FC<MenuBarItemProps> = ({
  item,
  isOpen,
  onClick,
  onSubmenuClick,
  className,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className={cn(
          'menubar__item',
          'px-2 py-1',
          'text-[13px]',
          'text-[var(--ide-foreground,#cccccc)]',
          'rounded',
          'hover:bg-[var(--ide-hover-bg,#5a5d5e50)]',
          isOpen && 'bg-[var(--ide-hover-bg,#5a5d5e50)]',
          item.disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={onClick}
        disabled={item.disabled}
        aria-haspopup={item.submenu ? 'menu' : undefined}
        aria-expanded={isOpen}
        role="menuitem"
      >
        {item.label}
      </button>

      {/* Dropdown Menu */}
      {isOpen && item.submenu && item.submenu.length > 0 && (
        <div
          className={cn(
            'menubar__dropdown',
            'absolute top-full left-0 mt-0.5',
            'min-w-[200px]',
            'bg-[var(--ide-bg-elevated,#252526)]',
            'border border-[var(--ide-border,#454545)]',
            'rounded-md shadow-lg',
            'py-1',
            'z-50'
          )}
          role="menu"
        >
          {item.submenu.map((subItem) => (
            <React.Fragment key={subItem.id}>
              {subItem.label === '' ? null : (
                <button
                  className={cn(
                    'menubar__dropdown-item',
                    'w-full px-3 py-1.5',
                    'flex items-center justify-between',
                    'text-[13px] text-left',
                    'text-[var(--ide-foreground,#cccccc)]',
                    'hover:bg-[var(--ide-accent-transparent,#094771)]',
                    'hover:text-[var(--ide-foreground,#ffffff)]',
                    subItem.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => onSubmenuClick?.(subItem)}
                  disabled={subItem.disabled}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    {subItem.icon && (
                      <span className="w-4 h-4">{subItem.icon}</span>
                    )}
                    {subItem.label}
                  </span>
                  {subItem.shortcut && (
                    <span className="text-[var(--ide-foreground,#cccccc)] opacity-60 text-[12px] ml-4">
                      {subItem.shortcut}
                    </span>
                  )}
                </button>
              )}
              {subItem.dividerAfter && (
                <div className="menubar__dropdown-divider h-px my-1 bg-[var(--ide-border,#454545)]" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuBar;
