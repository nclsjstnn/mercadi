import { connectDB } from "@/lib/db/connect";
import { Tenant, type ITenant } from "@/lib/db/models/tenant";

export async function resolveStoreTenant(
  slugOrHostname: string
): Promise<ITenant | null> {
  await connectDB();

  // Try by slug first (most common)
  const bySlug = await Tenant.findOne({
    slug: slugOrHostname,
    "store.enabled": true,
    status: "active",
  });
  if (bySlug) return bySlug;

  // Try by custom domain
  const byDomain = await Tenant.findOne({
    "store.customDomain": slugOrHostname,
    "store.customDomainVerified": true,
    "store.enabled": true,
    status: "active",
  });
  return byDomain;
}
