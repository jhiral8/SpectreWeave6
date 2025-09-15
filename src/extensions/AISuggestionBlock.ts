import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import AISuggestionComponent from '../components/editor/AISuggestionComponent'

export interface AISuggestionAttributes {
  originalText: string
  suggestedText: string
  action: 'improve' | 'rewrite' | 'summarize'
  timestamp: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiSuggestion: {
      setAISuggestion: (attributes: AISuggestionAttributes) => ReturnType
    }
  }
}

export const AISuggestionBlock = Node.create({
  name: 'aiSuggestion',
  
  group: 'block',
  
  atom: true,
  
  addAttributes() {
    return {
      originalText: {
        default: '',
      },
      suggestedText: {
        default: '',
      },
      action: {
        default: 'improve',
      },
      timestamp: {
        default: new Date().toISOString(),
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="ai-suggestion"]',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'ai-suggestion' })]
  },
  
  addCommands() {
    return {
      setAISuggestion:
        (attributes: AISuggestionAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          })
        },
    }
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(AISuggestionComponent)
  },
})