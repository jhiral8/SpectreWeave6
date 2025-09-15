'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, Calendar, User, Tag } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description?: string;
  lastModified: Date;
  collaborators?: string[];
  tags?: string[];
  status: 'draft' | 'in-progress' | 'completed' | 'published';
  wordCount?: number;
}

interface FilterOptions {
  status: string[];
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  collaborators: string[];
  tags: string[];
}

interface ProjectSearchProps {
  projects: Project[];
  onResultsChange?: (results: Project[]) => void;
  placeholder?: string;
  showFilters?: boolean;
}

const ProjectSearch: React.FC<ProjectSearchProps> = ({
  projects,
  onResultsChange,
  placeholder = "Search projects...",
  showFilters = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    dateRange: 'all',
    collaborators: [],
    tags: []
  });

  // Simple formatTimeAgo function without date-fns
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const allCollaborators = new Set<string>();
    const allTags = new Set<string>();
    
    projects.forEach(project => {
      project.collaborators?.forEach(collab => allCollaborators.add(collab));
      project.tags?.forEach(tag => allTags.add(tag));
    });

    return {
      collaborators: Array.from(allCollaborators),
      tags: Array.from(allTags)
    };
  }, [projects]);

  // Filter and search logic
  const filteredProjects = useMemo(() => {
    let results = projects;

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(project =>
        project.title.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filters.status.length > 0) {
      results = results.filter(project => filters.status.includes(project.status));
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      results = results.filter(project => project.lastModified >= cutoffDate);
    }

    // Apply collaborators filter
    if (filters.collaborators.length > 0) {
      results = results.filter(project =>
        project.collaborators?.some(collab => filters.collaborators.includes(collab))
      );
    }

    // Apply tags filter
    if (filters.tags.length > 0) {
      results = results.filter(project =>
        project.tags?.some(tag => filters.tags.includes(tag))
      );
    }

    return results;
  }, [projects, searchQuery, filters]);

  // Notify parent of results changes
  useEffect(() => {
    onResultsChange?.(filteredProjects);
  }, [filteredProjects, onResultsChange]);

  const clearFilters = () => {
    setFilters({
      status: [],
      dateRange: 'all',
      collaborators: [],
      tags: []
    });
    setSearchQuery('');
  };

  const hasActiveFilters = searchQuery || filters.status.length > 0 || 
    filters.dateRange !== 'all' || filters.collaborators.length > 0 || filters.tags.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-purple-700/30 rounded-lg text-white placeholder-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 ai-confidence-border"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-700/60 hover:bg-slate-600/60 text-purple-300 rounded-md border border-purple-600/30 transition-colors ai-data-flow"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filters</span>
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-3 py-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Clear all</span>
              </button>
            )}
          </div>

          <div className="text-sm text-purple-400">
            {filteredProjects.length} of {projects.length} projects
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-slate-800/40 border border-purple-700/30 rounded-lg p-4 space-y-4 ai-neural-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">Status</label>
              <div className="space-y-1">
                {['draft', 'in-progress', 'completed', 'published'].map((status) => (
                  <label key={status} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            status: [...prev.status, status]
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            status: prev.status.filter(s => s !== status)
                          }));
                        }
                      }}
                      className="rounded border-purple-600/30 text-purple-600 focus:ring-purple-500/50"
                    />
                    <span className="text-sm text-purple-200 capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: e.target.value as FilterOptions['dateRange']
                }))}
                className="w-full px-3 py-2 bg-slate-700/60 border border-purple-600/30 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">Past week</option>
                <option value="month">Past month</option>
                <option value="year">Past year</option>
              </select>
            </div>

            {/* Collaborators Filter */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Collaborators
              </label>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {filterOptions.collaborators.map((collaborator) => (
                  <label key={collaborator} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.collaborators.includes(collaborator)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            collaborators: [...prev.collaborators, collaborator]
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            collaborators: prev.collaborators.filter(c => c !== collaborator)
                          }));
                        }
                      }}
                      className="rounded border-purple-600/30 text-purple-600 focus:ring-purple-500/50"
                    />
                    <span className="text-sm text-purple-200">{collaborator}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags
              </label>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {filterOptions.tags.map((tag) => (
                  <label key={tag} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.tags.includes(tag)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            tags: [...prev.tags, tag]
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            tags: prev.tags.filter(t => t !== tag)
                          }));
                        }
                      }}
                      className="rounded border-purple-600/30 text-purple-600 focus:ring-purple-500/50"
                    />
                    <span className="text-sm text-purple-200">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ProjectSearch };