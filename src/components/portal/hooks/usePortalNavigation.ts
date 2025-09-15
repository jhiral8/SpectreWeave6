'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface NavigationState {
  currentSection: 'dashboard' | 'projects' | 'settings' | 'profile';
  isNavigating: boolean;
  previousSection: string | null;
  breadcrumbs: BreadcrumbItem[];
}

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}

interface UsePortalNavigationReturn {
  navigationState: NavigationState;
  navigateTo: (section: string, params?: Record<string, string>) => void;
  navigateToEditor: (projectId: string) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  setCurrentSection: (section: NavigationState['currentSection']) => void;
  updateBreadcrumbs: (items: Omit<BreadcrumbItem, 'isActive'>[]) => void;
  isCurrentSection: (section: string) => boolean;
  buildUrl: (path: string, params?: Record<string, string>) => string;
}

export const usePortalNavigation = (): UsePortalNavigationReturn => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentSection: 'dashboard',
    isNavigating: false,
    previousSection: null,
    breadcrumbs: [
      { label: 'Dashboard', path: '/dashboard', isActive: true }
    ]
  });

  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Update current section based on pathname
  useEffect(() => {
    const section = pathname.split('/')[1] || 'dashboard';
    const validSection = ['dashboard', 'projects', 'settings', 'profile'].includes(section)
      ? section as NavigationState['currentSection']
      : 'dashboard';

    setNavigationState(prev => ({
      ...prev,
      currentSection: validSection,
      previousSection: prev.currentSection !== validSection ? prev.currentSection : prev.previousSection
    }));

    // Update history
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    setHistory(prev => {
      const newHistory = [...prev];
      if (newHistory[historyIndex] !== currentUrl) {
        // Remove any forward history when navigating to a new page
        const updatedHistory = newHistory.slice(0, historyIndex + 1);
        updatedHistory.push(currentUrl);
        setHistoryIndex(updatedHistory.length - 1);
        return updatedHistory;
      }
      return prev;
    });
  }, [pathname, searchParams, historyIndex]);

  // Build URL with parameters
  const buildUrl = useCallback((path: string, params?: Record<string, string>) => {
    if (!params || Object.keys(params).length === 0) {
      return path;
    }

    const searchParams = new URLSearchParams(params);
    return `${path}?${searchParams.toString()}`;
  }, []);

  // Navigate to a specific section
  const navigateTo = useCallback((section: string, params?: Record<string, string>) => {
    setNavigationState(prev => ({ ...prev, isNavigating: true }));
    
    const url = buildUrl(section, params);
    router.push(url);
    
    // Reset navigation state after a short delay
    setTimeout(() => {
      setNavigationState(prev => ({ ...prev, isNavigating: false }));
    }, 300);
  }, [router, buildUrl]);

  // Navigate to editor with project
  const navigateToEditor = useCallback((projectId: string) => {
    setNavigationState(prev => ({ ...prev, isNavigating: true }));
    
    const url = `/dual-surface-demo?project=${projectId}`;
    router.push(url);
    
    // Reset navigation state after a short delay
    setTimeout(() => {
      setNavigationState(prev => ({ ...prev, isNavigating: false }));
    }, 300);
  }, [router]);

  // Go back in history
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      router.push(history[newIndex]);
    }
  }, [router, history, historyIndex]);

  // Go forward in history
  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      router.push(history[newIndex]);
    }
  }, [router, history, historyIndex]);

  // Check if we can go back/forward
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  // Set current section manually
  const setCurrentSection = useCallback((section: NavigationState['currentSection']) => {
    setNavigationState(prev => ({
      ...prev,
      currentSection: section,
      previousSection: prev.currentSection !== section ? prev.currentSection : prev.previousSection
    }));
  }, []);

  // Update breadcrumbs
  const updateBreadcrumbs = useCallback((items: Omit<BreadcrumbItem, 'isActive'>[]) => {
    const breadcrumbs = items.map((item, index) => ({
      ...item,
      isActive: index === items.length - 1
    }));

    setNavigationState(prev => ({
      ...prev,
      breadcrumbs
    }));
  }, []);

  // Check if current section matches
  const isCurrentSection = useCallback((section: string) => {
    return navigationState.currentSection === section;
  }, [navigationState.currentSection]);

  return {
    navigationState,
    navigateTo,
    navigateToEditor,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    setCurrentSection,
    updateBreadcrumbs,
    isCurrentSection,
    buildUrl
  };
};