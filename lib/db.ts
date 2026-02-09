import { Pool } from "pg"

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const url = process.env.POSTGRES_URL
    if (!url) throw new Error("POSTGRES_URL is not set")
    pool = new Pool({ connectionString: url })
  }
  return pool
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
  const db = getPool()
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
    if (code !== "42701") throw e // 42701 = duplicate_column (already exists)
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
}

export async function listProjects(): Promise<Project[]> {
  const { rows } = await getPool().query(
    "SELECT id, name, slug, description, created_at FROM projects ORDER BY name",
  )
  return rows as Project[]
}

export async function createProject(name: string, description?: string | null): Promise<Project> {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
  const { rows } = await getPool().query(
    `INSERT INTO projects (name, slug, description) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET name = $1, description = $3
     RETURNING id, name, slug, description, created_at`,
    [name, slug, description ?? null],
  )
  return rows[0] as Project
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const { rows } = await getPool().query(
    "SELECT id, name, slug, description, created_at FROM projects WHERE slug = $1 LIMIT 1",
    [slug],
  )
  return (rows[0] as Project) ?? null
}

export async function getProjectById(id: string): Promise<Project | null> {
  const { rows } = await getPool().query(
    "SELECT id, name, slug, description, created_at FROM projects WHERE id = $1 LIMIT 1",
    [id],
  )
  return (rows[0] as Project) ?? null
}

export async function updateProjectDescription(
  projectId: string,
  description: string | null,
): Promise<boolean> {
  const { rowCount } = await getPool().query(
    "UPDATE projects SET description = $2 WHERE id = $1",
    [projectId, description],
  )
  return (rowCount ?? 0) > 0
}

/** Delete a project and all its documents and chunks (cascade). Returns true if a row was deleted. */
export async function deleteProject(projectId: string): Promise<boolean> {
  const { rowCount } = await getPool().query("DELETE FROM projects WHERE id = $1", [projectId])
  return (rowCount ?? 0) > 0
}

export async function listDocuments(projectId: string): Promise<Document[]> {
  const { rows } = await getPool().query(
    `SELECT id, project_id, name, file_name, created_at FROM documents
     WHERE project_id = $1 ORDER BY created_at DESC`,
    [projectId],
  )
  return rows as Document[]
}

/** Get document metadata and raw content. Uses stored content if present, else falls back to chunks. */
export async function getDocumentContent(
  documentId: string,
): Promise<{ name: string; file_name: string; content: string } | null> {
  const docRows = await getPool().query(
    "SELECT name, file_name, content FROM documents WHERE id = $1 LIMIT 1",
    [documentId],
  )
  const doc = docRows.rows[0] as { name: string; file_name: string; content: string | null } | undefined
  if (!doc) return null
  if (doc.content != null && doc.content !== "") {
    return { name: doc.name, file_name: doc.file_name, content: doc.content }
  }
  const chunkRows = await getPool().query(
    "SELECT content FROM document_chunks WHERE document_id = $1 ORDER BY id",
    [documentId],
  )
  const content = (chunkRows.rows as { content: string }[]).map((r) => r.content).join("\n\n")
  return { name: doc.name, file_name: doc.file_name, content }
}

/** Update document raw content. */
export async function updateDocumentContent(documentId: string, content: string): Promise<boolean> {
  const { rowCount } = await getPool().query(
    "UPDATE documents SET content = $2 WHERE id = $1",
    [documentId, content],
  )
  return (rowCount ?? 0) > 0
}

/** Delete all chunks for a document (used before re-indexing). */
export async function deleteChunksByDocumentId(documentId: string): Promise<void> {
  await getPool().query("DELETE FROM document_chunks WHERE document_id = $1", [documentId])
}

/** Delete a document and its chunks (cascade). Returns true if a row was deleted. */
export async function deleteDocument(documentId: string): Promise<boolean> {
  const { rowCount } = await getPool().query("DELETE FROM documents WHERE id = $1", [documentId])
  return (rowCount ?? 0) > 0
}

export async function insertDocument(
  projectId: string,
  name: string,
  fileName: string,
  content?: string | null,
): Promise<Document> {
  const { rows } = await getPool().query(
    `INSERT INTO documents (project_id, name, file_name, content) VALUES ($1, $2, $3, $4)
     RETURNING id, project_id, name, file_name, created_at`,
    [projectId, name, fileName, content ?? null],
  )
  return rows[0] as Document
}

export async function insertChunk(
  documentId: string,
  content: string,
  embedding: number[],
): Promise<void> {
  const vec = `[${embedding.join(",")}]`
  await getPool().query(
    "INSERT INTO document_chunks (document_id, content, embedding) VALUES ($1, $2, $3::vector)",
    [documentId, content, vec],
  )
}

/** Cosine similarity search: returns chunks with content for a project. */
export async function searchChunks(
  projectId: string,
  queryEmbedding: number[],
  limit: number = 5,
): Promise<{ content: string; document_name: string }[]> {
  const vec = `[${queryEmbedding.join(",")}]`
  const { rows } = await getPool().query(
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
