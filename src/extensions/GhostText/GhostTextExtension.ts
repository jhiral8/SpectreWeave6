/**
 * TipTap Ghost Text Extension
 * 
 * Renders inline AI suggestions as semi-transparent "ghost text" 
 * at the cursor position, similar to GitHub Copilot.
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface GhostTextOptions {
  // The suggested text to display
  suggestion: string | null;
  // CSS class for the ghost text
  className: string;
  // Called when suggestion is accepted
  onAccept?: (text: string) => void;
  // Called when suggestion is dismissed
  onDismiss?: () => void;
}

export const ghostTextPluginKey = new PluginKey('ghostText');

export const GhostTextExtension = Extension.create<GhostTextOptions>({
  name: 'ghostText',

  addOptions() {
    return {
      suggestion: null,
      className: 'ghost-text-suggestion',
      onAccept: undefined,
      onDismiss: undefined,
    };
  },

  addProseMirrorPlugins() {
    const { options } = this;

    return [
      new Plugin({
        key: ghostTextPluginKey,
        
        state: {
          init() {
            return {
              suggestion: options.suggestion,
              decorations: DecorationSet.empty,
            };
          },
          
          apply(tr, pluginState, oldState, newState) {
            // Check for suggestion update via meta
            const meta = tr.getMeta(ghostTextPluginKey);
            if (meta !== undefined) {
              if (meta.suggestion === null) {
                return {
                  suggestion: null,
                  decorations: DecorationSet.empty,
                };
              }
              
              // Create decoration at cursor position
              const { from } = newState.selection;
              const widget = Decoration.widget(from, () => {
                const span = document.createElement('span');
                span.className = options.className;
                span.textContent = meta.suggestion;
                span.setAttribute('data-ghost-text', 'true');
                span.style.cssText = `
                  color: var(--ghost-text-color, #888);
                  opacity: var(--ghost-text-opacity, 0.5);
                  pointer-events: none;
                  user-select: none;
                `;
                return span;
              }, { side: 1 });
              
              return {
                suggestion: meta.suggestion,
                decorations: DecorationSet.create(newState.doc, [widget]),
              };
            }
            
            // Map decorations through document changes
            if (tr.docChanged || tr.selectionSet) {
              // Clear ghost text on any edit or cursor movement
              return {
                suggestion: null,
                decorations: DecorationSet.empty,
              };
            }
            
            return {
              ...pluginState,
              decorations: pluginState.decorations.map(tr.mapping, tr.doc),
            };
          },
        },
        
        props: {
          decorations(state) {
            return this.getState(state)?.decorations || DecorationSet.empty;
          },
          
          handleKeyDown(view, event) {
            const pluginState = this.getState(view.state);
            if (!pluginState?.suggestion) return false;
            
            // Tab to accept
            if (event.key === 'Tab' && !event.shiftKey) {
              event.preventDefault();
              const { suggestion } = pluginState;
              
              // Insert the suggestion
              view.dispatch(
                view.state.tr
                  .insertText(suggestion)
                  .setMeta(ghostTextPluginKey, { suggestion: null })
              );
              
              options.onAccept?.(suggestion);
              return true;
            }
            
            // Escape to dismiss
            if (event.key === 'Escape') {
              event.preventDefault();
              view.dispatch(
                view.state.tr.setMeta(ghostTextPluginKey, { suggestion: null })
              );
              options.onDismiss?.();
              return true;
            }
            
            // Ctrl/Cmd + Right to accept word
            if (event.key === 'ArrowRight' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              const { suggestion } = pluginState;
              const words = suggestion.split(/(\s+)/);
              const firstWord = words[0] + (words[1] || '');
              const remaining = words.slice(2).join('');
              
              view.dispatch(
                view.state.tr
                  .insertText(firstWord)
                  .setMeta(ghostTextPluginKey, { 
                    suggestion: remaining || null 
                  })
              );
              
              return true;
            }
            
            return false;
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      setGhostText: (text: string | null) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(ghostTextPluginKey, { suggestion: text });
          dispatch(tr);
        }
        return true;
      },
      
      acceptGhostText: () => ({ editor, tr, dispatch }) => {
        const pluginState = ghostTextPluginKey.getState(editor.state);
        if (!pluginState?.suggestion) return false;
        
        if (dispatch) {
          tr.insertText(pluginState.suggestion)
            .setMeta(ghostTextPluginKey, { suggestion: null });
          dispatch(tr);
          this.options.onAccept?.(pluginState.suggestion);
        }
        return true;
      },
      
      dismissGhostText: () => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(ghostTextPluginKey, { suggestion: null });
          dispatch(tr);
          this.options.onDismiss?.();
        }
        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.acceptGhostText(),
      Escape: () => this.editor.commands.dismissGhostText(),
    };
  },
});

// Helper to get current ghost text state
export function getGhostTextState(editor: any) {
  return ghostTextPluginKey.getState(editor.state);
}

// Type augmentation for TipTap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ghostText: {
      setGhostText: (text: string | null) => ReturnType;
      acceptGhostText: () => ReturnType;
      dismissGhostText: () => ReturnType;
    };
  }
}
