import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  PenTool,
  FileText,
  Users,
  MapPin,
  Clock,
  Sparkles,
  X,
  Send,
  Loader2,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { Textarea } from '../../ui/Textarea';
import { useAIContext } from '../../../contexts/AIContext';
import { writingPrompts } from '../../../services/writingPrompts';
import type { Editor } from '@tiptap/react';
import type { NarrativeContext } from '../../../types/narrative-context';

interface CustomGhostwriterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
  context?: Partial<NarrativeContext>;
  className?: string;
}

interface GenerationPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  promptTemplate: string;
  settings: {
    temperature: number;
    maxTokens: number;
    focusArea: string;
  };
}

interface GeneratedContent {
  id: string;
  content: string;
  preset: GenerationPreset;
  timestamp: Date;
  rating?: 'up' | 'down';
  applied: boolean;
}

export const CustomGhostwriterPanel: React.FC<CustomGhostwriterPanelProps> = ({
  isOpen,
  onClose,
  editor,
  context,
  className
}) => {
  const [selectedPreset, setSelectedPreset] = useState<GenerationPreset | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentGeneration, setCurrentGeneration] = useState<string | null>(null);
  
  const aiContext = useAIContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generation presets for different writing tasks
  const generationPresets: GenerationPreset[] = [
    {
      id: 'continue-scene',
      name: 'Continue Scene',
      description: 'Continue the current scene naturally',
      icon: <PenTool className="w-4 h-4" />,
      promptTemplate: 'Continue this scene maintaining the established tone, pacing, and character voices. Focus on moving the story forward naturally.',
      settings: {
        temperature: 0.8,
        maxTokens: 400,
        focusArea: 'narrative flow'
      }
    },
    {
      id: 'character-dialogue',
      name: 'Character Dialogue',
      description: 'Generate authentic character conversations',
      icon: <Users className="w-4 h-4" />,
      promptTemplate: 'Create realistic dialogue that reflects each character\'s unique voice, background, and current emotional state.',
      settings: {
        temperature: 0.7,
        maxTokens: 300,
        focusArea: 'character voice'
      }
    },
    {
      id: 'scene-description',
      name: 'Scene Description',
      description: 'Create vivid setting and atmosphere',
      icon: <MapPin className="w-4 h-4" />,
      promptTemplate: 'Describe the setting with rich sensory details that establish mood and atmosphere while supporting the story\'s tone.',
      settings: {
        temperature: 0.8,
        maxTokens: 350,
        focusArea: 'atmosphere'
      }
    },
    {
      id: 'action-sequence',
      name: 'Action Sequence',
      description: 'Write dynamic action and conflict',
      icon: <Sparkles className="w-4 h-4" />,
      promptTemplate: 'Create a compelling action sequence with clear choreography, tension, and emotional stakes.',
      settings: {
        temperature: 0.7,
        maxTokens: 400,
        focusArea: 'pacing and tension'
      }
    },
    {
      id: 'chapter-transition',
      name: 'Chapter Transition',
      description: 'Bridge between scenes or chapters',
      icon: <Clock className="w-4 h-4" />,
      promptTemplate: 'Create a smooth transition that maintains reader engagement while moving to the next scene or time period.',
      settings: {
        temperature: 0.6,
        maxTokens: 250,
        focusArea: 'narrative flow'
      }
    },
    {
      id: 'story-outline',
      name: 'Story Outline',
      description: 'Generate plot structure and beats',
      icon: <FileText className="w-4 h-4" />,
      promptTemplate: 'Create a detailed story outline with key plot points, character arcs, and thematic elements.',
      settings: {
        temperature: 0.5,
        maxTokens: 500,
        focusArea: 'story structure'
      }
    }
  ];

  // Close panel with ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const generateContent = useCallback(async (prompt: string, preset?: GenerationPreset) => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setStreamingContent('');
    const generationId = `gen_${Date.now()}`;
    setCurrentGeneration(generationId);

    try {
      // Get context from current editor position
      const { from } = editor.state.selection;
      const contextText = editor.state.doc.textBetween(Math.max(0, from - 1000), from);

      // Build comprehensive prompt
      let fullPrompt = prompt;
      if (preset) {
        fullPrompt = `${preset.promptTemplate}\n\nContext: ${contextText}\n\nSpecific request: ${prompt}`;
      } else if (contextText) {
        fullPrompt = `Based on this context: ${contextText}\n\n${prompt}`;
      }

      const settings = preset?.settings || {
        temperature: 0.8,
        maxTokens: 400,
        focusArea: 'general writing'
      };

      // Use streaming if available
      if (aiContext.generateStream) {
        await aiContext.generateStream({
          id: generationId,
          type: 'generation',
          prompt: fullPrompt,
          context: context,
          options: {
            provider: 'gemini',
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
            stream: true
          },
          timestamp: new Date()
        }, (chunk) => {
          setStreamingContent(prev => prev + chunk);
        });

        // After streaming completes, save the content
        const finalContent: GeneratedContent = {
          id: generationId,
          content: streamingContent,
          preset: preset || {
            id: 'custom',
            name: 'Custom Request',
            description: 'Custom AI generation',
            icon: <Sparkles className="w-4 h-4" />,
            promptTemplate: prompt,
            settings
          },
          timestamp: new Date(),
          applied: false
        };

        setGeneratedContent(prev => [finalContent, ...prev]);
      } else {
        // Fallback to regular generation
        const response = await aiContext.generateText({
          id: generationId,
          type: 'generation',
          prompt: fullPrompt,
          context: context,
          options: {
            provider: 'gemini',
            temperature: settings.temperature,
            maxTokens: settings.maxTokens
          },
          timestamp: new Date()
        });

        const finalContent: GeneratedContent = {
          id: generationId,
          content: response.content,
          preset: preset || {
            id: 'custom',
            name: 'Custom Request',
            description: 'Custom AI generation',
            icon: <Sparkles className="w-4 h-4" />,
            promptTemplate: prompt,
            settings
          },
          timestamp: new Date(),
          applied: false
        };

        setGeneratedContent(prev => [finalContent, ...prev]);
      }

    } catch (error) {
      console.error('Content generation failed:', error);
    } finally {
      setIsGenerating(false);
      setCurrentGeneration(null);
      setStreamingContent('');
    }
  }, [editor, context, aiContext, streamingContent]);

  const handlePresetGenerate = useCallback(async (preset: GenerationPreset) => {
    const prompt = customPrompt || `Generate content using the ${preset.name.toLowerCase()} approach.`;
    await generateContent(prompt, preset);
    setCustomPrompt('');
  }, [customPrompt, generateContent]);

  const handleCustomGenerate = useCallback(async () => {
    if (!customPrompt.trim()) return;
    await generateContent(customPrompt);
    setCustomPrompt('');
  }, [customPrompt, generateContent]);

  const applyContent = useCallback((content: GeneratedContent) => {
    editor.chain().focus().insertContent('\n\n' + content.content + '\n\n').run();
    
    setGeneratedContent(prev => 
      prev.map(item => 
        item.id === content.id ? { ...item, applied: true } : item
      )
    );
  }, [editor]);

  const copyContent = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could show a toast notification here
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  }, []);

  const rateContent = useCallback((contentId: string, rating: 'up' | 'down') => {
    setGeneratedContent(prev => 
      prev.map(item => 
        item.id === contentId ? { ...item, rating } : item
      )
    );
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        ref={panelRef}
        className={cn(
          'w-full max-w-4xl h-[80vh] bg-white dark:bg-neutral-900',
          'border border-neutral-200 dark:border-neutral-700',
          'rounded-lg shadow-xl flex flex-col overflow-hidden',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PenTool className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">
                AI Ghostwriter
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Advanced AI writing assistance with context awareness
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              buttonSize="iconSmall"
              onClick={() => setShowSettings(!showSettings)}
              className="text-neutral-500"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              buttonSize="iconSmall"
              onClick={onClose}
              className="text-neutral-500"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Presets and Input */}
          <div className="w-1/3 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
            {/* Generation Presets */}
            <div className="p-4">
              <h3 className="text-sm font-medium text-black dark:text-white mb-3">
                Quick Presets
              </h3>
              <div className="space-y-2">
                {generationPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetGenerate(preset)}
                    disabled={isGenerating}
                    className={cn(
                      'w-full p-3 rounded-lg border text-left transition-all duration-200',
                      'border-neutral-200 dark:border-neutral-700',
                      'hover:border-primary/30 hover:bg-primary/5',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      selectedPreset?.id === preset.id && 'border-primary bg-primary/10'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {preset.icon}
                      <span className="font-medium text-sm text-black dark:text-white">
                        {preset.name}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt Input */}
            <div className="flex-1 p-4 border-t border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-medium text-black dark:text-white mb-3">
                Custom Request
              </h3>
              <div className="space-y-3">
                <Textarea
                  ref={textareaRef}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe what you want the AI to write..."
                  className="min-h-[120px] resize-none"
                  disabled={isGenerating}
                />
                <Button
                  onClick={handleCustomGenerate}
                  disabled={!customPrompt.trim() || isGenerating}
                  className="w-full"
                  buttonSize="small"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Generated Content */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-medium text-black dark:text-white">
                Generated Content
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Streaming Content */}
              {isGenerating && streamingContent && (
                <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm font-medium text-primary">Generating...</span>
                  </div>
                  <div className="prose prose-sm max-w-none text-black dark:text-white">
                    {streamingContent}
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  </div>
                </div>
              )}

              {/* Generated Content List */}
              {generatedContent.map((content) => (
                <GeneratedContentCard
                  key={content.id}
                  content={content}
                  onApply={() => applyContent(content)}
                  onCopy={() => copyContent(content.content)}
                  onRate={(rating) => rateContent(content.id, rating)}
                />
              ))}

              {/* Empty State */}
              {generatedContent.length === 0 && !isGenerating && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full mb-4">
                    <Sparkles className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    Ready to Create
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 max-w-md">
                    Choose a preset or enter a custom request to generate AI-powered content for your story.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GeneratedContentCardProps {
  content: GeneratedContent;
  onApply: () => void;
  onCopy: () => void;
  onRate: (rating: 'up' | 'down') => void;
}

const GeneratedContentCard: React.FC<GeneratedContentCardProps> = ({
  content,
  onApply,
  onCopy,
  onRate
}) => {
  return (
    <div className={cn(
      'p-4 border rounded-lg transition-all duration-200',
      content.applied 
        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {content.preset.icon}
          <span className="text-sm font-medium text-black dark:text-white">
            {content.preset.name}
          </span>
          {content.applied && (
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
              Applied
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {content.timestamp.toLocaleTimeString()}
        </span>
      </div>

      {/* Content */}
      <div className="prose prose-sm max-w-none mb-4 text-black dark:text-white">
        {content.content}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            buttonSize="small"
            onClick={onApply}
            disabled={content.applied}
            className="text-xs"
          >
            <Send className="w-3 h-3 mr-1" />
            {content.applied ? 'Applied' : 'Apply'}
          </Button>
          <Button
            variant="ghost"
            buttonSize="small"
            onClick={onCopy}
            className="text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            buttonSize="iconSmall"
            onClick={() => onRate('up')}
            className={cn(
              'text-xs',
              content.rating === 'up' && 'text-green-600 bg-green-100 dark:bg-green-900/30'
            )}
          >
            <ThumbsUp className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            buttonSize="iconSmall"
            onClick={() => onRate('down')}
            className={cn(
              'text-xs',
              content.rating === 'down' && 'text-red-600 bg-red-100 dark:bg-red-900/30'
            )}
          >
            <ThumbsDown className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing the ghostwriter panel
export const useCustomGhostwriter = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openGhostwriter = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeGhostwriter = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    openGhostwriter,
    closeGhostwriter
  };
};