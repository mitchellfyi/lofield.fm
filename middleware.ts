import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Security headers to protect against common web vulnerabilities
 */
const securityHeaders = {
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // Prevent clickjacking
  "X-Frame-Options": "DENY",
  // XSS protection for legacy browsers
  "X-XSS-Protection": "1; mode=block",
  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Permissions Policy (formerly Feature Policy)
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
};

/**
 * Add security headers to a response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  // Public routes that don't require authentication
  const publicPaths = [
    "/",
    "/explore",
    "/auth/sign-in",
    "/auth/sign-up",
    "/auth/callback",
    "/auth/confirm",
  ];
  const isPublicPath = publicPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith("/auth/")
  );

  // API routes that handle their own authentication
  const selfAuthenticatedApiPaths = ["/api/admin/", "/api/explore"];
  const isSelfAuthenticatedApi = selfAuthenticatedApiPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // If the user is not authenticated and trying to access a protected route
  if (!user && !isPublicPath && !isSelfAuthenticatedApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("next", request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(url);
    return addSecurityHeaders(redirectResponse);
  }

  // Add security headers to the response
  return addSecurityHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
