import { headers } from "next/headers";
import { requireTenant } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { User } from "@/lib/db/models/user";
import { PLAN_LIMITS, type PlanType } from "@/lib/config/plans";
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form";
import { TemplateEditor } from "@/components/dashboard/template-editor";
import { CustomDomainSettings } from "@/components/dashboard/custom-domain-settings";
import { ThemeGeneratorPanel } from "@/components/dashboard/theme-generator-panel";
import type { GeneratedTheme } from "@/actions/store-theme";

export const metadata = {
  title: "Tienda - Dashboard",
};

export default async function StoreSettingsPage() {
  const session = await requireTenant();
  await connectDB();

  const tenant = await Tenant.findById(session.user.tenantId);
  if (!tenant) throw new Error("Tenant not found");

  const owner = await User.findById(tenant.ownerId).select("plan").lean();
  const plan = (owner?.plan || "free") as PlanType;
  const isPro = PLAN_LIMITS[plan].customDomain;

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const hostWithoutPort = host.split(":")[0];
  const isLocalhost = hostWithoutPort === "localhost";
  const protocol = isLocalhost ? "http" : "https";
  const storeUrl = isLocalhost
    ? `localhost:3000/store/${tenant.slug}`
    : `${host}/store/${tenant.slug}`;

  const store = tenant.store || {
    enabled: false,
    theme: {
      primaryColor: "#2563eb",
      secondaryColor: "#1e40af",
      accentColor: "#f59e0b",
      logoUrl: "",
      faviconUrl: "",
    },
    template: "",
    customDomain: "",
    customDomainVerified: false,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tienda</h1>
        <p className="text-muted-foreground">
          Configura tu tienda publica y personaliza su apariencia.
        </p>
      </div>

      {/* AI Theme Generator */}
      <div className="rounded-lg border p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Diseño con IA</h2>
          <p className="text-sm text-muted-foreground">
            Describe tu negocio y generamos una paleta de colores y tipografía personalizada.
          </p>
        </div>
        <ThemeGeneratorPanel
          tenantSlug={tenant.slug}
          initialPrompt={store.theme?.themePrompt || ""}
          initialTheme={
            store.theme?.themeGeneratedAt
              ? ({
                  primaryColor: store.theme.primaryColor,
                  secondaryColor: store.theme.secondaryColor,
                  accentColor: store.theme.accentColor,
                  backgroundColor: store.theme.backgroundColor || "#ffffff",
                  surfaceColor: store.theme.surfaceColor || "#f9fafb",
                  textColor: store.theme.textColor || "#111827",
                  mutedColor: store.theme.mutedColor || "#6b7280",
                  borderRadius: store.theme.borderRadius || "8px",
                  headingFont: store.theme.headingFont || "",
                  bodyFont: store.theme.bodyFont || "",
                } as GeneratedTheme)
              : null
          }
        />
      </div>

      {/* General + Theme */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">General y Tema</h2>
        <StoreSettingsForm
          enabled={store.enabled}
          theme={{
            primaryColor: store.theme?.primaryColor || "#2563eb",
            secondaryColor: store.theme?.secondaryColor || "#1e40af",
            accentColor: store.theme?.accentColor || "#f59e0b",
            logoUrl: store.theme?.logoUrl || "",
            faviconUrl: store.theme?.faviconUrl || "",
          }}
          storeUrl={storeUrl}
          protocol={protocol}
        />
      </div>

      {/* Template */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Plantilla</h2>
        <TemplateEditor template={store.template || ""} />
      </div>

      {/* Custom Domain */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Dominio</h2>
        <CustomDomainSettings
          domain={store.customDomain || ""}
          verified={store.customDomainVerified || false}
          isPro={isPro}
        />
      </div>
    </div>
  );
}
