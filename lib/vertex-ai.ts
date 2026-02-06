import path from "node:path"
import fs from "node:fs"
import { VertexAI } from "@google-cloud/vertexai"

const GEMINI_MODEL = "gemini-2.5-flash"
const DEFAULT_LOCATION = "us-central1"

export interface VertexConfig {
  projectId: string
  location: string
}

/**
 * Resolve GCP credentials in an environment-aware way:
 * - Vercel/production: use GCP_CREDENTIALS_JSON (full JSON string in env)
 * - Local: use GOOGLE_APPLICATION_CREDENTIALS path, or default key file in project root
 */
function getCredentialsPath(): string | null {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS
  }
  const defaultPath = path.join(process.cwd(), "rich-experiments-6e037a3981c5.json")
  return defaultPath
}

function getProjectIdFromCredentials(credentials: Record<string, unknown>): string {
  const id = credentials.project_id ?? credentials.projectId
  if (typeof id !== "string") {
    throw new Error("GCP credentials JSON must contain project_id")
  }
  return id
}

let cachedVertex: VertexAI | null = null
let cachedConfig: VertexConfig | null = null

/**
 * Returns a Vertex AI client with environment-aware credentials.
 */
export function getVertexAI(): { vertex: VertexAI; config: VertexConfig } {
  if (cachedVertex && cachedConfig) {
    return { vertex: cachedVertex, config: cachedConfig }
  }

  const credentialsJson = process.env.GCP_CREDENTIALS_JSON
  const location = process.env.VERTEX_AI_LOCATION ?? DEFAULT_LOCATION

  if (credentialsJson) {
    const credentials = JSON.parse(credentialsJson) as Record<string, unknown>
    const projectId = process.env.GCP_PROJECT_ID ?? getProjectIdFromCredentials(credentials)
    const vertex = new VertexAI({
      project: projectId,
      location,
      googleAuthOptions: { credentials },
    })
    cachedVertex = vertex
    cachedConfig = { projectId, location }
    return { vertex: cachedVertex, config: cachedConfig }
  }

  const keyPath = getCredentialsPath()
  if (!keyPath) {
    throw new Error(
      "GCP credentials not found. Set GCP_CREDENTIALS_JSON (Vercel) or GOOGLE_APPLICATION_CREDENTIALS."
    )
  }
  if (!fs.existsSync(keyPath)) {
    throw new Error(`GCP key file not found at ${keyPath}. For Vercel, set GCP_CREDENTIALS_JSON.`)
  }
  const keyContent = fs.readFileSync(keyPath, "utf8")
  const credentials = JSON.parse(keyContent) as Record<string, unknown>
  const projectId = process.env.GCP_PROJECT_ID ?? getProjectIdFromCredentials(credentials)

  const vertex = new VertexAI({
    project: projectId,
    location,
    googleAuthOptions: { credentials },
  })
  cachedVertex = vertex
  cachedConfig = { projectId, location }
  return { vertex: cachedVertex, config: cachedConfig }
}

export function getGeminiModel() {
  const { vertex } = getVertexAI()
  return vertex.getGenerativeModel({ model: GEMINI_MODEL })
}
