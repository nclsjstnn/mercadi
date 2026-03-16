import Link from "next/link";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { Order } from "@/lib/db/models/order";
import { requireAdmin } from "@/lib/auth/guards";
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
import {
  Building2,
  ShoppingCart,
  Banknote,
  Receipt,
} from "lucide-react";

export default async function AdminDashboard() {
  await requireAdmin();
  await connectDB();

  const [tenantCount, orderCount, revenueAgg, recentTenants, recentOrders] =
    await Promise.all([
      Tenant.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totals.total" },
            totalCommission: { $sum: "$commission.amount" },
          },
        },
      ]),
      Tenant.find().sort({ createdAt: -1 }).limit(5).lean(),
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

  const revenue = revenueAgg[0] || { totalRevenue: 0, totalCommission: 0 };

  return (
    <div>
      <PageHeader
        title="Panel de Administracion"
        description="Vista general de la plataforma Mercadi"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Negocios" value={tenantCount} icon={Building2} />
        <StatCard title="Pedidos" value={orderCount} icon={ShoppingCart} />
        <StatCard
          title="Ingresos Totales"
          value={formatPrice(revenue.totalRevenue)}
          icon={Banknote}
        />
        <StatCard
          title="Comisiones"
          value={formatPrice(revenue.totalCommission)}
          icon={Receipt}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Negocios Recientes</CardTitle>
            <Link href="/admin/tenants">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTenants.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Sin negocios registrados
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTenants.map((t) => (
                    <TableRow key={t._id.toString()}>
                      <TableCell>
                        <Link
                          href={`/admin/tenants/${t._id}`}
                          className="font-medium hover:underline"
                        >
                          {t.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString("es-CL")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pedidos Recientes</CardTitle>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Sin pedidos
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((o) => (
                    <TableRow key={o.orderId}>
                      <TableCell className="font-mono text-xs">
                        {o.orderId}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString("es-CL")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
