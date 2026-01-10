/**
 * AI Writing Surface Component
 * 
 * An enhanced TipTap editor with integrated AI features:
 * - Ghost text suggestions
 * - Inline agent triggers
 * - Selection-based AI actions
 * - Real-time style analysis
 */

'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  Wand2, 
  RefreshCw,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';

// Extensions
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { GhostTextExtension } from '@/extensions/GhostText';
import { useGhostTextTrigger } from '@/extensions/GhostText/useGhostTextTrigger';

// IDE Integration
import { useAgents } from '@/components/IDE/AIAgents/context/AgentContext';
import type { AgentId } from '@/components/IDE/AIAgents/types';

interface AIWritingSurfaceProps {
  // Initial content
  content?: string;
  // Content change handler
  onContentChange?: (content: string) => void;
  // Selection change handler for AI context
  onSelectionChange?: (selection: { selectedText: string; cursorPosition: number }) => void;
  // Callback to get editor manipulation functions
  onEditorReady?: (fns: { 
    insertText: (text: string) => void;
    replaceSelection: (text: string) => void;
  }) => void;
  // Placeholder text
  placeholder?: string;
  // Story context for AI
  chapterTitle?: string;
  sceneName?: string;
  characters?: string[];
  locations?: string[];
  // AI settings
  enableGhostText?: boolean;
  enableInlineAgents?: boolean;
  ghostTextDelay?: number;
  // Styling
  className?: string;
  editorClassName?: string;
}

export const AIWritingSurface: React.FC<AIWritingSurfaceProps> = ({
  content = '',
  onContentChange,
  onSelectionChange,
  onEditorReady,
  placeholder = 'Start writing your story...',
  chapterTitle,
  sceneName,
  characters = [],
  locations = [],
  enableGhostText = true,
  enableInlineAgents = true,
  ghostTextDelay = 2000,
  className,
  editorClassName,
}) => {
  const { runAgent } = useAgents();
  const [showAgentResult, setShowAgentResult] = useState(false);
  const [agentResult, setAgentResult] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionCoords, setSelectionCoords] = useState<{ top: number; left: number } | null>(null);

  // Create editor with extensions
  const editor = useEditor({
    // Required for SSR - prevents hydration mismatches in Next.js
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Configure heading levels for chapters/scenes
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount,
      GhostTextExtension.configure({
        onAccept: (text) => {
          console.log('Ghost text accepted:', text.slice(0, 50) + '...');
        },
        onDismiss: () => {
          console.log('Ghost text dismissed');
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-invert max-w-none w-full',
          'focus:outline-none',
          'min-h-full p-4',
          'text-[14px] leading-relaxed',
          editorClassName
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onContentChange?.(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to, empty } = editor.state.selection;
      if (!empty) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        setSelectedText(text);
        
        // Get selection coordinates for floating menu
        const coords = editor.view.coordsAtPos(from);
        setSelectionCoords({ top: coords.top, left: coords.left });
        
        // Notify parent of selection change
        onSelectionChange?.({ selectedText: text, cursorPosition: from });
      } else {
        setSelectedText('');
        setSelectionCoords(null);
        
        // Still notify parent of cursor position even without selection
        onSelectionChange?.({ selectedText: '', cursorPosition: from });
      }
    },
  });

  // Store a stable reference to the editor for external access
  const editorRef = useRef<Editor | null>(null);
  editorRef.current = editor;

  // Expose editor functions to parent when editor is ready
  // These functions ALWAYS use the current editor state, not stale closures
  useEffect(() => {
    if (editor && onEditorReady) {
      const insertText = (text: string) => {
        const currentEditor = editorRef.current;
        if (!currentEditor) {
          console.error('AIWritingSurface: No editor available for insertText');
          return;
        }
        
        // Get current cursor position
        const { from } = currentEditor.state.selection;
        console.log('AIWritingSurface.insertText:', { position: from, textLength: text.length });
        
        // Insert text at current cursor position
        currentEditor.chain().focus().insertContent(text).run();
      };
      
      const replaceSelection = (text: string) => {
        const currentEditor = editorRef.current;
        if (!currentEditor) {
          console.error('AIWritingSurface: No editor available for replaceSelection');
          return;
        }
        
        // Get CURRENT selection state (not stale from closure)
        const { from, to, empty } = currentEditor.state.selection;
        console.log('AIWritingSurface.replaceSelection:', { from, to, empty, textLength: text.length });
        
        if (empty) {
          // No selection - just insert at cursor
          console.log('No selection, inserting at cursor position:', from);
          currentEditor.chain().focus().insertContent(text).run();
        } else {
          // Has selection - replace it
          console.log('Replacing selection from', from, 'to', to);
          currentEditor.chain()
            .focus()
            .deleteRange({ from, to })
            .insertContentAt(from, text)
            .run();
        }
      };
      
      onEditorReady({ insertText, replaceSelection });
    }
  }, [editor, onEditorReady]);

  // Ghost text generation function
  const generateGhostText = useCallback(async (context: { before: string; after: string }) => {
    // Use the Ghost Writer agent to generate continuation
    try {
      const result = await runAgent('ghost-writer', {
        content: context.before.slice(-500), // Last 500 chars
        context: {
          chapter: chapterTitle,
          scene: sceneName,
          characters,
          previousText: context.before.slice(-1000),
          followingText: context.after.slice(0, 200),
        },
      });
      
      if (result?.content) {
        // Clean up the result - take first sentence or paragraph
        const cleaned = result.content
          .split(/[.!?]\s/)[0] // Take first sentence
          .trim();
        return cleaned + (cleaned.endsWith('.') ? '' : '.');
      }
      return '';
    } catch (error) {
      console.error('Ghost text generation failed:', error);
      return '';
    }
  }, [runAgent, chapterTitle, sceneName, characters]);

  // Ghost text trigger hook
  const ghostText = useGhostTextTrigger({
    editor,
    generateText: generateGhostText,
    delay: ghostTextDelay,
    autoTrigger: enableGhostText,
    minChars: 50,
    triggerPhrases: ['...', '—', '" ', '\n\n', 'and then', 'suddenly'],
  });

  // Run an agent on selected text
  const runAgentOnSelection = useCallback(async (agentId: AgentId) => {
    if (!selectedText || !editor) return;

    setShowAgentResult(true);
    setAgentResult(null);

    try {
      const result = await runAgent(agentId, {
        content: selectedText,
        context: {
          chapter: chapterTitle,
          scene: sceneName,
          characters,
        },
      });

      if (result?.content) {
        setAgentResult(result.content);
      }
    } catch (error) {
      console.error('Agent failed:', error);
      setAgentResult('Failed to generate. Please try again.');
    }
  }, [selectedText, editor, runAgent, chapterTitle, sceneName, characters]);

  // Insert agent result into editor
  const insertAgentResult = useCallback(() => {
    if (!editor || !agentResult) return;

    const { from, to } = editor.state.selection;
    
    editor.chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(agentResult)
      .run();

    setShowAgentResult(false);
    setAgentResult(null);
  }, [editor, agentResult]);

  // Replace selection with agent result
  const replaceWithAgentResult = useCallback(() => {
    insertAgentResult();
  }, [insertAgentResult]);

  // Dismiss agent result
  const dismissAgentResult = useCallback(() => {
    setShowAgentResult(false);
    setAgentResult(null);
  }, []);

  // Word count
  const wordCount = editor?.storage.characterCount.words() || 0;
  const charCount = editor?.storage.characterCount.characters() || 0;

  return (
    <div className={cn('ai-writing-surface h-full flex flex-col', className)}>
      {/* Editor Content - full height, no decorations */}
      <div className="flex-1 overflow-auto">
        <EditorContent 
          editor={editor}
          className={cn(
            'h-full w-full',
            'bg-[--ide-editor-bg] text-[--ide-foreground]',
            '[&_.is-editor-empty]:before:content-[attr(data-placeholder)]',
            '[&_.is-editor-empty]:before:text-[--ide-foreground-muted]',
            '[&_.is-editor-empty]:before:float-left',
            '[&_.is-editor-empty]:before:h-0',
            '[&_.is-editor-empty]:before:pointer-events-none',
          )}
        />
      </div>

      {/* Selection Floating Menu - only show when text selected */}
      {selectedText && selectionCoords && enableInlineAgents && !showAgentResult && (
        <SelectionMenu
          coords={selectionCoords}
          onAction={runAgentOnSelection}
          selectedText={selectedText}
        />
      )}

      {/* Agent Result Panel */}
      {showAgentResult && (
        <AgentResultFloating
          result={agentResult}
          isLoading={!agentResult}
          onInsert={insertAgentResult}
          onReplace={replaceWithAgentResult}
          onDismiss={dismissAgentResult}
        />
      )}
    </div>
  );
};

// Selection Menu Component
interface SelectionMenuProps {
  coords: { top: number; left: number };
  onAction: (agentId: AgentId) => void;
  selectedText: string;
}

const SelectionMenu: React.FC<SelectionMenuProps> = ({
  coords,
  onAction,
  selectedText,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const quickActions: { id: AgentId; label: string; icon: React.ReactNode }[] = [
    { id: 'ghost-writer', label: 'Improve', icon: <Wand2 className="w-3 h-3" /> },
    { id: 'style-coach', label: 'Analyze', icon: <Sparkles className="w-3 h-3" /> },
    { id: 'dialogue-master', label: 'Dialogue', icon: <span className="text-xs">"</span> },
  ];

  const wordCount = selectedText.split(/\s+/).length;

  return (
    <div
      className={cn(
        'fixed z-50 animate-fade-in',
        'bg-[--ide-tooltip-bg] border border-[--ide-border]',
        'rounded-lg shadow-lg overflow-hidden'
      )}
      style={{
        top: coords.top - 50,
        left: coords.left,
      }}
    >
      <div className="flex items-center gap-1 p-1">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-xs',
              'text-[--ide-foreground]',
              'hover:bg-[--ide-list-hover-bg] transition-colors'
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'p-1 rounded',
            'text-[--ide-activitybar-inactive]',
            'hover:bg-[--ide-list-hover-bg]'
          )}
        >
          <ChevronDown className={cn(
            'w-3 h-3 transition-transform',
            isExpanded && 'rotate-180'
          )} />
        </button>
      </div>
      
      {isExpanded && (
        <div className="border-t border-[--ide-border] p-2">
          <div className="text-[10px] text-[--ide-activitybar-inactive] mb-1">
            {wordCount} words selected
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => onAction('character-keeper')}
              className="text-xs px-2 py-1 rounded hover:bg-[--ide-list-hover-bg] text-left"
            >
              Check Characters
            </button>
            <button
              onClick={() => onAction('plot-analyst')}
              className="text-xs px-2 py-1 rounded hover:bg-[--ide-list-hover-bg] text-left"
            >
              Analyze Plot
            </button>
            <button
              onClick={() => onAction('world-builder')}
              className="text-xs px-2 py-1 rounded hover:bg-[--ide-list-hover-bg] text-left"
            >
              World Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Agent Result Floating Panel
interface AgentResultFloatingProps {
  result: string | null;
  isLoading: boolean;
  onInsert: () => void;
  onReplace: () => void;
  onDismiss: () => void;
}

const AgentResultFloating: React.FC<AgentResultFloatingProps> = ({
  result,
  isLoading,
  onInsert,
  onReplace,
  onDismiss,
}) => {
  return (
    <div className={cn(
      'fixed bottom-20 left-1/2 -translate-x-1/2 z-50',
      'w-[500px] max-w-[90vw]',
      'bg-[--ide-sidebar-bg] border border-[--ide-border]',
      'rounded-lg shadow-xl overflow-hidden',
      'animate-slide-up'
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-3 py-2',
        'bg-[--ide-input-bg] border-b border-[--ide-border]'
      )}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[--ide-ai-accent]" />
          <span className="text-sm font-medium">AI Suggestion</span>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-[--ide-list-hover-bg]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-3 max-h-[200px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-[--ide-activitybar-inactive]">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Generating...
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{result}</p>
        )}
      </div>
      
      {/* Actions */}
      {!isLoading && result && (
        <div className="flex items-center gap-2 p-2 border-t border-[--ide-border]">
          <button
            onClick={onReplace}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium',
              'bg-[--ide-activitybar-badge] text-white',
              'hover:opacity-90 transition-opacity'
            )}
          >
            <Check className="w-3.5 h-3.5" />
            Replace
          </button>
          <button
            onClick={onDismiss}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs',
              'text-[--ide-foreground]',
              'hover:bg-[--ide-list-hover-bg]'
            )}
          >
            <X className="w-3.5 h-3.5" />
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default AIWritingSurface;
