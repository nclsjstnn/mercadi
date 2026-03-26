import { redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db/connect";
import { Product } from "@/lib/db/models/product";
import { Order } from "@/lib/db/models/order";
import { Tenant } from "@/lib/db/models/tenant";
import { requireAuth } from "@/lib/auth/guards";
import { formatPrice } from "@/lib/utils/currency";
import { PageHeader } from "@/components/platform/page-header";
import { StatCard } from "@/components/platform/stat-card";
import { StatusBadge } from "@/components/platform/status-badge";
import { UpgradeBanner } from "@/components/platform/upgrade-banner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  ShoppingCart,
  Banknote,
  Plus,
  Settings,
  Store,
  MessageCircle,
  Bot,
  ExternalLink,
  Ticket,
  Truck,
} from "lucide-react";
import ChatWidget from "@/components/dashboard/chat-widget";

export default async function TenantDashboard() {
  const session = await requireAuth();

  if (session.user.role === "admin") redirect("/admin");
  if (!session.user.tenantId) redirect("/onboarding");

  await connectDB();

  const tenant = await Tenant.findById(session.user.tenantId).lean();
  const currency = tenant?.locale?.currency || "CLP";
  const baseUrl = process.env.NEXTAUTH_URL || "https://mercadi.cl";

  const [productCount, orderCount, revenueAgg, recentOrders] =
    await Promise.all([
      Product.countDocuments({ tenantId: session.user.tenantId }),
      Order.countDocuments({ tenantId: session.user.tenantId }),
      Order.aggregate([
        {
          $match: {
            tenantId: tenant?._id,
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$commission.merchantAmount" },
          },
        },
      ]),
      Order.find({ tenantId: session.user.tenantId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

  const revenue = revenueAgg[0]?.totalRevenue || 0;

  const storeEnabled = tenant?.store?.enabled ?? false;
  const whatsappEnabled = tenant?.whatsapp?.enabled ?? false;
  const acpEnabled = tenant?.acpEnabled ?? false;
  const storeUrl = `${baseUrl}/store/${tenant?.slug}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido, ${session.user.name || "Usuario"}`}
        description={tenant?.name || "Mi Negocio"}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Productos"
          value={productCount}
          icon={Package}
          description="En tu catálogo"
        />
        <StatCard
          title="Pedidos"
          value={orderCount}
          icon={ShoppingCart}
          description="Totales"
        />
        <StatCard
          title="Ingresos"
          value={formatPrice(revenue, currency)}
          icon={Banknote}
          description="Neto de comisión"
        />
      </div>

      {/* Channel status */}
      <div className="grid gap-3 sm:grid-cols-3">
        <ChannelCard
          icon={Store}
          label="Tienda web"
          enabled={storeEnabled}
          href={storeEnabled ? storeUrl : "/dashboard/store"}
          hrefLabel={storeEnabled ? "Ver tienda" : "Activar"}
          external={storeEnabled}
          color="amber"
        />
        <ChannelCard
          icon={MessageCircle}
          label="WhatsApp"
          enabled={whatsappEnabled}
          href="/dashboard/settings?tab=whatsapp"
          hrefLabel={whatsappEnabled ? "Configurar" : "Activar"}
          color="green"
        />
        <ChannelCard
          icon={Bot}
          label="ChatGPT / ACP"
          enabled={acpEnabled}
          href="/dashboard/settings?tab=acp"
          hrefLabel={acpEnabled ? "Configurar" : "Activar"}
          color="emerald"
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders — spans 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pedidos Recientes</CardTitle>
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aún no hay pedidos
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comprador</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell className="font-medium">
                          {order.buyer.name}
                        </TableCell>
                        <TableCell>
                          {formatPrice(order.totals.total, currency)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("es-CL")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <QuickAction href="/dashboard/products/new" icon={Plus} label="Agregar Producto" />
              <QuickAction href="/dashboard/orders" icon={ShoppingCart} label="Ver Pedidos" />
              <QuickAction href="/dashboard/coupons/new" icon={Ticket} label="Crear Cupón" />
              <QuickAction href="/dashboard/settings?tab=shipping" icon={Truck} label="Opciones de Envío" />
              <QuickAction href="/dashboard/settings?tab=payments" icon={Banknote} label="Configurar Pagos" />
              <QuickAction href="/dashboard/settings?tab=whatsapp" icon={MessageCircle} label="Configurar WhatsApp" />
              <QuickAction href="/dashboard/settings?tab=acp" icon={Bot} label="Configurar ChatGPT" />
              <QuickAction href="/dashboard/settings" icon={Settings} label="Configuración General" />
            </CardContent>
          </Card>

          <UpgradeBanner />
        </div>
      </div>

      {tenant?.ucpEnabled && <ChatWidget tenantSlug={tenant.slug} />}
    </div>
  );
}

// ─── Channel status card ────────────────────────────────────────────────────

function ChannelCard({
  icon: Icon,
  label,
  enabled,
  href,
  hrefLabel,
  external = false,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  enabled: boolean;
  href: string;
  hrefLabel: string;
  external?: boolean;
  color: "amber" | "green" | "emerald";
}) {
  const colorMap = {
    amber: "bg-amber-100 text-amber-600",
    green: "bg-green-100 text-green-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorMap[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <StatusBadge status={enabled ? "active" : "inactive"} />
      </div>
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        <Button variant="ghost" size="sm" className="gap-1 text-xs shrink-0">
          {hrefLabel}
          {external && <ExternalLink className="h-3 w-3" />}
        </Button>
      </Link>
    </div>
  );
}

// ─── Quick action button ────────────────────────────────────────────────────

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link href={href} className="block">
      <Button variant="ghost" className="w-full justify-start gap-2 h-9 px-3 text-sm">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        {label}
      </Button>
    </Link>
  );
}
