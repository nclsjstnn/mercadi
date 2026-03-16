import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rewrite /{tenantSlug}/.well-known/ucp to API route
  const ucpWellKnownMatch = pathname.match(
    /^\/([a-z0-9-]+)\/\.well-known\/ucp$/
  );
  if (ucpWellKnownMatch) {
    const tenantSlug = ucpWellKnownMatch[1];
    return NextResponse.rewrite(
      new URL(`/api/ucp/${tenantSlug}/.well-known/ucp`, request.url)
    );
  }

  // Protected routes check for session token
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/onboarding") ||
    pathname === "/profile" ||
    pathname === "/plans" ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/tenant");

  if (isProtected) {
    const token =
      request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
    "/profile",
    "/plans",
    "/api/admin/:path*",
    "/api/tenant/:path*",
    "/:tenantSlug/.well-known/ucp",
  ],
};
