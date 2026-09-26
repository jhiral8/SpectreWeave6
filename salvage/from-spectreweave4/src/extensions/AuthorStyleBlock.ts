import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AuthorStyleComponent } from '../components/editor/AuthorStyleComponent';

export interface AuthorStyleBlockOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    authorStyleBlock: {
      /**
       * Insert an author style block
       */
      insertAuthorStyleBlock: (attributes?: {
        authorName?: string;
        genre?: string;
        styleDescription?: string;
        sampleText?: string;
        writingTips?: string[];
        collapsed?: boolean;
      }) => ReturnType;
    };
  }
}

export const AuthorStyleBlock = Node.create<AuthorStyleBlockOptions>({
  name: 'authorStyleBlock',

  group: 'block',

  content: 'block*',

  defining: true,

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      authorName: {
        default: '',
        parseHTML: element => element.getAttribute('data-author-name'),
        renderHTML: attributes => {
          if (!attributes.authorName) {
            return {};
          }
          return {
            'data-author-name': attributes.authorName,
          };
        },
      },
      genre: {
        default: '',
        parseHTML: element => element.getAttribute('data-genre'),
        renderHTML: attributes => {
          if (!attributes.genre) {
            return {};
          }
          return {
            'data-genre': attributes.genre,
          };
        },
      },
      styleDescription: {
        default: '',
        parseHTML: element => element.getAttribute('data-style-description'),
        renderHTML: attributes => {
          if (!attributes.styleDescription) {
            return {};
          }
          return {
            'data-style-description': attributes.styleDescription,
          };
        },
      },
      sampleText: {
        default: '',
        parseHTML: element => element.getAttribute('data-sample-text'),
        renderHTML: attributes => {
          if (!attributes.sampleText) {
            return {};
          }
          return {
            'data-sample-text': attributes.sampleText,
          };
        },
      },
      writingTips: {
        default: [],
        parseHTML: element => {
          const tips = element.getAttribute('data-writing-tips');
          return tips ? JSON.parse(tips) : [];
        },
        renderHTML: attributes => {
          if (!attributes.writingTips || attributes.writingTips.length === 0) {
            return {};
          }
          return {
            'data-writing-tips': JSON.stringify(attributes.writingTips),
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
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-author-style-block]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-author-style-block': '',
        class: 'author-style-block',
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AuthorStyleComponent);
  },

  addCommands() {
    return {
      insertAuthorStyleBlock:
        (attributes = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              authorName: '',
              genre: '',
              styleDescription: '',
              sampleText: '',
              writingTips: [],
              collapsed: false,
              timestamp: new Date().toISOString(),
              ...attributes,
            },
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-a': () => this.editor.commands.insertAuthorStyleBlock(),
    };
  },
});