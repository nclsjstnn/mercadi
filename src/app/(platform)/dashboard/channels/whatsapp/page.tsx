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

export default async function WhatsAppChannelPage() {
  const session = await requireTenant();
  await connectDB();

  const tenant = await Tenant.findById(session.user.tenantId).lean();
  if (!tenant) return <p>Error: negocio no encontrado</p>;

  const baseUrl = process.env.NEXTAUTH_URL || "https://mercadi.cl";
  const webhookUrl = `${baseUrl}/api/whatsapp/${tenant.slug}/webhook`;
  const feedUrl = `${baseUrl}/api/acp/${tenant.slug}/feed`;

  const feed = await generateProductFeed(tenant);
  const eligibleSearch = feed.filter((i) => i.is_eligible_search).length;
  const eligibleCheckout = feed.filter((i) => i.is_eligible_checkout).length;
  const inStock = feed.filter((i) => i.availability === "in_stock").length;

  return (
    <div>
      <PageHeader
        title="WhatsApp"
        description="Bot de WhatsApp — permite a tus clientes explorar el catalogo y comprar por WhatsApp"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Canales" },
          { label: "WhatsApp" },
        ]}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Bot</CardTitle>
            <CardDescription>
              Permite a tus clientes explorar el catalogo desde WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Estado:</span>
              <StatusBadge
                status={tenant.whatsapp?.enabled ? "active" : "inactive"}
              />
            </div>
            {tenant.whatsapp?.phoneNumberId ? (
              <>
                <InfoRow
                  label="Phone Number ID"
                  value={tenant.whatsapp.phoneNumberId}
                />
                <CopyableField label="Webhook URL" value={webhookUrl} />
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 space-y-1">
                  <p className="font-medium">Configuracion en Meta for Developers:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Abre tu Meta App → WhatsApp → Configuration</li>
                    <li>Webhook URL: copia la URL de arriba</li>
                    <li>Verify Token: el mismo que configuraste aqui</li>
                    <li>
                      Suscribe al evento{" "}
                      <code className="text-xs bg-blue-100 px-1 rounded">
                        messages
                      </code>
                    </li>
                  </ol>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Configura las credenciales de WhatsApp Business (Phone Number ID,
                Access Token, Verify Token) con el administrador de la plataforma
                para activar el bot.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feed de Productos</CardTitle>
            <CardDescription>
              Productos disponibles para el bot de WhatsApp
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
