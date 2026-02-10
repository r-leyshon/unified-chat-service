export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatSource {
  title: string
  url: string
}

export interface ChatResponse {
  answer: string
  sources?: ChatSource[]
}

export interface ChatUser {
  id: string
  name?: string
  email?: string
}

export interface ChatTheme {
  primaryColor?: string
  accentColor?: string
  logoUrl?: string
  fontFamily?: string
  borderRadius?: number
}

export type DisplayMode = "floating" | "inline"

export interface ChatAssistantEvent {
  type: "open" | "close" | "message_sent" | "message_received" | "search" | "error"
  payload?: unknown
}

export interface ChatAssistantProps {
  apiUrl: string
  productId: string
  user?: ChatUser
  theme?: ChatTheme
  displayMode?: DisplayMode
  showSources?: boolean
  maxMessages?: number
  onEvent?: (event: ChatAssistantEvent) => void
  placeholder?: string
  title?: string
  subtitle?: string
}
