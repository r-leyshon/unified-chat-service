import {
  getProjectById,
  insertDocument,
  insertChunk,
} from "@/lib/db"
import { requireLibraryAuth } from "@/lib/auth"
import { chunkText, extractTextFromFile } from "@/lib/documents"
import { embedTexts } from "@/lib/embeddings"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { error } = await requireLibraryAuth()
  if (error) return error
  try {
    const formData = await req.formData()
    const projectId = formData.get("projectId")
    const file = formData.get("file")

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }

    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const { text, name } = await extractTextFromFile(file)
    if (!text.trim()) {
      return NextResponse.json({ error: "No text extracted from file" }, { status: 400 })
    }

    const chunks = chunkText(text)
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No content to index" }, { status: 400 })
    }

    const doc = await insertDocument(projectId, name, file.name, text)

    const batchSize = 5
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const embeddings = await embedTexts(batch)
      for (let j = 0; j < batch.length; j++) {
        await insertChunk(doc.id, batch[j], embeddings[j])
      }
    }

    return NextResponse.json(doc)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
