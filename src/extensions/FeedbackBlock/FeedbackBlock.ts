import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FeedbackBlockComponent } from './components/FeedbackBlockComponent';

export interface FeedbackBlockOptions {
  HTMLAttributes: Record<string, any>;
  onResolve?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<any>) => void;
}

export type FeedbackBlockType = 
  | 'ai-feedback' 
  | 'editor-note' 
  | 'character-note' 
  | 'plot-reminder' 
  | 'revision-note'
  | 'grammar'
  | 'style'
  | 'consistency'
  | 'pacing';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    feedbackBlock: {
      /**
       * Insert a feedback block
       */
      insertFeedbackBlock: (attributes?: {
        type?: FeedbackBlockType;
        content?: string;
        author?: string;
        timestamp?: string;
        resolved?: boolean;
        severity?: 'info' | 'suggestion' | 'warning' | 'error';
        suggestions?: string[];
        position?: { start: number; end: number };
        metadata?: Record<string, any>;
      }) => ReturnType;
      
      /**
       * Update a feedback block
       */
      updateFeedbackBlock: (id: string, attributes: Record<string, any>) => ReturnType;
      
      /**
       * Remove a feedback block
       */
      removeFeedbackBlock: (id: string) => ReturnType;
      
      /**
       * Toggle feedback block resolved status
       */
      toggleFeedbackResolved: (id: string) => ReturnType;
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
      onResolve: undefined,
      onDelete: undefined,
      onUpdate: undefined,
    };
  },

  addAttributes() {
    return {
      id: {
        default: () => `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          return {
            'data-id': attributes.id,
          };
        },
      },
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
      severity: {
        default: 'suggestion',
        parseHTML: element => element.getAttribute('data-severity') || 'suggestion',
        renderHTML: attributes => {
          return {
            'data-severity': attributes.severity || 'suggestion',
          };
        },
      },
      suggestions: {
        default: [],
        parseHTML: element => {
          const data = element.getAttribute('data-suggestions');
          return data ? JSON.parse(data) : [];
        },
        renderHTML: attributes => {
          if (!attributes.suggestions || attributes.suggestions.length === 0) {
            return {};
          }
          return {
            'data-suggestions': JSON.stringify(attributes.suggestions),
          };
        },
      },
      position: {
        default: null,
        parseHTML: element => {
          const data = element.getAttribute('data-position');
          return data ? JSON.parse(data) : null;
        },
        renderHTML: attributes => {
          if (!attributes.position) {
            return {};
          }
          return {
            'data-position': JSON.stringify(attributes.position),
          };
        },
      },
      metadata: {
        default: {},
        parseHTML: element => {
          const data = element.getAttribute('data-metadata');
          return data ? JSON.parse(data) : {};
        },
        renderHTML: attributes => {
          if (!attributes.metadata || Object.keys(attributes.metadata).length === 0) {
            return {};
          }
          return {
            'data-metadata': JSON.stringify(attributes.metadata),
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
              id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'ai-feedback',
              author: 'AI Assistant',
              timestamp: new Date().toISOString(),
              resolved: false,
              collapsed: false,
              severity: 'suggestion',
              suggestions: [],
              position: null,
              metadata: {},
              ...attributes,
            },
            content: attributes.content ? [{ type: 'text', text: attributes.content }] : [],
          });
        },
      
      updateFeedbackBlock:
        (id: string, attributes: Record<string, any>) =>
        ({ commands, state }) => {
          let found = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'feedbackBlock' && node.attrs.id === id) {
              found = true;
              commands.updateAttributes('feedbackBlock', attributes);
              return false; // Stop searching
            }
          });
          return found;
        },
      
      removeFeedbackBlock:
        (id: string) =>
        ({ commands, state }) => {
          let found = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'feedbackBlock' && node.attrs.id === id) {
              found = true;
              commands.deleteRange({ from: pos, to: pos + node.nodeSize });
              return false; // Stop searching
            }
          });
          return found;
        },
      
      toggleFeedbackResolved:
        (id: string) =>
        ({ commands, state }) => {
          let found = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'feedbackBlock' && node.attrs.id === id) {
              found = true;
              commands.updateAttributes('feedbackBlock', { resolved: !node.attrs.resolved });
              return false; // Stop searching
            }
          });
          return found;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-f': () => this.editor.commands.insertFeedbackBlock(),
    };
  },
});