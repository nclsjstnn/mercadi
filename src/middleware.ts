import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain routing middleware.
 * Rewrites `{tenantSlug}.localhost:3000` → `/store/{tenantSlug}/...`
 * so tenant storefronts are accessible via subdomains.
 */

// Hostnames that should serve the main platform (not a tenant store)
const PLATFORM_HOSTS = new Set([
  "localhost",
  "mercadi.cl",
  "www.mercadi.cl",
]);

// Paths that should never be rewritten (platform routes)
const BYPASS_PREFIXES = [
  "/api/",
  "/login",
  "/register",
  "/admin",
  "/dashboard",
  "/onboarding",
  "/profile",
  "/plans",
  "/test",
  "/docs",
  "/store/",
  "/_next/",
  "/favicon.ico",
];

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const hostnameWithoutPort = hostname.split(":")[0];

  // If it's a known platform host, don't rewrite
  if (PLATFORM_HOSTS.has(hostnameWithoutPort)) {
    return NextResponse.next();
  }

  // Extract subdomain: e.g. "chalaszico.localhost" → "chalaszico"
  // Works for both local dev (*.localhost) and production (*.mercadi.cl)
  let tenantSlug: string | null = null;

  if (hostnameWithoutPort.endsWith(".localhost")) {
    tenantSlug = hostnameWithoutPort.replace(".localhost", "");
  } else if (hostnameWithoutPort.endsWith(".mercadi.cl")) {
    const sub = hostnameWithoutPort.replace(".mercadi.cl", "");
    if (sub !== "www") {
      tenantSlug = sub;
    }
  }

  if (!tenantSlug) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Don't rewrite platform/internal paths
  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Rewrite to /store/{tenantSlug}{pathname}
  const url = request.nextUrl.clone();
  url.pathname = `/store/${tenantSlug}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
