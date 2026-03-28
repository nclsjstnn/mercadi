import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { requireTenant } from "@/lib/auth/guards";
import { generateProductFeed } from "@/lib/acp/feed-generator";
import { PageHeader } from "@/components/platform/page-header";
import { CopyButton } from "@/components/platform/copy-button";
import { StatusBadge } from "@/components/platform/status-badge";
import { EmptyState } from "@/components/platform/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rss } from "lucide-react";

export default async function AcpChannelPage() {
  const session = await requireTenant();
  await connectDB();

  const tenant = await Tenant.findById(session.user.tenantId).lean();
  if (!tenant) return <p>Error: negocio no encontrado</p>;

  const baseUrl = process.env.NEXTAUTH_URL || "https://mercadi.cl";
  const acpCheckoutUrl = `${baseUrl}/api/acp/${tenant.slug}/checkout_sessions`;
  const feedUrl = `${baseUrl}/api/acp/${tenant.slug}/feed`;

  const feed = await generateProductFeed(tenant);
  const eligibleSearch = feed.filter((i) => i.is_eligible_search).length;
  const eligibleCheckout = feed.filter((i) => i.is_eligible_checkout).length;
  const inStock = feed.filter((i) => i.availability === "in_stock").length;

  return (
    <div>
      <PageHeader
        title="ChatGPT / ACP"
        description="Agentic Commerce Protocol — permite compras directas desde ChatGPT Instant Checkout"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Canales" },
          { label: "ChatGPT / ACP" },
        ]}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Agentic Commerce Protocol (OpenAI)</CardTitle>
            <CardDescription>
              Configuracion para Instant Checkout en ChatGPT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Estado:</span>
              <StatusBadge
                status={tenant.acpEnabled ? "active" : "inactive"}
              />
            </div>
            {tenant.acpApiKey && (
              <CopyableField label="API Key" value={tenant.acpApiKey} />
            )}
            {tenant.acpSigningSecret && (
              <CopyableField
                label="Signing Secret"
                value={tenant.acpSigningSecret}
              />
            )}
            <InfoRow
              label="Payment Provider"
              value={(tenant.acpPaymentProvider || "stripe").toUpperCase()}
            />
            <CopyableField label="Checkout Endpoint" value={acpCheckoutUrl} />
            {(tenant.acpLegalLinks?.privacyPolicy ||
              tenant.acpLegalLinks?.termsOfService) && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium">Links Legales</p>
                {tenant.acpLegalLinks.privacyPolicy && (
                  <InfoRow
                    label="Politica de Privacidad"
                    value={tenant.acpLegalLinks.privacyPolicy}
                  />
                )}
                {tenant.acpLegalLinks.termsOfService && (
                  <InfoRow
                    label="Terminos de Servicio"
                    value={tenant.acpLegalLinks.termsOfService}
                  />
                )}
                {tenant.acpLegalLinks.refundPolicy && (
                  <InfoRow
                    label="Politica de Reembolso"
                    value={tenant.acpLegalLinks.refundPolicy}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feed de Productos (ACP)</CardTitle>
            <CardDescription>
              Vista previa del feed que consume ChatGPT. Agrega ?format=csv para descargar.
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

            {feed.length === 0 ? (
              <EmptyState
                icon={Rss}
                title="Sin productos en el feed"
                description="Agrega productos activos para que aparezcan en el feed de OpenAI."
              />
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Vista Previa ({feed.length} productos)
                </p>
                <div className="space-y-2">
                  {feed.slice(0, 20).map((item) => (
                    <div
                      key={item.item_id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border px-4 py-3"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.item_id}
                      </span>
                      <span className="flex-1 text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="text-sm">{item.price}</span>
                      <Badge
                        variant={
                          item.availability === "in_stock"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {item.availability === "in_stock"
                          ? "En stock"
                          : "Sin stock"}
                      </Badge>
                      {item.is_eligible_checkout && (
                        <Badge variant="outline">Checkout</Badge>
                      )}
                    </div>
                  ))}
                  {feed.length > 20 && (
                    <p className="text-center text-sm text-muted-foreground">
                      ... y {feed.length - 20} productos mas
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-1 rounded-lg border px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
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
