import React, { useState, useCallback } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  FileText, 
  Zap, 
  MessageSquare, 
  BookOpen,
  ChevronDown,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { useAIContext } from '../../../contexts/AIContext';
import { writingPrompts } from '../../../services/writingPrompts';
import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';

interface AIToolbarProps {
  editor: Editor;
  className?: string;
}

interface AIAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  action: (editor: Editor, selectedText: string) => Promise<void>;
  category: 'generate' | 'improve' | 'analyze';
  requiresSelection?: boolean;
}

export const AIToolbar: React.FC<AIToolbarProps> = ({
  editor,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const aiContext = useAIContext();


  // Check if AI toolbar should show - only when text is selected and delay to avoid conflicts
  const shouldShow = useCallback(({ editor, view, state, from, to }: any) => {
    const { doc, selection } = state;
    const { empty } = selection;
    
    // Don't show if selection is empty
    if (empty) return false;
    
    // Don't show if currently processing
    if (isProcessing) return false;
    
    // Check if there's actual text selected
    const text = doc.textBetween(from, to, ' ');
    const hasText = text.trim().length > 0;
    
    // Only show if we have a substantial text selection (more than 5 characters)
    // This helps avoid conflicts with quick selections that trigger TextMenu
    if (!hasText || text.trim().length <= 5) return false;
    
    return true;
  }, [isProcessing]);

  // Get selected text
  const getSelectedText = useCallback(() => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ');
  }, [editor]);

  // AI Actions based on context
  const getAIActions = useCallback((): AIAction[] => {
    return [
      {
        id: 'continue',
        label: 'Continue',
        icon: <Sparkles className="w-4 h-4" />,
        description: 'Continue writing from cursor position',
        category: 'generate',
        requiresSelection: false,
        action: async (editor: Editor, selectedText: string) => {
          const { from } = editor.state.selection;
          const beforeText = editor.state.doc.textBetween(Math.max(0, from - 500), from);
          
          const promptData = await writingPrompts.generatePrompt('continue-story', {
            currentContent: beforeText,
            wordTarget: 150
          });
          
          const response = await aiContext.generateText({
            id: `continue_${Date.now()}`,
            type: 'generation',
            prompt: promptData.prompt,
            options: promptData.options,
            timestamp: new Date()
          });
          
          editor.chain().focus().insertContent(' ' + response.content).run();
        }
      },
      {
        id: 'improve',
        label: 'Improve',
        icon: <Zap className="w-4 h-4" />,
        description: 'Enhance selected text style and clarity',
        category: 'improve',
        requiresSelection: true,
        action: async (editor: Editor, selectedText: string) => {
          if (!selectedText) return;
          
          const promptData = await writingPrompts.generatePrompt('improve-prose', {
            originalText: selectedText,
            improvementAreas: 'style, clarity, engagement'
          });
          
          const response = await aiContext.generateText({
            id: `improve_${Date.now()}`,
            type: 'editing',
            prompt: promptData.prompt,
            options: promptData.options,
            timestamp: new Date()
          });
          
          // Replace selected text with improved version
          editor.chain().focus().insertContent(response.content).run();
        }
      },
      {
        id: 'rewrite',
        label: 'Rewrite',
        icon: <RefreshCw className="w-4 h-4" />,
        description: 'Rewrite selected text with different approach',
        category: 'improve',
        requiresSelection: true,
        action: async (editor: Editor, selectedText: string) => {
          if (!selectedText) return;
          
          const response = await aiContext.generateText({
            id: `rewrite_${Date.now()}`,
            type: 'editing',
            prompt: `Rewrite this text with a fresh approach while maintaining the same meaning and tone:\\n\\n${selectedText}`,
            options: {
              provider: 'gemini',
              temperature: 0.8,
              maxTokens: Math.max(200, selectedText.length * 1.5)
            },
            timestamp: new Date()
          });
          
          editor.chain().focus().insertContent(response.content).run();
        }
      },
      {
        id: 'dialogue',
        label: 'Add Dialogue',
        icon: <MessageSquare className="w-4 h-4" />,
        description: 'Generate character dialogue for this scene',
        category: 'generate',
        requiresSelection: false,
        action: async (editor: Editor, selectedText: string) => {
          const { from } = editor.state.selection;
          const context = editor.state.doc.textBetween(Math.max(0, from - 300), from + 300);
          
          const response = await aiContext.generateText({
            id: `dialogue_${Date.now()}`,
            type: 'generation',
            prompt: `Based on this scene context, generate natural dialogue that fits the situation:\\n\\nContext: ${context}\\n\\nGenerate 2-3 lines of dialogue with appropriate tags:`,
            options: {
              provider: 'gemini',
              temperature: 0.7,
              maxTokens: 300
            },
            timestamp: new Date()
          });
          
          editor.chain().focus().insertContent('\\n\\n' + response.content).run();
        }
      },
      {
        id: 'summarize',
        label: 'Summarize',
        icon: <FileText className="w-4 h-4" />,
        description: 'Create a summary of selected text',
        category: 'analyze',
        requiresSelection: true,
        action: async (editor: Editor, selectedText: string) => {
          if (!selectedText) return;
          
          const response = await aiContext.generateText({
            id: `summarize_${Date.now()}`,
            type: 'analysis',
            prompt: `Create a concise summary of this text, highlighting the key points:\\n\\n${selectedText}`,
            options: {
              provider: 'gemini',
              temperature: 0.3,
              maxTokens: 200
            },
            timestamp: new Date()
          });
          
          // Insert summary as a note or comment
          editor.chain().focus().insertContent(`\\n\\n**Summary:** ${response.content}\\n\\n`).run();
        }
      },
      {
        id: 'expand',
        label: 'Expand',
        icon: <BookOpen className="w-4 h-4" />,
        description: 'Expand selected text with more detail',
        category: 'improve',
        requiresSelection: true,
        action: async (editor: Editor, selectedText: string) => {
          if (!selectedText) return;
          
          const response = await aiContext.generateText({
            id: `expand_${Date.now()}`,
            type: 'generation',
            prompt: `Expand this text with more descriptive details, sensory information, and depth while maintaining the same tone:\\n\\n${selectedText}`,
            options: {
              provider: 'gemini',
              temperature: 0.7,
              maxTokens: Math.max(300, selectedText.length * 2)
            },
            timestamp: new Date()
          });
          
          editor.chain().focus().insertContent(response.content).run();
        }
      }
    ];
  }, [aiContext]);

  const actions = getAIActions();
  const selectedText = getSelectedText();
  const availableActions = actions.filter(action => !action.requiresSelection || selectedText.trim().length > 0);

  const executeAction = useCallback(async (action: AIAction) => {
    setIsProcessing(true);
    setActiveAction(action.id);
    
    try {
      await action.action(editor, selectedText);
      // Close expanded view after successful action
      setIsExpanded(false);
    } catch (error) {
      console.error('AI action failed:', error);
      // Show error state or notification
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
    }
  }, [editor, selectedText]);

  // Quick actions (always visible)
  const quickActions = availableActions.slice(0, 3);
  const moreActions = availableActions.slice(3);

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="aiToolbar"
      shouldShow={shouldShow}
      updateDelay={200}
      tippyOptions={{
        placement: 'bottom-start',
        offset: [0, 12],
        maxWidth: 'none',
        hideOnClick: false,
        interactive: true,
        popperOptions: {
          strategy: 'absolute',
          modifiers: [
            {
              name: 'flip',
              enabled: true,
              options: {
                fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
              },
            },
            {
              name: 'preventOverflow',
              options: {
                boundary: 'viewport',
                padding: 8,
                altAxis: true,
              },
            },
          ],
        },
        zIndex: 900,
      }}
      className={cn("ai-toolbar-bubble", className)}
      data-theme="aiToolbar"
    >
      <div className="flex flex-col gap-2">
        {/* Connection indicator - shows this toolbar is connected to selection above */}
        <div className="flex justify-center">
          <div className="w-6 h-1 bg-primary/50 rounded-full"></div>
        </div>
        
        {/* Main toolbar */}
        <div
          className={cn(
            'flex items-center p-2 gap-1.5',
            'bg-gradient-to-r from-primary/20 to-primary/10',
            'border border-primary/30',
            'rounded-lg shadow-lg transition-all duration-200',
            'min-w-[220px] max-w-[360px]',
            'backdrop-blur-sm'
          )}
        >
        {/* AI Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/20 rounded-md border border-primary/30">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary">AI</span>
        </div>

        {/* Quick Actions */}
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant="ghost"
            buttonSize="iconSmall"
            onClick={() => executeAction(action)}
            disabled={isProcessing}
            className={cn(
              'relative transition-all duration-200 hover:bg-primary/20',
              'h-8 w-8 rounded-md',
              activeAction === action.id && 'bg-primary/30',
              isProcessing && activeAction !== action.id && 'opacity-50'
            )}
            title={action.description}
          >
            {activeAction === action.id ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <div className="w-4 h-4 text-primary">
                {action.icon}
              </div>
            )}
          </Button>
        ))}

        {/* More Actions Toggle */}
        {moreActions.length > 0 && (
          <Button
            variant="ghost"
            buttonSize="iconSmall"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'h-8 w-8 rounded-md transition-all duration-200 hover:bg-primary/20',
              isExpanded && 'rotate-180 bg-primary/20'
            )}
          >
            <ChevronDown className="w-4 h-4 text-primary" />
          </Button>
        )}

        {/* Close Button */}
        <div className="ml-2 border-l border-primary/30 pl-2">
          <Button
            variant="ghost"
            buttonSize="iconSmall"
            onClick={() => {
              setIsExpanded(false);
              editor.commands.focus();
            }}
            className="h-8 w-8 rounded-md text-primary/70 hover:text-primary hover:bg-primary/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Expanded Actions - positioned absolutely below the main toolbar */}
        {isExpanded && moreActions.length > 0 && (
          <div className="absolute top-full left-0 mt-1 bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30 rounded-lg shadow-lg p-1 space-y-0.5 z-50 min-w-[240px] backdrop-blur-sm">
            {moreActions.map((action) => (
              <button
                key={action.id}
                onClick={() => executeAction(action)}
                disabled={isProcessing}
                className={cn(
                  'w-full flex items-center gap-2.5 p-2 rounded-md text-left',
                  'hover:bg-primary/20',
                  'transition-colors duration-150',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  activeAction === action.id && 'bg-primary/30'
                )}
              >
                <div className="flex-shrink-0">
                  {activeAction === action.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <div className="w-4 h-4 text-primary">
                      {action.icon}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {action.label}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {action.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        </div>
        
        {/* Context Info - positioned at the top right */}
        {selectedText && (
          <div className="absolute -top-6 right-0 px-2 py-0.5 bg-primary/90 text-primary-foreground text-xs rounded-sm shadow-sm">
            {selectedText.length} chars
          </div>
        )}
      </div>
    </BubbleMenu>
  );
};

// Simplified hook that's not needed anymore, but keeping for compatibility
export const useAIToolbar = (editor: Editor | null) => {
  return {
    visible: false,
    position: { top: 0, left: 0 },
    selectedText: '',
    hideToolbar: () => {}
  };
};