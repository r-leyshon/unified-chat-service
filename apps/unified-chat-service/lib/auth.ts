import { auth } from "@/auth"
import { NextResponse } from "next/server"

/**
 * Returns the auth session or a 401 JSON response if not authenticated.
 * Use in protected API routes for document library content management.
 */
export async function requireLibraryAuth() {
  const session = await auth()
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { session, error: null }
}
