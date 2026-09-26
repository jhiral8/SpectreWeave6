import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { SlashCommandsList } from '../components/editor/SlashCommandsList';

export interface SlashCommand {
  title: string;
  description: string;
  icon: string;
  command: ({ editor, range }: { editor: any; range: any }) => void;
  category: 'formatting' | 'blocks' | 'feedback' | 'ai' | 'writing';
}

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        pluginKey: new PluginKey('slashCommands'),
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const createSlashCommandsSuggestion = () => ({
  items: ({ query }: { query: string }) => {
    const commands: SlashCommand[] = [
      // Formatting Commands
      {
        title: 'Heading 1',
        description: 'Large section heading',
        icon: 'H1',
        category: 'formatting',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
        },
      },
      {
        title: 'Heading 2',
        description: 'Medium section heading',
        icon: 'H2',
        category: 'formatting',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
        },
      },
      {
        title: 'Heading 3',
        description: 'Small section heading',
        icon: 'H3',
        category: 'formatting',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
        },
      },
      {
        title: 'Bullet List',
        description: 'Create a bullet list',
        icon: 'List',
        category: 'formatting',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: 'Numbered List',
        description: 'Create a numbered list',
        icon: 'ListOrdered',
        category: 'formatting',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        title: 'Quote',
        description: 'Create a blockquote',
        icon: 'Quote',
        category: 'formatting',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
      },

      // Block Commands
      {
        title: 'Table',
        description: 'Insert a table',
        icon: 'Table',
        category: 'blocks',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
      },
      {
        title: 'Horizontal Rule',
        description: 'Insert a horizontal divider',
        icon: 'Minus',
        category: 'blocks',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
      },

      // Feedback Commands
      {
        title: 'AI Feedback',
        description: 'Add AI-generated feedback',
        icon: 'Bot',
        category: 'feedback',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertFeedbackBlock({ 
            type: 'ai-feedback', 
            content: 'AI feedback...',
            author: 'AI Assistant'
          }).run();
        },
      },
      {
        title: 'Editor Note',
        description: 'Add an editorial comment',
        icon: 'User',
        category: 'feedback',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertFeedbackBlock({ 
            type: 'editor-note', 
            content: 'Editor note...',
            author: 'Editor'
          }).run();
        },
      },
      {
        title: 'Character Note',
        description: 'Add character development notes',
        icon: 'Users',
        category: 'feedback',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertFeedbackBlock({ 
            type: 'character-note', 
            content: 'Character note...',
            author: 'Writer'
          }).run();
        },
      },
      {
        title: 'Plot Reminder',
        description: 'Add plot continuity reminders',
        icon: 'BookOpen',
        category: 'feedback',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertFeedbackBlock({ 
            type: 'plot-reminder', 
            content: 'Plot reminder...',
            author: 'Writer'
          }).run();
        },
      },
      {
        title: 'Revision Note',
        description: 'Mark sections for revision',
        icon: 'Edit3',
        category: 'feedback',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertFeedbackBlock({ 
            type: 'revision-note', 
            content: 'Revision note...',
            author: 'Writer'
          }).run();
        },
      },

      // AI-Powered Commands
      {
        title: 'Generate Content',
        description: 'Generate content with AI',
        icon: 'Zap',
        category: 'ai',
        command: ({ editor, range }) => {
          // This will be implemented when we integrate with the AI service
          editor.chain().focus().deleteRange(range).insertContent('Generating content...').run();
        },
      },
      {
        title: 'Rewrite Selection',
        description: 'Rewrite selected text with AI',
        icon: 'RefreshCw',
        category: 'ai',
        command: ({ editor, range }) => {
          // This will be implemented when we integrate with the AI service
          editor.chain().focus().deleteRange(range).insertContent('Rewriting...').run();
        },
      },
      {
        title: 'Summarize',
        description: 'Create a summary of the text',
        icon: 'FileText',
        category: 'ai',
        command: ({ editor, range }) => {
          // This will be implemented when we integrate with the AI service
          editor.chain().focus().deleteRange(range).insertContent('Summarizing...').run();
        },
      },

      // Writing-Specific Commands
      {
        title: 'Character Profile',
        description: 'Add character development sheet',
        icon: 'Users',
        category: 'writing',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertCharacterProfile({
            characterName: 'New Character',
            profileData: {}
          }).run();
        },
      },
      {
        title: 'Author Style Guide',
        description: 'Add author style reference',
        icon: 'User',
        category: 'writing',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertAuthorStyleBlock({
            authorName: 'Author Name',
            genre: '',
            styleDescription: '',
            sampleText: '',
            writingTips: []
          }).run();
        },
      },
      {
        title: 'Research Note',
        description: 'Add research references',
        icon: 'Search',
        category: 'writing',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertFeedbackBlock({ 
            type: 'editor-note', 
            content: 'Research: ',
            author: 'Research'
          }).run();
        },
      },
      {
        title: 'Todo',
        description: 'Add a todo item',
        icon: 'CheckSquare',
        category: 'writing',
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertFeedbackBlock({ 
            type: 'revision-note', 
            content: 'TODO: ',
            author: 'Writer'
          }).run();
        },
      },
    ];

    return commands.filter(command => 
      command.title.toLowerCase().includes(query.toLowerCase()) ||
      command.description.toLowerCase().includes(query.toLowerCase())
    );
  },

  render: () => {
    let component: ReactRenderer;
    let popup: any;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(SlashCommandsList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: any) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }

        return (component.ref as any)?.onKeyDown(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
});