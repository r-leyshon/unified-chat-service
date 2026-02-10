"use client"

import { useState, useEffect, useCallback } from "react"
import { ChatAssistant } from "unified-chat"
import { Play, Pause, RotateCcw } from "lucide-react"

const WORK_SEC = 25 * 60
const SHORT_BREAK_SEC = 5 * 60
const LONG_BREAK_SEC = 15 * 60
const CYCLES_BEFORE_LONG = 4

type Phase = "work" | "shortBreak" | "longBreak"

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export default function PomodoroPage() {
  const [phase, setPhase] = useState<Phase>("work")
  const [timeLeft, setTimeLeft] = useState(WORK_SEC)
  const [isRunning, setIsRunning] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)

  const totalForPhase = phase === "work" ? WORK_SEC : phase === "shortBreak" ? SHORT_BREAK_SEC : LONG_BREAK_SEC

  const resetCurrentPhase = useCallback(() => {
    setTimeLeft(totalForPhase)
  }, [totalForPhase])

  const advancePhase = useCallback(() => {
    if (phase === "work") {
      const nextCycle = cycleCount + 1
      setCycleCount(nextCycle)
      if (nextCycle >= CYCLES_BEFORE_LONG) {
        setCycleCount(0)
        setPhase("longBreak")
        setTimeLeft(LONG_BREAK_SEC)
      } else {
        setPhase("shortBreak")
        setTimeLeft(SHORT_BREAK_SEC)
      }
    } else {
      setPhase("work")
      setTimeLeft(WORK_SEC)
    }
    setIsRunning(true)
  }, [phase, cycleCount])

  useEffect(() => {
    if (!isRunning) return
    const t = setInterval(() => setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1)), 1000)
    return () => clearInterval(t)
  }, [isRunning])

  useEffect(() => {
    if (isRunning && timeLeft <= 0) {
      advancePhase()
    }
  }, [isRunning, timeLeft, advancePhase])

  const chatServiceUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || ""
  const productId = process.env.NEXT_PUBLIC_POMODORO_PRODUCT_ID || ""

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/20">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Minimal Pomodoro</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Work 25 min → short break 5 min. After 4 work blocks, take a long break (15 min).
      </p>

      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {phase === "work" ? "Work" : phase === "shortBreak" ? "Short break" : "Long break"}
          </p>
          <p className="text-6xl font-mono font-semibold tabular-nums text-foreground">
            {formatTime(timeLeft)}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsRunning((r) => !r)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground h-10 px-4 text-sm font-medium hover:bg-primary/90"
          >
            {isRunning ? (
              <>
                <Pause className="size-4" /> Pause
              </>
            ) : (
              <>
                <Play className="size-4" /> Start
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRunning(false)
              resetCurrentPhase()
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background h-10 px-4 text-sm font-medium hover:bg-accent"
          >
            <RotateCcw className="size-4" /> Reset
          </button>
        </div>

        {cycleCount > 0 && (
          <p className="text-xs text-muted-foreground">
            Work blocks this round: {cycleCount} / {CYCLES_BEFORE_LONG}
          </p>
        )}
      </div>

      {chatServiceUrl && productId && (
        <ChatAssistant
          apiUrl={`${chatServiceUrl}/api/chat`}
          productId={productId}
          productName="Minimal Pomodoro"
          eventReportUrl={`${chatServiceUrl}/api/events`}
          user={{ id: "pomodoro-user", name: "Pomodoro User" }}
          displayMode="floating"
          placeholder="Ask about the Pomodoro technique..."
          title="Pomodoro Help"
          subtitle="Powered by AI"
          theme={{ primaryColor: "#3b82f6", accentColor: "#10b981" }}
        />
      )}
    </div>
  )
}
