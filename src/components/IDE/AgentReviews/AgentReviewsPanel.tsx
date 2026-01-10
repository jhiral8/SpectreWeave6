/**
 * Agent Reviews Panel
 * 
 * Displays saved agent reviews organized by chapter and agent type.
 * Users can view, accept, or dismiss agent suggestions.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Bot,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Eye,
  Trash2,
  Clock,
  FileText,
} from 'lucide-react';

interface AgentReview {
  id: string;
  project_id: string;
  chapter_id?: string;
  agent_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  suggestions: AgentSuggestion[];
  summary?: string;
  created_at: string;
  updated_at: string;
}

interface AgentSuggestion {
  id: string;
  type: string;
  severity: 'minor' | 'moderate' | 'major';
  quote?: string;
  issue: string;
  suggestion: string;
  example?: string;
}

interface AgentReviewsPanelProps {
  reviews?: AgentReview[];
  chapters?: Array<{ id: string; title: string }>;
  onViewReview?: (reviewId: string) => void;
  onDeleteReview?: (reviewId: string) => Promise<void>;
  onApplySuggestion?: (reviewId: string, suggestionId: string) => void;
  className?: string;
}

const AGENT_LABELS: Record<string, string> = {
  'style-coach': 'Style Coach',
  'character-keeper': 'Character Keeper',
  'plot-analyst': 'Plot Analyst',
  'dialogue-master': 'Dialogue Master',
  'world-builder': 'World Builder',
  'continuity-checker': 'Continuity Checker',
};

const AGENT_ICONS: Record<string, React.ElementType> = {
  'style-coach': FileText,
  'character-keeper': Bot,
  'plot-analyst': AlertTriangle,
  'dialogue-master': Bot,
  'world-builder': Bot,
  'continuity-checker': CheckCircle,
};

export function AgentReviewsPanel({
  reviews = [],
  chapters = [],
  onViewReview,
  onDeleteReview,
  onApplySuggestion,
  className
}: AgentReviewsPanelProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const toggleReview = useCallback((reviewId: string) => {
    setExpandedReviews(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  }, []);

  const getChapterTitle = (chapterId?: string) => {
    if (!chapterId) return 'General';
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.title || 'Unknown Chapter';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major': return 'text-red-400';
      case 'moderate': return 'text-yellow-400';
      case 'minor': return 'text-blue-400';
      default: return 'text-neutral-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'major': return XCircle;
      case 'moderate': return AlertTriangle;
      case 'minor': return Info;
      default: return Info;
    }
  };

  // Group reviews by chapter
  const reviewsByChapter = reviews.reduce((acc, review) => {
    const key = review.chapter_id || 'general';
    if (!acc[key]) acc[key] = [];
    acc[key].push(review);
    return acc;
  }, {} as Record<string, AgentReview[]>);

  return (
    <div className={cn('h-full flex flex-col bg-[--ide-sidebar-bg]', className)}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-3 h-[35px] min-h-[35px]',
        'border-b border-[--ide-border]'
      )}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[--ide-foreground-secondary]">
          Agent Reviews
        </span>
        <span className="text-xs text-[--ide-foreground-secondary]">
          {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Bot className="w-12 h-12 text-[--ide-foreground-secondary] opacity-50 mb-3" />
            <p className="text-sm text-[--ide-foreground-secondary] mb-1">
              No agent reviews yet
            </p>
            <p className="text-xs text-[--ide-foreground-secondary] opacity-70">
              Run an agent from the AI Copilot panel to get started
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {Object.entries(reviewsByChapter).map(([chapterId, chapterReviews]) => (
              <div key={chapterId} className="space-y-1">
                <div className="text-xs font-semibold text-[--ide-foreground-secondary] px-2 py-1">
                  {getChapterTitle(chapterId === 'general' ? undefined : chapterId)}
                </div>
                
                {chapterReviews.map((review) => {
                  const isExpanded = expandedReviews.has(review.id);
                  const AgentIcon = AGENT_ICONS[review.agent_type] || Bot;
                  const agentLabel = AGENT_LABELS[review.agent_type] || review.agent_type;
                  const completedSuggestions = review.suggestions.filter(s => (s as any).accepted).length;
                  
                  return (
                    <div
                      key={review.id}
                      className="bg-[--ide-input-bg] border border-[--ide-border] rounded"
                    >
                      {/* Review Header */}
                      <button
                        onClick={() => toggleReview(review.id)}
                        className={cn(
                          'w-full flex items-center gap-2 p-2 text-left',
                          'hover:bg-[--ide-list-hover] transition-colors'
                        )}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[--ide-foreground-secondary] flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-[--ide-foreground-secondary] flex-shrink-0" />
                        )}
                        <AgentIcon className="w-4 h-4 text-[--ide-accent] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[--ide-foreground]">
                            {agentLabel}
                          </div>
                          <div className="text-[10px] text-[--ide-foreground-secondary] flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {new Date(review.created_at).toLocaleDateString()}
                            {review.suggestions.length > 0 && (
                              <span>• {review.suggestions.length} suggestion{review.suggestions.length !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteReview?.(review.id);
                          }}
                          className="p-1 hover:bg-red-900/30 rounded"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </button>

                      {/* Review Details */}
                      {isExpanded && (
                        <div className="border-t border-[--ide-border] p-2 space-y-2">
                          {review.summary && (
                            <div className="text-xs text-[--ide-foreground-secondary] mb-2">
                              {review.summary}
                            </div>
                          )}
                          
                          {review.suggestions.length === 0 ? (
                            <p className="text-xs text-[--ide-foreground-secondary] italic">
                              No suggestions
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {review.suggestions.map((suggestion) => {
                                const SeverityIcon = getSeverityIcon(suggestion.severity);
                                
                                return (
                                  <div
                                    key={suggestion.id}
                                    className="bg-[--ide-background] border border-[--ide-border] rounded p-2"
                                  >
                                    <div className="flex items-start gap-2 mb-1">
                                      <SeverityIcon className={cn(
                                        'w-3.5 h-3.5 flex-shrink-0 mt-0.5',
                                        getSeverityColor(suggestion.severity)
                                      )} />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-[--ide-foreground] mb-1">
                                          {suggestion.issue}
                                        </div>
                                        {suggestion.quote && (
                                          <div className="text-[10px] text-[--ide-foreground-secondary] italic mb-1 pl-2 border-l-2 border-[--ide-border]">
                                            "{suggestion.quote}"
                                          </div>
                                        )}
                                        <div className="text-[10px] text-[--ide-foreground-secondary]">
                                          {suggestion.suggestion}
                                        </div>
                                        {suggestion.example && (
                                          <div className="text-[10px] text-[--ide-accent] mt-1">
                                            Example: {suggestion.example}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {onApplySuggestion && (
                                      <div className="flex items-center gap-1 mt-2">
                                        <button
                                          onClick={() => onApplySuggestion(review.id, suggestion.id)}
                                          className="flex items-center gap-1 px-2 py-1 text-[10px] bg-[--ide-accent] text-white rounded hover:opacity-90"
                                        >
                                          <CheckCircle className="w-3 h-3" />
                                          Apply
                                        </button>
                                        <button
                                          onClick={() => onViewReview?.(review.id)}
                                          className="flex items-center gap-1 px-2 py-1 text-[10px] bg-[--ide-input-bg] text-[--ide-foreground] rounded hover:bg-[--ide-list-hover]"
                                        >
                                          <Eye className="w-3 h-3" />
                                          View in Context
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentReviewsPanel;
