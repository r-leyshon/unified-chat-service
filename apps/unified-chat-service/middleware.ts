import { auth } from "@/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  // Protect /library but allow /library/signin
  if (pathname === "/library" && !req.auth) {
    const signInUrl = new URL("/library/signin", req.nextUrl.origin)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return Response.redirect(signInUrl)
  }
  return undefined
})

export const config = {
  matcher: ["/library"],
}
