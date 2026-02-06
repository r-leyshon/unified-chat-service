import { getGeminiModel } from "@/lib/vertex-ai"

export async function POST(req: Request) {
  const body = await req.json()
  const { messages } = body as {
    product_id?: string
    user?: { id?: string; name?: string }
    messages?: Array<{ role: string; content: string }>
  }

  const model = getGeminiModel()

  const contents = (messages ?? []).map((m: { role: string; content: string }) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }))

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        const streamingResult = await model.generateContentStream({
          contents,
        })
        for await (const item of streamingResult.stream) {
          const text = item.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "content", content: text })}\n\n`),
            )
          }
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "sources", sources: [] })}\n\n`),
        )
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
      } catch (err) {
        const message = err instanceof Error ? err.message : "Vertex AI error"
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "content", content: `Error: ${message}` })}\n\n`,
          ),
        )
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "sources", sources: [] })}\n\n`),
        )
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
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
