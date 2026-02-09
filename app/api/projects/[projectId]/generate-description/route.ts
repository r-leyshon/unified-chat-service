import { getProjectById, getProjectDocumentationContent } from "@/lib/db"
import { SUMMARY_PROMPT } from "@/lib/prompts"
import { getGeminiModel } from "@/lib/vertex-ai"
import { NextResponse } from "next/server"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }
  try {
    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    const documentation = await getProjectDocumentationContent(projectId)
    if (!documentation.trim()) {
      return NextResponse.json(
        { error: "No documentation content yet. Upload and store documents first." },
        { status: 400 },
      )
    }
    const model = getGeminiModel()
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${SUMMARY_PROMPT}\n\n---\n\n${documentation.slice(0, 30000)}` }],
        },
      ],
    })
    const text =
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "No summary generated."
    return NextResponse.json({ description: text })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate description"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
