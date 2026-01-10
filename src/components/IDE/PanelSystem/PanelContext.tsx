'use client';

import React, { 
  createContext, 
  useContext, 
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  PanelLayout,
  PanelPosition,
  LeftPanelView,
  RightPanelView,
  BottomPanelView,
  DEFAULT_PANEL_LAYOUT,
  PANEL_CONSTRAINTS,
} from './types';

interface PanelContextValue {
  layout: PanelLayout;
  setActivePanel: (position: 'left' | 'right' | 'bottom', panel: string | null) => void;
  togglePanel: (position: 'left' | 'right' | 'bottom') => void;
  setPanelSize: (position: 'left' | 'right', size: number) => void;
  setPanelHeight: (height: number) => void;
  resetLayout: () => void;
}

const PanelContext = createContext<PanelContextValue | null>(null);

const STORAGE_KEY = 'spectreweave-panel-layout';

export const PanelProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children,
}) => {
  const [layout, setLayout] = useState<PanelLayout>(DEFAULT_PANEL_LAYOUT);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load layout from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLayout({
          ...DEFAULT_PANEL_LAYOUT,
          ...parsed,
        });
      }
    } catch (error) {
      console.error('Failed to load panel layout:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save layout to storage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch (error) {
      console.error('Failed to save panel layout:', error);
    }
  }, [layout, isLoaded]);

  const setActivePanel = useCallback((
    position: 'left' | 'right' | 'bottom',
    panel: string | null
  ) => {
    setLayout(prev => {
      const key = `${position}Panel` as keyof PanelLayout;
      return {
        ...prev,
        [key]: {
          ...prev[key],
          activePanel: panel,
          isVisible: panel !== null,
        },
      };
    });
  }, []);

  const togglePanel = useCallback((position: 'left' | 'right' | 'bottom') => {
    setLayout(prev => {
      const key = `${position}Panel` as keyof PanelLayout;
      const currentPanel = prev[key];
      
      return {
        ...prev,
        [key]: {
          ...currentPanel,
          isVisible: !currentPanel.isVisible,
        },
      };
    });
  }, []);

  const setPanelSize = useCallback((
    position: 'left' | 'right',
    size: number
  ) => {
    const constraints = PANEL_CONSTRAINTS[position];
    const clampedSize = Math.max(
      constraints.min,
      Math.min(constraints.max, size)
    );
    
    setLayout(prev => {
      const key = `${position}Panel` as keyof PanelLayout;
      return {
        ...prev,
        [key]: {
          ...prev[key],
          width: clampedSize,
        },
      };
    });
  }, []);

  const setPanelHeight = useCallback((height: number) => {
    const constraints = PANEL_CONSTRAINTS.bottom;
    const clampedHeight = Math.max(
      constraints.min,
      Math.min(constraints.max, height)
    );
    
    setLayout(prev => ({
      ...prev,
      bottomPanel: {
        ...prev.bottomPanel,
        height: clampedHeight,
      },
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_PANEL_LAYOUT);
  }, []);

  if (!isLoaded) {
    return null;
  }

  return (
    <PanelContext.Provider value={{
      layout,
      setActivePanel,
      togglePanel,
      setPanelSize,
      setPanelHeight,
      resetLayout,
    }}>
      {children}
    </PanelContext.Provider>
  );
};

export const usePanels = (): PanelContextValue => {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanels must be used within PanelProvider');
  }
  return context;
};
