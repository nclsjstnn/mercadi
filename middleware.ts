import { NextRequest, NextResponse } from "next/server";

const STOREFRONT_BASE_DOMAIN = process.env.STOREFRONT_BASE_DOMAIN || "localhost";

function getSubdomain(hostname: string): string | null {
  // Remove port
  const host = hostname.split(":")[0];

  // Check for {slug}.localhost in dev
  if (STOREFRONT_BASE_DOMAIN === "localhost") {
    const match = host.match(/^([a-z0-9-]+)\.localhost$/);
    return match ? match[1] : null;
  }

  // Check for {slug}.mercadi.cl in prod
  if (host.endsWith(`.${STOREFRONT_BASE_DOMAIN}`) && host !== STOREFRONT_BASE_DOMAIN) {
    const sub = host.slice(0, -(STOREFRONT_BASE_DOMAIN.length + 1));
    // Only single-level subdomains
    if (/^[a-z0-9-]+$/.test(sub)) return sub;
  }

  return null;
}

function isMainDomain(hostname: string): boolean {
  const host = hostname.split(":")[0];
  if (STOREFRONT_BASE_DOMAIN === "localhost") {
    return host === "localhost";
  }
  return host === STOREFRONT_BASE_DOMAIN || host === `www.${STOREFRONT_BASE_DOMAIN}`;
}

// Import reserved subdomains inline to avoid dynamic imports in middleware
const RESERVED = new Set([
  "www", "app", "api", "admin", "dashboard", "mail", "smtp", "ftp",
  "ns1", "ns2", "blog", "help", "support", "docs", "status", "cdn",
  "assets", "static", "media", "auth", "login", "register", "signup",
  "onboarding", "billing", "payments", "store", "shop",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // --- Subdomain-based storefront routing ---
  const subdomain = getSubdomain(hostname);
  if (subdomain && !RESERVED.has(subdomain)) {
    const url = request.nextUrl.clone();
    url.pathname = `/store/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // --- Custom domain routing ---
  if (!isMainDomain(hostname) && !subdomain) {
    const host = hostname.split(":")[0];
    const url = request.nextUrl.clone();
    url.pathname = `/store/_custom/${host}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // --- Existing UCP well-known rewrite ---
  const ucpWellKnownMatch = pathname.match(
    /^\/([a-z0-9-]+)\/\.well-known\/ucp$/
  );
  if (ucpWellKnownMatch) {
    const tenantSlug = ucpWellKnownMatch[1];
    return NextResponse.rewrite(
      new URL(`/api/ucp/${tenantSlug}/.well-known/ucp`, request.url)
    );
  }

  // --- Protected routes check for session token ---
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
    // Storefront catch-all — match everything for subdomain/custom domain detection
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
