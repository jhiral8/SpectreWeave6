'use client';

import React, { useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Users,
  Globe,
  Search,
  Bot,
  Settings,
  Home,
  FileText,
} from 'lucide-react';
import { ActivityBarItem } from './ActivityBarItem';
import { usePanels } from '../PanelSystem/PanelContext';

interface ActivityItem {
  id: string;
  icon: React.ElementType;
  label: string;
  panel: string; // Which panel this opens
  badge?: number | 'dot';
  badgeColor?: 'error' | 'warning' | 'info';
  shortcut?: string;
}

interface ActivityBarProps {
  problemCount?: number;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({ 
  problemCount = 0,
}) => {
  const { layout, setActivePanel, togglePanel } = usePanels();
  const router = useRouter();

  const topItems: ActivityItem[] = useMemo(() => [
    {
      id: 'story-explorer',
      icon: BookOpen,
      label: 'Story Explorer',
      panel: 'story-explorer',
      shortcut: '⌘1',
    },
    {
      id: 'characters',
      icon: Users,
      label: 'Characters',
      panel: 'characters',
      shortcut: '⌘2',
    },
    {
      id: 'notes',
      icon: FileText,
      label: 'Research & Notes',
      panel: 'notes',
      shortcut: '⌘3',
    },
    {
      id: 'world',
      icon: Globe,
      label: 'World Building',
      panel: 'world',
      shortcut: '⌘4',
    },
    {
      id: 'search',
      icon: Search,
      label: 'Search',
      panel: 'search',
      shortcut: '⌘⇧F',
    },
    {
      id: 'ai-agents',
      icon: Bot,
      label: 'AI Agents',
      panel: 'ai-agents',
      badge: problemCount > 0 ? problemCount : undefined,
      badgeColor: problemCount > 0 ? 'warning' : undefined,
      shortcut: '⌘⇧A',
    },
  ], [problemCount]);

  const bottomItems: ActivityItem[] = useMemo(() => [
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      panel: 'settings',
      shortcut: '⌘,',
    },
  ], []);

  const handleItemClick = useCallback((item: ActivityItem) => {
    if (layout.leftPanel.activePanel === item.panel) {
      // Toggle off if clicking active panel
      togglePanel('left');
    } else {
      setActivePanel('left', item.panel);
    }
  }, [layout.leftPanel.activePanel, setActivePanel, togglePanel]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      if (!e.metaKey && !e.ctrlKey) return;
      
      // Cmd+H for home/portal
      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        router.push('/portal/dashboard');
        return;
      }
      
      // Cmd+1-4 for panels
      if (e.key === '1') {
        e.preventDefault();
        handleItemClick(topItems[0]); // Story Explorer
      } else if (e.key === '2') {
        e.preventDefault();
        handleItemClick(topItems[1]); // Characters
      } else if (e.key === '3') {
        e.preventDefault();
        handleItemClick(topItems[2]); // Notes
      } else if (e.key === '4') {
        e.preventDefault();
        handleItemClick(topItems[3]); // World
      } else if (e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleItemClick(topItems[4]); // Search
      } else if (e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleItemClick(topItems[5]); // AI Agents
      } else if (e.key === ',') {
        e.preventDefault();
        handleItemClick(bottomItems[0]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleItemClick, topItems, bottomItems, router]);

  return (
    <div className={cn(
      'activity-bar flex flex-col w-12 h-full',
      'bg-[--ide-activitybar-bg] border-r border-[--ide-border]',
      'flex-shrink-0'
    )}>
      {/* Home button at top */}
      <div className="py-2 border-b border-[--ide-border]">
        <ActivityBarItem
          icon={Home}
          label="Back to Portal"
          isActive={false}
          shortcut="⌘H"
          onClick={() => router.push('/portal/dashboard')}
        />
      </div>

      {/* Top items */}
      <div className="flex-1 flex flex-col py-2">
        {topItems.map((item) => (
          <ActivityBarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={layout.leftPanel.activePanel === item.panel && layout.leftPanel.isVisible}
            badge={item.badge}
            badgeColor={item.badgeColor}
            shortcut={item.shortcut}
            onClick={() => handleItemClick(item)}
          />
        ))}
      </div>
      
      {/* Bottom items */}
      <div className="flex flex-col py-2 border-t border-[--ide-border]">
        {bottomItems.map((item) => (
          <ActivityBarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={layout.leftPanel.activePanel === item.panel && layout.leftPanel.isVisible}
            shortcut={item.shortcut}
            onClick={() => handleItemClick(item)}
          />
        ))}
      </div>
    </div>
  );
};
