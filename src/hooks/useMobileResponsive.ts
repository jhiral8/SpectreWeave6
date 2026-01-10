/**
 * Mobile Responsive Hooks
 * 
 * React hooks for mobile-responsive IDE behavior including
 * breakpoint detection, touch gestures, and panel management.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Breakpoint values
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook to detect current breakpoint
 */
export function useBreakpoint(): {
  breakpoint: Breakpoint | null;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
} {
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return 1024;
    return window.innerWidth;
  });

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    // Use ResizeObserver for better performance
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        handleResize();
      });
      observer.observe(document.body);
      return () => observer.disconnect();
    }

    // Fallback to window resize event
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const breakpoint = (() => {
    if (width < BREAKPOINTS.sm) return null;
    if (width < BREAKPOINTS.md) return 'sm';
    if (width < BREAKPOINTS.lg) return 'md';
    if (width < BREAKPOINTS.xl) return 'lg';
    if (width < BREAKPOINTS['2xl']) return 'xl';
    return '2xl';
  })();

  return {
    breakpoint,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    width,
  };
}

/**
 * Hook to detect if device supports touch
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const isTouchDevice = 
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - msMaxTouchPoints is IE specific
      navigator.msMaxTouchPoints > 0;
    
    setIsTouch(isTouchDevice);
  }, []);

  return isTouch;
}

/**
 * Hook for swipe gesture detection
 */
export interface SwipeGestureOptions {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  enabled?: boolean;
}

export function useSwipeGesture(
  ref: React.RefObject<HTMLElement>,
  options: SwipeGestureOptions = {}
): void {
  const {
    threshold = 50,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    enabled = true,
  } = options;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine if horizontal or vertical swipe
      if (absX > absY && absX > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else if (absY > absX && absY > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }

      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, enabled]);
}

/**
 * Hook for mobile panel management
 */
export interface MobilePanelState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
}

export function useMobilePanels(initialState?: Partial<MobilePanelState>) {
  const [state, setState] = useState<MobilePanelState>({
    leftPanelOpen: false,
    rightPanelOpen: false,
    bottomPanelOpen: false,
    ...initialState,
  });

  const toggleLeftPanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      leftPanelOpen: !prev.leftPanelOpen,
      rightPanelOpen: false, // Close other panels
    }));
  }, []);

  const toggleRightPanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      rightPanelOpen: !prev.rightPanelOpen,
      leftPanelOpen: false, // Close other panels
    }));
  }, []);

  const toggleBottomPanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      bottomPanelOpen: !prev.bottomPanelOpen,
    }));
  }, []);

  const closeAllPanels = useCallback(() => {
    setState({
      leftPanelOpen: false,
      rightPanelOpen: false,
      bottomPanelOpen: false,
    });
  }, []);

  const openLeftPanel = useCallback(() => {
    setState(prev => ({ ...prev, leftPanelOpen: true, rightPanelOpen: false }));
  }, []);

  const openRightPanel = useCallback(() => {
    setState(prev => ({ ...prev, rightPanelOpen: true, leftPanelOpen: false }));
  }, []);

  return {
    ...state,
    toggleLeftPanel,
    toggleRightPanel,
    toggleBottomPanel,
    closeAllPanels,
    openLeftPanel,
    openRightPanel,
  };
}

/**
 * Hook to handle keyboard visibility on mobile
 */
export function useKeyboardVisibility(): {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
} {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use visualViewport API if available
    if (window.visualViewport) {
      const viewport = window.visualViewport;
      
      const handleResize = () => {
        const heightDiff = window.innerHeight - viewport.height;
        setIsKeyboardVisible(heightDiff > 150);
        setKeyboardHeight(heightDiff > 150 ? heightDiff : 0);
      };

      viewport.addEventListener('resize', handleResize);
      return () => viewport.removeEventListener('resize', handleResize);
    }

    // Fallback for older browsers
    const handleFocusIn = () => {
      const target = document.activeElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        // Estimate keyboard height
        setTimeout(() => {
          setIsKeyboardVisible(true);
          setKeyboardHeight(300); // Approximate
        }, 100);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return { isKeyboardVisible, keyboardHeight };
}

/**
 * Hook to detect orientation
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    // Use screen.orientation if available
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
      return () => {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      };
    }

    // Fallback to resize event
    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  return orientation;
}

/**
 * Hook to prevent body scroll when panel is open (mobile)
 */
export function usePreventBodyScroll(prevent: boolean): void {
  useEffect(() => {
    if (!prevent) return;

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [prevent]);
}

export default {
  useBreakpoint,
  useTouchDevice,
  useSwipeGesture,
  useMobilePanels,
  useKeyboardVisibility,
  useOrientation,
  usePreventBodyScroll,
  BREAKPOINTS,
};
