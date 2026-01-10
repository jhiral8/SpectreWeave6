'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, ChevronRight, X, Replace } from 'lucide-react';
import type { SearchOptions, SearchResult, SearchMatch } from './types';

interface SearchPanelProps {
  onSearch?: (query: string, options: SearchOptions) => void;
  results?: SearchResult[];
  isSearching?: boolean;
}

/**
 * Search Panel Component
 * 
 * VS Code-style search panel with options and results.
 * 
 * ┌─────────────────────────────────────┐
 * │ [🔍 Search...               ] [≡]  │
 * │ [  Replace...               ] [≡]  │
 * │ [Aa] [Ab] [.*] [📁]                │
 * ├─────────────────────────────────────┤
 * │ 3 results in 2 files                │
 * ├─────────────────────────────────────┤
 * │ ▼ chapter1.md (2)                   │
 * │     Line 10: ...match text...       │
 * │     Line 25: ...match text...       │
 * │ ▼ chapter2.md (1)                   │
 * │     Line 5: ...match text...        │
 * └─────────────────────────────────────┘
 */
export const SearchPanel: React.FC<SearchPanelProps> = ({
  onSearch,
  results = [],
  isSearching = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
  });
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery, options);
    }
  }, [searchQuery, options, onSearch]);

  const toggleOption = useCallback((option: keyof SearchOptions) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option],
    }));
  }, []);

  const toggleFileExpanded = useCallback((fileId: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }, []);

  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);

  return (
    <div className="vscode-search-panel flex flex-col h-full">
      {/* Search Input Area */}
      <div className="flex flex-col gap-1 p-2">
        {/* Search Row */}
        <div className="flex items-center gap-1">
          {/* Expand/Collapse Replace */}
          <button
            className={cn(
              'flex-shrink-0 w-5 h-5 flex items-center justify-center',
              'text-[var(--ide-foreground-muted,#c5c5c5)]',
              'hover:bg-[var(--ide-hover-bg,#5a5d5e)]',
              'rounded'
            )}
            onClick={() => setShowReplace(!showReplace)}
            title={showReplace ? 'Hide Replace' : 'Show Replace'}
          >
            {showReplace ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="Search"
              className={cn(
                'w-full h-[24px] pl-2 pr-6',
                'bg-[var(--ide-bg,#3c3c3c)]',
                'text-[var(--ide-foreground,#cccccc)]',
                'border border-[var(--ide-border,transparent)]',
                'focus:border-[var(--ide-accent,#007fd4)]',
                'text-[13px] outline-none'
              )}
            />
            {searchQuery && (
              <button
                className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-[var(--ide-foreground-muted,#c5c5c5)]"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Replace Row */}
        {showReplace && (
          <div className="flex items-center gap-1">
            <span className="w-5" /> {/* Spacer */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="Replace"
                className={cn(
                  'w-full h-[24px] pl-2 pr-6',
                  'bg-[var(--ide-bg,#3c3c3c)]',
                  'text-[var(--ide-foreground,#cccccc)]',
                  'border border-[var(--ide-border,transparent)]',
                  'focus:border-[var(--ide-accent,#007fd4)]',
                  'text-[13px] outline-none'
                )}
              />
            </div>
            <button
              className={cn(
                'flex-shrink-0 w-6 h-6 flex items-center justify-center',
                'text-[var(--ide-foreground-muted,#c5c5c5)]',
                'hover:bg-[var(--ide-hover-bg,#5a5d5e)]',
                'rounded'
              )}
              title="Replace All"
            >
              <Replace className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search Options */}
        <div className="flex items-center gap-1 ml-6">
          <SearchOptionButton
            active={options.caseSensitive}
            onClick={() => toggleOption('caseSensitive')}
            title="Match Case"
            icon="Aa"
          />
          <SearchOptionButton
            active={options.wholeWord}
            onClick={() => toggleOption('wholeWord')}
            title="Match Whole Word"
            icon="Ab"
          />
          <SearchOptionButton
            active={options.useRegex}
            onClick={() => toggleOption('useRegex')}
            title="Use Regular Expression"
            icon=".*"
          />
        </div>
      </div>

      {/* Results Summary */}
      {searchQuery && (
        <div className="px-4 py-1 text-[12px] text-[var(--ide-foreground-muted,#8b8b8b)] border-t border-[var(--ide-border,#3c3c3c)]">
          {isSearching ? (
            'Searching...'
          ) : results.length > 0 ? (
            `${totalMatches} result${totalMatches !== 1 ? 's' : ''} in ${results.length} file${results.length !== 1 ? 's' : ''}`
          ) : (
            'No results found'
          )}
        </div>
      )}

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto vscode-scrollbar">
        {results.map((result) => (
          <div key={result.fileId}>
            {/* File Header */}
            <div
              className={cn(
                'flex items-center h-[22px] px-2',
                'cursor-pointer select-none',
                'hover:bg-[var(--ide-hover-bg,#2a2d2e)]'
              )}
              onClick={() => toggleFileExpanded(result.fileId)}
            >
              <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {expandedFiles.has(result.fileId) ? (
                  <ChevronDown className="w-3 h-3 text-[var(--ide-foreground-muted,#c5c5c5)]" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-[var(--ide-foreground-muted,#c5c5c5)]" />
                )}
              </span>
              <span className="flex-1 truncate text-[13px] text-[var(--ide-foreground,#cccccc)]">
                {result.fileName}
              </span>
              <span className="flex-shrink-0 text-[11px] text-[var(--ide-foreground-muted,#8b8b8b)]">
                {result.matches.length}
              </span>
            </div>

            {/* File Matches */}
            {expandedFiles.has(result.fileId) && (
              <div>
                {result.matches.map((match, idx) => (
                  <SearchMatchItem key={idx} match={match} query={searchQuery} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Search Option Toggle Button
 */
const SearchOptionButton: React.FC<{
  active: boolean;
  onClick: () => void;
  title: string;
  icon: string;
}> = ({ active, onClick, title, icon }) => (
  <button
    className={cn(
      'w-6 h-6 flex items-center justify-center',
      'text-[11px] font-medium',
      'rounded border',
      active
        ? 'bg-[var(--ide-accent,#007fd4)] border-[var(--ide-accent,#007fd4)] text-white'
        : 'bg-transparent border-transparent text-[var(--ide-foreground-muted,#c5c5c5)] hover:bg-[var(--ide-hover-bg,#5a5d5e)]'
    )}
    onClick={onClick}
    title={title}
  >
    {icon}
  </button>
);

/**
 * Individual Search Match
 */
const SearchMatchItem: React.FC<{ match: SearchMatch; query: string }> = ({ match, query }) => {
  // Highlight the match in the line content
  const before = match.lineContent.slice(0, match.matchStart);
  const matched = match.lineContent.slice(match.matchStart, match.matchEnd);
  const after = match.lineContent.slice(match.matchEnd);

  return (
    <div
      className={cn(
        'flex items-center h-[22px] pl-8 pr-2',
        'cursor-pointer select-none',
        'hover:bg-[var(--ide-hover-bg,#2a2d2e)]'
      )}
    >
      <span className="flex-shrink-0 w-8 text-right pr-2 text-[11px] text-[var(--ide-foreground-muted,#8b8b8b)]">
        {match.lineNumber}
      </span>
      <span className="flex-1 truncate text-[13px] text-[var(--ide-foreground,#cccccc)]">
        {before}
        <span className="bg-[var(--ide-accent-transparent,#ea5c0055)] text-[var(--ide-foreground,#d4d4d4)]">
          {matched}
        </span>
        {after}
      </span>
    </div>
  );
};

export default SearchPanel;
