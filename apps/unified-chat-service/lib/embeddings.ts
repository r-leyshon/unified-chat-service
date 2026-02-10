import { getVertexAI, getGoogleAuth } from "./vertex-ai"

const EMBEDDING_MODEL = "text-embedding-005"
const EMBEDDING_DIMENSIONS = 768

async function getEmbeddingAccessToken(): Promise<string> {
  const auth = getGoogleAuth()
  const client = await auth.getClient()
  const tokenResponse = await client.getAccessToken()
  if (!tokenResponse.token) throw new Error("Failed to get GCP access token")
  return tokenResponse.token
}

/**
 * Get embedding vector for a single text using Vertex AI text-embedding-005.
 * Returns 768-dimensional vector.
 */
export async function embedText(text: string): Promise<number[]> {
  const { config } = getVertexAI()
  const { projectId, location } = config
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${EMBEDDING_MODEL}:predict`

  const accessToken = await getEmbeddingAccessToken()

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instances: [{ content: text.slice(0, 2048) }],
      parameters: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Vertex AI embedding failed: ${res.status} ${err}`)
  }

  const data = (await res.json()) as { predictions?: { embeddings?: { values?: number[] } }[] }
  const values = data.predictions?.[0]?.embeddings?.values
  if (!values || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("Invalid embedding response")
  }
  return values
}

/** Embed multiple texts in one batch (fewer API calls). */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const { config } = getVertexAI()
  const { projectId, location } = config
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${EMBEDDING_MODEL}:predict`

  const accessToken = await getEmbeddingAccessToken()

  const instances = texts.map((t) => ({ content: t.slice(0, 2048) }))
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instances,
      parameters: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Vertex AI embedding failed: ${res.status} ${err}`)
  }

  const data = (await res.json()) as { predictions?: { embeddings?: { values?: number[] } }[] }
  const results: number[][] = []
  for (const p of data.predictions ?? []) {
    const values = p.embeddings?.values
    if (!values || values.length !== EMBEDDING_DIMENSIONS) throw new Error("Invalid embedding response")
    results.push(values)
  }
  return results
}
