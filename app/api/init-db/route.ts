import { initVectorSchema } from "@/lib/db"
import { NextResponse } from "next/server"

/** One-time setup: enable pgvector and create tables. Call once after connecting Vercel Postgres. */
export async function POST() {
  try {
    await initVectorSchema()
    return NextResponse.json({ ok: true, message: "Schema initialized" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Init failed"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
