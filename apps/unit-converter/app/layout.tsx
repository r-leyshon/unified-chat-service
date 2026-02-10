import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Unit Converter",
  description: "Convert between units with AI help.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
