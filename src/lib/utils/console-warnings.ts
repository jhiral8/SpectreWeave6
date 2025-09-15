/**
 * Utility to suppress specific console warnings that are known issues
 * with third-party libraries like TipTap v3 with React
 */

const originalError = console.error;
const originalWarn = console.warn;

// List of warning patterns to suppress
const suppressPatterns = [
  /React does not recognize the `tippyOptions` prop/,
  /tippyOptions/,
  /flushSync was called from inside a lifecycle method/,
  /Image with src.*has either width or height modified/,
];

function shouldSuppress(message: string): boolean {
  return suppressPatterns.some(pattern => pattern.test(message));
}

export function setupConsoleFilters() {
  // Only setup in development mode
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalError.apply(console, args);
    }
  };

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalWarn.apply(console, args);
    }
  };

  // Also patch React DevTools warnings if available
  if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const devtools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (devtools.onCommitFiberRoot) {
      const originalOnCommitFiberRoot = devtools.onCommitFiberRoot;
      devtools.onCommitFiberRoot = function(id: any, root: any, priorityLevel: any) {
        try {
          return originalOnCommitFiberRoot.apply(this, arguments);
        } catch (err: any) {
          if (!shouldSuppress(err.message || '')) {
            originalError('React DevTools error:', err);
          }
        }
      };
    }
  }
}

export function restoreConsole() {
  console.error = originalError;
  console.warn = originalWarn;
}