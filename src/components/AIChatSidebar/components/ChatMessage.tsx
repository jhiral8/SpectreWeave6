import { cn } from '@/lib/utils'
import { useState } from 'react'
import { ChatMessage as ChatMessageType } from '@/hooks/useAIChatSidebar'
import { 
  insertTextIntoSurface, 
  getAvailableSurfaces, 
  getSurfaceLabel,
  WritingSurface,
  InsertionMode
} from '@/lib/ai/textInsertion'

export const ChatMessage = ({ message }: { message: ChatMessageType }) => {
  const isUser = message.role === 'user'
  const isLoading = message.isLoading
  const [showInsertOptions, setShowInsertOptions] = useState(false)
  const [selectedSurface, setSelectedSurface] = useState<WritingSurface>('active')
  const [selectedMode, setSelectedMode] = useState<InsertionMode>('cursor')

  const availableSurfaces = getAvailableSurfaces()
  const hasMultipleSurfaces = availableSurfaces.length > 1
  const isAIMessage = !isUser && !isLoading && message.content.trim().length > 0

  const handleInsertText = () => {
    const success = insertTextIntoSurface({
      surface: selectedSurface,
      mode: selectedMode,
      text: message.content,
      addParagraphBreak: true
    })
    
    if (success) {
      setShowInsertOptions(false)
      // You could add a toast notification here
    }
  }

  const handleQuickInsert = (surface: WritingSurface) => {
    insertTextIntoSurface({
      surface,
      mode: 'cursor',
      text: message.content,
      addParagraphBreak: true
    })
  }

  return (
    <div className={cn(
      'mb-4 flex',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[80%] rounded-lg px-3 py-2 text-xs',
        isUser 
          ? 'bg-[color-mix(in_srgb,var(--brand)_35%,transparent)] text-white ml-auto' 
          : 'bg-white/5 text-[--card-foreground] mr-auto border border-[--border]'
      )}>
        {isLoading ? (
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        ) : (
          <>
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
            
            {/* Surface targeting buttons for AI messages */}
            {isAIMessage && (
              <div className="mt-3 pt-2 border-t border-[--border]/30">
                {!showInsertOptions ? (
                  <div className="flex flex-wrap gap-1">
                    {/* Quick insert buttons */}
                    {availableSurfaces.map(surface => (
                      <button
                        key={surface}
                        onClick={() => handleQuickInsert(surface)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-md bg-[--accent]/10 hover:bg-[--accent]/20 text-[--accent-foreground] border border-[--border]/50 transition-colors"
                        title={`Insert into ${getSurfaceLabel(surface)}`}
                      >
                        <span className="text-[8px]">
                          {surface === 'manuscript' ? '📝' : surface === 'framework' ? '🏗️' : '✨'}
                        </span>
                        {getSurfaceLabel(surface)}
                      </button>
                    ))}
                    
                    {/* More options button */}
                    {hasMultipleSurfaces && (
                      <button
                        onClick={() => setShowInsertOptions(true)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-md bg-[--muted]/20 hover:bg-[--muted]/30 text-[--muted-foreground] border border-[--border]/50 transition-colors"
                        title="More insertion options"
                      >
                        ⚙️ Options
                      </button>
                    )}
                  </div>
                ) : (
                  /* Detailed insertion options */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-[--muted-foreground]">Insert Options</span>
                      <button
                        onClick={() => setShowInsertOptions(false)}
                        className="text-[10px] text-[--muted-foreground] hover:text-[--foreground]"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Surface selection */}
                      <div>
                        <label className="text-[9px] text-[--muted-foreground] block mb-1">Target Surface</label>
                        <select
                          value={selectedSurface}
                          onChange={(e) => setSelectedSurface(e.target.value as WritingSurface)}
                          className="w-full px-2 py-1 text-[10px] rounded border border-[--border] bg-[--background] text-[--foreground]"
                        >
                          {availableSurfaces.map(surface => (
                            <option key={surface} value={surface}>
                              {getSurfaceLabel(surface)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Mode selection */}
                      <div>
                        <label className="text-[9px] text-[--muted-foreground] block mb-1">Insert Mode</label>
                        <select
                          value={selectedMode}
                          onChange={(e) => setSelectedMode(e.target.value as InsertionMode)}
                          className="w-full px-2 py-1 text-[10px] rounded border border-[--border] bg-[--background] text-[--foreground]"
                        >
                          <option value="cursor">At cursor position</option>
                          <option value="append">Append to end</option>
                          <option value="replace">Replace all content</option>
                        </select>
                      </div>
                      
                      {/* Insert button */}
                      <button
                        onClick={handleInsertText}
                        className="w-full px-2 py-1.5 text-[10px] font-medium rounded bg-[--accent] hover:bg-[--accent]/90 text-[--accent-foreground] transition-colors"
                      >
                        Insert Text
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        {!isLoading && (
          <div className={cn(
            'text-[10px] mt-1 opacity-60',
            isUser ? 'text-white' : 'text-[--muted-foreground]'
          )}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
    </div>
  )
}