import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AuthorStyleComponent } from './components/AuthorStyleComponent';

export interface AuthorStyleBlockOptions {
  HTMLAttributes: Record<string, any>;
  enableAI?: boolean;
  enableStyleAnalysis?: boolean;
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
        styleMetrics?: Record<string, any>;
        aiAnalysis?: string;
        lastAnalysis?: string;
        confidence?: number;
      }) => ReturnType;
      analyzeAuthorStyle: (styleId: string, content?: string) => ReturnType;
      applyStyleToSelection: (styleId: string) => ReturnType;
      generateStyleSuggestions: (styleId: string) => ReturnType;
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
      enableAI: true,
      enableStyleAnalysis: true,
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
      styleId: {
        default: () => `style_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        parseHTML: element => element.getAttribute('data-style-id'),
        renderHTML: attributes => {
          if (!attributes.styleId) {
            return {};
          }
          return {
            'data-style-id': attributes.styleId,
          };
        },
      },
      styleMetrics: {
        default: {},
        parseHTML: element => {
          const metrics = element.getAttribute('data-style-metrics');
          return metrics ? JSON.parse(metrics) : {};
        },
        renderHTML: attributes => {
          if (!attributes.styleMetrics || Object.keys(attributes.styleMetrics).length === 0) {
            return {};
          }
          return {
            'data-style-metrics': JSON.stringify(attributes.styleMetrics),
          };
        },
      },
      aiAnalysis: {
        default: '',
        parseHTML: element => element.getAttribute('data-ai-analysis'),
        renderHTML: attributes => {
          if (!attributes.aiAnalysis) {
            return {};
          }
          return {
            'data-ai-analysis': attributes.aiAnalysis,
          };
        },
      },
      lastAnalysis: {
        default: '',
        parseHTML: element => element.getAttribute('data-last-analysis'),
        renderHTML: attributes => {
          if (!attributes.lastAnalysis) {
            return {};
          }
          return {
            'data-last-analysis': attributes.lastAnalysis,
          };
        },
      },
      confidence: {
        default: 0,
        parseHTML: element => {
          const conf = element.getAttribute('data-confidence');
          return conf ? parseFloat(conf) : 0;
        },
        renderHTML: attributes => {
          if (!attributes.confidence) {
            return {};
          }
          return {
            'data-confidence': attributes.confidence.toString(),
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
          const styleId = `style_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          return commands.insertContent({
            type: this.name,
            attrs: {
              styleId,
              authorName: '',
              genre: '',
              styleDescription: '',
              sampleText: '',
              writingTips: [],
              collapsed: false,
              timestamp: new Date().toISOString(),
              styleMetrics: {},
              aiAnalysis: '',
              lastAnalysis: '',
              confidence: 0,
              ...attributes,
            },
          });
        },
      analyzeAuthorStyle:
        (styleId: string, content?: string) =>
        ({ editor, state }) => {
          if (!this.options.enableStyleAnalysis) return false;

          let styleNode: any = null;
          state.doc.descendants((node: any) => {
            if (node.type.name === this.name && node.attrs.styleId === styleId) {
              styleNode = node;
              return false; // Stop traversal
            }
          });
          if (!styleNode) return false;

          // Get content to analyze
          let textToAnalyze = content;
          if (!textToAnalyze) {
            // Use selection or entire document
            const selection = state.selection;
            textToAnalyze = selection.empty 
              ? state.doc.textContent 
              : state.doc.textBetween(selection.from, selection.to);
          }

          // Trigger AI analysis using SpectreWeave5 AI system
          if (this.options.enableAI && textToAnalyze.trim().length > 50) {
            // Trigger AI style analysis
            const event = new CustomEvent('author-style-analysis-request', {
              detail: {
                styleId: styleNode.attrs.styleId,
                styleData: styleNode.attrs,
                content: textToAnalyze,
                timestamp: new Date().toISOString(),
              },
            });
            window.dispatchEvent(event);
          }

          return true;
        },
      applyStyleToSelection:
        (styleId: string) =>
        ({ editor, state, dispatch }) => {
          let styleNode: any = null;
          state.doc.descendants((node: any) => {
            if (node.type.name === this.name && node.attrs.styleId === styleId) {
              styleNode = node;
              return false; // Stop traversal
            }
          });
          if (!styleNode) return false;

          // Apply style guidance to selected text
          const selection = state.selection;
          if (selection.empty) return false;

          // This would typically involve applying style transforms
          // For now, we'll trigger a style application event
          const event = new CustomEvent('author-style-apply', {
            detail: {
              styleId,
              styleData: styleNode.attrs,
              selection: {
                from: selection.from,
                to: selection.to,
                text: state.doc.textBetween(selection.from, selection.to),
              },
            },
          });
          window.dispatchEvent(event);

          return true;
        },
      generateStyleSuggestions:
        (styleId: string) =>
        ({ editor, state }) => {
          let styleNode: any = null;
          state.doc.descendants((node: any) => {
            if (node.type.name === this.name && node.attrs.styleId === styleId) {
              styleNode = node;
              return false; // Stop traversal
            }
          });
          if (!styleNode) return false;

          if (this.options.enableAI) {
            // Trigger AI style suggestions
            const event = new CustomEvent('author-style-suggestion-request', {
              detail: {
                styleId: styleNode.attrs.styleId,
                styleData: styleNode.attrs,
              },
            });
            window.dispatchEvent(event);
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-a': () => this.editor.commands.insertAuthorStyleBlock(),
      'Mod-Alt-a': () => {
        // Analyze current selection with the first available style block
        const state = this.editor.state;
        let firstStyleId: string | null = null;
        
        state.doc.descendants((node: any) => {
          if (node.type.name === this.name && !firstStyleId) {
            firstStyleId = node.attrs.styleId;
            return false;
          }
        });
        
        if (firstStyleId) {
          return this.editor.commands.analyzeAuthorStyle(firstStyleId);
        }
        return false;
      },
    };
  },
});