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
import { Package, ShoppingCart, Banknote, Plus, Settings } from "lucide-react";
import ChatWidget from "@/components/dashboard/chat-widget";
import { UpgradeBanner } from "@/components/platform/upgrade-banner";

export default async function TenantDashboard() {
  const session = await requireAuth();

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  if (!session.user.tenantId) {
    redirect("/onboarding");
  }
  await connectDB();

  const tenant = await Tenant.findById(session.user.tenantId).lean();
  const currency = tenant?.locale?.currency || "CLP";

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

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${session.user.name || "Usuario"}`}
        description={tenant?.name || "Mi Negocio"}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Productos"
          value={productCount}
          icon={Package}
          description="En tu catalogo"
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
          description="Neto de comision"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
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
                Aun no hay pedidos
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acciones Rapidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/products/new" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Agregar Producto
              </Button>
            </Link>
            <Link href="/dashboard/settings" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Settings className="h-4 w-4" />
                Configuracion UCP
              </Button>
            </Link>
          </CardContent>
        </Card>

        <UpgradeBanner />
      </div>

      {tenant?.ucpEnabled && <ChatWidget tenantSlug={tenant.slug} />}
    </div>
  );
}
