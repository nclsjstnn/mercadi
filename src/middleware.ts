import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain routing for tenant storefronts.
 * Rewrites `{tenantSlug}.localhost:3000` → `/store/{tenantSlug}/...`
 *
 * Production subdomain routing (*.mercadi.cl) is handled by
 * vercel.json rewrites — no middleware needed on Vercel.
 */

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const hostnameWithoutPort = hostname.split(":")[0];

  // Only handle *.localhost subdomains (local dev)
  if (!hostnameWithoutPort.endsWith(".localhost")) {
    return NextResponse.next();
  }

  const tenantSlug = hostnameWithoutPort.replace(".localhost", "");
  if (!tenantSlug) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Don't rewrite API, auth, or internal paths
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/store/")
  ) {
    return NextResponse.next();
  }

  // Rewrite to /store/{tenantSlug}{pathname}
  const url = request.nextUrl.clone();
  url.pathname = `/store/${tenantSlug}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
