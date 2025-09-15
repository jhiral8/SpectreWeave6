import React, { useState, useCallback, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ChevronDown, 
  ChevronRight, 
  Search,
  BookOpen,
  Globe,
  Plus,
  X,
  Edit3,
  Download,
  Upload,
  Brain,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Star,
  Clock,
  Tag,
  FileText,
  Database,
  Target,
  BookMarked,
  Filter,
  MoreHorizontal,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Save,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
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
import { ResearchFinding, ResearchQuery } from '../ResearchBlock';

interface ResearchBlockComponentProps {
  node: any;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
  decorations: any[];
  selected: boolean;
  view: any;
  getPos: () => number;
  innerDecorations: any;
  editor: any;
  extension: any;
  HTMLAttributes: Record<string, any>;
  ref: React.RefObject<HTMLElement>;
}

const STATUS_CONFIG = {
  draft: {
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
    borderColor: 'border-gray-200 dark:border-gray-700',
    icon: FileText,
  },
  'in-progress': {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-700',
    icon: Clock,
  },
  completed: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-700',
    icon: CheckCircle,
  },
};

const PRIORITY_CONFIG = {
  low: {
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    label: 'Low',
  },
  medium: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-800/20',
    label: 'Medium',
  },
  high: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-800/20',
    label: 'High',
  },
};

export const ResearchBlockComponent: React.FC<ResearchBlockComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const { 
    researchId,
    topic, 
    description, 
    queries,
    findings,
    tags,
    status,
    priority,
    collapsed,
    timestamp,
    lastUpdated,
    aiSuggestions,
    lastAIUpdate,
    citationStyle,
    exportFormat
  } = node.attrs;
  
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showFindings, setShowFindings] = useState(true);
  const [showQueries, setShowQueries] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'queries' | 'findings' | 'analysis'>('overview');
  const [newQuery, setNewQuery] = useState('');
  const [newTag, setNewTag] = useState('');
  const [aiError, setAIError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [showAllFindings, setShowAllFindings] = useState(false);
  
  const [editValues, setEditValues] = useState({
    topic,
    description,
    tags: [...(tags || [])],
    status,
    priority,
    citationStyle,
  });

  const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  const priorityConfig = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
  const StatusIcon = statusConfig.icon;

  // AI Integration methods
  const generateResearchSuggestions = useCallback(async () => {
    if (!topic && !description) {
      setAIError('Please provide at least a research topic or description before generating suggestions.');
      return;
    }

    setIsGeneratingAI(true);
    setAIError(null);

    try {
      // Trigger AI research suggestions
      const event = new CustomEvent('research-ai-suggestion-request', {
        detail: {
          researchId,
          researchData: node.attrs,
          context: {
            topic,
            description,
            existingFindings: findings,
            queries: queries,
          },
        },
      });
      
      console.log('🚀 Dispatching AI suggestion request event:', event.detail);
      window.dispatchEvent(event);
    } catch (error) {
      console.error('AI suggestion generation failed:', error);
      setAIError('Failed to generate AI suggestions. Please try again.');
      setIsGeneratingAI(false);
    }
  }, [topic, description, findings, queries, researchId, updateAttributes, node.attrs]);

  const performWebSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setAIError(null);

    try {
      // Add query to the list
      const newQueryObj: ResearchQuery = {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query,
        status: 'pending',
        timestamp: new Date().toISOString(),
        results: [],
      };

      const updatedQueries = [...(queries || []), newQueryObj];
      updateAttributes({
        queries: updatedQueries,
        lastUpdated: new Date().toISOString(),
      });

      // Trigger web search
      const event = new CustomEvent('research-web-search-request', {
        detail: {
          researchId,
          query,
          queryId: newQueryObj.id,
          researchData: node.attrs,
        },
      });
      
      console.log('🔍 Dispatching web search request event:', event.detail);
      window.dispatchEvent(event);

      setNewQuery('');
    } catch (error) {
      console.error('Web search failed:', error);
      setAIError('Failed to perform web search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [queries, researchId, updateAttributes, node.attrs]);

  const addFinding = useCallback((finding: Partial<ResearchFinding>) => {
    const newFinding: ResearchFinding = {
      id: `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: finding.title || 'New Finding',
      content: finding.content || '',
      source: finding.source || 'Manual Entry',
      url: finding.url || '',
      relevance: finding.relevance || 0.5,
      timestamp: new Date().toISOString(),
      verified: finding.verified || false,
      tags: finding.tags || [],
      notes: finding.notes || '',
      ...finding,
    };

    const updatedFindings = [...(findings || []), newFinding];
    updateAttributes({
      findings: updatedFindings,
      lastUpdated: new Date().toISOString(),
    });
  }, [findings, updateAttributes]);

  const removeFinding = useCallback((findingId: string) => {
    const updatedFindings = findings.filter((f: ResearchFinding) => f.id !== findingId);
    updateAttributes({
      findings: updatedFindings,
      lastUpdated: new Date().toISOString(),
    });
  }, [findings, updateAttributes]);

  const toggleFindingVerified = useCallback((findingId: string) => {
    const updatedFindings = findings.map((f: ResearchFinding) => 
      f.id === findingId ? { ...f, verified: !f.verified } : f
    );
    updateAttributes({
      findings: updatedFindings,
      lastUpdated: new Date().toISOString(),
    });
  }, [findings, updateAttributes]);

  const removeQuery = useCallback((queryId: string) => {
    const updatedQueries = queries.filter((q: ResearchQuery) => q.id !== queryId);
    updateAttributes({
      queries: updatedQueries,
      lastUpdated: new Date().toISOString(),
    });
  }, [queries, updateAttributes]);

  const addTag = useCallback(() => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    
    const updatedTags = [...tags, newTag.trim()];
    updateAttributes({ tags: updatedTags });
    setNewTag('');
  }, [newTag, tags, updateAttributes]);

  const removeTag = useCallback((tagToRemove: string) => {
    const updatedTags = tags.filter((t: string) => t !== tagToRemove);
    updateAttributes({ tags: updatedTags });
  }, [tags, updateAttributes]);

  const toggleCollapsed = useCallback(() => {
    updateAttributes({ collapsed: !collapsed });
  }, [collapsed, updateAttributes]);

  const handleSave = useCallback(() => {
    updateAttributes({
      ...editValues,
      lastUpdated: new Date().toISOString(),
    });
    setIsEditing(false);
  }, [editValues, updateAttributes]);

  const handleCancel = useCallback(() => {
    setEditValues({
      topic,
      description,
      tags: [...(tags || [])],
      status,
      priority,
      citationStyle,
    });
    setIsEditing(false);
  }, [topic, description, tags, status, priority, citationStyle]);

  const exportData = useCallback((format: 'markdown' | 'json' | 'csv' = 'markdown') => {
    // This would typically call the command
    if (node.editor) {
      node.editor.commands.exportResearchData(researchId, format);
    }
  }, [researchId, node.editor]);

  const applySuggestion = useCallback((suggestion: string) => {
    // Extract actionable parts from suggestion and apply them
    if (suggestion.includes('Search for')) {
      const queryMatch = suggestion.match(/Search for "(.+?)"/);
      if (queryMatch) {
        performWebSearch(queryMatch[1]);
      }
    }
    // Add more suggestion parsing logic as needed
  }, [performWebSearch]);

  // Listen for AI suggestion events and responses
  useEffect(() => {
    const handleAISuggestionResponse = (event: CustomEvent) => {
      console.log('📥 Received AI suggestion response event:', event.detail);
      
      if (event.detail.researchId === researchId) {
        console.log('✅ AI suggestion response matches our research ID:', researchId);
        const { suggestions, findings, sources } = event.detail;
        
        // Update AI suggestions
        updateAttributes({
          aiSuggestions: suggestions || [],
          lastAIUpdate: new Date().toISOString(),
        });
        
        // Add new findings if provided
        if (findings && findings.length > 0) {
          console.log('📋 Adding new findings from AI response:', findings);
          const newFindings = findings.map((finding: string, index: number) => ({
            id: `ai_finding_${Date.now()}_${index}`,
            title: `AI Finding ${index + 1}`,
            content: finding,
            source: 'AI Research',
            url: '',
            relevance: 0.8,
            timestamp: new Date().toISOString(),
            verified: false,
            tags: ['ai-generated'],
            notes: ''
          }));
          
          updateAttributes({
            findings: [...(findings || []), ...newFindings],
            lastUpdated: new Date().toISOString(),
          });
        }
        
        setIsGeneratingAI(false);
        setShowAISuggestions(true);
      } else {
        console.log('⚠️ AI suggestion response for different research ID:', event.detail.researchId, 'vs', researchId);
      }
    };

    const handleAISuggestionError = (event: CustomEvent) => {
      console.log('❌ Received AI suggestion error event:', event.detail);
      
      if (event.detail.researchId === researchId) {
        console.log('🚨 AI suggestion error matches our research ID:', researchId);
        setAIError(event.detail.error || 'AI suggestion failed');
        setIsGeneratingAI(false);
      }
    };

    const handleWebSearchResponse = (event: CustomEvent) => {
      console.log('📥 Received web search response event:', event.detail);
      
      if (event.detail.researchId === researchId) {
        console.log('✅ Web search response matches our research ID:', researchId);
        const { findings: searchFindings, summary } = event.detail;
        
        if (searchFindings && searchFindings.length > 0) {
          console.log('📋 Adding new findings from web search:', searchFindings);
          updateAttributes({
            findings: [...(findings || []), ...searchFindings],
            lastUpdated: new Date().toISOString(),
          });
        }
        
        setIsSearching(false);
      } else {
        console.log('⚠️ Web search response for different research ID:', event.detail.researchId, 'vs', researchId);
      }
    };

    const handleWebSearchError = (event: CustomEvent) => {
      console.log('❌ Received web search error event:', event.detail);
      
      if (event.detail.researchId === researchId) {
        console.log('🚨 Web search error matches our research ID:', researchId);
        setAIError(event.detail.error || 'Web search failed');
        setIsSearching(false);
      }
    };

    window.addEventListener('research-ai-suggestion-response', handleAISuggestionResponse as EventListener);
    window.addEventListener('research-ai-suggestion-error', handleAISuggestionError as EventListener);
    window.addEventListener('research-web-search-response', handleWebSearchResponse as EventListener);
    window.addEventListener('research-web-search-error', handleWebSearchError as EventListener);
    
    return () => {
      window.removeEventListener('research-ai-suggestion-response', handleAISuggestionResponse as EventListener);
      window.removeEventListener('research-ai-suggestion-error', handleAISuggestionError as EventListener);
      window.removeEventListener('research-web-search-response', handleWebSearchResponse as EventListener);
      window.removeEventListener('research-web-search-error', handleWebSearchError as EventListener);
    };
  }, [researchId, updateAttributes, findings]);

  const filteredFindings = findings?.filter((finding: ResearchFinding) =>
    !searchFilter || 
    finding.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    finding.content.toLowerCase().includes(searchFilter.toLowerCase()) ||
    finding.source.toLowerCase().includes(searchFilter.toLowerCase())
  ) || [];

  return (
    <NodeViewWrapper className="research-block my-4">
      <div className={cn(
        "border rounded-lg bg-gradient-to-r from-emerald-50/50 to-cyan-50/50 dark:from-emerald-950/20 dark:to-cyan-950/20 overflow-hidden shadow-sm",
        statusConfig.borderColor
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleCollapsed}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>
            
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {topic || 'Research Block'}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <StatusIcon className="w-3 h-3" />
                  <span>{status}</span>
                  <Badge variant="outline" className={cn("text-xs", priorityConfig.color)}>
                    {priorityConfig.label}
                  </Badge>
                  {lastAIUpdate && (
                    <span className="flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      AI updated {new Date(lastAIUpdate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {findings?.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {findings.length} findings
              </Badge>
            )}
            
            {queries?.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {queries.length} queries
              </Badge>
            )}
            
            {aiSuggestions?.length > 0 && (
              <Button
                buttonSize="small"
                variant="ghost"
                onClick={() => setShowAISuggestions(!showAISuggestions)}
                className="h-7 px-2 relative"
                title={`${aiSuggestions.length} AI suggestions available`}
              >
                <Sparkles className="w-3 h-3" />
                <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 px-1 text-[10px]">
                  {aiSuggestions.length}
                </Badge>
              </Button>
            )}
            
            <Button
              buttonSize="small"
              variant="ghost"
              onClick={generateResearchSuggestions}
              disabled={isGeneratingAI}
              className="h-7 px-2"
              title="Generate AI suggestions"
            >
              {isGeneratingAI ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Brain className="w-3 h-3" />
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  buttonSize="iconSmall"
                  variant="ghost"
                  title="Export options"
                >
                  <Download className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Research</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => exportData('markdown')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Markdown Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData('json')}>
                  <Database className="w-4 h-4 mr-2" />
                  JSON Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData('csv')}>
                  <FileText className="w-4 h-4 mr-2" />
                  CSV Findings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              buttonSize="iconSmall"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              title="Edit research block"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            
            <Button
              buttonSize="iconSmall"
              variant="ghost"
              onClick={deleteNode}
              className="hover:bg-red-100 dark:hover:bg-red-900/20"
              title="Delete research block"
            >
              <X className="w-3 h-3 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="p-4 space-y-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
            {/* AI Error Display */}
            {aiError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700 dark:text-red-300">{aiError}</span>
                <Button
                  buttonSize="iconSmall"
                  variant="ghost"
                  onClick={() => setAIError(null)}
                  className="ml-auto"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            
            {/* AI Suggestions Panel */}
            {showAISuggestions && aiSuggestions?.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-emerald-50/50 to-cyan-50/50 dark:from-emerald-950/10 dark:to-cyan-950/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    AI Research Suggestions
                  </h4>
                  <Button
                    buttonSize="iconSmall"
                    variant="ghost"
                    onClick={() => setShowAISuggestions(false)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {aiSuggestions.map((suggestion: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded border border-gray-200/50 dark:border-gray-700/50">
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{suggestion}</span>
                      <Button
                        buttonSize="iconSmall"
                        variant="ghost"
                        onClick={() => applySuggestion(suggestion)}
                        className="hover:bg-emerald-100 dark:hover:bg-emerald-900/20"
                        title="Apply suggestion"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-4">
                {/* Edit Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Research Topic
                    </label>
                    <Input
                      value={editValues.topic}
                      onChange={(e) => setEditValues(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="Research topic or question"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        value={editValues.status}
                        onChange={(e) => setEditValues(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="draft">Draft</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priority
                      </label>
                      <select
                        value={editValues.priority}
                        onChange={(e) => setEditValues(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={editValues.description}
                    onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Describe your research objectives, scope, and methodology..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tags
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag..."
                        className="w-32"
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      />
                      <Button
                        buttonSize="small"
                        variant="secondary"
                        onClick={addTag}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editValues.tags.map((tag: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900/20 dark:to-cyan-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    buttonSize="small"
                    variant="secondary"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    buttonSize="small"
                    variant="primary"
                    onClick={handleSave}
                  >
                    Save Research
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Display Mode */}
                {description && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Description</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{description}</p>
                    </div>
                  </div>
                )}

                {tags?.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Tag className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag: string, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900/20 dark:to-cyan-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-6">
                    {[
                      { id: 'overview', label: 'Overview', icon: BookOpen },
                      { id: 'queries', label: `Queries (${queries?.length || 0})`, icon: Search },
                      { id: 'findings', label: `Findings (${findings?.length || 0})`, icon: Target },
                      { id: 'analysis', label: 'Analysis', icon: Brain },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setSelectedTab(id as any)}
                        className={cn(
                          "flex items-center gap-2 py-2 px-1 border-b-2 text-sm font-medium transition-colors",
                          selectedTab === id
                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px]">
                  {selectedTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Queries</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{queries?.length || 0}</p>
                        </div>
                        
                        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Findings</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{findings?.length || 0}</p>
                        </div>
                        
                        <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Verified</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {findings?.filter((f: ResearchFinding) => f.verified).length || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Research overview and statistics</p>
                        <p className="text-xs mt-1">Switch to other tabs to manage queries and findings</p>
                      </div>
                    </div>
                  )}

                  {selectedTab === 'queries' && (
                    <div className="space-y-4">
                      {/* Add Query */}
                      <div className="flex gap-2">
                        <Input
                          value={newQuery}
                          onChange={(e) => setNewQuery(e.target.value)}
                          placeholder="Enter research query or question..."
                          className="flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && performWebSearch(newQuery)}
                        />
                        <Button
                          onClick={() => performWebSearch(newQuery)}
                          disabled={isSearching || !newQuery.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {isSearching ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-2" />
                              Search
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Query List */}
                      <div className="space-y-2">
                        {queries?.map((query: ResearchQuery) => (
                          <div key={query.id} className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{query.query}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={query.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                  {query.status}
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(query.timestamp).toLocaleDateString()}
                                </span>
                                {query.results?.length > 0 && (
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                    {query.results.length} results
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              buttonSize="iconSmall"
                              variant="ghost"
                              onClick={() => removeQuery(query.id)}
                              className="hover:bg-red-100 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        
                        {(!queries || queries.length === 0) && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No research queries yet</p>
                            <p className="text-xs mt-1">Add a query above to start researching</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedTab === 'findings' && (
                    <div className="space-y-4">
                      {/* Filter and Add Finding */}
                      <div className="flex gap-2">
                        <Input
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          placeholder="Filter findings..."
                          className="flex-1"
                        />
                        <Button
                          onClick={() => addFinding({
                            title: 'New Finding',
                            content: 'Add your research finding here...',
                            source: 'Manual Entry'
                          })}
                          variant="secondary"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Finding
                        </Button>
                      </div>

                      {/* Findings List */}
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {filteredFindings.slice(0, showAllFindings ? filteredFindings.length : 3).map((finding: ResearchFinding, index: number) => (
                          <div key={finding.id} className="p-3 bg-white/60 dark:bg-gray-800/60 rounded border border-gray-200 dark:border-gray-700 hover:bg-white/80 dark:hover:bg-gray-800/80">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">
                                    {String(index + 1).padStart(2, '0')}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    {finding.title && (
                                      <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">{finding.title}</h5>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                      <span className="truncate max-w-[120px]" title={finding.source}>{finding.source}</span>
                                      {finding.url && (
                                        <a
                                          href={finding.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                      <span>•</span>
                                      <span>{(finding.relevance * 100).toFixed(0)}%</span>
                                      {finding.verified && (
                                        <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  buttonSize="iconSmall"
                                  variant="ghost"
                                  onClick={() => toggleFindingVerified(finding.id)}
                                  className={cn(
                                    finding.verified 
                                      ? "text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20" 
                                      : "hover:bg-gray-100 dark:hover:bg-gray-800",
                                    "opacity-60 hover:opacity-100"
                                  )}
                                  title={finding.verified ? "Mark as unverified" : "Mark as verified"}
                                >
                                  {finding.verified ? <CheckCircle className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </Button>
                                <Button
                                  buttonSize="iconSmall"
                                  variant="ghost"
                                  onClick={() => removeFinding(finding.id)}
                                  className="hover:bg-red-100 dark:hover:bg-red-900/20 opacity-60 hover:opacity-100"
                                  title="Remove finding"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              </div>
                            </div>
                            
                            {finding.content && (
                              <div className="ml-6">
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                  {finding.content.length > 150 ? finding.content.substring(0, 150) + '...' : finding.content}
                                </p>
                              </div>
                            )}
                            
                            {finding.tags?.length > 0 && (
                              <div className="ml-6 mt-1 flex gap-1">
                                {finding.tags.slice(0, 2).map((tag: string, tagIndex: number) => (
                                  <Badge key={tagIndex} variant="outline" className="text-xs px-1 py-0 h-4">
                                    {tag}
                                  </Badge>
                                ))}
                                {finding.tags.length > 2 && (
                                  <span className="text-xs text-gray-400">+{finding.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {filteredFindings.length > 3 && (
                          <div className="text-center py-2">
                            <Button
                              variant="ghost"
                              buttonSize="small"
                              onClick={() => setShowAllFindings(!showAllFindings)}
                              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              {showAllFindings ? 'Show less' : `Show ${filteredFindings.length - 3} more findings`}
                            </Button>
                          </div>
                        )}
                        
                        {(!findings || findings.length === 0) && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No research findings yet</p>
                            <p className="text-xs mt-1">Add findings manually or through web searches</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedTab === 'analysis' && (
                    <div className="space-y-4">
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">AI Analysis coming soon</p>
                        <p className="text-xs mt-1">Advanced research analysis and insights</p>
                      </div>
                    </div>
                  )}
                </div>

                {!topic && !description && (!queries || queries.length === 0) && (!findings || findings.length === 0) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click the edit button to add research information</p>
                    <p className="text-xs mt-1">Or use the AI button to generate research suggestions</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content area for nested content */}
        <NodeViewContent className="research-block-content" />
      </div>
    </NodeViewWrapper>
  );
};