import { getGeminiModel } from "@/lib/vertex-ai"
import { getProjectById, searchChunks } from "@/lib/db"
import { embedText } from "@/lib/embeddings"

const EXTRACTION_SYSTEM = `You help identify whether a user message is asking about a specific product so we can look up documentation.
You are given the current product's name and optional description.
Your job: output a JSON array of 1 or more search terms (strings) that would find relevant documentation, OR an empty array [] if the message is chit-chat, greeting, unrelated, or not about this product.
Reply with ONLY the JSON array, no other text. Example: ["unit conversion", "length"] or []`

function parseSearchTerms(raw: string): string[] {
  const trimmed = raw?.trim() || ""
  if (!trimmed) return []
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === "string")
  } catch {
    return []
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  const { messages, product_id: productId } = body as {
    product_id?: string
    user?: { id?: string; name?: string }
    messages?: Array<{ role: string; content: string }>
  }

  const model = getGeminiModel()
  const messageList = messages ?? []
  const contents = messageList.map((m: { role: string; content: string }) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }))

  const lastUserMessage = [...messageList].reverse().find((m: { role: string }) => m.role === "user")
  const lastUserText = (lastUserMessage as { content?: string } | undefined)?.content ?? ""

  const encoder = new TextEncoder()
  const enqueue = (controller: ReadableStreamDefaultController<Uint8Array>, data: unknown) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  }

  const stream = new ReadableStream({
    async start(controller) {
      let contextBlock = ""
      let sources: { title: string; url: string }[] = []

      try {
        if (productId && lastUserText.trim()) {
          const project = await getProjectById(productId)
          if (project) {
            const extractionPrompt = `Product name: ${project.name}
${project.description ? `Product description: ${project.description}` : ""}

User message: ${lastUserText}

Output a JSON array of search terms (or [] if not about this product):`

            try {
              const extractionResult = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
                systemInstruction: EXTRACTION_SYSTEM,
              })
              const extractionText =
                extractionResult.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
              const searchTerms = parseSearchTerms(extractionText)
              console.info(
                "[chat] product_id=%s extracted_search_terms=%s",
                productId,
                JSON.stringify(searchTerms),
              )
              if (searchTerms.length >= 1) {
                enqueue(controller, { type: "status", message: "Looking up guidance…" })
                const query = searchTerms.join(" ")
                const queryEmbedding = await embedText(query)
                const chunks = await searchChunks(productId, queryEmbedding, 5)
                if (chunks.length > 0) {
                  contextBlock = chunks
                    .map((c) => `[${c.document_name}]\n${c.content}`)
                    .join("\n\n---\n\n")
                  const seen = new Set<string>()
                  sources = chunks.map((c) => {
                    const title = c.document_name
                    if (seen.has(title)) return { title: `${title} (excerpt)`, url: "" }
                    seen.add(title)
                    return { title, url: "" }
                  })
                }
              }
            } catch (err) {
              console.warn("[chat] extraction or search failed", err)
            }
          }
        }

        const baseSystem =
          "You are a helpful product assistant. Answer concisely and accurately. If you are given context from documentation, use it to answer; if the context does not contain the answer, say so."
        const systemInstruction = contextBlock
          ? `${baseSystem}\n\nUse the following context from the product documentation when answering. If the context does not contain the answer, say so.\n\nContext:\n${contextBlock}`
          : baseSystem

        const streamingResult = await model.generateContentStream({
          contents,
          systemInstruction,
        })
        for await (const item of streamingResult.stream) {
          const text = item.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            enqueue(controller, { type: "content", content: text })
          }
        }
        enqueue(controller, { type: "sources", sources })
        enqueue(controller, { type: "done" })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Vertex AI error"
        enqueue(controller, { type: "content", content: `Error: ${message}` })
        enqueue(controller, { type: "sources", sources: [] })
        enqueue(controller, { type: "done" })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
