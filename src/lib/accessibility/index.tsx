/**
 * Accessibility Utilities for IDE
 * 
 * ARIA helpers, focus management, screen reader announcements,
 * and reduced motion support.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Create a live region for screen reader announcements
 */
export function useAnnouncer() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region element
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);
    announcerRef.current = announcer;

    return () => {
      announcer.remove();
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcerRef.current) return;
    
    announcerRef.current.setAttribute('aria-live', priority);
    announcerRef.current.textContent = '';
    
    // Force reannouncement by clearing and setting
    requestAnimationFrame(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = message;
      }
    });
  }, []);

  return { announce };
}

/**
 * Focus trap for modal dialogs
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, active: boolean) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Store previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    const focusableElements = getFocusableElements();
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus on unmount
      previousFocusRef.current?.focus();
    };
  }, [active, containerRef]);
}

/**
 * Roving tabindex for list navigation
 */
export function useRovingTabindex<T extends HTMLElement>(
  containerRef: React.RefObject<T>,
  itemSelector: string,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
    onSelect?: (element: HTMLElement, index: number) => void;
  } = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>(itemSelector);
    
    // Set initial tabindex
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === activeIndex ? '0' : '-1');
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = container.querySelectorAll<HTMLElement>(itemSelector);
      let nextIndex = activeIndex;

      const isVertical = orientation === 'vertical' || orientation === 'both';
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';

      if ((e.key === 'ArrowDown' && isVertical) || (e.key === 'ArrowRight' && isHorizontal)) {
        e.preventDefault();
        nextIndex = loop 
          ? (activeIndex + 1) % items.length 
          : Math.min(activeIndex + 1, items.length - 1);
      } else if ((e.key === 'ArrowUp' && isVertical) || (e.key === 'ArrowLeft' && isHorizontal)) {
        e.preventDefault();
        nextIndex = loop 
          ? (activeIndex - 1 + items.length) % items.length 
          : Math.max(activeIndex - 1, 0);
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = items.length - 1;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect?.(items[activeIndex], activeIndex);
        return;
      }

      if (nextIndex !== activeIndex) {
        setActiveIndex(nextIndex);
        items.forEach((item, index) => {
          item.setAttribute('tabindex', index === nextIndex ? '0' : '-1');
        });
        items[nextIndex]?.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, itemSelector, activeIndex, orientation, loop, onSelect]);

  return { activeIndex, setActiveIndex };
}

/**
 * Check if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Check if user prefers high contrast
 */
export function usePrefersHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: more)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
}

/**
 * Skip to main content link
 */
export function SkipToContent({ contentId = 'main-content' }: { contentId?: string }) {
  return (
    <a
      href={`#${contentId}`}
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-[9999]
        focus:px-4 focus:py-2 focus:rounded-md
        focus:bg-primary focus:text-primary-foreground
        focus:ring-2 focus:ring-offset-2 focus:ring-primary
        focus:outline-none
      "
    >
      Skip to main content
    </a>
  );
}

/**
 * ARIA ID generator
 */
let idCounter = 0;
export function useAriaId(prefix: string = 'aria'): string {
  const [id] = useState(() => `${prefix}-${++idCounter}`);
  return id;
}

/**
 * Accessible button group props
 */
export interface AccessibleButtonGroupProps {
  label: string;
  children: React.ReactNode;
}

export function AccessibleButtonGroup({ label, children }: AccessibleButtonGroupProps) {
  return (
    <div role="group" aria-label={label}>
      {children}
    </div>
  );
}

/**
 * Generate descriptive text for agent status
 */
export function getAgentStatusDescription(
  agentName: string,
  status: 'idle' | 'working' | 'success' | 'error'
): string {
  switch (status) {
    case 'idle':
      return `${agentName} is ready`;
    case 'working':
      return `${agentName} is processing`;
    case 'success':
      return `${agentName} completed successfully`;
    case 'error':
      return `${agentName} encountered an error`;
    default:
      return agentName;
  }
}

/**
 * Generate descriptive text for problems panel
 */
export function getProblemsDescription(
  errors: number,
  warnings: number
): string {
  const parts: string[] = [];
  
  if (errors > 0) {
    parts.push(`${errors} ${errors === 1 ? 'error' : 'errors'}`);
  }
  
  if (warnings > 0) {
    parts.push(`${warnings} ${warnings === 1 ? 'warning' : 'warnings'}`);
  }
  
  if (parts.length === 0) {
    return 'No problems found';
  }
  
  return parts.join(' and ');
}

/**
 * Hook for managing focus with keyboard
 */
export function useKeyboardFocus() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
}

export default {
  useAnnouncer,
  useFocusTrap,
  useRovingTabindex,
  usePrefersReducedMotion,
  usePrefersHighContrast,
  useAriaId,
  useKeyboardFocus,
  SkipToContent,
  AccessibleButtonGroup,
  getAgentStatusDescription,
  getProblemsDescription,
};
