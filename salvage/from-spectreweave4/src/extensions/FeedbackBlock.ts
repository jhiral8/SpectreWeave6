import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FeedbackBlockComponent } from '../components/editor/FeedbackBlockComponent';

export interface FeedbackBlockOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    feedbackBlock: {
      /**
       * Insert a feedback block
       */
      insertFeedbackBlock: (attributes?: {
        type?: 'ai-feedback' | 'editor-note' | 'character-note' | 'plot-reminder' | 'revision-note';
        content?: string;
        author?: string;
        timestamp?: string;
        resolved?: boolean;
        researchData?: any;
      }) => ReturnType;
    };
  }
}

export const FeedbackBlock = Node.create<FeedbackBlockOptions>({
  name: 'feedbackBlock',

  group: 'block',

  content: 'inline*',

  defining: true,

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      type: {
        default: 'ai-feedback',
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => {
          if (!attributes.type) {
            return {};
          }
          return {
            'data-type': attributes.type,
          };
        },
      },
      author: {
        default: 'AI Assistant',
        parseHTML: element => element.getAttribute('data-author'),
        renderHTML: attributes => {
          if (!attributes.author) {
            return {};
          }
          return {
            'data-author': attributes.author,
          };
        },
      },
      timestamp: {
        default: () => new Date().toISOString(),
        parseHTML: element => element.getAttribute('data-timestamp'),
        renderHTML: attributes => {
          if (!attributes.timestamp) {
            return {};
          }
          return {
            'data-timestamp': attributes.timestamp,
          };
        },
      },
      resolved: {
        default: false,
        parseHTML: element => element.getAttribute('data-resolved') === 'true',
        renderHTML: attributes => {
          return {
            'data-resolved': attributes.resolved ? 'true' : 'false',
          };
        },
      },
      collapsed: {
        default: false,
        parseHTML: element => element.getAttribute('data-collapsed') === 'true',
        renderHTML: attributes => {
          return {
            'data-collapsed': attributes.collapsed ? 'true' : 'false',
          };
        },
      },
      researchData: {
        default: null,
        parseHTML: element => {
          const data = element.getAttribute('data-research');
          return data ? JSON.parse(data) : null;
        },
        renderHTML: attributes => {
          if (!attributes.researchData) {
            return {};
          }
          return {
            'data-research': JSON.stringify(attributes.researchData),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-feedback-block]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-feedback-block': '',
        class: 'feedback-block',
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FeedbackBlockComponent);
  },

  addCommands() {
    return {
      insertFeedbackBlock:
        (attributes = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              type: 'ai-feedback',
              author: 'AI Assistant',
              timestamp: new Date().toISOString(),
              resolved: false,
              collapsed: false,
              researchData: null,
              ...attributes,
            },
            content: attributes.content ? [{ type: 'text', text: attributes.content }] : [],
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-f': () => this.editor.commands.insertFeedbackBlock(),
    };
  },
});