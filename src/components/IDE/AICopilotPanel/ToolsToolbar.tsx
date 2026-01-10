/**
 * Tools Toolbar Component
 * 
 * Quick action buttons for common AI writing tasks.
 */

'use client';

import React from 'react';
import { 
  Wand2, 
  FileText, 
  MessageSquare, 
  Lightbulb, 
  ArrowRight,
  Sparkles,
  RefreshCw,
  Copy,
  BookOpen,
  Users,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CopilotTool } from './types';

interface ToolsToolbarProps {
  onToolSelect: (tool: CopilotTool) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const COPILOT_TOOLS: CopilotTool[] = [
  {
    id: 'continue',
    name: 'Continue',
    description: 'Continue writing from cursor',
    icon: <ArrowRight className="w-4 h-4" />,
    shortcut: '⌘⇧G',
    action: 'continue',
    prompt: 'Continue the story naturally from where it left off, maintaining the same voice and style.',
  },
  {
    id: 'improve',
    name: 'Improve',
    description: 'Enhance selected text',
    icon: <Sparkles className="w-4 h-4" />,
    shortcut: '⌘⇧I',
    action: 'improve',
    prompt: 'Improve this text while maintaining its meaning. Make it more engaging and polished.',
  },
  {
    id: 'explain',
    name: 'Explain',
    description: 'Explain writing concepts',
    icon: <Lightbulb className="w-4 h-4" />,
    action: 'explain',
    prompt: 'Explain the writing technique or concept behind this text.',
  },
  {
    id: 'dialogue',
    name: 'Dialogue',
    description: 'Generate character dialogue',
    icon: <MessageSquare className="w-4 h-4" />,
    action: 'custom',
    prompt: 'Generate natural dialogue for the characters in this scene.',
  },
  {
    id: 'describe',
    name: 'Describe',
    description: 'Add vivid descriptions',
    icon: <Palette className="w-4 h-4" />,
    action: 'custom',
    prompt: 'Add vivid sensory descriptions to enhance this scene.',
  },
  {
    id: 'character',
    name: 'Character',
    description: 'Develop character details',
    icon: <Users className="w-4 h-4" />,
    action: 'custom',
    prompt: 'Develop deeper character insights and motivations for this scene.',
  },
  {
    id: 'summarize',
    name: 'Summarize',
    description: 'Summarize the content',
    icon: <FileText className="w-4 h-4" />,
    action: 'custom',
    prompt: 'Provide a concise summary of this content.',
  },
  {
    id: 'rewrite',
    name: 'Rewrite',
    description: 'Rewrite in different style',
    icon: <RefreshCw className="w-4 h-4" />,
    action: 'replace',
    prompt: 'Rewrite this text in a different style while preserving the core meaning.',
  },
];

export const ToolsToolbar: React.FC<ToolsToolbarProps> = ({
  onToolSelect,
  orientation = 'vertical',
  className,
}) => {
  return (
    <div className={cn(
      'flex gap-1',
      orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
      className
    )}>
      <div className="px-2 py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[--ide-foreground-muted]">
          Quick Actions
        </p>
      </div>
      
      {COPILOT_TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolSelect(tool)}
          title={`${tool.name}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-left',
            'hover:bg-[--ide-list-hover] transition-colors',
            'text-[--ide-foreground] group'
          )}
        >
          <span className="text-[--ide-foreground-muted] group-hover:text-[--ide-accent] transition-colors">
            {tool.icon}
          </span>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium">{tool.name}</span>
            {orientation === 'vertical' && (
              <p className="text-[10px] text-[--ide-foreground-muted] truncate">
                {tool.description}
              </p>
            )}
          </div>
          {tool.shortcut && orientation === 'vertical' && (
            <span className="text-[10px] text-[--ide-foreground-muted] font-mono">
              {tool.shortcut}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export { COPILOT_TOOLS };
