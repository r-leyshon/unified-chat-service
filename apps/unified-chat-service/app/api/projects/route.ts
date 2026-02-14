import { auth } from "@/auth"
import { listProjects, createProject } from "@/lib/db"
import { requireLibraryAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

/** Project UUID hidden from dropdown until user has completed GitHub OAuth */
const PROTECTED_PROJECT_ID = "ee621ad8-6db9-4578-901e-6344eabb9f39"

export async function GET() {
  try {
    const projects = await listProjects()
    const session = await auth()
    // Only show protected project to users who have completed GitHub OAuth (library access)
    const filtered =
      session?.user
        ? projects
        : projects.filter((p) => p.id !== PROTECTED_PROJECT_ID)

    return NextResponse.json(filtered)
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
