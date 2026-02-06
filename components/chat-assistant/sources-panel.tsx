"use client"

import type { ChatSource } from "@/lib/chat-types"
import { ExternalLink } from "lucide-react"

interface SourcesPanelProps {
  sources: ChatSource[]
}

export default function SourcesPanel({ sources }: SourcesPanelProps) {
  if (!sources || sources.length === 0) return null

  return (
    <div className="border-t border-border p-4 bg-secondary/20">
      <p className="text-xs font-semibold text-muted-foreground mb-2">Sources</p>
      <div className="flex flex-col gap-2">
        {sources.map((source, idx) => (
          <a
            key={idx}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
          >
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{source.title}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
