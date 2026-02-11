"use client"

import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Suspense } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Github } from "lucide-react"

function SignInContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className="text-xl font-bold text-foreground mb-2">Document Library</h1>
        {error === "AccessDenied" && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            Access denied. Your GitHub account is not authorized to manage the document library. If you believe
            this is an error, contact the administrator.
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-6">
          Sign in with your GitHub account to manage projects and documents. Access is restricted to
          authorized users.
        </p>
        <Button
          className="w-full gap-2"
          onClick={() => signIn("github", { callbackUrl: "/library" })}
        >
          <Github className="w-5 h-5" />
          Sign in with GitHub
        </Button>
      </Card>
      <Link
        href="/"
        className="mt-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Back to demo
      </Link>
    </div>
  )
}

export default function LibrarySignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
