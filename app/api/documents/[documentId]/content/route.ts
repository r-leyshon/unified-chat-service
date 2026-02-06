import {
  getDocumentContent,
  updateDocumentContent,
  deleteChunksByDocumentId,
  insertChunk,
} from "@/lib/db"
import { chunkText } from "@/lib/documents"
import { embedTexts } from "@/lib/embeddings"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params
  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 })
  }
  try {
    const result = await getDocumentContent(documentId)
    if (!result) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load content"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params
  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const content = typeof body.content === "string" ? body.content : ""
    const existing = await getDocumentContent(documentId)
    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    await updateDocumentContent(documentId, content)
    await deleteChunksByDocumentId(documentId)
    const chunks = chunkText(content)
    if (chunks.length > 0) {
      const batchSize = 5
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize)
        const embeddings = await embedTexts(batch)
        for (let j = 0; j < batch.length; j++) {
          await insertChunk(documentId, batch[j], embeddings[j])
        }
      }
    }
    return NextResponse.json({ name: existing.name, file_name: existing.file_name, content })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update content"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
