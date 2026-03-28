import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { requireTenant } from "@/lib/auth/guards";
import { generateProductFeed } from "@/lib/acp/feed-generator";
import { PageHeader } from "@/components/platform/page-header";
import { CopyButton } from "@/components/platform/copy-button";
import { StatusBadge } from "@/components/platform/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function UcpChannelPage() {
  const session = await requireTenant();
  await connectDB();

  const tenant = await Tenant.findById(session.user.tenantId).lean();
  if (!tenant) return <p>Error: negocio no encontrado</p>;

  const baseUrl = process.env.NEXTAUTH_URL || "https://mercadi.cl";
  const discoveryUrl = `${baseUrl}/${tenant.slug}/.well-known/ucp`;
  const checkoutUrl = `${baseUrl}/api/ucp/${tenant.slug}/v1/checkout-sessions`;
  const feedUrl = `${baseUrl}/api/acp/${tenant.slug}/feed`;

  const feed = await generateProductFeed(tenant);
  const eligibleSearch = feed.filter((i) => i.is_eligible_search).length;
  const eligibleCheckout = feed.filter((i) => i.is_eligible_checkout).length;
  const inStock = feed.filter((i) => i.availability === "in_stock").length;

  return (
    <div>
      <PageHeader
        title="UCP / Gemini"
        description="Universal Commerce Protocol — permite a agentes IA como Gemini descubrir y comprar en tu tienda"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Canales" },
          { label: "UCP / Gemini" },
        ]}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Universal Commerce Protocol</CardTitle>
            <CardDescription>
              Configuracion de tu endpoint UCP para agentes IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Estado:</span>
              <StatusBadge status={tenant.ucpEnabled ? "active" : "inactive"} />
            </div>
            <CopyableField label="API Key" value={tenant.ucpApiKey} />
            <CopyableField label="Discovery URL" value={discoveryUrl} />
            <CopyableField label="Checkout Endpoint" value={checkoutUrl} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feed de Productos</CardTitle>
            <CardDescription>
              Productos disponibles para descubrimiento por agentes IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total" value={feed.length} />
              <StatCard label="En busqueda" value={eligibleSearch} />
              <StatCard label="Con checkout" value={eligibleCheckout} />
              <StatCard label="Con stock" value={inStock} />
            </div>
            <CopyableField label="Feed URL" value={feedUrl} />
            <CopyableField label="Feed CSV" value={`${feedUrl}?format=csv`} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CopyableField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
        <code className="flex-1 truncate text-xs">{value}</code>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border px-4 py-3 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
