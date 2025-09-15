import React, { useState, useCallback, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { 
  ChevronDown, 
  ChevronRight, 
  User, 
  BookOpen, 
  Lightbulb, 
  Quote,
  Edit3,
  X,
  Plus,
  Brain,
  Sparkles,
  BarChart3,
  TrendingUp,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Target,
  Zap,
  FileText,
  Clock,
  Award
} from 'lucide-react';
import { useAdvancedAI } from '@/lib/ai/advancedAIContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface AuthorStyleComponentProps {
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

export const AuthorStyleComponent: React.FC<AuthorStyleComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const { 
    styleId,
    authorName, 
    genre, 
    styleDescription, 
    sampleText, 
    writingTips, 
    styleMetrics,
    aiAnalysis,
    lastAnalysis,
    confidence,
    collapsed 
  } = node.attrs;
  
  const {
    analyzeStyleConsistency,
    transformTextToStyle,
    generateStyleSuggestions,
    isLoading,
    error
  } = useAdvancedAI();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    authorName,
    genre,
    styleDescription,
    sampleText,
    writingTips: [...writingTips],
  });

  // Listen for AI analysis events
  useEffect(() => {
    const handleAnalysisRequest = async (event: CustomEvent) => {
      if (event.detail.styleId !== styleId) return;
      
      setIsAnalyzing(true);
      setAIError(null);
      
      try {
        const analysis = await analyzeStyleConsistency(event.detail.content, {
          authorName: event.detail.styleData.authorName,
          genre: event.detail.styleData.genre,
          styleDescription: event.detail.styleData.styleDescription,
          sampleText: event.detail.styleData.sampleText,
        });
        
        updateAttributes({
          aiAnalysis: analysis.feedback,
          styleMetrics: analysis.metrics,
          confidence: analysis.consistencyScore,
          lastAnalysis: new Date().toISOString(),
        });
        
        setShowAnalysis(true);
      } catch (err) {
        setAIError(err instanceof Error ? err.message : 'Analysis failed');
      } finally {
        setIsAnalyzing(false);
      }
    };

    const handleSuggestionRequest = async (event: CustomEvent) => {
      if (event.detail.styleId !== styleId) return;
      
      setIsAnalyzing(true);
      setAIError(null);
      
      try {
        const suggestions = await generateStyleSuggestions({
          authorName: event.detail.styleData.authorName,
          genre: event.detail.styleData.genre,
          styleDescription: event.detail.styleData.styleDescription,
        });
        
        // Update writing tips with AI suggestions
        updateAttributes({
          writingTips: [...writingTips, ...suggestions.suggestions],
          lastAnalysis: new Date().toISOString(),
        });
      } catch (err) {
        setAIError(err instanceof Error ? err.message : 'Failed to generate suggestions');
      } finally {
        setIsAnalyzing(false);
      }
    };

    window.addEventListener('author-style-analysis-request', handleAnalysisRequest as EventListener);
    window.addEventListener('author-style-suggestion-request', handleSuggestionRequest as EventListener);

    return () => {
      window.removeEventListener('author-style-analysis-request', handleAnalysisRequest as EventListener);
      window.removeEventListener('author-style-suggestion-request', handleSuggestionRequest as EventListener);
    };
  }, [styleId, authorName, genre, styleDescription, sampleText, writingTips, analyzeStyleConsistency, generateStyleSuggestions, updateAttributes]);

  const toggleCollapsed = useCallback(() => {
    updateAttributes({ collapsed: !collapsed });
  }, [collapsed, updateAttributes]);

  const handleSave = useCallback(() => {
    updateAttributes(editValues);
    setIsEditing(false);
  }, [editValues, updateAttributes]);

  const handleCancel = useCallback(() => {
    setEditValues({
      authorName,
      genre,
      styleDescription,
      sampleText,
      writingTips: [...writingTips],
    });
    setIsEditing(false);
  }, [authorName, genre, styleDescription, sampleText, writingTips]);

  const addWritingTip = useCallback(() => {
    setEditValues(prev => ({
      ...prev,
      writingTips: [...prev.writingTips, ''],
    }));
  }, []);

  const updateWritingTip = useCallback((index: number, value: string) => {
    setEditValues(prev => ({
      ...prev,
      writingTips: prev.writingTips.map((tip, i) => i === index ? value : tip),
    }));
  }, []);

  const removeWritingTip = useCallback((index: number) => {
    setEditValues(prev => ({
      ...prev,
      writingTips: prev.writingTips.filter((_, i) => i !== index),
    }));
  }, []);

  const getGenreColor = (genre: string) => {
    const colors: Record<string, string> = {
      'sci-fi': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700',
      'fantasy': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700',
      'mystery': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
      'thriller': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
      'romance': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-700',
      'horror': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700',
      'historical': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700',
      'literary': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700',
    };
    return colors[genre.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  };

  const runAnalysis = useCallback(() => {
    const event = new CustomEvent('author-style-analysis-request', {
      detail: {
        styleId,
        styleData: node.attrs,
        content: '', // Will use document content
        timestamp: new Date().toISOString(),
      },
    });
    window.dispatchEvent(event);
  }, [styleId, node.attrs]);

  const generateSuggestions = useCallback(() => {
    const event = new CustomEvent('author-style-suggestion-request', {
      detail: {
        styleId,
        styleData: node.attrs,
      },
    });
    window.dispatchEvent(event);
  }, [styleId, node.attrs]);

  return (
    <NodeViewWrapper className="author-style-block my-4">
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
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
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {authorName || 'Author Style Guide'}
              </h3>
              {genre && (
                <Badge variant="outline" className={cn("text-xs", getGenreColor(genre))}>
                  {genre}
                </Badge>
              )}
              {confidence > 0 && (
                <Badge variant="outline" className="text-xs">
                  {Math.round(confidence * 100)}% Match
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isEditing && authorName && (
              <>
                <Button
                  buttonSize="small"
                  variant="ghost"
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="h-7 px-2"
                  title="Analyze style consistency"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Brain className="w-3 h-3" />
                  )}
                  <span className="ml-1 text-xs">Analyze</span>
                </Button>
                <Button
                  buttonSize="small"
                  variant="ghost"
                  onClick={generateSuggestions}
                  disabled={isAnalyzing}
                  className="h-7 px-2"
                  title="Generate style suggestions"
                >
                  <Sparkles className="w-3 h-3" />
                  <span className="ml-1 text-xs">Suggest</span>
                </Button>
              </>
            )}
            <Button
              buttonSize="iconSmall"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              title="Edit style guide"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              buttonSize="iconSmall"
              variant="ghost"
              onClick={deleteNode}
              className="hover:bg-red-100 dark:hover:bg-red-900/20"
              title="Delete style guide"
            >
              <X className="w-3 h-3 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="p-4 space-y-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
            {isEditing ? (
              <div className="space-y-4">
                {/* Edit Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Author Name
                    </label>
                    <Input
                      value={editValues.authorName}
                      onChange={(e) => setEditValues(prev => ({ ...prev, authorName: e.target.value }))}
                      placeholder="e.g., Ernest Hemingway"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Genre
                    </label>
                    <Select
                      value={editValues.genre}
                      onValueChange={(value) => setEditValues(prev => ({ ...prev, genre: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="literary">Literary Fiction</SelectItem>
                        <SelectItem value="sci-fi">Science Fiction</SelectItem>
                        <SelectItem value="fantasy">Fantasy</SelectItem>
                        <SelectItem value="mystery">Mystery</SelectItem>
                        <SelectItem value="thriller">Thriller</SelectItem>
                        <SelectItem value="romance">Romance</SelectItem>
                        <SelectItem value="horror">Horror</SelectItem>
                        <SelectItem value="historical">Historical Fiction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Style Description
                  </label>
                  <Textarea
                    value={editValues.styleDescription}
                    onChange={(e) => setEditValues(prev => ({ ...prev, styleDescription: e.target.value }))}
                    rows={3}
                    placeholder="Describe the author's distinctive writing style, voice, and techniques..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sample Text
                  </label>
                  <Textarea
                    value={editValues.sampleText}
                    onChange={(e) => setEditValues(prev => ({ ...prev, sampleText: e.target.value }))}
                    rows={4}
                    placeholder="Include a representative sample of the author's writing..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Writing Tips
                    </label>
                    <Button
                      buttonSize="small"
                      variant="secondary"
                      onClick={addWritingTip}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Tip
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editValues.writingTips.map((tip, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={tip}
                          onChange={(e) => updateWritingTip(index, e.target.value)}
                          placeholder="Enter a writing tip or technique..."
                        />
                        <Button
                          buttonSize="iconSmall"
                          variant="ghost"
                          onClick={() => removeWritingTip(index)}
                          className="hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
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
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Display Mode */}
                {styleDescription && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Style Description</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{styleDescription}</p>
                    </div>
                  </div>
                )}

                {sampleText && (
                  <div className="flex items-start gap-3">
                    <Quote className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Sample Text</h4>
                      <blockquote className="text-gray-700 dark:text-gray-300 text-sm italic leading-relaxed border-l-4 border-blue-200 dark:border-blue-700 pl-4 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-r">
                        {sampleText}
                      </blockquote>
                    </div>
                  </div>
                )}

                {writingTips.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Writing Tips</h4>
                      <ul className="space-y-1">
                        {writingTips.map((tip, index) => (
                          <li key={index} className="text-gray-700 dark:text-gray-300 text-sm flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* AI Analysis Results */}
                {aiAnalysis && showAnalysis && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">AI Style Analysis</h4>
                        <div className="space-y-3">
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{aiAnalysis}</p>
                          
                          {styleMetrics && Object.keys(styleMetrics).length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                              {Object.entries(styleMetrics).map(([key, value]) => (
                                <div key={key} className="bg-gray-100 dark:bg-gray-800 rounded p-2">
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{key}</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {typeof value === 'number' ? value.toFixed(2) : value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {lastAnalysis && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last analyzed: {new Date(lastAnalysis).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* AI Error */}
                {aiError && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-700 rounded">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{aiError}</p>
                  </div>
                )}

                {!styleDescription && !sampleText && writingTips.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click the edit button to add author style information</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content area for nested content */}
        <NodeViewContent className="author-style-content" />
      </div>
    </NodeViewWrapper>
  );
};