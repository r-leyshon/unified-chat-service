const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 50

/** Split text into overlapping chunks for embedding. */
export function chunkText(text: string): string[] {
  const trimmed = text.replace(/\s+/g, " ").trim()
  if (!trimmed) return []
  const chunks: string[] = []
  let start = 0
  while (start < trimmed.length) {
    let end = start + CHUNK_SIZE
    if (end < trimmed.length) {
      const nextSpace = trimmed.indexOf(" ", end)
      if (nextSpace !== -1) end = nextSpace + 1
    }
    const chunk = trimmed.slice(start, end).trim()
    if (chunk) chunks.push(chunk)
    start = end - CHUNK_OVERLAP
    if (start >= trimmed.length) break
  }
  return chunks
}

export async function extractTextFromFile(
  file: File,
): Promise<{ text: string; name: string }> {
  const name = file.name
  const buffer = Buffer.from(await file.arrayBuffer())
  const lower = name.toLowerCase()

  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    const text = buffer.toString("utf-8")
    return { text, name }
  }

  if (lower.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default
    const data = await pdfParse(buffer)
    return { text: data.text, name }
  }

  if (lower.endsWith(".docx")) {
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    return { text: result.value, name }
  }

  throw new Error("Unsupported file type. Use .txt, .md, .pdf, or .docx")
}

/** Accepted file extensions for upload. */
export const ACCEPTED_EXTENSIONS = ".txt,.md,.pdf,.docx"
