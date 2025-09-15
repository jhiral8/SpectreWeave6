/**
 * SpectreWeave Enhanced Editor
 * 
 * Complete editor implementation with all Phase 3.5 writing tools:
 * - Text selection toolbar
 * - Block handles and formatting
 * - Draggable block selector
 * - Enhanced slash commands
 * - Writing blocks (Author Style, Character Profile, Feedback)
 * - Research tools integration
 */

import React, { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { ExtensionKit } from '../../../extensions/extension-kit';
import { TextMenu } from '../../menus/TextMenu/TextMenu';
import { DraggableBlockSelector } from '../DraggableBlockSelector';
import { AIToolbar } from '../AIToolbar';
import { cn } from '../../../lib/utils';

interface SpectreWeaveEditorProps {
  content?: string;
  onUpdate?: (content: string) => void;
  onSave?: (content: string) => void;
  className?: string;
  placeholder?: string;
  enableAI?: boolean;
  enableResearch?: boolean;
  enableWritingTools?: boolean;
  projectId?: string;
  userId?: string;
  userName?: string;
  provider?: any; // HocuspocusProvider
  editable?: boolean;
}

export const SpectreWeaveEditor: React.FC<SpectreWeaveEditorProps> = ({
  content = '',
  onUpdate,
  onSave,
  className,
  placeholder = "Type '/' for commands...",
  enableAI = true,
  enableResearch = true,
  enableWritingTools = true,
  projectId,
  userId,
  userName = 'Writer',
  provider,
  editable = true,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: ExtensionKit({
      provider,
      userId,
      userName,
      enableAI,
      enableResearch,
      enableWritingTools,
      projectId,
    }),
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate?.(html);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full',
          className
        ),
        spellcheck: 'false',
      },
    },
  });


  // Save function with keyboard shortcut
  React.useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (onSave && editor) {
          onSave(editor.getHTML());
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, onSave]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500 dark:text-neutral-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Editor Container */}
      <div
        ref={editorRef}
        className={cn(
          'relative w-full min-h-[500px] p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg',
          'focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors',
          className
        )}
      >
        {/* Standard Text Menu for formatting */}
        <TextMenu editor={editor} />

        {/* AI Toolbar for selected text */}
        {enableAI && <AIToolbar editor={editor} />}

        {/* Block Selection and Handles */}
        <DraggableBlockSelector editor={editor} />

        {/* Main Editor */}
        <EditorContent 
          editor={editor} 
          className="focus:outline-none"
        />

        {/* Placeholder when empty */}
        {editor.isEmpty && (
          <div className="absolute top-8 left-8 text-neutral-400 dark:text-neutral-500 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Editor Status Bar */}
      <div className="flex items-center justify-between mt-4 px-2 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center space-x-4">
          <span>{editor.storage.characterCount?.characters() || 0} characters</span>
          <span>{editor.storage.characterCount?.words() || 0} words</span>
          {enableWritingTools && (
            <span className="text-green-600 dark:text-green-400">Writing tools enabled</span>
          )}
          {enableAI && (
            <span className="text-blue-600 dark:text-blue-400">AI features enabled</span>
          )}
          {enableResearch && (
            <span className="text-purple-600 dark:text-purple-400">Research tools enabled</span>
          )}
        </div>
        <div className="text-neutral-400 dark:text-neutral-500">
          Press Ctrl+S to save
        </div>
      </div>
    </div>
  );
};