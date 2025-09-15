'use client';

import React from 'react';
import { FileText, FolderPlus, Users, Zap, BookOpen, Settings } from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface QuickActionsPanelProps {
  user: any;
  onNewProject?: () => void;
  onTemplateSelect?: (templateId: string) => void;
  onAIFeatureToggle?: (feature: string) => void;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  user,
  onNewProject,
  onTemplateSelect,
  onAIFeatureToggle
}) => {
  const quickActions: QuickAction[] = [
    {
      id: 'new-project',
      title: 'New Project',
      description: 'Start a new writing project',
      icon: <FileText className="w-6 h-6" />,
      onClick: () => onNewProject?.()
    },
    {
      id: 'templates',
      title: 'Templates',
      description: 'Browse project templates',
      icon: <BookOpen className="w-6 h-6" />,
      onClick: () => onTemplateSelect?.('default')
    },
    {
      id: 'ai-assist',
      title: 'AI Assistant',
      description: 'Get writing help from AI',
      icon: <Zap className="w-6 h-6" />,
      onClick: () => onAIFeatureToggle?.('assistant')
    },
    {
      id: 'collaborate',
      title: 'Collaborate',
      description: 'Invite team members',
      icon: <Users className="w-6 h-6" />,
      onClick: () => console.log('Collaboration coming soon')
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure preferences',
      icon: <Settings className="w-6 h-6" />,
      onClick: () => console.log('Settings coming soon')
    }
  ];

  return (
    <div className="bg-slate-800/60 border border-purple-700/30 rounded-lg p-6 ai-neural-border">
      <h3 className="text-lg font-surgena text-white mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className="flex flex-col items-center p-4 text-center bg-slate-700/40 hover:bg-slate-600/60 border border-purple-600/20 hover:border-purple-500/40 rounded-lg transition-all ai-confidence-border ai-data-flow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-purple-400 mb-2">
              {action.icon}
            </div>
            
            <h4 className="text-sm font-surgena text-white mb-1">
              {action.title}
            </h4>
            
            <p className="text-xs text-purple-300/70 leading-tight">
              {action.description}
            </p>
          </button>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-purple-700/30">
        <div className="text-xs text-purple-400/60 text-center">
          Need help getting started? Check out our{' '}
          <button className="text-purple-300 hover:text-white underline">
            documentation
          </button>
        </div>
      </div>
    </div>
  );
};

export { QuickActionsPanel };