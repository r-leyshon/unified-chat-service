import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless"
import { Pool as PgPool } from "pg"

type QueryResult = { rows: unknown[]; rowCount: number | null }

function createDbClient() {
  const url = process.env.POSTGRES_URL
  if (!url) throw new Error("POSTGRES_URL is not set")

  const isNeon =
    url.includes("neon.tech") || url.includes("neon.db.ondigitalocean.com")

  // Use Neon serverless Pool for Neon URLs — HTTP fetch, no url.parse/SSL warnings, faster in serverless.
  // Fall back to pg Pool for local Docker Postgres.
  if (isNeon) {
    neonConfig.poolQueryViaFetch = true
  }

  const PoolClass = isNeon ? NeonPool : PgPool
  const pool = new PoolClass({ connectionString: url })
  return {
    query: async (text: string, values?: unknown[]): Promise<QueryResult> => {
      const result = await pool.query(text, values)
      return { rows: result.rows, rowCount: result.rowCount }
    },
  }
}

let db: ReturnType<typeof createDbClient> | null = null

function getDb() {
  if (!db) db = createDbClient()
  return db
}

export type Project = {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: Date
}

export type Document = {
  id: string
  project_id: string
  name: string
  file_name: string
  created_at: Date
}

/** Ensure pgvector extension and tables exist. Run once (e.g. POST /api/init-db). */
export async function initVectorSchema() {
  const db = getDb()
  await db.query("CREATE EXTENSION IF NOT EXISTS vector")
  await db.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  try {
    await db.query("ALTER TABLE projects ADD COLUMN description TEXT")
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code
    if (code !== "42701") throw e
  }
  await db.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  try {
    await db.query("ALTER TABLE documents ADD COLUMN content TEXT")
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code
    if (code !== "42701") throw e
  }
  await db.query(`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      embedding vector(768)
    )
  `)
  await db.query("CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id)")
  await db.query("CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id)")

  await db.query(`
    CREATE TABLE IF NOT EXISTS chat_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id TEXT NOT NULL DEFAULT '',
      product_name TEXT,
      type TEXT NOT NULL,
      payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await db.query("CREATE INDEX IF NOT EXISTS idx_chat_events_product_id ON chat_events(product_id)")
  await db.query("CREATE INDEX IF NOT EXISTS idx_chat_events_created_at ON chat_events(created_at DESC)")
}

export async function listProjects(): Promise<Project[]> {
  const { rows } = await getDb().query(
    "SELECT id, name, slug, description, created_at FROM projects ORDER BY name",
  )
  return rows as Project[]
}

export async function createProject(name: string, description?: string | null): Promise<Project> {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
  const { rows } = await getDb().query(
    `INSERT INTO projects (name, slug, description) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET name = $1, description = $3
     RETURNING id, name, slug, description, created_at`,
    [name, slug, description ?? null],
  )
  return (rows as Project[])[0]
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const { rows } = await getDb().query(
    "SELECT id, name, slug, description, created_at FROM projects WHERE slug = $1 LIMIT 1",
    [slug],
  )
  return ((rows as Project[])[0] as Project) ?? null
}

export async function getProjectById(id: string): Promise<Project | null> {
  const { rows } = await getDb().query(
    "SELECT id, name, slug, description, created_at FROM projects WHERE id = $1 LIMIT 1",
    [id],
  )
  return ((rows as Project[])[0] as Project) ?? null
}

export async function updateProjectDescription(
  projectId: string,
  description: string | null,
): Promise<boolean> {
  const { rowCount } = await getDb().query(
    "UPDATE projects SET description = $2 WHERE id = $1",
    [projectId, description],
  )
  return (rowCount ?? 0) > 0
}

/** Delete a project and all its documents and chunks (cascade). Returns true if a row was deleted. */
export async function deleteProject(projectId: string): Promise<boolean> {
  const { rowCount } = await getDb().query("DELETE FROM projects WHERE id = $1", [projectId])
  return (rowCount ?? 0) > 0
}

export async function listDocuments(projectId: string): Promise<Document[]> {
  const { rows } = await getDb().query(
    `SELECT id, project_id, name, file_name, created_at FROM documents
     WHERE project_id = $1 ORDER BY created_at DESC`,
    [projectId],
  )
  return rows as Document[]
}

/** Get concatenated raw content of all documents in a project (for summarization). */
export async function getProjectDocumentationContent(projectId: string): Promise<string> {
  const docs = await listDocuments(projectId)
  const parts: string[] = []
  for (const d of docs) {
    const result = await getDocumentContent(d.id)
    if (result?.content) {
      parts.push(`[${result.name}]\n${result.content}`)
    }
  }
  return parts.join("\n\n---\n\n")
}

/** Get document metadata and raw content. Uses stored content if present, else falls back to chunks. */
export async function getDocumentContent(
  documentId: string,
): Promise<{ name: string; file_name: string; content: string } | null> {
  const docRows = await getDb().query(
    "SELECT name, file_name, content FROM documents WHERE id = $1 LIMIT 1",
    [documentId],
  )
  const doc = (docRows.rows[0] as { name: string; file_name: string; content: string | null } | undefined)
  if (!doc) return null
  if (doc.content != null && doc.content !== "") {
    return { name: doc.name, file_name: doc.file_name, content: doc.content }
  }
  const chunkRows = await getDb().query(
    "SELECT content FROM document_chunks WHERE document_id = $1 ORDER BY id",
    [documentId],
  )
  const content = (chunkRows.rows as { content: string }[]).map((r) => r.content).join("\n\n")
  return { name: doc.name, file_name: doc.file_name, content }
}

/** Update document raw content. */
export async function updateDocumentContent(documentId: string, content: string): Promise<boolean> {
  const { rowCount } = await getDb().query(
    "UPDATE documents SET content = $2 WHERE id = $1",
    [documentId, content],
  )
  return (rowCount ?? 0) > 0
}

/** Delete all chunks for a document (used before re-indexing). */
export async function deleteChunksByDocumentId(documentId: string): Promise<void> {
  await getDb().query("DELETE FROM document_chunks WHERE document_id = $1", [documentId])
}

/** Delete a document and its chunks (cascade). Returns true if a row was deleted. */
export async function deleteDocument(documentId: string): Promise<boolean> {
  const { rowCount } = await getDb().query("DELETE FROM documents WHERE id = $1", [documentId])
  return (rowCount ?? 0) > 0
}

export async function insertDocument(
  projectId: string,
  name: string,
  fileName: string,
  content?: string | null,
): Promise<Document> {
  const { rows } = await getDb().query(
    `INSERT INTO documents (project_id, name, file_name, content) VALUES ($1, $2, $3, $4)
     RETURNING id, project_id, name, file_name, created_at`,
    [projectId, name, fileName, content ?? null],
  )
  return (rows as Document[])[0]
}

export async function insertChunk(
  documentId: string,
  content: string,
  embedding: number[],
): Promise<void> {
  const vec = `[${embedding.join(",")}]`
  await getDb().query(
    "INSERT INTO document_chunks (document_id, content, embedding) VALUES ($1, $2, $3::vector)",
    [documentId, content, vec],
  )
}

/** Insert a chat event and prune if over MAX_EVENTS. */
const MAX_CHAT_EVENTS = 500
export async function insertChatEvent(
  productId: string,
  productName: string | null,
  type: string,
  payload: unknown,
): Promise<void> {
  const db = getDb()
  const payloadJson = payload != null ? JSON.stringify(payload) : null
  await db.query(
    `INSERT INTO chat_events (product_id, product_name, type, payload)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [productId, productName, type, payloadJson],
  )
  const { rows } = await db.query("SELECT COUNT(*)::int AS cnt FROM chat_events")
  const count = (rows[0] as { cnt: number })?.cnt ?? 0
  if (count > MAX_CHAT_EVENTS) {
    await db.query(
      `DELETE FROM chat_events
       WHERE id IN (
         SELECT id FROM chat_events
         ORDER BY created_at ASC
         LIMIT $1
       )`,
      [count - MAX_CHAT_EVENTS],
    )
  }
}

/** List recent chat events, optionally filtered by productId. */
export async function listChatEvents(productId?: string | null): Promise<
  { productId: string; productName?: string; type: string; payload?: unknown; time: string }[]
> {
  const db = getDb()
  const rows = productId
    ? (await db.query(
        `SELECT product_id, product_name, type, payload, created_at
         FROM chat_events WHERE product_id = $1
         ORDER BY created_at DESC LIMIT 100`,
        [productId],
      )).rows
    : (await db.query(
        `SELECT product_id, product_name, type, payload, created_at
         FROM chat_events
         ORDER BY created_at DESC LIMIT 100`,
      )).rows
  return (rows as Array<{ product_id: string; product_name: string | null; type: string; payload: unknown; created_at: string | Date }>).map(
    (r) => ({
      productId: r.product_id,
      productName: r.product_name ?? undefined,
      type: r.type,
      payload: r.payload,
      time: typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
    }),
  )
}

/** Cosine similarity search: returns chunks with content for a project. */
export async function searchChunks(
  projectId: string,
  queryEmbedding: number[],
  limit: number = 5,
): Promise<{ content: string; document_name: string }[]> {
  const vec = `[${queryEmbedding.join(",")}]`
  const { rows } = await getDb().query(
    `SELECT c.content, d.name AS document_name
     FROM document_chunks c
     JOIN documents d ON d.id = c.document_id
     WHERE d.project_id = $1
     ORDER BY c.embedding <=> $2::vector
     LIMIT $3`,
    [projectId, vec, limit],
  )
  return rows as { content: string; document_name: string }[]
}
