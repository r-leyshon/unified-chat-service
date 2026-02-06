import { deleteProject } from "@/lib/db"
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
