'use client';

/**
 * RightPanelContent
 * 
 * Switches between different right panel views based on the active panel selection.
 * This follows VS Code's pattern of having multiple views in the right sidebar.
 */

import React from 'react';
import { usePanels } from '../PanelSystem/PanelContext';
import { AIChatPanel } from '../AIChatPanel';

// Lazy load other panels to reduce initial bundle
const AIAgentsPanel = React.lazy(() => 
  import('../AIAgents/AIAgentsPanel').then(m => ({ default: m.AIAgentsPanel }))
);

/**
 * Placeholder for panels not yet implemented
 */
const PlaceholderPanel: React.FC<{ name: string }> = ({ name }) => (
  <div className="h-full flex flex-col items-center justify-center p-4 text-center">
    <div className="text-[var(--ide-foreground-muted)] text-sm">
      <p className="font-medium mb-1">{name}</p>
      <p className="text-xs opacity-70">Coming soon</p>
    </div>
  </div>
);

/**
 * RightPanelContent renders the appropriate panel based on the current selection.
 * Uses React.Suspense for code-split panels.
 */
export const RightPanelContent: React.FC = () => {
  const { layout } = usePanels();
  const activePanel = layout.rightPanel.activePanel;

  // Loading fallback for lazy-loaded panels
  const loadingFallback = (
    <div className="h-full flex items-center justify-center">
      <div className="animate-pulse text-[var(--ide-foreground-muted)] text-sm">
        Loading...
      </div>
    </div>
  );

  // Render the active panel
  const renderPanel = () => {
    switch (activePanel) {
      case 'ai-chat':
        return <AIChatPanel />;
      
      case 'outline':
        return <PlaceholderPanel name="Document Outline" />;
      
      case 'references':
        return <PlaceholderPanel name="References" />;
      
      default:
        // Default to AI Chat if no panel selected
        return <AIChatPanel />;
    }
  };

  return (
    <React.Suspense fallback={loadingFallback}>
      {renderPanel()}
    </React.Suspense>
  );
};

export default RightPanelContent;
