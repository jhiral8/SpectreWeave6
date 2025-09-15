import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

interface CustomAIToolbarProps {
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

export const CustomAIToolbar: React.FC<CustomAIToolbarProps> = ({
  editor,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const aiContext = useAIContext();

  // Position calculation - place BELOW the selected text
  const updatePosition = useCallback(() => {
    if (!editor) {
      setIsVisible(false);
      return;
    }

    const { from, to, empty } = editor.state.selection;
    const surface = editor.view.dom.getAttribute('data-surface');


    // Don't show if selection is empty
    if (empty) {
      setIsVisible(false);
      return;
    }

    // Don't show if currently processing
    if (isProcessing) {
      setIsVisible(false);
      return;
    }

    // Check if there's actual text selected (minimum 3 characters)
    const text = editor.state.doc.textBetween(from, to, ' ');
    if (!text || text.trim().length <= 3) {
      setIsVisible(false);
      return;
    }

    try {
      // Get the DOM coordinates of the selection END (bottom) - these are viewport-relative
      const view = editor.view;
      const coordsEnd = view.coordsAtPos(to);
      
      // Ensure coordinates are viewport-relative (they should be already)
      const viewportRect = { top: 0, left: 0 }; // coordsAtPos returns viewport coordinates
      
      // Position BELOW the selection end
      const selectionBottom = coordsEnd.bottom;
      const selectionLeft = coordsEnd.left;
      
      // Toolbar dimensions
      const toolbarWidth = 320;
      const toolbarHeight = 50;
      
      // Position below selection with padding - these are viewport coordinates
      let top = selectionBottom + 15; // 15px below selection
      let left = selectionLeft - (toolbarWidth / 2); // Centered on selection end
      
      // Viewport boundaries with safe margins
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 20; // Increased margin to avoid clipping
      
      // Horizontal boundary checks
      if (left < margin) {
        left = margin;
      } else if (left + toolbarWidth > viewportWidth - margin) {
        left = viewportWidth - toolbarWidth - margin;
      }
      
      // Vertical boundary check - ensure it stays in viewport
      if (top + toolbarHeight > viewportHeight - margin) {
        // If no space below, position above selection instead
        const coordsStart = view.coordsAtPos(from);
        top = coordsStart.top - toolbarHeight - 15;
        // Double-check it fits above
        if (top < margin) {
          top = margin; // Last resort: stick to top
        }
      }
      
      setPosition({ top, left });
      setIsVisible(true);
    } catch (error) {
      console.warn('Could not calculate AI toolbar position:', error);
      setIsVisible(false);
    }
  }, [editor, isProcessing]);

  // Update position on selection change
  useEffect(() => {
    if (!editor) return;

    const surface = editor.view.dom.getAttribute('data-surface');

    const updateHandler = () => {
      setTimeout(updatePosition, 50); // Small delay
    };

    editor.on('selectionUpdate', updateHandler);
    editor.on('transaction', updateHandler);

    // Initial check
    updatePosition();

    return () => {
      editor.off('selectionUpdate', updateHandler);
      editor.off('transaction', updateHandler);
    };
  }, [editor, updatePosition]);

  // Get selected text
  const getSelectedText = useCallback(() => {
    if (!editor) return '';
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ');
  }, [editor]);

  // AI Actions
  const getAIActions = useCallback((): AIAction[] => {
    return [
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
            improvementAreas: 'style, clarity, engagement',
            styleProfile: 'Clear, engaging prose with varied sentence structure and precise word choice',
            preserveLength: false
          });
          
          const response = await aiContext.generateText({
            id: `improve_${Date.now()}`,
            type: 'editing',
            prompt: promptData.prompt,
            options: promptData.options,
            timestamp: new Date()
          });
          
          // Clear selection and insert AI suggestion block after the original selection
          const { from, to } = editor.state.selection;
          editor.chain()
            .focus()
            .insertContentAt(to + 1, {
              type: 'aiSuggestion',
              attrs: {
            originalText: selectedText,
            suggestedText: response.content,
            action: 'improve',
            timestamp: new Date().toISOString()
              }
            })
            .setTextSelection({ from: to + 2, to: to + 2 }) // Clear selection after insertion
            .run();
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
            prompt: `Rewrite the following text with a fresh approach while maintaining the same meaning and intent. Use clear, engaging language with varied sentence structure:

${selectedText}

Provide only the rewritten text without any explanation or preamble.`,
            timestamp: new Date(),
            options: {
              provider: 'gemini',
              temperature: 0.8,
              maxTokens: Math.max(200, selectedText.length * 1.5)
            }
          });
          
          // Clear selection and insert AI suggestion block after the original selection
          const { from, to } = editor.state.selection;
          editor.chain()
            .focus()
            .insertContentAt(to + 1, {
              type: 'aiSuggestion',
              attrs: {
            originalText: selectedText,
            suggestedText: response.content,
            action: 'rewrite',
            timestamp: new Date().toISOString()
              }
            })
            .setTextSelection({ from: to + 2, to: to + 2 }) // Clear selection after insertion
            .run();
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
            prompt: `Summarize the following text in 2-3 concise paragraphs, capturing the main points and key ideas:

${selectedText}

Provide only the summary without any introduction or explanation.`,
            timestamp: new Date(),
            options: {
              provider: 'gemini',
              temperature: 0.3,
              maxTokens: 200
            }
          });
          
          // Clear selection and insert AI suggestion block after the original selection
          const { from, to } = editor.state.selection;
          editor.chain()
            .focus()
            .insertContentAt(to + 1, {
              type: 'aiSuggestion',
              attrs: {
                originalText: selectedText,
                suggestedText: response.content,
                action: 'summarize',
                timestamp: new Date().toISOString()
              }
            })
            .setTextSelection({ from: to + 2, to: to + 2 }) // Clear selection after insertion
            .run();
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
      setIsExpanded(false);
      setIsVisible(false); // Hide after action
    } catch (error) {
      console.error('AI action failed:', error);
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
    }
  }, [editor, selectedText]);

  // Log render state for debugging

  if (!editor || !isVisible) {
    return null;
  }

  // Render toolbar as portal to document.body to avoid container clipping
  const toolbarElement = (
    <div
      ref={toolbarRef}
      className={cn(
        'custom-ai-toolbar fixed pointer-events-auto z-[9995]', // Lower z-index than TextMenu
        'overflow-visible will-change-transform',
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxWidth: 'min(320px, calc(100vw - 2rem))',
        minWidth: 'min(260px, calc(100vw - 2rem))',
        contain: 'none', // Prevent containment that could cause clipping
      }}
      data-surface={editor?.view?.dom?.getAttribute('data-surface')}
    >
      <div className="flex flex-col gap-2">
        {/* Connection indicator */}
        <div className="flex justify-center">
          <div className="w-6 h-1 rounded-full bg-[--border]"></div>
        </div>
        
        {/* Main toolbar */}
        <div
          className={cn(
            'ai-toolbar-surface flex items-center p-2 gap-1.5',
            // Solid card surface (non-transparent)
            'bg-[--card] text-[--card-foreground] border border-[--border]',
            'rounded-lg shadow-xl transition-all duration-200',
            'min-w-[280px] max-w-full w-max',
            'overflow-hidden'
          )}
        >
          {/* AI Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 rounded-md border border-[--border]">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">AI</span>
          </div>

          {/* Actions */}
          {availableActions.slice(0, 3).map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              buttonSize="iconSmall"
              onClick={() => executeAction(action)}
              disabled={isProcessing}
              className={cn(
                'relative transition-all duration-200 hover:bg-white/10',
                'h-8 w-8 rounded-md',
                activeAction === action.id && 'bg-white/15',
                isProcessing && activeAction !== action.id && 'opacity-50'
              )}
              title={action.description}
            >
              {activeAction === action.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="w-4 h-4">
                  {action.icon}
                </div>
              )}
            </Button>
          ))}

          {/* Close Button */}
          <div className="ml-2 border-l border-primary/30 pl-2">
            <Button
              variant="ghost"
              buttonSize="iconSmall"
              onClick={() => {
                setIsVisible(false);
                setIsExpanded(false);
                editor.commands.focus();
              }}
              className="h-8 w-8 rounded-md hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Character count */}
        {selectedText && (
          <div className="absolute -top-6 right-0 px-2 py-0.5 rounded-sm shadow-sm border border-[--border] bg-[--card] text-[--card-foreground] text-xs">
            {selectedText.length} chars
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render outside editor containers to prevent clipping
  return createPortal(toolbarElement, document.body);
};