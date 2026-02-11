import { listProjects, createProject } from "@/lib/db"
import { requireLibraryAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const projects = await listProjects()
    return NextResponse.json(projects)
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Failed to list projects"
    const message =
      !process.env.POSTGRES_URL
        ? "POSTGRES_URL is not set. Add it to .env.local (see README)."
        : /relation "projects" does not exist|relation .* does not exist/i.test(raw)
          ? "Database schema not initialized. Run: make init-db (or POST /api/init-db)"
          : raw
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { error } = await requireLibraryAuth()
  if (error) return error
  try {
    const body = await req.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }
    const project = await createProject(name)
    return NextResponse.json(project)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create project"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
