import path from "node:path"
import fs from "node:fs"
import { GoogleAuth } from "google-auth-library"
import { VertexAI } from "@google-cloud/vertexai"

const GEMINI_MODEL = "gemini-2.5-flash"
const DEFAULT_LOCATION = "us-central1"

export interface VertexConfig {
  projectId: string
  location: string
}

const DEFAULT_KEY_FILE = "rich-experiments-6e037a3981c5.json"

/**
 * Resolve GCP credentials in an environment-aware way:
 * - Vercel/production: use GCP_CREDENTIALS_JSON (full JSON string in env)
 * - Local: use GOOGLE_APPLICATION_CREDENTIALS path, or default key file in service root or monorepo root
 */
function getCredentialsPath(): string | null {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS
  }
  const cwd = process.cwd()
  const inService = path.join(cwd, DEFAULT_KEY_FILE)
  if (fs.existsSync(inService)) return inService
  // When run from apps/unified-chat-service, monorepo root is two levels up
  const inMonorepoRoot = path.join(cwd, "..", "..", DEFAULT_KEY_FILE)
  if (fs.existsSync(inMonorepoRoot)) return inMonorepoRoot
  return path.join(cwd, DEFAULT_KEY_FILE)
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
let cachedAuth: GoogleAuth | null = null

function getCredentials(): Record<string, unknown> {
  const credentialsJson = process.env.GCP_CREDENTIALS_JSON
  if (credentialsJson) return JSON.parse(credentialsJson) as Record<string, unknown>
  const keyPath = getCredentialsPath()
  if (!keyPath || !fs.existsSync(keyPath)) {
    throw new Error(
      "GCP credentials not found. Set GCP_CREDENTIALS_JSON (Vercel) or add key file to project root."
    )
  }
  return JSON.parse(fs.readFileSync(keyPath, "utf8")) as Record<string, unknown>
}

const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform"

/**
 * Returns a GoogleAuth client with the same credentials as Vertex AI (for embedding API etc.).
 * Uses cloud-platform scope so the access token is accepted by Vertex AI REST APIs (e.g. embeddings).
 */
export function getGoogleAuth(): GoogleAuth {
  if (cachedAuth) return cachedAuth
  const credentialsJson = process.env.GCP_CREDENTIALS_JSON
  const scopes: string[] = [CLOUD_PLATFORM_SCOPE]
  if (credentialsJson) {
    cachedAuth = new GoogleAuth({
      credentials: JSON.parse(credentialsJson) as Record<string, unknown>,
      scopes,
    })
  } else {
    const credentials = getCredentials()
    cachedAuth = new GoogleAuth({ credentials, scopes })
  }
  return cachedAuth
}

/**
 * Returns a Vertex AI client with environment-aware credentials.
 */
export function getVertexAI(): { vertex: VertexAI; config: VertexConfig } {
  if (cachedVertex && cachedConfig) {
    return { vertex: cachedVertex, config: cachedConfig }
  }

  const location = process.env.VERTEX_AI_LOCATION ?? DEFAULT_LOCATION
  const credentials = getCredentials()
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
