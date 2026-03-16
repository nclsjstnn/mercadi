export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "mail",
  "smtp",
  "ftp",
  "ns1",
  "ns2",
  "blog",
  "help",
  "support",
  "docs",
  "status",
  "cdn",
  "assets",
  "static",
  "media",
  "auth",
  "login",
  "register",
  "signup",
  "onboarding",
  "billing",
  "payments",
  "store",
  "shop",
]);

export function isReservedSubdomain(slug: string): boolean {
  return RESERVED_SUBDOMAINS.has(slug.toLowerCase());
}
