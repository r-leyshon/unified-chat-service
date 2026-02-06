"use client"

import type { ChatMessage } from "@/lib/chat-types"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

interface MessageBubbleProps {
  message: ChatMessage
}

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="my-2 list-disc pl-4 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="my-2 list-decimal pl-4 space-y-0.5">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "px-4 py-3 rounded-lg text-sm leading-relaxed break-words",
          isUser ? "max-w-xs" : "max-w-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-secondary/70 text-foreground rounded-bl-none",
        )}
      >
        {isUser ? (
          <p className="text-pretty">{message.content}</p>
        ) : (
          <div className="text-pretty [&_p]:mb-2 [&_p:last-child]:mb-0">
            <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
