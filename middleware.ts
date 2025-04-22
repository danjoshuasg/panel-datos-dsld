import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath =
    path === "/auth" || path === "/" || path.startsWith("/public/") || path.includes("/_next") || path.includes("/api/")

  // Check if the user is authenticated
  const isAuthenticated = request.cookies.has("auth_session") || request.cookies.has("supabase-auth-token")

  // If the path requires authentication and the user is not authenticated,
  // redirect to the login page
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  // If the user is authenticated and trying to access the login page,
  // redirect to the home page
  if (isAuthenticated && path === "/auth") {
    return NextResponse.redirect(new URL("/auth/inicio", request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
