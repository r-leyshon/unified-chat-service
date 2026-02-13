"use client"

import { useState, useMemo } from "react"
import { ChatAssistant } from "unified-chat"
import { ArrowRightLeft } from "lucide-react"

const MAX_INPUT_LENGTH = 15

type Category = "length" | "weight" | "volume"

const LENGTH_UNITS = [
  { id: "m", label: "Metres (m)", toBase: 1 },
  { id: "km", label: "Kilometres (km)", toBase: 1000 },
  { id: "mi", label: "Miles (mi)", toBase: 1609.344 },
  { id: "ft", label: "Feet (ft)", toBase: 0.3048 },
  { id: "in", label: "Inches (in)", toBase: 0.0254 },
  { id: "cm", label: "Centimetres (cm)", toBase: 0.01 },
  { id: "yd", label: "Yards (yd)", toBase: 0.9144 },
  { id: "mm", label: "Millimetres (mm)", toBase: 0.001 },
] as const

const WEIGHT_UNITS = [
  { id: "kg", label: "Kilograms (kg)", toBase: 1 },
  { id: "g", label: "Grams (g)", toBase: 0.001 },
  { id: "lb", label: "Pounds (lb)", toBase: 0.45359237 },
  { id: "oz", label: "Ounces (oz)", toBase: 0.028349523125 },
  { id: "st", label: "Stone (st)", toBase: 6.35029318 },
  { id: "mg", label: "Milligrams (mg)", toBase: 0.000001 },
] as const

const VOLUME_UNITS = [
  { id: "L", label: "Litres (L)", toBase: 1 },
  { id: "mL", label: "Millilitres (mL)", toBase: 0.001 },
  { id: "gal", label: "Gallons (gal)", toBase: 4.54609 },
  { id: "galUS", label: "US Gallons (gal US)", toBase: 3.785411784 },
  { id: "floz", label: "Fluid ounces (fl oz)", toBase: 0.0295735295625 },
  { id: "cup", label: "Cups (cup)", toBase: 0.2365882365 },
  { id: "tbsp", label: "Tablespoons (tbsp)", toBase: 0.01478676478125 },
  { id: "tsp", label: "Teaspoons (tsp)", toBase: 0.00492892159375 },
] as const

function convert(
  value: number,
  fromId: string,
  toId: string,
  units: readonly { id: string; toBase: number }[],
): number {
  const from = units.find((u) => u.id === fromId)
  const to = units.find((u) => u.id === toId)
  if (!from || !to) return value
  const base = value * from.toBase
  return base / to.toBase
}

function formatResult(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e6 || (abs > 0 && abs < 1e-4)) {
    return value.toExponential(2)
  }
  const magnitude = abs >= 1 ? Math.floor(Math.log10(abs)) + 1 : 0
  const decimals = Math.min(6, Math.max(2, 6 - magnitude))
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: value % 1 === 0 ? 0 : Math.min(2, decimals),
  })
}

export default function UnitConverterPage() {
  const [category, setCategory] = useState<Category>("length")
  const [amount, setAmount] = useState("100")
  const [fromUnit, setFromUnit] = useState("m")
  const [toUnit, setToUnit] = useState("ft")

  const units = category === "length" ? LENGTH_UNITS : category === "weight" ? WEIGHT_UNITS : VOLUME_UNITS

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    let cleaned = raw.replace(/\s/g, "")
    if (cleaned.length > MAX_INPUT_LENGTH) cleaned = cleaned.slice(0, MAX_INPUT_LENGTH)
    const parts = cleaned.split(".")
    if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("")
    if (cleaned !== "" && !/^\d*\.?\d*$/.test(cleaned)) return
    setAmount(cleaned)
  }

  const num = useMemo(() => parseFloat(amount) || 0, [amount])
  const result = useMemo(
    () => (fromUnit === toUnit ? num : convert(num, fromUnit, toUnit, units)),
    [num, fromUnit, toUnit, units],
  )

  const chatServiceUrl = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || ""
  const productId = process.env.NEXT_PUBLIC_UNIT_CONVERTER_PRODUCT_ID || ""

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/20">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Unit Converter</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Convert values in one category at a time. Choose category, enter value, then From and To units.
      </p>

      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Category</label>
            <div className="flex gap-2">
              {(["length", "weight", "volume"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat)
                    const u = cat === "length" ? LENGTH_UNITS : cat === "weight" ? WEIGHT_UNITS : VOLUME_UNITS
                    setFromUnit(u[0].id)
                    setToUnit(u[1]?.id ?? u[0].id)
                  }}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize ${
                    category === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Value to convert</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                maxLength={MAX_INPUT_LENGTH}
                placeholder="Numbers and one decimal only"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Max {MAX_INPUT_LENGTH} characters, no spaces or units</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">From</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-center text-muted-foreground">
            <ArrowRightLeft className="size-5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">To</label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Result</label>
            <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground font-mono tabular-nums">
              {formatResult(result)}
            </div>
          </div>
        </div>
      </div>

      {chatServiceUrl && productId && (
        <ChatAssistant
          apiUrl={`${chatServiceUrl}/api/chat`}
          productId={productId}
          productName="Unit Converter"
          user={{ id: "converter-user", name: "Converter User" }}
          displayMode="floating"
          placeholder="Ask about unit conversions..."
          title="Conversion Help"
          subtitle="Powered by AI"
        />
      )}
    </div>
  )
}
