import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet, EditorView } from '@tiptap/pm/view'

type TriggerType = 'typing' | 'punctuation' | 'newline'

// Global lock to prevent multiple instances from making simultaneous requests
let globalRequestLock = false
let globalRequestCount = 0

export interface GhostCompletionOptions {
	enabled: boolean
	debounceMs: number
	minCharacters: number
	contextWindow: number
	maxTokens: number
	temperature: number
	planCount: 1 | 2 | 3
	provider: 'gemini' | 'databricks' | 'azure'
	punctuationChars: string
    safeMode: boolean
}

interface GhostState {
	visible: boolean
	fromPos: number
	suggestion: string
	plan: string[]
	loading: boolean
	lastDocSize: number
	lastSelectionFrom: number
}

const key = new PluginKey<GhostState>('ghostCompletion')

function createGhostElement(state: GhostState): HTMLElement {
	const container = document.createElement('span')
	container.className = 'ghost-completion-container'

	// Create inline suggestion with accept/reject controls
	const suggestionWrapper = document.createElement('span')
	suggestionWrapper.className = 'ghost-suggestion-wrapper'
	
	const ghost = document.createElement('span')
	ghost.className = 'ghost-completion'
	ghost.textContent = state.suggestion
	
	const controls = document.createElement('span')
	controls.className = 'ghost-controls'
	
	const acceptBtn = document.createElement('button')
	acceptBtn.className = 'ghost-accept-btn'
	acceptBtn.textContent = '↹'
	acceptBtn.title = 'Accept (Tab)'
	acceptBtn.setAttribute('data-action', 'accept')
	
	const rejectBtn = document.createElement('button')
	rejectBtn.className = 'ghost-reject-btn'
	rejectBtn.textContent = '✕'
	rejectBtn.title = 'Reject (Escape)'
	rejectBtn.setAttribute('data-action', 'reject')
	
	controls.appendChild(acceptBtn)
	controls.appendChild(rejectBtn)
	
	suggestionWrapper.appendChild(ghost)
	suggestionWrapper.appendChild(controls)
	container.appendChild(suggestionWrapper)

	// Create floating modal for style suggestions/plan
	if (state.plan && state.plan.length > 0) {
		const modal = document.createElement('div')
		modal.className = 'ghost-plan-modal'
		
		const modalHeader = document.createElement('div')
		modalHeader.className = 'ghost-modal-header'
		modalHeader.textContent = 'Writing Plan'
		
		const modalContent = document.createElement('div')
		modalContent.className = 'ghost-modal-content'
		
		state.plan.forEach((planItem, index) => {
			const planElement = document.createElement('div')
			planElement.className = 'ghost-plan-item'
			planElement.textContent = `${index + 1}. ${planItem}`
			modalContent.appendChild(planElement)
		})
		
		modal.appendChild(modalHeader)
		modal.appendChild(modalContent)
		container.appendChild(modal)
	}

	return container
}

async function fetchGhostSuggestion(
	view: EditorView,
	options: GhostCompletionOptions
): Promise<{ completion: string; plan: string[] } | null> {
	// Global lock to prevent multiple simultaneous requests across all instances
	if (globalRequestLock) {
		console.warn('👻 BLOCKED: Global request lock active, preventing duplicate API call')
		return null
	}
	
	globalRequestLock = true
	globalRequestCount++
	console.log(`👻 API CALL #${globalRequestCount} - Starting ghost completion request`)
	
	try {
		const { state } = view
		const { from } = state.selection
		const doc = state.doc
		const start = Math.max(0, from - options.contextWindow)
		const end = Math.min(doc.content.size, from + 1)
		const context = doc.textBetween(start, from, ' ')

		if (!context || context.trim().length < options.minCharacters) {
			console.log('👻 Context too short, aborting request')
			return null
		}

		const promptParts: string[] = []
		promptParts.push('You are assisting a novelist. Continue the writing with a short, natural ghost completion and propose a brief plan for the next 1-3 sentences.')
		promptParts.push('Write in the same voice, POV, and tense as the given context. Avoid repetition. Keep completion concise (<= 40 words).')
		if (options.safeMode) {
			promptParts.push('Safety: Avoid profanity, sexual content, hate, harassment, self-harm, or illegal advice. Keep content broadly acceptable while preserving tone.')
		}
		promptParts.push('Return JSON with keys: completion (string), plan (array of 1-3 short strings).')
		promptParts.push('Context:')
		promptParts.push(context.trim())
		promptParts.push('JSON only:')
		const prompt = promptParts.join('\n\n')

		// Test hook for E2E determinism
		const w: any = (typeof window !== 'undefined' ? window : undefined) as any
		if (w && w.__sw_test_ghost) {
			const g = w.__sw_test_ghost
			return { completion: String(g.completion || ''), plan: Array.isArray(g.plan) ? g.plan : [] }
		}
		
		const response = await fetch('/api/bridge/generate-text', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				prompt,
				provider: options.provider,
				model: 'gpt-5-nano', // Use extremely cheap AI Foundry model for ghost completion
				options: { maxTokens: options.maxTokens, temperature: options.temperature }
			})
		})
		
		if (!response.ok) {
			return null
		}
		
		const res = await response.json()

		if (!res.success || !res.data) return null

		// Try to parse JSON; if not JSON, treat as plain completion
		let completion = ''
		let plan: string[] = []
		try {
			// Handle markdown code blocks
			let jsonStr = res.data
			if (jsonStr.includes('```json')) {
				const match = jsonStr.match(/```json\s*\n([\s\S]*?)\n```/)
				if (match && match[1]) {
					jsonStr = match[1]
				}
			}
			
			const parsed = JSON.parse(jsonStr)
			completion = String(parsed.completion || '')
			plan = Array.isArray(parsed.plan) ? parsed.plan.slice(0, options.planCount) : []
		} catch {
			// Fallback: use raw text as completion and no plan
			completion = res.data.trim()
		}

		// Sanitize completion: remove leading newlines and excessive whitespace
		completion = completion.replace(/^[\n\r\s]+/, '').replace(/[\s]+/g, ' ')
		if (!completion) return null

		console.log(`👻 API CALL #${globalRequestCount} - SUCCESS: Got completion`)
		return { completion, plan }
	} catch (error) {
		console.error(`👻 API CALL #${globalRequestCount} - ERROR:`, error)
		return null
	} finally {
		globalRequestLock = false
		console.log(`👻 API CALL #${globalRequestCount} - Global lock released`)
	}
}

// Shared runtime state that persists across command calls
const runtimeState = {
	enabled: true,
	planCount: 3 as 1 | 2 | 3,
	safeMode: true,
}

export const GhostCompletion = Extension.create<GhostCompletionOptions>({
	name: 'ghostCompletion',

	addOptions() {
		return {
			enabled: true,
			debounceMs: 3000, // Reduced from 10s to 3s for better responsiveness
			minCharacters: 15, // Slightly reduced threshold
			contextWindow: 1000,
			maxTokens: 120,
			temperature: 0.6,
			planCount: 3,
			provider: 'aifoundry',
			punctuationChars: '.!?',
            safeMode: true,
		}
	},

	addProseMirrorPlugins() {
		const extensionOptions = this.options

		return [
			new Plugin<GhostState>({
				key,
				state: {
					init: () => ({
						visible: false,
						fromPos: 0,
						suggestion: '',
						plan: [],
						loading: false,
						lastDocSize: 0,
						lastSelectionFrom: 0,
					}),
					apply(tr, prev) {
						const meta = tr.getMeta(key)
						if (meta && typeof meta === 'object') {
							return { ...prev, ...meta }
						}
						// Make suggestions much more persistent - only clear on major changes
						if (tr.docChanged && prev.visible) {
							// Clear if cursor moved very far from the suggestion position
							const cursorPos = tr.selection.from
							const suggestionPos = prev.fromPos
							const cursorDiff = Math.abs(cursorPos - suggestionPos)
							
							// Increased threshold - only clear if cursor moved far away
							if (cursorDiff > 50) {
								return { ...prev, visible: false, suggestion: '', plan: [] }
							}
							
							// Clear only on very large document changes (major edits/paste)
							const sizeDiff = Math.abs(tr.doc.content.size - prev.lastDocSize)
							if (sizeDiff > 100) {
								return { ...prev, visible: false, suggestion: '', plan: [], lastDocSize: tr.doc.content.size }
							}
						}
						return prev
					},
				},
				props: {
          // Expose runtime options for external toggles (read-only snapshot)
          editorProps: {
            __ghostOptions: extensionOptions,
          } as any,
					handleKeyDown(view, event) {
						const state = key.getState(view.state)
						if (!state) return false
						if (state.visible && event.key === 'Tab') {
							event.preventDefault()
							// Insert suggestion at cursor
							const { from } = view.state.selection
							view.dispatch(
								view.state.tr
									.insertText(state.suggestion, from, from)
									.setMeta(key, { visible: false, suggestion: '', plan: [], fromPos: 0 })
							)
                  try { window.dispatchEvent(new CustomEvent('sw:ghost-accepted', { detail: { length: state.suggestion?.length || 0 } })) } catch {}
							return true
						}
						if (state.visible && event.key === 'Escape') {
							view.dispatch(view.state.tr.setMeta(key, { visible: false, suggestion: '', plan: [], fromPos: 0 }))
                  try { window.dispatchEvent(new CustomEvent('sw:ghost-dismissed')) } catch {}
							return false
						}
						return false
					},
					handleClick(view, pos, event) {
						const target = event.target as HTMLElement
						const state = key.getState(view.state)
						if (!state || !state.visible) return false
						
						const action = target.getAttribute('data-action')
						if (action === 'accept') {
							event.preventDefault()
							const { from } = view.state.selection
							view.dispatch(
								view.state.tr
									.insertText(state.suggestion, from, from)
									.setMeta(key, { visible: false, suggestion: '', plan: [], fromPos: 0 })
							)
							try { window.dispatchEvent(new CustomEvent('sw:ghost-accepted', { detail: { length: state.suggestion?.length || 0 } })) } catch {}
							return true
						}
						if (action === 'reject') {
							event.preventDefault()
							view.dispatch(view.state.tr.setMeta(key, { visible: false, suggestion: '', plan: [], fromPos: 0 }))
							try { window.dispatchEvent(new CustomEvent('sw:ghost-dismissed')) } catch {}
							return true
						}
						return false
					},
					decorations(state) {
						const pluginState = key.getState(state)
						if (!pluginState || !pluginState.visible || !pluginState.suggestion) {
							return null
						}
						const deco = Decoration.widget(pluginState.fromPos, () => createGhostElement(pluginState), {
							ignoreSelection: true,
							stopEvent: () => false,
						})
						return DecorationSet.create(state.doc, [deco])
					},
				},
				view(editorView) {
					let timer: any = null
					let inFlight = false
					let schedulingLock = false
					let lastScheduleId = 0

					const schedule = (trigger: TriggerType) => {
						if (!runtimeState.enabled || schedulingLock) return
						
						// Don't schedule new suggestions if one is already visible
						const currentState = key.getState(editorView.state)
						if (currentState && currentState.visible) return
						
						// Atomic scheduling - prevent multiple simultaneous requests
						const scheduleId = ++lastScheduleId
						schedulingLock = true
						
						// Cancel any existing timer
						if (timer) clearTimeout(timer)
						
						timer = setTimeout(async () => {
							// Verify this is still the latest schedule request
							if (scheduleId !== lastScheduleId) {
								schedulingLock = false
								return
							}
							
							// Double-check state hasn't changed
							const state = key.getState(editorView.state)
							if (state && state.visible) {
								schedulingLock = false
								return
							}
							
							if (inFlight) {
								schedulingLock = false
								return
							}
							
							try {
								inFlight = true
								const payload = await fetchGhostSuggestion(editorView, { ...extensionOptions, ...runtimeState })
								
								// Verify this is still the latest request and state is valid
								if (scheduleId === lastScheduleId) {
									if (payload) {
										const { from } = editorView.state.selection
										editorView.dispatch(
											editorView.state.tr.setMeta(key, {
												visible: true,
												fromPos: from,
												suggestion: payload.completion,
												plan: payload.plan,
											})
										)
									} else {
										editorView.dispatch(
											editorView.state.tr.setMeta(key, {
												visible: false,
												suggestion: '',
												plan: [],
											})
										)
									}
								}
							} catch (error) {
								console.warn('Ghost completion error:', error)
							} finally {
								inFlight = false
								schedulingLock = false
							}
						}, extensionOptions.debounceMs)
					}

					let lastDocSize = editorView.state.doc.content.size
					let lastSelectionFrom = editorView.state.selection.from
					let lastStateHash = ''

					const handleUpdate = (newState: any) => {
						// Create a hash of relevant state to prevent duplicate processing
						const stateHash = `${newState.doc.content.size}-${newState.selection.from}-${newState.selection.to}`
						
						if (stateHash === lastStateHash) {
							return // Skip if state hasn't actually changed
						}
						lastStateHash = stateHash
						
						// Only trigger on actual document changes or meaningful selection changes
						const currentDocSize = newState.doc.content.size
						const currentSelectionFrom = newState.selection.from
						
						// Skip if no document changes and selection hasn't moved significantly
						if (currentDocSize === lastDocSize && Math.abs(currentSelectionFrom - lastSelectionFrom) < 3) {
							return
						}
						
						// Don't trigger if there's already a visible suggestion
						const currentState = key.getState(newState)
						if (currentState && currentState.visible) {
							lastDocSize = currentDocSize
							lastSelectionFrom = currentSelectionFrom
							return
						}
						
						lastDocSize = currentDocSize
						lastSelectionFrom = currentSelectionFrom
						
						const pos = newState.selection.from
						const $pos = newState.doc.resolve(pos)
						const beforeChar = pos > 0 ? newState.doc.textBetween(pos - 1, pos) : ''
						if (beforeChar && extensionOptions.punctuationChars.includes(beforeChar)) {
							schedule('punctuation')
							return
						}
						// Trigger on newline
						if ($pos.parentOffset === 0 && pos !== 0) {
							schedule('newline')
							return
						}
						// Default typing trigger
						schedule('typing')
					}

					// Observe editor updates
					const origUpdate = editorView.updateState
					;(editorView as any).updateState = (state: any) => {
						origUpdate.call(editorView, state)
						handleUpdate(state)
					}

					// Initial - but pass the current state
					handleUpdate(editorView.state)

					return {
						destroy() {
							if (timer) clearTimeout(timer)
						},
					}
				},
			}),
		]
	},

  addCommands() {
    return {
      setGhostEnabled:
        (enabled: boolean) => ({ state, tr, dispatch }) => {
          try {
            // Update the runtime state (this is what the plugin actually uses)
            runtimeState.enabled = !!enabled
            
            // Clear any visible ghost completion when disabled
            if (dispatch) dispatch(tr.setMeta(key, { visible: false, suggestion: '', plan: [] }))
            
            return true
          } catch (error) {
            return false
          }
        },
      setGhostPlanCount:
        (count: 1 | 2 | 3) => ({ tr, dispatch }) => {
          try { 
            runtimeState.planCount = count
          } catch {}
          if (dispatch) dispatch(tr)
          return true
        },
      setGhostSafeMode:
        (safe: boolean) => ({ tr, dispatch }) => {
          try { 
            runtimeState.safeMode = !!safe
          } catch {}
          if (dispatch) dispatch(tr)
          return true
        },
    }
  },
})

// Export runtime state getters for external use
export const getGhostRuntimeState = () => runtimeState

export default GhostCompletion


