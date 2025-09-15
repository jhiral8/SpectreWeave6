import React from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { Check, X, Sparkles, RefreshCw, FileText } from 'lucide-react'

interface AISuggestionComponentProps extends NodeViewProps {
  node: {
    attrs: {
      originalText: string
      suggestedText: string
      action: 'improve' | 'rewrite' | 'summarize'
      timestamp: string
    }
  }
}

const AISuggestionComponent: React.FC<AISuggestionComponentProps> = ({
  node,
  deleteNode,
  editor,
  getPos
}) => {
  const { originalText, suggestedText, action, timestamp } = node.attrs

  const handleAccept = () => {
    // Get the position of this node from the getPos function
    const pos = typeof getPos === 'function' ? getPos() : 0
    
    // Replace the node with the suggested text
    editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + node.nodeSize })
      .insertContentAt(pos, suggestedText)
      .run()
  }

  const handleReject = () => {
    // Simply remove the suggestion block without affecting any other content
    deleteNode()
  }

  const getActionIcon = () => {
    switch (action) {
      case 'improve':
        return <Sparkles className="w-4 h-4 ai-sparkle" />
      case 'rewrite':
        return <RefreshCw className="w-4 h-4 ai-sparkle" />
      case 'summarize':
        return <FileText className="w-4 h-4 ai-sparkle" />
      default:
        return <Sparkles className="w-4 h-4 ai-sparkle" />
    }
  }

  const getActionLabel = () => {
    switch (action) {
      case 'improve':
        return 'AI Enhanced'
      case 'rewrite':
        return 'AI Rewritten'
      case 'summarize':
        return 'AI Summary'
      default:
        return 'AI Suggestion'
    }
  }

  return (
    <NodeViewWrapper className="ai-suggestion-wrapper">
      <div className="ai-suggestion-box relative overflow-hidden">
        {/* Floating particles for ambiance */}
        <div className="ai-particles">
          <div className="ai-particle ai-particle-1"></div>
          <div className="ai-particle ai-particle-2"></div>
          <div className="ai-particle ai-particle-3"></div>
        </div>

        {/* AI Badge */}
        <div className="ai-suggestion-badge">AI</div>

        {/* Header */}
        <div className="ai-suggestion-header">
          <div className="ai-suggestion-title">
            {getActionIcon()}
            <span className="font-semibold text-sm bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {getActionLabel()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAccept}
              className="ai-accept-btn flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 relative overflow-hidden"
              title="Accept AI suggestion"
            >
              <div className="ai-shimmer"></div>
              <Check className="w-4 h-4" />
              <span>Accept</span>
            </button>
            <button
              onClick={handleReject}
              className="ai-reject-btn flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300"
              title="Reject suggestion"
            >
              <X className="w-4 h-4" />
              <span>Reject</span>
            </button>
          </div>
        </div>

        {/* Content Comparison */}
        <div className="ai-text-comparison space-y-3 mt-4">
          {/* Original text (for context) */}
          {action !== 'summarize' && originalText && (
            <div className="ai-original-text relative">
              <div className="text-xs font-medium text-red-300 mb-2 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400 opacity-60"></div>
                Original
              </div>
              <div className="text-sm text-red-200 line-through opacity-70">
                {originalText}
              </div>
            </div>
          )}

          {/* Suggested text */}
          <div className="ai-suggested-text relative">
            <div className="text-xs font-medium text-green-300 mb-2 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400 ai-glow-pulse"></div>
              {action === 'summarize' ? 'Summary' : 'Suggestion'}
            </div>
            <div className="text-sm text-gray-100 leading-relaxed">
              {suggestedText}
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-400 text-right mt-3 opacity-60">
          Generated at {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export default AISuggestionComponent