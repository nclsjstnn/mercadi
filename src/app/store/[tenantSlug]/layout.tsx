import { notFound } from "next/navigation";
import { resolveStoreTenant } from "@/lib/store/resolve-tenant";
import { User } from "@/lib/db/models/user";
import { connectDB } from "@/lib/db/connect";
import { PLAN_LIMITS, type PlanType } from "@/lib/config/plans";
import { CartProvider } from "@/components/store/cart-provider";
import { StoreHeader } from "@/components/store/store-header";
import { StoreFooter } from "@/components/store/store-footer";
import { CartButton } from "@/components/store/cart-button";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  // Handle custom domain routing
  const isCustomDomain = tenantSlug === "_custom";
  let resolveKey = tenantSlug;
  if (isCustomDomain) {
    // For custom domains the actual hostname would be the next segment,
    // but we handle it in the _custom route group instead
    return notFound();
  }

  const tenant = await resolveStoreTenant(resolveKey);
  if (!tenant) return notFound();

  await connectDB();
  const owner = await User.findById(tenant.ownerId).select("plan").lean();
  const plan = (owner?.plan || "free") as PlanType;
  const showBranding = !PLAN_LIMITS[plan].removeBranding;

  const theme = tenant.store?.theme || {
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    accentColor: "#f59e0b",
    logoUrl: "",
    faviconUrl: "",
  };

  return (
    <div
      style={
        {
          "--store-primary": theme.primaryColor,
          "--store-secondary": theme.secondaryColor,
          "--store-accent": theme.accentColor,
        } as React.CSSProperties
      }
    >
      <CartProvider tenantSlug={tenant.slug}>
        <StoreHeader
          businessName={tenant.name}
          logoUrl={theme.logoUrl || undefined}
        />
        <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 sm:px-6">
          {children}
        </main>
        <StoreFooter businessName={tenant.name} showBranding={showBranding} />
        <CartButton />
      </CartProvider>
    </div>
  );
}
