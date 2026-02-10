import { listDocuments } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }
  try {
    const documents = await listDocuments(projectId)
    return NextResponse.json(documents)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list documents"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
