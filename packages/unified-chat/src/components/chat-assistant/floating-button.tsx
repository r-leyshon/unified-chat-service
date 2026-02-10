"use client"

import { MessageCircle } from "lucide-react"
import { cn } from "../../lib/utils"

interface FloatingButtonProps {
  onClick: () => void
  isOpen: boolean
  theme?: {
    primaryColor?: string
    accentColor?: string
  }
}

export default function FloatingButton({ onClick, isOpen, theme }: FloatingButtonProps) {
  if (isOpen) return null
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl z-[10000] flex items-center justify-center",
        "transition-[box-shadow,transform] duration-200",
        "bg-primary hover:bg-primary/90",
      )}
      style={{
        // Fallback so button is always bottom-right and sized even if Tailwind content scan misses the package
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        zIndex: 10000,
        ...(theme?.primaryColor ? { backgroundColor: theme.primaryColor } : {}),
      }}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      <MessageCircle className="w-6 h-6 text-primary-foreground" style={{ width: 24, height: 24 }} />
    </button>
  )
}
