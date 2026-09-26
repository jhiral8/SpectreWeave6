import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Search,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { deepResearchService, type ResearchQuery, type ResearchResult } from '../../services/deepResearchService';

interface FeedbackBlockComponentProps {
  node: any; // Full Node object from TipTap
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
  selected: boolean;
  // Additional properties required by ReactNodeViewRenderer
  decorations: any[];
  view: any;
  getPos: () => number;
  innerDecorations: any; // DecorationSource type
  editor: any;
  extension: any;
  HTMLAttributes: Record<string, any>;
  ref: React.RefObject<HTMLElement>;
}

const FEEDBACK_TYPES = {
  'ai-feedback': {
    icon: Bot,
    label: 'AI Feedback',
    color: 'bg-blue-50 border-blue-200 text-blue-900',
    iconColor: 'text-blue-600',
  },
  'editor-note': {
    icon: User,
    label: 'Editor Note',
    color: 'bg-green-50 border-green-200 text-green-900',
    iconColor: 'text-green-600',
  },
  'character-note': {
    icon: Users,
    label: 'Character Note',
    color: 'bg-purple-50 border-purple-200 text-purple-900',
    iconColor: 'text-purple-600',
  },
  'plot-reminder': {
    icon: BookOpen,
    label: 'Plot Reminder',
    color: 'bg-orange-50 border-orange-200 text-orange-900',
    iconColor: 'text-orange-600',
  },
  'revision-note': {
    icon: Edit3,
    label: 'Revision Note',
    color: 'bg-red-50 border-red-200 text-red-900',
    iconColor: 'text-red-600',
  },
};

export const FeedbackBlockComponent: React.FC<FeedbackBlockComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [researchQuery, setResearchQuery] = useState('');
  const [researchContext, setResearchContext] = useState('');
  const [researchDepth, setResearchDepth] = useState<'basic' | 'comprehensive' | 'academic'>('comprehensive');
  const [researchSources, setResearchSources] = useState<'web' | 'academic' | 'both'>('both');
  const menuRef = useRef<HTMLDivElement>(null);
  const { type, author, timestamp, resolved, collapsed, researchData } = node.attrs;
  
  const feedbackType = FEEDBACK_TYPES[type];
  const IconComponent = feedbackType.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCollapsed = () => {
    updateAttributes({ collapsed: !collapsed });
  };

  const toggleResolved = () => {
    updateAttributes({ resolved: !resolved });
  };

  const changeType = (newType: string) => {
    updateAttributes({ type: newType });
    setShowMenu(false);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Unknown time';
    }
  };

  const handleResearch = async () => {
    if (!researchQuery.trim()) return;

    console.log('Starting research process...', { researchQuery, researchContext, researchDepth, researchSources });
    setIsResearching(true);
    
    // Add timeout to prevent permanent stuck state
    const timeoutId = setTimeout(() => {
      console.warn('Research timeout reached, resetting state...');
      setIsResearching(false);
      setShowResearchModal(false);
      alert('Research timed out. Please try again.');
    }, 30000); // 30 second timeout
    
    try {
      const query: ResearchQuery = {
        topic: researchQuery.trim(),
        context: researchContext.trim() || undefined,
        depth: researchDepth,
        sources: researchSources,
        maxResults: 10
      };

      console.log('Calling deepResearchService.conductResearch...', query);
      const result = await deepResearchService.conductResearch(query);
      console.log('Research completed successfully:', result);
      
      console.log('Updating block attributes with research data...');
      updateAttributes({ researchData: result });
      console.log('Block attributes updated successfully');
      
      console.log('Closing research modal...');
      setShowResearchModal(false);
      console.log('Research modal closed');
      
      console.log('Resetting form fields...');
      setResearchQuery('');
      setResearchContext('');
      console.log('Form fields reset successfully');
      
    } catch (error) {
      console.error('Research failed:', error);
      alert(`Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      clearTimeout(timeoutId);
      console.log('Setting isResearching to false...');
      setIsResearching(false);
      console.log('Research process completed');
    }
  };

  const isResearchNote = type === 'editor-note' && author === 'Research';

  return (
    <NodeViewWrapper
      className={`feedback-block-wrapper my-4 ${selected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div
        className={`
          feedback-block border-l-4 rounded-lg p-3 transition-all duration-200
          ${feedbackType.color}
          ${resolved ? 'opacity-60' : ''}
          ${collapsed ? 'pb-2' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleCollapsed}
              className="p-1 hover:bg-black/10 rounded transition-colors"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            <IconComponent className={`w-4 h-4 ${feedbackType.iconColor}`} />
            
            <span className="text-sm font-medium">
              {feedbackType.label}
            </span>
            
            {resolved && (
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <Check className="w-3 h-3" />
                <span>Resolved</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {/* Research Button for Research Notes */}
            {isResearchNote && (
              <button
                onClick={() => setShowResearchModal(true)}
                className="p-1 hover:bg-black/10 rounded transition-colors"
                title="Conduct Research"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
            
            <span className="text-xs opacity-70">
              {author} • {formatTimestamp(timestamp)}
            </span>
            
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-black/10 rounded transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 mb-2">Change Type</div>
                    {Object.entries(FEEDBACK_TYPES).map(([key, config]) => {
                      const MenuIcon = config.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => changeType(key)}
                          className={`
                            w-full flex items-center space-x-2 px-2 py-1 text-sm rounded hover:bg-gray-100 transition-colors
                            ${type === key ? 'bg-gray-100' : ''}
                          `}
                        >
                          <MenuIcon className={`w-4 h-4 ${config.iconColor}`} />
                          <span>{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="border-t border-gray-200 p-2">
                    <button
                      onClick={toggleResolved}
                      className="w-full flex items-center space-x-2 px-2 py-1 text-sm rounded hover:bg-gray-100 transition-colors"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{resolved ? 'Mark as Unresolved' : 'Mark as Resolved'}</span>
                    </button>
                    
                    <button
                      onClick={deleteNode}
                      className="w-full flex items-center space-x-2 px-2 py-1 text-sm rounded hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="feedback-content">
            <NodeViewContent className="prose prose-sm max-w-none focus:outline-none" />
            
            {/* Research Results Display */}
            {isResearchNote && researchData && (
              <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">Research Results</h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>Confidence: {researchData.confidence}%</span>
                    <span>•</span>
                    <span>{new Date(researchData.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <h5 className="text-xs font-medium text-gray-700 mb-1">Summary</h5>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 mt-4 mb-2">{children}</h1>,
                        h2: ({children}) => <h2 className="text-base font-semibold text-gray-900 mt-3 mb-2">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-medium text-gray-800 mt-2 mb-1">{children}</h3>,
                        p: ({children}) => <p className="text-sm text-gray-600 mb-2">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside text-sm text-gray-600 mb-2 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside text-sm text-gray-600 mb-2 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-sm text-gray-600">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
                        em: ({children}) => <em className="italic text-gray-700">{children}</em>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 mb-2">{children}</blockquote>,
                      }}
                    >
                      {researchData.summary}
                    </ReactMarkdown>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-xs font-medium text-gray-700 mb-1">Sources</h5>
                  <div className="space-y-2">
                    {researchData.sources.map((source, index) => (
                      <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 rounded">
                        <ExternalLink className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium block truncate"
                          >
                            {source.title}
                          </a>
                          <p className="text-xs text-gray-500 mt-1">{source.snippet}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-400">{source.type}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">{Math.round(source.relevance * 100)}% relevant</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Debug info */}
                <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-600">
                  <div>Debug: Research data stored successfully</div>
                  <div>Topic: {researchData.query.topic}</div>
                  <div>Depth: {researchData.query.depth}</div>
                  <div>Sources: {researchData.query.sources}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Research Modal */}
      {showResearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Conduct Research</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Research Topic *
                </label>
                <input
                  type="text"
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  placeholder="Enter research topic..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Context (Optional)
                </label>
                <textarea
                  value={researchContext}
                  onChange={(e) => setResearchContext(e.target.value)}
                  placeholder="Provide context for the research..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Research Depth
                </label>
                <select
                  value={researchDepth}
                  onChange={(e) => setResearchDepth(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="basic">Basic Overview</option>
                  <option value="comprehensive">Comprehensive Analysis</option>
                  <option value="academic">Academic Research</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Types
                </label>
                <select
                  value={researchSources}
                  onChange={(e) => setResearchSources(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="both">Web & Academic</option>
                  <option value="web">Web Sources Only</option>
                  <option value="academic">Academic Sources Only</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowResearchModal(false);
                  setIsResearching(false);
                  setResearchQuery('');
                  setResearchContext('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isResearching}
              >
                Cancel
              </button>
              {isResearching && (
                <button
                  onClick={() => {
                    console.log('Manual reset triggered');
                    setIsResearching(false);
                    setShowResearchModal(false);
                    setResearchQuery('');
                    setResearchContext('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                >
                  Reset
                </button>
              )}
              <button
                onClick={handleResearch}
                disabled={!researchQuery.trim() || isResearching}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Researching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Research</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};