import { deleteDocument } from "@/lib/db"
import { requireLibraryAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { error } = await requireLibraryAuth()
  if (error) return error
  const { documentId } = await params
  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 })
  }
  try {
    const deleted = await deleteDocument(documentId)
    if (!deleted) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete document"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
