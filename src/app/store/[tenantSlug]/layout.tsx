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

  const theme = tenant.store?.theme || {};

  const primary = theme.primaryColor || "#2563eb";
  const secondary = theme.secondaryColor || "#1e40af";
  const accent = theme.accentColor || "#f59e0b";
  const bg = theme.backgroundColor || "#ffffff";
  const surface = theme.surfaceColor || "#f9fafb";
  const text = theme.textColor || "#111827";
  const muted = theme.mutedColor || "#6b7280";
  const radius = theme.borderRadius || "8px";
  const headingFont = theme.headingFont || "";
  const bodyFont = theme.bodyFont || "";

  // Build Google Fonts URL if AI theme has custom fonts
  const googleFontsHref =
    headingFont || bodyFont
      ? `https://fonts.googleapis.com/css2?${[
          headingFont && `family=${encodeURIComponent(headingFont)}:wght@400;600;700`,
          bodyFont && bodyFont !== headingFont && `family=${encodeURIComponent(bodyFont)}:wght@400;500;600`,
        ]
          .filter(Boolean)
          .join("&")}&display=swap`
      : null;

  const fontStack = (name: string) =>
    name ? `"${name}", system-ui, sans-serif` : "system-ui, sans-serif";

  return (
    <>
      {googleFontsHref && (
        <link rel="stylesheet" href={googleFontsHref} />
      )}
      <div
        style={
          {
            "--store-primary": primary,
            "--store-secondary": secondary,
            "--store-accent": accent,
            "--store-bg": bg,
            "--store-surface": surface,
            "--store-text": text,
            "--store-muted": muted,
            "--store-radius": radius,
            "--store-font-heading": fontStack(headingFont),
            "--store-font-body": fontStack(bodyFont),
            backgroundColor: bg,
            color: text,
            fontFamily: fontStack(bodyFont),
          } as React.CSSProperties
        }
      >
        <CartProvider tenantSlug={tenant.slug}>
          <StoreHeader
            businessName={tenant.name}
            tenantSlug={tenant.slug}
            logoUrl={theme.logoUrl || undefined}
          />
          <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 sm:px-6">
            {children}
          </main>
          <StoreFooter businessName={tenant.name} showBranding={showBranding} />
          <CartButton tenantSlug={tenant.slug} />
        </CartProvider>
      </div>
    </>
  );
}
