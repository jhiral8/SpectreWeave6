'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Filter,
  RefreshCw,
  Sparkles,
  FileText,
  X,
} from 'lucide-react';
import { WritingProblem, ProblemFilter, GroupBy, ProblemSeverity } from './types';

interface ProblemsPanelProps {
  problems: WritingProblem[];
  isAnalyzing?: boolean;
  onProblemClick?: (problem: WritingProblem) => void;
  onFixProblem?: (problem: WritingProblem) => void;
  onDismissProblem?: (problemId: string) => void;
  onRefresh?: () => void;
}

// Icon mapping for severity
const SEVERITY_CONFIG: Record<ProblemSeverity, { 
  icon: React.ElementType; 
  color: string;
  bgColor: string;
}> = {
  error: { 
    icon: AlertCircle, 
    color: 'text-[--ide-error]',
    bgColor: 'bg-[--ide-error]/10',
  },
  warning: { 
    icon: AlertTriangle, 
    color: 'text-[--ide-warning]',
    bgColor: 'bg-[--ide-warning]/10',
  },
  info: { 
    icon: Info, 
    color: 'text-[--ide-info]',
    bgColor: 'bg-[--ide-info]/10',
  },
  suggestion: { 
    icon: Lightbulb, 
    color: 'text-[--ide-success,#22c55e]',
    bgColor: 'bg-[--ide-success,#22c55e]/10',
  },
};

export const ProblemsPanel: React.FC<ProblemsPanelProps> = ({
  problems,
  isAnalyzing = false,
  onProblemClick,
  onFixProblem,
  onDismissProblem,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<ProblemFilter>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('chapter');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']));
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);

  // Filter problems
  const filteredProblems = useMemo(() => {
    if (filter === 'all') return problems;
    
    const severityMap: Record<ProblemFilter, ProblemSeverity[]> = {
      all: [],
      errors: ['error'],
      warnings: ['warning'],
      info: ['info'],
      suggestions: ['suggestion'],
    };
    
    return problems.filter(p => severityMap[filter].includes(p.severity));
  }, [problems, filter]);

  // Group problems
  const groupedProblems = useMemo(() => {
    const groups: Record<string, WritingProblem[]> = {};
    
    filteredProblems.forEach(problem => {
      let key: string;
      
      switch (groupBy) {
        case 'severity':
          key = problem.severity;
          break;
        case 'chapter':
          key = problem.chapter || 'General';
          break;
        case 'type':
          key = problem.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          break;
        default:
          key = 'All';
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(problem);
    });
    
    return groups;
  }, [filteredProblems, groupBy]);

  const handleToggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  const handleSelectProblem = useCallback((problem: WritingProblem) => {
    setSelectedProblem(problem.id);
    onProblemClick?.(problem);
  }, [onProblemClick]);

  // Counts for filter buttons
  const counts = useMemo(() => ({
    all: problems.length,
    errors: problems.filter(p => p.severity === 'error').length,
    warnings: problems.filter(p => p.severity === 'warning').length,
    info: problems.filter(p => p.severity === 'info').length,
    suggestions: problems.filter(p => p.severity === 'suggestion').length,
  }), [problems]);

  return (
    <div className="problems-panel flex flex-col h-full">
      {/* Toolbar */}
      <div className={cn(
        'flex items-center justify-between px-2 py-1.5',
        'border-b border-[--ide-panel-border,--ide-border]',
        'bg-[--ide-panel-toolbar,--ide-background]'
      )}>
        {/* Filter buttons */}
        <div className="flex items-center gap-1">
          <FilterButton 
            active={filter === 'all'} 
            onClick={() => setFilter('all')}
            count={counts.all}
          >
            All
          </FilterButton>
          <FilterButton 
            active={filter === 'errors'} 
            onClick={() => setFilter('errors')}
            count={counts.errors}
            color="text-[--ide-error]"
          >
            Errors
          </FilterButton>
          <FilterButton 
            active={filter === 'warnings'} 
            onClick={() => setFilter('warnings')}
            count={counts.warnings}
            color="text-[--ide-warning]"
          >
            Warnings
          </FilterButton>
          <FilterButton 
            active={filter === 'suggestions'} 
            onClick={() => setFilter('suggestions')}
            count={counts.suggestions}
            color="text-[--ide-success,#22c55e]"
          >
            Suggestions
          </FilterButton>
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Group by dropdown */}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className={cn(
              'px-2 py-0.5 text-xs rounded',
              'bg-[--ide-input-bg] text-[--ide-input-fg]',
              'border border-[--ide-input-border]',
              'focus:outline-none focus:border-[--ide-input-focus-border]'
            )}
          >
            <option value="chapter">Group by Chapter</option>
            <option value="severity">Group by Severity</option>
            <option value="type">Group by Type</option>
          </select>
          
          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isAnalyzing}
            className={cn(
              'p-1 rounded hover:bg-[--ide-list-hover-bg]',
              'text-[--ide-activitybar-inactive] hover:text-[--ide-foreground]',
              'transition-colors disabled:opacity-50',
              isAnalyzing && 'animate-spin'
            )}
            title="Refresh analysis"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Problem list */}
      <div className="flex-1 overflow-auto">
        {isAnalyzing && problems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-sm text-[--ide-activitybar-inactive]">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Analyzing your writing...
            </div>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-10 h-10 rounded-full bg-[--ide-success,#22c55e]/20 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-[--ide-success,#22c55e]" />
            </div>
            <p className="text-sm text-[--ide-foreground]">No issues found</p>
            <p className="text-xs text-[--ide-activitybar-inactive] mt-1">
              Your writing looks great!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[--ide-border]">
            {Object.entries(groupedProblems).map(([groupKey, groupProblems]) => (
              <ProblemGroup
                key={groupKey}
                label={groupKey}
                problems={groupProblems}
                isExpanded={expandedGroups.has(groupKey) || expandedGroups.has('all')}
                onToggle={() => handleToggleGroup(groupKey)}
                selectedProblem={selectedProblem}
                onSelectProblem={handleSelectProblem}
                onFixProblem={onFixProblem}
                onDismissProblem={onDismissProblem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Filter button component
interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  count: number;
  color?: string;
  children: React.ReactNode;
}

const FilterButton: React.FC<FilterButtonProps> = ({ 
  active, 
  onClick, 
  count, 
  color,
  children 
}) => (
  <button
    onClick={onClick}
    className={cn(
      'px-2 py-0.5 text-xs rounded flex items-center gap-1',
      'transition-colors',
      active 
        ? 'bg-[--ide-activitybar-badge] text-white' 
        : 'hover:bg-[--ide-list-hover-bg] text-[--ide-activitybar-inactive]'
    )}
  >
    <span className={active ? '' : color}>{children}</span>
    <span className={cn(
      'min-w-[16px] text-center',
      active ? 'opacity-75' : ''
    )}>
      ({count})
    </span>
  </button>
);

// Problem group component
interface ProblemGroupProps {
  label: string;
  problems: WritingProblem[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedProblem: string | null;
  onSelectProblem: (problem: WritingProblem) => void;
  onFixProblem?: (problem: WritingProblem) => void;
  onDismissProblem?: (problemId: string) => void;
}

const ProblemGroup: React.FC<ProblemGroupProps> = ({
  label,
  problems,
  isExpanded,
  onToggle,
  selectedProblem,
  onSelectProblem,
  onFixProblem,
  onDismissProblem,
}) => {
  // Count by severity in this group
  const errorCount = problems.filter(p => p.severity === 'error').length;
  const warningCount = problems.filter(p => p.severity === 'warning').length;

  return (
    <div>
      {/* Group header */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-1.5',
          'hover:bg-[--ide-list-hover-bg] transition-colors',
          'text-left'
        )}
      >
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-[--ide-activitybar-inactive]" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[--ide-activitybar-inactive]" />
        )}
        <FileText className="w-3.5 h-3.5 text-[--ide-activitybar-inactive]" />
        <span className="flex-1 text-xs font-medium text-[--ide-foreground]">
          {label}
        </span>
        <span className="flex items-center gap-2 text-[10px]">
          {errorCount > 0 && (
            <span className="text-[--ide-error]">{errorCount}</span>
          )}
          {warningCount > 0 && (
            <span className="text-[--ide-warning]">{warningCount}</span>
          )}
          <span className="text-[--ide-activitybar-inactive]">
            ({problems.length})
          </span>
        </span>
      </button>
      
      {/* Problem items */}
      {isExpanded && (
        <div>
          {problems.map(problem => (
            <ProblemItem
              key={problem.id}
              problem={problem}
              isSelected={selectedProblem === problem.id}
              onSelect={() => onSelectProblem(problem)}
              onFix={onFixProblem ? () => onFixProblem(problem) : undefined}
              onDismiss={onDismissProblem ? () => onDismissProblem(problem.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Individual problem item
interface ProblemItemProps {
  problem: WritingProblem;
  isSelected: boolean;
  onSelect: () => void;
  onFix?: () => void;
  onDismiss?: () => void;
}

const ProblemItem: React.FC<ProblemItemProps> = ({
  problem,
  isSelected,
  onSelect,
  onFix,
  onDismiss,
}) => {
  const config = SEVERITY_CONFIG[problem.severity];
  const Icon = config.icon;

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-start gap-2 px-3 py-2 pl-8 cursor-pointer group',
        'hover:bg-[--ide-list-hover-bg] transition-colors',
        isSelected && 'bg-[--ide-list-active-bg]'
      )}
    >
      <Icon className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', config.color)} />
      
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[--ide-foreground]">{problem.message}</p>
        {problem.description && (
          <p className="text-[10px] text-[--ide-activitybar-inactive] mt-0.5">
            {problem.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {problem.chapter && (
            <span className="text-[10px] text-[--ide-activitybar-inactive]">
              {problem.chapter}
            </span>
          )}
          {problem.line && (
            <span className="text-[10px] text-[--ide-activitybar-inactive]">
              Line {problem.line}
            </span>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {problem.fixable && onFix && (
          <button
            onClick={(e) => { e.stopPropagation(); onFix(); }}
            className={cn(
              'px-1.5 py-0.5 text-[10px] rounded',
              'bg-[--ide-activitybar-badge] text-white',
              'hover:opacity-90'
            )}
          >
            Fix
          </button>
        )}
        {onDismiss && (
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className={cn(
              'p-0.5 rounded hover:bg-[--ide-list-hover-bg]',
              'text-[--ide-activitybar-inactive] hover:text-[--ide-foreground]'
            )}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
