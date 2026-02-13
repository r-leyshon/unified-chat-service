import { NextRequest } from "next/server"
import { pushEvent, getEvents } from "@/lib/events"

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin")
  const allowed =
    process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? []
  const allow = !origin || allowed.includes("*") || allowed.includes(origin)
  return {
    "Access-Control-Allow-Origin": allow && origin ? origin : allowed[0] ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  }
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) })
}

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId")
  const events = await getEvents(productId)
  return Response.json(events, { headers: getCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const headers = getCorsHeaders(req)
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers })
  try {
    const body = await req.json()
    const { productId, productName, type, payload } = body
    if (!type || typeof type !== "string") {
      return Response.json(
        { error: "type (string) required" },
        { status: 400, headers }
      )
    }
    await pushEvent({
      productId: typeof productId === "string" ? productId : "",
      productName: typeof productName === "string" ? productName : undefined,
      type,
      payload,
    })
    return Response.json({ ok: true }, { status: 201, headers })
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400, headers })
  }
}
