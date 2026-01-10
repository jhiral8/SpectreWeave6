import { Extension } from '@tiptap/core'
import { Editor } from '@tiptap/react'

export interface ContextualPeekOptions {
  onPeek?: (characterName: string) => void
}

export interface ContextualPeekStorage {
  targetEditor: Editor | null
}

export const ContextualPeek = Extension.create<ContextualPeekOptions, ContextualPeekStorage>({
  name: 'contextualPeek',

  addOptions() {
    return {
      onPeek: undefined,
    }
  },

  addStorage() {
    return {
      targetEditor: null,
    }
  },

  onSelectionUpdate({ editor }) {
    const { onPeek } = this.options
    const { targetEditor } = this.storage
    
    if (!targetEditor || targetEditor.isDestroyed || !targetEditor.view) return

    const { from, to } = editor.state.selection
    if (from === to) return // No selection

    const text = editor.state.doc.textBetween(from, to, ' ')
    if (!text || text.trim().length < 2 || text.length > 50) return

    // Logic to find the character in the target editor
    // We look for characterProfile nodes with a matching name
    let found = false
    try {
      targetEditor.state.doc.descendants((node, pos) => {
        if (found) return false
        
        if (node.type.name === 'characterProfile') {
          const charName = node.attrs.name
          if (charName && text.toLowerCase().includes(charName.toLowerCase())) {
            // Found a match!
            found = true
            
            // Scroll the target editor to this position
            // Ensure view is still available and node is rendered
            const dom = targetEditor.view.nodeDOM(pos) as HTMLElement
            if (dom) {
              dom.scrollIntoView({ behavior: 'smooth', block: 'center' })
              
              // Highlight the block briefly
              dom.classList.add('peek-highlight')
              setTimeout(() => {
                if (dom && dom.classList) {
                  dom.classList.remove('peek-highlight')
                }
              }, 2000)
              
              if (onPeek) onPeek(charName)
            }
            return false
          }
        }
        return true
      })
    } catch (error) {
      console.error('ContextualPeek error:', error)
    }
  },
})
