export async function POST(req: Request) {
  const body = await req.json()

  // In a real app:
  // - Validate user auth
  // - Extract product_id from your app context
  // - Call the central chat service

  // For demo purposes, we'll stream a mock response
  const mockResponse = {
    type: "content",
    content:
      "This is a mock response from the central chat service. In production, this endpoint would proxy to your Python FastAPI backend, which handles RAG, document retrieval, and Azure OpenAI calls.",
  }

  const mockSources = {
    type: "sources",
    sources: [
      {
        title: "Getting Started Guide",
        url: "https://docs.example.com/getting-started",
      },
      {
        title: "API Reference",
        url: "https://docs.example.com/api-reference",
      },
    ],
  }

  const mockDone = { type: "done" }

  // Create a readable stream
  const stream = new ReadableStream({
    start(controller) {
      // Simulate streaming by sending chunks with delays
      const chunks = [
        `data: ${JSON.stringify(mockResponse)}\n\n`,
        `data: ${JSON.stringify(mockSources)}\n\n`,
        `data: ${JSON.stringify(mockDone)}\n\n`,
      ]

      let index = 0

      const sendChunk = () => {
        if (index < chunks.length) {
          controller.enqueue(new TextEncoder().encode(chunks[index]))
          index++
          setTimeout(sendChunk, 300) // Simulate delay between chunks
        } else {
          controller.close()
        }
      }

      sendChunk()
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
