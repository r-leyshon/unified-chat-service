"use client"

import { useState } from "react"
import type { ChatAssistantProps } from "@/lib/chat-types"
import ChatWindow from "./chat-window"
import FloatingButton from "./floating-button"

export default function ChatAssistant({
  apiUrl,
  productId,
  user,
  theme,
  displayMode = "floating",
  showSources = true,
  maxMessages = 50,
  placeholder,
  title,
  subtitle,
  onEvent,
}: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)

  const userId = user?.id ?? "anonymous"
  const userName = user?.name

  if (displayMode === "inline") {
    return (
      <ChatWindow
        isOpen={true}
        onClose={() => {}}
        apiUrl={apiUrl}
        productId={productId}
        userId={userId}
        userName={userName}
        theme={theme}
        showSources={showSources}
        maxMessages={maxMessages}
        placeholder={placeholder}
        title={title}
        subtitle={subtitle}
        onEvent={onEvent}
      />
    )
  }

  return (
    <>
      <FloatingButton
        onClick={() => {
          setIsOpen((prev) => {
            const next = !prev
            onEvent?.({ type: next ? "open" : "close" })
            return next
          })
        }}
        isOpen={isOpen}
        theme={theme}
      />
      <ChatWindow
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false)
          onEvent?.({ type: "close" })
        }}
        apiUrl={apiUrl}
        productId={productId}
        userId={userId}
        userName={userName}
        theme={theme}
        showSources={showSources}
        maxMessages={maxMessages}
        placeholder={placeholder}
        title={title}
        subtitle={subtitle}
        onEvent={onEvent}
      />
    </>
  )
}
