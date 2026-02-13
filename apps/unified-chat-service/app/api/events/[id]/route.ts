import { NextRequest } from "next/server"
import { deleteEvent } from "@/lib/events"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) {
    return Response.json({ error: "id required" }, { status: 400 })
  }
  const deleted = await deleteEvent(id)
  if (!deleted) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  return Response.json({ ok: true })
}
