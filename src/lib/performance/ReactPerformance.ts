/**
 * React Performance Utilities
 * 
 * Memoization helpers and optimized hooks for the IDE components.
 */

import React, { useCallback, useRef, useMemo, useEffect, useState } from 'react';

/**
 * Debounce a callback function
 */
export function useDebounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  
  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedCallback;
}

/**
 * Debounce a value
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Throttle a callback function
 */
export function useThrottle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    
    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callbackRef.current(...args);
    } else {
      // Schedule for later
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callbackRef.current(...args);
      }, delay - timeSinceLastCall);
    }
  }, [delay]) as T;
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return throttledCallback;
}

/**
 * Only update when specific props change
 */
export function useStableCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  
  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}

/**
 * Track previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Compare objects for shallow equality
 */
export function shallowEqual<T extends Record<string, unknown>>(
  objA: T,
  objB: T
): boolean {
  if (objA === objB) return true;
  if (!objA || !objB) return false;
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }
  
  return true;
}

/**
 * Memoize a complex object with custom comparison
 */
export function useMemoCompare<T>(
  value: T,
  compare: (prev: T | undefined, next: T) => boolean
): T {
  const ref = useRef<T>();
  
  const valueToReturn = useMemo(() => {
    const isEqual = compare(ref.current, value);
    if (isEqual) {
      return ref.current as T;
    }
    return value;
  }, [value, compare]);
  
  useEffect(() => {
    ref.current = valueToReturn;
  }, [valueToReturn]);
  
  return valueToReturn;
}

/**
 * Create a stable object reference
 */
export function useStableObject<T extends Record<string, unknown>>(obj: T): T {
  const ref = useRef(obj);
  
  const isEqual = useMemo(() => shallowEqual(ref.current, obj), [obj]);
  
  if (!isEqual) {
    ref.current = obj;
  }
  
  return ref.current;
}

/**
 * Run effect only after initial mount
 */
export function useUpdateEffect(
  effect: React.EffectCallback,
  deps: React.DependencyList
): void {
  const isFirstMount = useRef(true);
  
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Batch multiple state updates
 */
export function useBatchedUpdates<T>(
  setter: React.Dispatch<React.SetStateAction<T>>,
  delay: number = 16
): (update: T | ((prev: T) => T)) => void {
  const pendingUpdates = useRef<Array<T | ((prev: T) => T)>>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const batchedSetter = useCallback((update: T | ((prev: T) => T)) => {
    pendingUpdates.current.push(update);
    
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        const updates = pendingUpdates.current;
        pendingUpdates.current = [];
        timeoutRef.current = null;
        
        // Apply all updates sequentially
        setter(prev => {
          let result = prev;
          for (const update of updates) {
            if (typeof update === 'function') {
              result = (update as (prev: T) => T)(result);
            } else {
              result = update;
            }
          }
          return result;
        });
      }, delay);
    }
  }, [setter, delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return batchedSetter;
}

/**
 * Measure render performance
 */
export function useRenderCount(componentName: string): void {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${componentName}] Render count: ${renderCount.current}`);
    }
  });
}

/**
 * Create a component with display name for debugging
 */
export function withDisplayName<P extends object>(
  Component: React.FC<P>,
  displayName: string
): React.NamedExoticComponent<P> {
  const NamedComponent = React.memo(Component);
  NamedComponent.displayName = displayName;
  return NamedComponent;
}

export default {
  useDebounce,
  useDebouncedValue,
  useThrottle,
  useStableCallback,
  usePrevious,
  shallowEqual,
  useMemoCompare,
  useStableObject,
  useUpdateEffect,
  useBatchedUpdates,
  useRenderCount,
  withDisplayName,
};
