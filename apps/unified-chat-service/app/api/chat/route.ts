import { getGeminiModel } from "@/lib/vertex-ai"
import { getProjectById, searchChunks } from "@/lib/db"
import { embedText } from "@/lib/embeddings"
import { pushEvent } from "@/lib/events"
import {
  EXTRACTION_SYSTEM,
  buildExtractionUserMessage,
  buildChatAssistantSystemInstruction,
} from "@/lib/prompts"
/** CORS: allowed origins from env (comma-separated). Empty = same-origin only. */
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin")
  const allowed = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? []
  if (!origin) return {}
  if (allowed.length === 0) return {}
  if (!allowed.includes(origin)) return {}
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

export async function OPTIONS(req: Request) {
  const cors = getCorsHeaders(req)
  return new Response(null, { status: 204, headers: cors })
}

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
      const project = productId ? await getProjectById(productId) : null
      const productName = project?.name ?? undefined

      const registerEvent = (type: string, payload?: unknown) => {
        pushEvent({ productId: productId ?? "", productName, type, payload })
      }

      if (lastUserText.trim()) {
        registerEvent("message_sent", { content: lastUserText })
      }

      try {
        if (productId && lastUserText.trim() && project) {
          const extractionPrompt = buildExtractionUserMessage(
              project.name,
              project.description,
              lastUserText,
            )
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
                registerEvent("search", { searchTerms })
                enqueue(controller, { type: "search", searchTerms })
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

        const systemInstruction = buildChatAssistantSystemInstruction(contextBlock)

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
        registerEvent("message_received", { sources })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Vertex AI error"
        registerEvent("error", { error: message })
        enqueue(controller, { type: "content", content: `Error: ${message}` })
        enqueue(controller, { type: "sources", sources: [] })
        enqueue(controller, { type: "done" })
      } finally {
        controller.close()
      }
    },
  })

  const cors = getCorsHeaders(req)
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...cors,
    },
  })
}
