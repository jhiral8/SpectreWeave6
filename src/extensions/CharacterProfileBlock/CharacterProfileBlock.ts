import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CharacterProfileComponent } from './components/CharacterProfileComponent';

export interface CharacterProfileOptions {
  HTMLAttributes: Record<string, any>;
  enableAI?: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    characterProfile: {
      /**
       * Insert a character profile block
       */
      insertCharacterProfile: (attributes?: {
        name?: string;
        description?: string;
        traits?: string[];
        backstory?: string;
        goals?: string;
        conflicts?: string;
        relationships?: string;
        development?: string;
        notes?: string;
        avatar?: string;
        aiSuggestions?: string[];
        lastAIUpdate?: string;
      }) => ReturnType;
      generateCharacterSuggestions: (characterId: string) => ReturnType;
      exportCharacterData: (characterId: string) => ReturnType;
      importCharacterData: (data: any) => ReturnType;
    };
  }
}

export const CharacterProfileBlock = Node.create<CharacterProfileOptions>({
  name: 'characterProfile',

  group: 'block',

  content: 'block*',

  defining: true,

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      enableAI: true,
    };
  },

  addAttributes() {
    return {
      name: {
        default: '',
        parseHTML: element => element.getAttribute('data-name'),
        renderHTML: attributes => {
          if (!attributes.name) {
            return {};
          }
          return {
            'data-name': attributes.name,
          };
        },
      },
      description: {
        default: '',
        parseHTML: element => element.getAttribute('data-description'),
        renderHTML: attributes => {
          if (!attributes.description) {
            return {};
          }
          return {
            'data-description': attributes.description,
          };
        },
      },
      traits: {
        default: [],
        parseHTML: element => {
          const traits = element.getAttribute('data-traits');
          return traits ? JSON.parse(traits) : [];
        },
        renderHTML: attributes => {
          if (!attributes.traits || attributes.traits.length === 0) {
            return {};
          }
          return {
            'data-traits': JSON.stringify(attributes.traits),
          };
        },
      },
      backstory: {
        default: '',
        parseHTML: element => element.getAttribute('data-backstory'),
        renderHTML: attributes => {
          if (!attributes.backstory) {
            return {};
          }
          return {
            'data-backstory': attributes.backstory,
          };
        },
      },
      goals: {
        default: '',
        parseHTML: element => element.getAttribute('data-goals'),
        renderHTML: attributes => {
          if (!attributes.goals) {
            return {};
          }
          return {
            'data-goals': attributes.goals,
          };
        },
      },
      conflicts: {
        default: '',
        parseHTML: element => element.getAttribute('data-conflicts'),
        renderHTML: attributes => {
          if (!attributes.conflicts) {
            return {};
          }
          return {
            'data-conflicts': attributes.conflicts,
          };
        },
      },
      relationships: {
        default: '',
        parseHTML: element => element.getAttribute('data-relationships'),
        renderHTML: attributes => {
          if (!attributes.relationships) {
            return {};
          }
          return {
            'data-relationships': attributes.relationships,
          };
        },
      },
      development: {
        default: '',
        parseHTML: element => element.getAttribute('data-development'),
        renderHTML: attributes => {
          if (!attributes.development) {
            return {};
          }
          return {
            'data-development': attributes.development,
          };
        },
      },
      notes: {
        default: '',
        parseHTML: element => element.getAttribute('data-notes'),
        renderHTML: attributes => {
          if (!attributes.notes) {
            return {};
          }
          return {
            'data-notes': attributes.notes,
          };
        },
      },
      avatar: {
        default: '',
        parseHTML: element => element.getAttribute('data-avatar'),
        renderHTML: attributes => {
          if (!attributes.avatar) {
            return {};
          }
          return {
            'data-avatar': attributes.avatar,
          };
        },
      },
      aiSuggestions: {
        default: [],
        parseHTML: element => {
          const suggestions = element.getAttribute('data-ai-suggestions');
          return suggestions ? JSON.parse(suggestions) : [];
        },
        renderHTML: attributes => {
          if (!attributes.aiSuggestions || attributes.aiSuggestions.length === 0) {
            return {};
          }
          return {
            'data-ai-suggestions': JSON.stringify(attributes.aiSuggestions),
          };
        },
      },
      lastAIUpdate: {
        default: '',
        parseHTML: element => element.getAttribute('data-last-ai-update'),
        renderHTML: attributes => {
          if (!attributes.lastAIUpdate) {
            return {};
          }
          return {
            'data-last-ai-update': attributes.lastAIUpdate,
          };
        },
      },
      characterId: {
        default: () => `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        parseHTML: element => element.getAttribute('data-character-id'),
        renderHTML: attributes => {
          if (!attributes.characterId) {
            return {};
          }
          return {
            'data-character-id': attributes.characterId,
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
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-character-profile]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-character-profile': '',
        class: 'character-profile-block',
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CharacterProfileComponent);
  },

  addCommands() {
    return {
      insertCharacterProfile:
        (attributes = {}) =>
        ({ commands }) => {
          const characterId = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          return commands.insertContent({
            type: this.name,
            attrs: {
              characterId,
              name: '',
              description: '',
              traits: [],
              backstory: '',
              goals: '',
              conflicts: '',
              relationships: '',
              development: '',
              notes: '',
              avatar: '',
              aiSuggestions: [],
              lastAIUpdate: '',
              collapsed: false,
              ...attributes,
            },
          });
        },
      generateCharacterSuggestions:
        (characterId: string) =>
        ({ editor, state }) => {
          // Find the character block by ID
          let characterNode: any = null;
          state.doc.descendants((node: any) => {
            if (node.type.name === this.name && node.attrs.characterId === characterId) {
              characterNode = node;
              return false; // Stop traversal
            }
          });
          if (!characterNode) return false;

          // Trigger AI suggestion generation
          if (this.options.enableAI) {
            // Trigger AI character suggestions
            const event = new CustomEvent('character-ai-suggestion-request', {
              detail: {
                characterId: characterNode.attrs.characterId,
                characterData: characterNode.attrs,
              },
            });
            window.dispatchEvent(event);
          }
          
          return true;
        },
      exportCharacterData:
        (characterId: string) =>
        ({ state }) => {
          let characterNode: any = null;
          state.doc.descendants((node: any) => {
            if (node.type.name === this.name && node.attrs.characterId === characterId) {
              characterNode = node;
              return false; // Stop traversal
            }
          });
          if (!characterNode) return false;

          const data = {
            id: characterNode.attrs.characterId,
            name: characterNode.attrs.name,
            description: characterNode.attrs.description,
            traits: characterNode.attrs.traits,
            backstory: characterNode.attrs.backstory,
            goals: characterNode.attrs.goals,
            conflicts: characterNode.attrs.conflicts,
            relationships: characterNode.attrs.relationships,
            development: characterNode.attrs.development,
            notes: characterNode.attrs.notes,
            avatar: characterNode.attrs.avatar,
            exportDate: new Date().toISOString(),
          };

          // Trigger download
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `character_${data.name || 'unnamed'}_${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          return true;
        },
      importCharacterData:
        (data: any) =>
        ({ commands }) => {
          if (!data || typeof data !== 'object') return false;

          return commands.insertContent({
            type: this.name,
            attrs: {
              characterId: data.id || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: data.name || '',
              description: data.description || '',
              traits: Array.isArray(data.traits) ? data.traits : [],
              backstory: data.backstory || '',
              goals: data.goals || '',
              conflicts: data.conflicts || '',
              relationships: data.relationships || '',
              development: data.development || '',
              notes: data.notes || '',
              avatar: data.avatar || '',
              aiSuggestions: [],
              lastAIUpdate: '',
              collapsed: false,
            },
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-c': () => this.editor.commands.insertCharacterProfile(),
    };
  },
});