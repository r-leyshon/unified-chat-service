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
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl z-40 flex items-center justify-center",
        "transition-[box-shadow,transform] duration-200",
        isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90",
      )}
      style={!isOpen && theme?.primaryColor ? { backgroundColor: theme.primaryColor } : {}}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      <MessageCircle className="w-6 h-6 text-primary-foreground" />
    </button>
  )
}
