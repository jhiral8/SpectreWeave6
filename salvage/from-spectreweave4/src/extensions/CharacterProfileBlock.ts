import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CharacterProfileComponent } from '../components/editor/CharacterProfileComponent';

export interface CharacterProfileOptions {
  HTMLAttributes: Record<string, any>;
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
      }) => ReturnType;
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
          return commands.insertContent({
            type: this.name,
            attrs: {
              name: '',
              description: '',
              traits: [],
              backstory: '',
              goals: '',
              conflicts: '',
              collapsed: false,
              ...attributes,
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