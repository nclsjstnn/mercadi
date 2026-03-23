import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { requireTenant } from "@/lib/auth/guards";
import { generateProductFeed } from "@/lib/acp/feed-generator";
import { PageHeader } from "@/components/platform/page-header";
import { EmptyState } from "@/components/platform/empty-state";
import { CopyButton } from "@/components/platform/copy-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rss } from "lucide-react";

export default async function AcpFeedPage() {
  const session = await requireTenant();
  await connectDB();

  const tenant = await Tenant.findById(session.user.tenantId);
  if (!tenant) return <p>Error: negocio no encontrado</p>;

  const feed = await generateProductFeed(tenant);
  const baseUrl = process.env.NEXTAUTH_URL || "https://mercadi.cl";
  const feedUrl = `${baseUrl}/api/acp/${tenant.slug}/feed`;

  const eligibleSearch = feed.filter((i) => i.is_eligible_search).length;
  const eligibleCheckout = feed.filter((i) => i.is_eligible_checkout).length;
  const inStock = feed.filter((i) => i.availability === "in_stock").length;

  return (
    <div>
      <PageHeader
        title="Feed ACP (OpenAI)"
        description="Vista previa del feed de productos para ChatGPT Instant Checkout"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Feed ACP" },
        ]}
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label="Total productos" value={feed.length} />
          <StatCard label="Visibles en busqueda" value={eligibleSearch} />
          <StatCard label="Habilitados para compra" value={eligibleCheckout} />
          <StatCard label="Con stock" value={inStock} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feed URL</CardTitle>
            <CardDescription>
              URL del feed de productos. Agrega ?format=csv para descargar en CSV.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <code className="flex-1 truncate text-xs">{feedUrl}</code>
              <CopyButton value={feedUrl} />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <code className="flex-1 truncate text-xs">{feedUrl}?format=csv</code>
              <CopyButton value={`${feedUrl}?format=csv`} />
            </div>
          </CardContent>
        </Card>

        {feed.length === 0 ? (
          <EmptyState
            icon={Rss}
            title="Sin productos en el feed"
            description="Agrega productos activos para que aparezcan en el feed de OpenAI."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa ({feed.length} productos)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
