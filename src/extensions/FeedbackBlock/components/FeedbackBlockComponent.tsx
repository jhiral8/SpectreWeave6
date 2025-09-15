import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { 
  MessageSquare, 
  Bot, 
  User, 
  Users, 
  BookOpen, 
  Edit3,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  MoreHorizontal,
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import { FeedbackBlockType } from '../FeedbackBlock';

interface FeedbackBlockComponentProps {
  node: any;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
  selected: boolean;
  decorations: any[];
  view: any;
  getPos: () => number;
  innerDecorations: any;
  editor: any;
  extension: any;
  HTMLAttributes: Record<string, any>;
  ref: React.RefObject<HTMLElement>;
}

const FEEDBACK_TYPES: Record<FeedbackBlockType, {
  icon: any;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}> = {
  'ai-feedback': {
    icon: Bot,
    label: 'AI Feedback',
    color: 'text-blue-900 dark:text-blue-100',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  'editor-note': {
    icon: User,
    label: 'Editor Note',
    color: 'text-green-900 dark:text-green-100',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  'character-note': {
    icon: Users,
    label: 'Character Note',
    color: 'text-purple-900 dark:text-purple-100',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  'plot-reminder': {
    icon: BookOpen,
    label: 'Plot Reminder',
    color: 'text-orange-900 dark:text-orange-100',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  'revision-note': {
    icon: Edit3,
    label: 'Revision Note',
    color: 'text-red-900 dark:text-red-100',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  'grammar': {
    icon: Edit3,
    label: 'Grammar',
    color: 'text-yellow-900 dark:text-yellow-100',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  'style': {
    icon: Edit3,
    label: 'Style',
    color: 'text-indigo-900 dark:text-indigo-100',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  'consistency': {
    icon: AlertCircle,
    label: 'Consistency',
    color: 'text-pink-900 dark:text-pink-100',
    bgColor: 'bg-pink-50 dark:bg-pink-950/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  'pacing': {
    icon: AlertTriangle,
    label: 'Pacing',
    color: 'text-cyan-900 dark:text-cyan-100',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
};

const SEVERITY_CONFIG = {
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  suggestion: {
    icon: Lightbulb,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
};

export const FeedbackBlockComponent: React.FC<FeedbackBlockComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const { type, author, timestamp, resolved, collapsed, severity, suggestions } = node.attrs;
  
  const feedbackType = FEEDBACK_TYPES[type as FeedbackBlockType];
  const severityConfig = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
  const IconComponent = feedbackType.icon;
  const SeverityIcon = severityConfig.icon;

  const toggleCollapsed = () => {
    updateAttributes({ collapsed: !collapsed });
  };

  const toggleResolved = () => {
    updateAttributes({ resolved: !resolved });
  };

  const changeType = (newType: string) => {
    updateAttributes({ type: newType });
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <NodeViewWrapper
      className={cn(
        "feedback-block-wrapper my-4 transition-all duration-200",
        selected && "ring-2 ring-blue-500 dark:ring-blue-400 rounded-lg"
      )}
    >
      <div
        className={cn(
          "feedback-block border-l-4 rounded-lg p-3 transition-all duration-200",
          feedbackType.bgColor,
          feedbackType.borderColor,
          feedbackType.color,
          resolved && "opacity-60",
          collapsed && "pb-2"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleCollapsed}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            <IconComponent className={cn("w-4 h-4", feedbackType.iconColor)} />
            
            <span className="text-sm font-medium">
              {feedbackType.label}
            </span>
            
            {severity && severity !== 'suggestion' && (
              <Badge variant="outline" className={cn("text-xs", severityConfig.borderColor)}>
                <SeverityIcon className="w-3 h-3 mr-1" />
                {severity}
              </Badge>
            )}
            
            {resolved && (
              <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-700">
                <Check className="w-3 h-3 mr-1" />
                Resolved
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-xs opacity-70">
              {author} • {formatTimestamp(timestamp)}
            </span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  buttonSize="iconSmall"
                  variant="ghost"
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Change Type</DropdownMenuLabel>
                {Object.entries(FEEDBACK_TYPES).map(([key, config]) => {
                  const MenuIcon = config.icon;
                  return (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => changeType(key)}
                      className={type === key ? 'bg-gray-100 dark:bg-gray-800' : ''}
                    >
                      <MenuIcon className={cn("w-4 h-4 mr-2", config.iconColor)} />
                      {config.label}
                    </DropdownMenuItem>
                  );
                })}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={toggleResolved}>
                  <Check className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                  {resolved ? 'Mark as Unresolved' : 'Mark as Resolved'}
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={deleteNode}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <X className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="feedback-content">
            <NodeViewContent className="prose prose-sm dark:prose-invert max-w-none focus:outline-none" />
            
            {/* Suggestions Display */}
            {suggestions && suggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium mb-2 opacity-70">Suggestions:</h4>
                <ul className="space-y-1">
                  {suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 bg-current rounded-full mt-1.5 flex-shrink-0 opacity-50"></span>
                      <span className="opacity-90">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};