// Minimal shim so imports compile when collaboration is disabled
// Expose a runtime-compatible WebSocketStatus with enum-like shape
export const WebSocketStatus = {
  Connecting: 0,
  Connected: 1,
  Disconnected: 2,
} as const
export type WebSocketStatus = (typeof WebSocketStatus)[keyof typeof WebSocketStatus]

type StatusEvent = { status: WebSocketStatus }
type EventName = 'status' | 'synced'

export class TiptapCollabProvider {
  // No-op event emitter to satisfy consumer code
  on(_event: EventName, _cb: ((e: StatusEvent) => void) | (() => void)) {}
  off(_event: EventName, _cb: ((e: StatusEvent) => void) | (() => void)) {}
}

// Provide named export used elsewhere
export class HocuspocusProvider {}
export default TiptapCollabProvider


