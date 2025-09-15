import React, { useState, useCallback } from 'react';
import { 
  Brain, 
  Sparkles, 
  FileText, 
  Search, 
  PenTool,
  Lightbulb,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';

interface AIWorkspacePanelProps {
  projectId: string;
  genre: string;
  isGenerating?: boolean;
  className?: string;
}

interface AIQuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

interface AISection {
  id: string;
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  children: React.ReactNode;
}

export const AIWorkspacePanel: React.FC<AIWorkspacePanelProps> = ({
  projectId,
  genre,
  isGenerating = false,
  className
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['quick-actions', 'suggestions'])
  );

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // AI Specialist based on genre - following existing pattern
  const getAISpecialist = () => {
    const genreSpecialists: Record<string, { name: string; description: string }> = {
      fantasy: { name: 'Fantasy Writing Expert', description: 'Specialized in fantasy world-building and magic systems' },
      'science-fiction': { name: 'Sci-Fi Writing Expert', description: 'Expert in scientific concepts and futuristic narratives' },
      mystery: { name: 'Mystery Writing Expert', description: 'Specialized in plot twists and suspense building' },
      romance: { name: 'Romance Writing Expert', description: 'Expert in character relationships and emotional arcs' },
      horror: { name: 'Horror Writing Expert', description: 'Specialized in atmospheric tension and psychological elements' },
      thriller: { name: 'Thriller Writing Expert', description: 'Expert in pacing and high-stakes scenarios' }
    };

    return genreSpecialists[genre] || {
      name: 'General Writing Assistant',
      description: 'AI assistant for creative writing support'
    };
  };

  const aiSpecialist = getAISpecialist();

  const quickActions: AIQuickAction[] = [
    {
      id: 'continue',
      label: 'Continue Writing',
      description: 'Let AI continue your story naturally',
      icon: <PenTool className="w-4 h-4" />,
      action: () => console.log('Continue writing'),
      variant: 'primary'
    },
    {
      id: 'outline',
      label: 'Generate Outline',
      description: 'Create a structured story outline',
      icon: <FileText className="w-4 h-4" />,
      action: () => console.log('Generate outline')
    },
    {
      id: 'improve',
      label: 'Improve Style',
      description: 'Enhance writing style and flow',
      icon: <Zap className="w-4 h-4" />,
      action: () => console.log('Improve style')
    },
    {
      id: 'research',
      label: 'Research & Citations',
      description: 'Find information and add citations',
      icon: <Search className="w-4 h-4" />,
      action: () => console.log('Research')
    }
  ];

  const sections: AISection[] = [
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      icon: <Sparkles className="w-4 h-4" />,
      isExpanded: expandedSections.has('quick-actions'),
      children: (
        <div className="space-y-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              disabled={isGenerating}
              className={cn(
                'w-full p-3 rounded-lg text-left transition-all duration-200',
                'border border-neutral-200 dark:border-neutral-700',
                'hover:border-neutral-300 dark:hover:border-neutral-600',
                'hover:bg-black/5 dark:hover:bg-white/5',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                action.variant === 'primary' && 'bg-primary/5 border-primary/20 hover:bg-primary/10'
              )}
            >
              <div className="flex items-center gap-3 mb-1">
                {action.icon}
                <span className="text-sm font-medium text-black dark:text-white">
                  {action.label}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {action.description}
              </p>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'suggestions',
      title: 'Smart Suggestions',
      icon: <Lightbulb className="w-4 h-4" />,
      isExpanded: expandedSections.has('suggestions'),
      children: (
        <div className="space-y-3">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Real-time writing assistance based on your current context
          </div>
          <div className="space-y-2">
            <SuggestionCard
              suggestion="Consider expanding this character's emotional reaction to create deeper reader connection"
              confidence={0.85}
              type="character"
            />
            <SuggestionCard
              suggestion="This dialogue could be more specific to reflect the character's background"
              confidence={0.72}
              type="dialogue"
            />
            <SuggestionCard
              suggestion="The pacing in this scene could benefit from more tension building"
              confidence={0.68}
              type="pacing"
            />
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      title: 'Writing Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      isExpanded: expandedSections.has('analytics'),
      children: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Readability" value="8.2" color="green" />
            <MetricCard label="Variety" value="Good" color="blue" />
            <MetricCard label="Pacing" value="7.5" color="yellow" />
            <MetricCard label="Voice" value="Strong" color="purple" />
          </div>
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              Document Progress
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full w-3/4"></div>
              </div>
              <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                75%
              </span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className={cn(
      'w-80 bg-card border-l border-border flex flex-col h-full',
      className
    )}>
      {/* AI Header - Following existing pattern */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center tracking-tight">
            <Brain className="w-5 h-5 mr-3 text-primary" />
            AI Assistant
          </h2>
          <button className="btn-primary text-xs px-3 py-1.5 h-auto min-h-0">
            Pro
          </button>
        </div>
        
        {/* AI Specialist Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isGenerating ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
            )} />
            <span className="text-sm text-muted-foreground">
              {isGenerating ? 'Generating...' : 'Online'} • Gemini 2.0 Flash
            </span>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="font-medium text-sm text-foreground mb-1">
              {aiSpecialist.name}
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              {aiSpecialist.description}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {sections.map((section) => (
            <AISection
              key={section.id}
              section={section}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface AISectionProps {
  section: AISection;
  onToggle: () => void;
}

const AISection: React.FC<AISectionProps> = ({ section, onToggle }) => {
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between p-2 rounded-lg',
          'hover:bg-black/5 dark:hover:bg-white/5',
          'transition-colors duration-200',
          'text-left'
        )}
      >
        <div className="flex items-center gap-2">
          {section.icon}
          <span className="text-sm font-medium text-black dark:text-white">
            {section.title}
          </span>
        </div>
        {section.isExpanded ? (
          <ChevronDown className="w-4 h-4 text-neutral-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        )}
      </button>
      
      {section.isExpanded && (
        <div className="pl-2">
          {section.children}
        </div>
      )}
    </div>
  );
};

interface AISectionProps {
  section: AISection;
  onToggle: () => void;
}

const AISection: React.FC<AISectionProps> = ({ section, onToggle }) => {
  return (
    <div className="space-y-3">
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between p-2 rounded-lg',
          'hover:bg-muted/50 transition-colors duration-200',
          'text-left'
        )}
      >
        <div className="flex items-center gap-2">
          {section.icon}
          <span className="text-sm font-medium text-foreground">
            {section.title}
          </span>
        </div>
        {section.isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {section.isExpanded && (
        <div className="pl-2">
          {section.children}
        </div>
      )}
    </div>
  );
};

interface SuggestionCardProps {
  suggestion: string;
  confidence: number;
  type: 'character' | 'dialogue' | 'plot' | 'style' | 'grammar' | 'pacing';
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, confidence, type }) => {
  const typeColors = {
    character: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    dialogue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    plot: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    style: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
    grammar: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    pacing: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
  };

  const colorClass = typeColors[type];
  const [textClass, bgClass] = colorClass.split(' bg-');

  return (
    <div className={cn(
      'p-3 rounded-lg border border-border',
      'bg-card hover:bg-muted/30',
      'transition-all duration-200 cursor-pointer'
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={cn(
          'text-xs font-medium capitalize px-2 py-1 rounded-full',
          textClass,
          `bg-${bgClass}`
        )}>
          {type}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span className="text-xs text-muted-foreground">
            {Math.round(confidence * 100)}%
          </span>
        </div>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-3">
        {suggestion}
      </p>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          buttonSize="small" 
          className="text-xs h-7 px-3 text-primary hover:bg-primary/10"
        >
          Apply
        </Button>
        <Button
          variant="ghost"
          buttonSize="small"
          className="text-xs h-7 px-3 text-muted-foreground hover:bg-muted/50"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  color?: 'green' | 'blue' | 'yellow' | 'purple' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, color = 'blue' }) => {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
  };

  return (
    <div className={cn(
      'p-3 rounded-lg border border-border',
      colorClasses[color]
    )}>
      <div className="text-xs text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-sm font-semibold">
        {value}
      </div>
    </div>
  );
};