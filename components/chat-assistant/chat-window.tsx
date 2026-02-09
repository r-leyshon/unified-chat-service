"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import type { ChatMessage, ChatResponse, ChatTheme } from "@/lib/chat-types"
import MessageBubble from "./message-bubble"
import SourcesPanel from "./sources-panel"
import { Send, X } from "lucide-react"

interface ChatWindowProps {
  isOpen: boolean
  onClose: () => void
  apiUrl: string
  productId: string
  userId: string
  userName?: string
  theme?: ChatTheme
  showSources?: boolean
  maxMessages?: number
  placeholder?: string
  title?: string
  subtitle?: string
  onEvent?: (event: import("@/lib/chat-types").ChatAssistantEvent) => void
}

export default function ChatWindow({
  isOpen,
  onClose,
  apiUrl,
  productId,
  userId,
  userName,
  theme,
  showSources = true,
  maxMessages = 50,
  placeholder = "Ask me anything...",
  title = "Chat Assistant",
  subtitle = "Powered by AI",
  onEvent,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [currentSources, setCurrentSources] = useState<ChatResponse["sources"]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput("")

    // Add user message to UI immediately
    const newUserMessage: ChatMessage = { role: "user", content: userMessage }
    setMessages((prev) => [...prev.slice(-maxMessages + 1), newUserMessage])

    onEvent?.({ type: "message_sent", payload: { content: userMessage } })

    setIsLoading(true)
    setStatusMessage(null)

    try {
      // Create assistant placeholder message
      const assistantMessage: ChatMessage = { role: "assistant", content: "" }
      setMessages((prev) => [...prev, assistantMessage])

      // Stream response from backend
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          user: {
            id: userId,
            name: userName,
          },
          messages: [...messages, newUserMessage],
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let fullAnswer = ""
      let sources: ChatResponse["sources"] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === "status") {
                setStatusMessage(data.message ?? "Looking up guidance…")
              } else if (data.type === "content") {
                setStatusMessage(null)
                fullAnswer += data.content
                // Update message with streamed content
                setMessages((prev) => {
                  const updated = [...prev]
                  if (updated[updated.length - 1].role === "assistant") {
                    updated[updated.length - 1].content = fullAnswer
                  }
                  return updated
                })
              } else if (data.type === "sources") {
                sources = data.sources
                setCurrentSources(sources)
              } else if (data.type === "done") {
                setStatusMessage(null)
                onEvent?.({
                  type: "message_received",
                  payload: { answer: fullAnswer, sources },
                })
              }
            } catch (e) {
              // Ignore JSON parse errors on non-data lines
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get response"
      onEvent?.({ type: "error", payload: { error: errorMessage } })

      // Remove incomplete assistant message
      setMessages((prev) => prev.slice(0, -1))

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
      setStatusMessage(null)
    }
  }

  if (!isOpen) return null

  const themeStyles = {
    "--chat-primary": theme?.primaryColor || "#3b82f6",
    "--chat-accent": theme?.accentColor || "#10b981",
    "--chat-radius": theme?.borderRadius ? `${theme.borderRadius}px` : "12px",
  } as React.CSSProperties

  return (
    <div
      className="fixed bottom-0 right-0 w-full sm:w-96 h-screen sm:h-[600px] sm:rounded-t-lg bg-background border-l border-t border-border shadow-2xl z-50 flex flex-col"
      style={themeStyles}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-secondary rounded-md transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="flex flex-col gap-4 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm text-muted-foreground">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 items-center px-3 py-2 rounded-lg bg-secondary/50">
                    <Spinner className="w-4 h-4" />
                    <span className="text-xs text-muted-foreground">
                      {statusMessage || "Thinking…"}
                    </span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Sources Section */}
      {showSources && currentSources && currentSources.length > 0 && <SourcesPanel sources={currentSources} />}

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-gradient-to-t from-background to-background">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 bg-secondary/50 border-secondary focus:border-primary"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
