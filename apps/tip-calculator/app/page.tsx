"use client"

import { useState, useEffect } from "react"
import { ChatAssistant } from "unified-chat"
import { Sun, Moon } from "lucide-react"

const TIP_PRESETS = [0, 10, 15, 20, 25] as const
type TipPreset = (typeof TIP_PRESETS)[number] | "custom"

function formatMoney(n: number) {
  return n.toFixed(2)
}

/** Fair split: per-person amounts rounded to nearest cent so sum matches total. Returns array of amounts in dollars. */
function fairSplit(total: number, split: number): number[] {
  if (split <= 0) return []
  const totalCents = Math.round(total * 100)
  const baseCents = Math.floor(totalCents / split)
  let remainder = totalCents - baseCents * split
  const out: number[] = []
  for (let i = 0; i < split; i++) {
    const cents = baseCents + (remainder > 0 ? 1 : 0)
    if (remainder > 0) remainder--
    out.push(cents / 100)
  }
  return out
}

export default function TipCalculatorPage() {
  const [bill, setBill] = useState("")
  const [tipPreset, setTipPreset] = useState<TipPreset>(15)
  const [customTipPct, setCustomTipPct] = useState("")
  const [split, setSplit] = useState(1)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("tip-calculator-theme")
    const preferDark =
      stored !== null ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches
    setDark(preferDark)
    document.documentElement.classList.toggle("dark", preferDark)
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("tip-calculator-theme", next ? "dark" : "light")
  }

  const tipPct =
    tipPreset === "custom"
      ? Math.min(100, Math.max(0, parseInt(customTipPct, 10) || 0))
      : tipPreset

  const numBill = parseFloat(bill) || 0
  const tipAmount = (numBill * tipPct) / 100
  const total = numBill + tipAmount
  const perPersonAmounts = split > 0 ? fairSplit(total, split) : []
  const perPersonDisplay =
    perPersonAmounts.length > 0
      ? perPersonAmounts[0] === perPersonAmounts[perPersonAmounts.length - 1]
        ? formatMoney(perPersonAmounts[0])
        : `${formatMoney(Math.min(...perPersonAmounts))} – ${formatMoney(Math.max(...perPersonAmounts))}`
      : formatMoney(total)

  const handleBillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === "") {
      setBill("")
      return
    }
    const match = raw.match(/^\d*\.?\d*$/)
    if (!match) return
    const parts = raw.split(".")
    if (parts.length > 2) return
    if (parts[1]?.length > 2) return
    setBill(raw)
  }

  const chatServiceUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || ""

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/20">
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-md border border-border bg-background p-2 text-foreground hover:bg-accent"
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </div>

      <h1 className="text-2xl font-semibold text-foreground mb-2">Tip Calculator</h1>
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
        Work out how much to leave as a tip and how to split the total fairly. Enter the bill total, choose a tip %, and how many people are sharing.
      </p>

      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Bill total</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="e.g. 42.50"
              value={bill}
              onChange={handleBillChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">Numbers and one decimal point only; no currency symbol.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tip percentage</label>
            <div className="flex flex-wrap gap-2">
              {TIP_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTipPreset(p)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    tipPreset === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {p}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTipPreset("custom")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tipPreset === "custom"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                Custom
              </button>
            </div>
            {tipPreset === "custom" && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={customTipPct}
                  onChange={(e) => setCustomTipPct(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="Whole number"
                  className="w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Number of people</label>
            <input
              type="number"
              min={1}
              value={split}
              onChange={(e) => setSplit(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">Total is split equally between everyone.</p>
          </div>

          <div className="border-t border-border pt-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tip amount</span>
              <span className="font-medium text-foreground">{formatMoney(tipAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium text-foreground">{formatMoney(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Per person</span>
              <span className="font-medium text-foreground">{perPersonDisplay}</span>
            </div>
            {split > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Rounded to nearest cent so the sum of shares matches the total.
              </p>
            )}
          </div>
        </div>
      </div>

      {chatServiceUrl ? (
        <ChatAssistant
          apiUrl={`${chatServiceUrl}/api/chat`}
          productId={process.env.NEXT_PUBLIC_TIP_CALCULATOR_PRODUCT_ID || ""}
          productName="Tip Calculator"
          eventReportUrl={`${chatServiceUrl}/api/events`}
          user={{ id: "tip-user", name: "Tip User" }}
          displayMode="floating"
          placeholder="Ask about tipping or splitting the bill..."
          title="Tip Help"
          subtitle="Powered by AI"
        />
      ) : null}
    </div>
  )
}
