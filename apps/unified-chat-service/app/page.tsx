"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChatAssistant } from "unified-chat"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ChevronDown, ChevronUp } from "lucide-react"

const EVENT_LOG_KEY = "unified-chat-demo-events"
const MAX_PERSISTED = 100

type Project = { id: string; name: string; slug: string; description?: string | null }
type LogEvent = { type: string; time: string; payload?: unknown; source?: "demo" | "remote"; productName?: string }

function loadPersistedEvents(): LogEvent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(EVENT_LOG_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_PERSISTED) : []
  } catch {
    return []
  }
}

function savePersistedEvents(events: LogEvent[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(events.slice(0, MAX_PERSISTED)))
  } catch {
    // ignore
  }
}

function formatEventPayload(event: LogEvent): string {
  if (!event.payload || typeof event.payload !== "object") return ""
  const p = event.payload as Record<string, unknown>
  if (event.type === "message_sent" && "content" in p)
    return String(p.content)
  if (event.type === "message_received") {
    const parts: string[] = []
    if ("answer" in p && p.answer) parts.push(String(p.answer))
    if ("sources" in p && Array.isArray(p.sources) && p.sources.length > 0) {
      parts.push("\nSources:")
      ;(p.sources as Array<{ title?: string; url?: string }>).forEach((s, i) => {
        parts.push(`  ${i + 1}. ${s.title ?? "—"} ${s.url ?? ""}`)
      })
    }
    return parts.join("\n")
  }
  if (event.type === "search" && "searchTerms" in p && Array.isArray(p.searchTerms))
    return (p.searchTerms as string[]).join(", ")
  if (event.type === "error" && "error" in p) return String(p.error)
  return JSON.stringify(p, null, 2)
}

export default function Home() {
  const [displayMode, setDisplayMode] = useState<"floating" | "inline">("floating")
  const [events, setEvents] = useState<LogEvent[]>([])
  const [remoteEvents, setRemoteEvents] = useState<LogEvent[]>([])
  const [expandedEventKey, setExpandedEventKey] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [projectsLoading, setProjectsLoading] = useState(true)

  useEffect(() => {
    setEvents(loadPersistedEvents())
  }, [])
  useEffect(() => {
    const fetchRemote = () => {
      fetch("/api/events")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setRemoteEvents(
              data.map((e: { type: string; time: string; payload?: unknown; productId?: string; productName?: string }) => ({
                type: e.type,
                time: e.time,
                payload: e.payload,
                productName: e.productName,
                source: "remote" as const,
              })),
            )
          }
        })
        .catch(() => {})
    }
    fetchRemote()
    const t = setInterval(fetchRemote, 2000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data)
      })
      .catch(() => {})
      .finally(() => setProjectsLoading(false))
  }, [])

  const handleEvent = useCallback(
    (event: { type: string; payload?: unknown }) => {
      if (event.type === "open" || event.type === "close") return
      const now = new Date().toLocaleTimeString()
      const logEvent: LogEvent = { type: event.type, time: now, payload: event.payload, source: "demo" }
      setEvents((prev) => {
        const next = [logEvent, ...prev.slice(0, MAX_PERSISTED - 1)]
        savePersistedEvents(next)
        return next
      })
    },
    [],
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Unified Chat Assistant</h1>
            <p className="text-muted-foreground">A frontend component library + central service for in-product AI chat</p>
          </div>
          <Link href="/library">
            <Button variant="outline" size="sm">Document Library</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Demo */}
          <div className="lg:col-span-2">
            <Card className="p-8 bg-gradient-to-br from-card to-card/50 border-border/50">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-foreground mb-2">Chat Assistant Demo</h2>
                <p className="text-sm text-muted-foreground">
                  Try the chat widget. Switch between floating and inline modes to see how it adapts.
                  Select a project to test chat as if from that product (RAG uses that project&apos;s docs).
                </p>
              </div>

              {/* Project selector: simulates consumer app passing product_id */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Chat as product (product_id)
                </label>
                {projectsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Spinner className="w-4 h-4" /> Loading projects…
                  </div>
                ) : (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">No project (no RAG)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                {selectedProjectId && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    product_id = <code className="bg-secondary px-1 rounded">{selectedProjectId}</code>
                  </p>
                )}
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-3 mb-8">
                <Button
                  variant={displayMode === "floating" ? "default" : "outline"}
                  onClick={() => setDisplayMode("floating")}
                >
                  Floating Mode
                </Button>
                <Button
                  variant={displayMode === "inline" ? "default" : "outline"}
                  onClick={() => setDisplayMode("inline")}
                >
                  Inline Mode
                </Button>
              </div>

              {/* Chat Component */}
              {displayMode === "inline" && (
                <div className="border border-border/50 rounded-lg overflow-hidden bg-background/50">
                  <ChatAssistant
                    apiUrl="/api/chat"
                    productId={selectedProjectId}
                    user={{
                      id: "demo-user-123",
                      name: "Demo User",
                      email: "demo@example.com",
                    }}
                    productName="Demo"
                    eventReportUrl="/api/events"
                    displayMode="inline"
                    showSources={true}
                    maxMessages={50}
                    placeholder="Ask me anything about the product..."
                    title="Product Assistant"
                    subtitle="Powered by AI"
                    theme={{
                      primaryColor: "#3b82f6",
                      accentColor: "#10b981",
                    }}
                    onEvent={handleEvent}
                  />
                </div>
              )}

              {displayMode === "floating" && (
                <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                  <p className="text-sm">Look for the chat button in the bottom-right corner</p>
                </div>
              )}
            </Card>
          </div>

          {/* Event Log */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50 sticky top-24">
              <h3 className="text-lg font-semibold text-foreground mb-1">Event Log</h3>
              <p className="text-xs text-muted-foreground mb-4">Click to expand detail</p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[...remoteEvents, ...events].length === 0 ? (
                  <p className="text-xs text-muted-foreground">No events yet. Try sending a message!</p>
                ) : (
                  [...remoteEvents, ...events].map((event, idx) => {
                    const eventKey = `${event.source ?? "demo"}-${event.time}-${event.type}-${idx}`
                    const fullPayload = formatEventPayload(event)
                    const hasPayload = fullPayload.length > 0
                    const isExpanded = expandedEventKey === eventKey
                    return (
                      <div key={eventKey} className="rounded border border-border/50 bg-secondary/50 overflow-hidden">
                        <button
                          type="button"
                          className="w-full text-left text-xs p-2 hover:bg-secondary/80 transition-colors cursor-pointer"
                          onClick={() => setExpandedEventKey((k) => (k === eventKey ? null : eventKey))}
                        >
                          <span className="font-mono text-primary">
                            {event.type === "search" &&
                            event.payload &&
                            typeof event.payload === "object" &&
                            "searchTerms" in event.payload &&
                            Array.isArray(event.payload.searchTerms)
                              ? `search: ${(event.payload.searchTerms as string[]).join(", ")}`
                              : event.type}
                          </span>
                          <br />
                          <span className="text-muted-foreground">
                            {event.time}
                            {event.source === "remote" && event.productName && (
                              <> · {event.productName}</>
                            )}
                            {hasPayload && (
                              <span className="ml-1 inline-flex items-center gap-0.5">
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3 inline" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 inline" />
                                )}
                              </span>
                            )}
                          </span>
                        </button>
                        {hasPayload && isExpanded && (
                          <div className="border-t border-border/50 p-2 bg-background/50 max-h-48 overflow-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground">
                              {fullPayload}
                            </pre>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Floating Chat */}
        {displayMode === "floating" && (
          <ChatAssistant
            apiUrl="/api/chat"
            productId={selectedProjectId}
            productName="Demo"
            eventReportUrl="/api/events"
            user={{
              id: "demo-user-123",
              name: "Demo User",
              email: "demo@example.com",
            }}
            displayMode="floating"
            showSources={true}
            maxMessages={50}
            placeholder="Ask me anything..."
            title="Product Assistant"
            subtitle="Powered by AI"
            theme={{
              primaryColor: "#3b82f6",
              accentColor: "#10b981",
            }}
            onEvent={handleEvent}
          />
        )}
      </main>
    </div>
  )
}
