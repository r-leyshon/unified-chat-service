/**
 * Event store backed by Postgres. Used by /api/events and by the chat route to register
 * events. Persisted in DB so events are visible across serverless instances.
 */

import { insertChatEvent, listChatEvents, deleteChatEvent } from "@/lib/db"

export type StoredEvent = {
  id?: string
  productId: string
  productName?: string
  type: string
  payload?: unknown
  time: string
}

export async function pushEvent(event: Omit<StoredEvent, "time">): Promise<void> {
  await insertChatEvent(
    event.productId ?? "",
    event.productName ?? null,
    event.type,
    event.payload,
  )
}

export async function getEvents(productId?: string | null): Promise<StoredEvent[]> {
  return listChatEvents(productId)
}

export async function deleteEvent(id: string): Promise<boolean> {
  return deleteChatEvent(id)
}
