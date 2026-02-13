"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import type { ChatAssistantProps } from "../../lib/chat-types"
import ChatWindow from "./chat-window"
import FloatingButton from "./floating-button"

export default function ChatAssistant({
  apiUrl,
  productId,
  productName,
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
        productName={productName}
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

  const floatingUI = (
    <>
      <FloatingButton
        onClick={() => {
          const next = !isOpen
          setIsOpen(next)
          onEvent?.({ type: next ? "open" : "close" })
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
        productName={productName}
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

  // Portal to document.body so fixed positioning is viewport-relative (no ancestor transform/containing block)
  if (typeof document !== "undefined") {
    return createPortal(floatingUI, document.body)
  }
  return floatingUI
}
