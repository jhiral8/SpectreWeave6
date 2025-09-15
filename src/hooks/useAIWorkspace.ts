import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAIContext } from '../contexts/AIContext';
import type { NarrativeContext } from '../types/narrative-context';
import type { AIRequest, AISuggestion } from '../types/ai';

export interface AIWorkspaceState {
  // Panel state
  activeView: 'suggestions' | 'history' | 'analytics' | 'research';
  isGenerating: boolean;
  streamingResponse: string;
  
  // Content
  suggestions: AISuggestion[];
  recentGenerations: any[];
  analytics: WritingAnalytics;
  
  // Actions
  generateContent: (prompt: string, options?: any) => Promise<void>;
  applySuggestion: (suggestionId: string) => void;
  dismissSuggestion: (suggestionId: string) => void;
  clearSuggestions: () => void;
  
  // View management
  setActiveView: (view: AIWorkspaceState['activeView']) => void;
}

export interface WritingAnalytics {
  readability: {
    score: number;
    level: string;
  };
  variety: {
    score: string;
    details: string[];
  };
  pacing: {
    score: number;
    issues: string[];
  };
  voice: {
    strength: string;
    consistency: number;
  };
  progress: {
    percentage: number;
    wordCount: number;
    targetWords?: number;
  };
}

export interface AIWorkspaceOptions {
  projectId: string;
  genre: string;
  enableRealTimeAnalysis?: boolean;
  enableSmartSuggestions?: boolean;
  suggestionDelay?: number;
}

export const useAIWorkspace = (options: AIWorkspaceOptions): AIWorkspaceState => {
  const aiContext = useAIContext();
  const [activeView, setActiveView] = useState<AIWorkspaceState['activeView']>('suggestions');
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock analytics data - in real implementation, this would come from AI analysis
  const analytics: WritingAnalytics = useMemo(() => ({
    readability: {
      score: 8.2,
      level: 'High School'
    },
    variety: {
      score: 'Good',
      details: ['Sentence length varies well', 'Vocabulary is rich', 'Good use of literary devices']
    },
    pacing: {
      score: 7.5,
      issues: ['Some scenes could use more tension', 'Consider faster transitions in chapter 3']
    },
    voice: {
      strength: 'Strong',
      consistency: 0.89
    },
    progress: {
      percentage: 75,
      wordCount: 45000,
      targetWords: 60000
    }
  }), []);

  // Mock suggestions - in real implementation, these would come from AI analysis
  const generateRealSuggestions = useCallback(async (content: string): Promise<AISuggestion[]> => {
    try {
      // Import the advanced AI service manager for suggestions
      const { advancedAIServiceManager } = await import('@/lib/ai/advancedAIServiceManager');
      
      if (!advancedAIServiceManager) {
        console.warn('Advanced AI Service Manager not available');
        return [];
      }

      // Build context for AI suggestions
      const context = {
        projectId: options.projectId,
        genre: options.genre,
        authorStyles: options.authorStyles || [],
        currentContent: content
      };

      // Generate AI suggestions using the advanced service manager
      const aiSuggestions = await advancedAIServiceManager.generateSuggestions(content, context);
      
      return aiSuggestions.map(suggestion => ({
        id: suggestion.id,
        type: suggestion.type,
        text: suggestion.text,
        reason: suggestion.reason,
        confidence: suggestion.confidence,
        position: suggestion.position || { start: 0, end: content.length },
        applied: false,
        timestamp: new Date()
      }));

    } catch (error) {
      console.error('Failed to generate real AI suggestions:', error);
      
      // Fallback to basic suggestions if AI fails
      return [
        {
          id: `fallback_${Date.now()}_1`,
          type: 'enhancement',
          text: 'Consider adding more descriptive details to enhance reader engagement',
          reason: 'Adding sensory details can improve immersion',
          confidence: 0.7,
          position: { start: 0, end: Math.min(content.length, 100) },
          applied: false,
          timestamp: new Date()
        },
        {
          id: `fallback_${Date.now()}_2`,
          type: 'correction',
          text: 'Review sentence structure for better flow and readability',
          reason: 'Varied sentence structure improves reading experience',
          confidence: 0.65,
          position: { start: Math.floor(content.length * 0.3), end: Math.floor(content.length * 0.6) },
          applied: false,
          timestamp: new Date()
        }
      ];
    }
  }, [options.projectId, options.genre, options.authorStyles]);

  // Initialize suggestions
  useEffect(() => {
    if (options.enableSmartSuggestions) {
      // Initialize with empty suggestions, real suggestions will be generated when content is available
      setSuggestions([]);
    }
  }, [options.enableSmartSuggestions]);

  // Get recent generations from AI context
  const recentGenerations = useMemo(() => {
    // In real implementation, filter by project and get recent items
    return [];
  }, []);

  // Generate content using AI
  const generateContent = useCallback(async (prompt: string, generationOptions?: any) => {
    if (!aiContext.isReady) {
      console.warn('AI context not ready');
      return;
    }

    setIsGenerating(true);
    setStreamingResponse('');

    try {
      const request: AIRequest = {
        id: `req_${Date.now()}`,
        type: 'generation',
        prompt,
        context: {
          projectId: options.projectId,
          genre: options.genre,
        },
        options: {
          provider: 'gemini',
          temperature: 0.8,
          maxTokens: 500,
          stream: true,
          ...generationOptions
        },
        timestamp: new Date()
      };

      // Use streaming generation if available
      if (aiContext.generateStream) {
        await aiContext.generateStream(request, (chunk) => {
          setStreamingResponse(prev => prev + chunk);
        });
      } else {
        // Fallback to regular generation
        const response = await aiContext.generateText(request);
        setStreamingResponse(response.content);
      }
    } catch (error) {
      console.error('Content generation failed:', error);
      // Handle error appropriately
    } finally {
      setIsGenerating(false);
    }
  }, [aiContext, options.projectId, options.genre]);

  // Apply a suggestion
  const applySuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => 
      prev.map(suggestion => 
        suggestion.id === suggestionId 
          ? { ...suggestion, applied: true }
          : suggestion
      )
    );

    // In real implementation, apply the suggestion to the editor
    console.log('Applying suggestion:', suggestionId);
  }, []);

  // Dismiss a suggestion
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(suggestion => suggestion.id !== suggestionId));
  }, []);

  // Clear all suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Real-time analysis effect
  useEffect(() => {
    if (!options.enableRealTimeAnalysis) return;

    // In real implementation, this would analyze the current document content
    // and update suggestions in real-time
    const analysisInterval = setInterval(() => {
      // Mock real-time analysis
      if (Math.random() > 0.8) { // 20% chance of new suggestion
        const newSuggestion: AISuggestion = {
          id: `suggestion_${Date.now()}`,
          type: 'enhancement',
          text: 'Real-time suggestion based on your current writing',
          reason: 'Analysis of recent changes',
          confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
          applied: false,
          timestamp: new Date()
        };
        
        setSuggestions(prev => [newSuggestion, ...prev].slice(0, 10)); // Keep latest 10
      }
    }, options.suggestionDelay || 5000);

    return () => clearInterval(analysisInterval);
  }, [options.enableRealTimeAnalysis, options.suggestionDelay]);

  return {
    // State
    activeView,
    isGenerating,
    streamingResponse,
    suggestions,
    recentGenerations,
    analytics,
    
    // Actions
    generateContent,
    applySuggestion,
    dismissSuggestion,
    clearSuggestions,
    setActiveView
  };
};

// Utility hook for AI quick actions
export const useAIQuickActions = (workspaceState: AIWorkspaceState) => {
  const continueWriting = useCallback(async () => {
    await workspaceState.generateContent(
      'Continue this story naturally, maintaining the established tone and style.',
      { type: 'continuation', wordTarget: 200 }
    );
  }, [workspaceState]);

  const generateOutline = useCallback(async () => {
    await workspaceState.generateContent(
      'Create a detailed outline for the next chapter based on the current story progression.',
      { type: 'outline', temperature: 0.6 }
    );
  }, [workspaceState]);

  const improveStyle = useCallback(async () => {
    await workspaceState.generateContent(
      'Analyze the current text and suggest specific improvements for style, flow, and readability.',
      { type: 'analysis', temperature: 0.4 }
    );
  }, [workspaceState]);

  const performResearch = useCallback(async (topic: string) => {
    await workspaceState.generateContent(
      `Research information about: ${topic}. Provide accurate, relevant details for creative writing.`,
      { type: 'research', temperature: 0.3 }
    );
  }, [workspaceState]);

  return {
    continueWriting,
    generateOutline,
    improveStyle,
    performResearch
  };
};