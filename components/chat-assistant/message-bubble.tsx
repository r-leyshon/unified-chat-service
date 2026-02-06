"use client"

import type { ChatMessage } from "@/lib/chat-types"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: ChatMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-xs px-4 py-3 rounded-lg text-sm leading-relaxed break-words",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-secondary/70 text-foreground rounded-bl-none",
        )}
      >
        <p className="text-pretty">{message.content}</p>
      </div>
    </div>
  )
}
