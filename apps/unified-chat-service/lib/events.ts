/**
 * Shared in-memory event store. Used by /api/events and by the chat route to register
 * events server-side (no consumer POST needed).
 */

const MAX_EVENTS = 500

export type StoredEvent = {
  productId: string
  productName?: string
  type: string
  payload?: unknown
  time: string
}

const store: StoredEvent[] = []

export function pushEvent(event: Omit<StoredEvent, "time">): void {
  const full: StoredEvent = { ...event, time: new Date().toISOString() }
  store.push(full)
  while (store.length > MAX_EVENTS) store.shift()
}

export function getEvents(productId?: string | null): StoredEvent[] {
  let list = [...store].reverse()
  if (productId) list = list.filter((e) => e.productId === productId)
  return list.slice(0, 100)
}
