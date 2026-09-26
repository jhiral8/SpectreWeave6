import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface BlockWrapperOptions {
  types: string[];
}

export const BlockWrapper = Extension.create<BlockWrapperOptions>({
  name: 'blockWrapper',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote', 'feedbackBlock', 'characterProfile', 'authorStyleBlock'],
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockWrapper'),
        
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const { doc, selection } = state;
            
            doc.descendants((node, pos) => {
              if (this.options.types.includes(node.type.name)) {
                // Add block wrapper decoration
                const decoration = Decoration.widget(pos, () => {
                  const wrapper = document.createElement('div');
                  wrapper.className = 'block-wrapper';
                  wrapper.setAttribute('data-block-type', node.type.name);
                  
                  // Add hover effect
                  wrapper.addEventListener('mouseenter', () => {
                    wrapper.classList.add('block-hovered');
                  });
                  
                  wrapper.addEventListener('mouseleave', () => {
                    wrapper.classList.remove('block-hovered');
                  });
                  
                  return wrapper;
                }, {
                  side: -1,
                  key: `block-wrapper-${pos}`,
                });
                
                decorations.push(decoration);
              }
            });
            
            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          'data-block-id': {
            default: null,
            parseHTML: element => element.getAttribute('data-block-id'),
            renderHTML: attributes => {
              if (!attributes['data-block-id']) {
                return {};
              }
              return {
                'data-block-id': attributes['data-block-id'],
              };
            },
          },
        },
      },
    ];
  },
});