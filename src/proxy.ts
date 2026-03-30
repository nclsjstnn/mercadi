import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain routing middleware.
 *
 * booty.mercadi.cl        → rewrite to /store/booty
 * booty.mercadi.cl/cart   → rewrite to /store/booty/cart
 *
 * Configure the base domain via NEXT_PUBLIC_ROOT_DOMAIN env var.
 * Defaults to "mercadi.cl" so it works on the .cl domain out of the box.
 *
 * On Vercel: add *.mercadi.cl as a wildcard domain in project settings.
 * On DNS: add a wildcard A record  *.mercadi.cl → same IP as mercadi.cl
 *         (or CNAME *.mercadi.cl → cname.vercel-dns.com for Vercel).
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "mercadi.cl";

// Subdomains that should never route to a tenant store
const RESERVED = new Set([
  "www", "app", "api", "admin", "dashboard", "mail", "smtp",
  "ftp", "ns1", "ns2", "blog", "help", "support", "docs",
  "status", "cdn", "assets", "static", "media", "auth",
  "login", "register", "signup", "onboarding", "billing",
  "payments", "store", "shop",
]);

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // Never rewrite API routes, Next.js internals, or paths already under /store/
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/store/") ||
    pathname.startsWith("/checkout/transbank-redirect")
  ) {
    return NextResponse.next();
  }

  // Only act when request comes in on a subdomain of ROOT_DOMAIN.
  // Passthrough for:
  //   mercadi.cl          (no subdomain)
  //   www.mercadi.cl      (www)
  //   anything.vercel.app (Vercel preview URLs — no wildcard store there)
  //   localhost:*         (local dev without subdomain)
  if (
    hostname === ROOT_DOMAIN ||
    hostname === `www.${ROOT_DOMAIN}` ||
    !hostname.endsWith(`.${ROOT_DOMAIN}`)
  ) {
    return NextResponse.next();
  }

  // Extract subdomain: "booty.mercadi.cl" → "booty"
  const subdomain = hostname.slice(0, hostname.length - ROOT_DOMAIN.length - 1);

  // Skip nested subdomains (e.g., a.b.mercadi.cl) and reserved names
  if (subdomain.includes(".") || RESERVED.has(subdomain.toLowerCase())) {
    return NextResponse.next();
  }

  // Rewrite:
  //   booty.mercadi.cl/          → /store/booty
  //   booty.mercadi.cl/cart      → /store/booty/cart
  //   booty.mercadi.cl/product/1 → /store/booty/product/1
  const rewritePath = `/store/${subdomain}${pathname === "/" ? "" : pathname}`;
  const url = request.nextUrl.clone();
  url.pathname = rewritePath;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf)).*)",
  ],
};
