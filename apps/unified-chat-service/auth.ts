import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

const allowedUsernames = (process.env.LIBRARY_ALLOWED_GITHUB_USERNAMES ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    signIn: ({ profile }) => {
      if (allowedUsernames.length === 0) {
        return true // No restriction configured, allow all
      }
      const login = (profile as { login?: string })?.login?.toLowerCase()
      if (!login || !allowedUsernames.includes(login)) {
        return "/library/signin?error=AccessDenied"
      }
      return true
    },
  },
  pages: {
    signIn: "/library/signin",
    error: "/library/signin",
  },
})
