import { headers } from "next/headers";
import { requireTenant } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { User } from "@/lib/db/models/user";
import { PLAN_LIMITS, type PlanType } from "@/lib/config/plans";
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form";
import { TemplateEditor } from "@/components/dashboard/template-editor";
import { CustomDomainSettings } from "@/components/dashboard/custom-domain-settings";

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
    ? `${tenant.slug}.localhost:3000`
    : `${tenant.slug}.${host}`;

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
