import { deleteProject, updateProjectDescription } from "@/lib/db"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }
  try {
    const deleted = await deleteProject(projectId)
    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete project"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const description =
      typeof body.description === "string" ? body.description : body.description === null ? null : undefined
    if (description === undefined) {
      return NextResponse.json({ error: "description (string or null) is required" }, { status: 400 })
    }
    const updated = await updateProjectDescription(projectId, description)
    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update project"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
