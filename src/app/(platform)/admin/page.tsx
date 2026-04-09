import { requireSuperAdmin } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { Order } from "@/lib/db/models/order";
import { Product } from "@/lib/db/models/product";
import { User } from "@/lib/db/models/user";
import { formatPrice } from "@/lib/utils/currency";
import { PageHeader } from "@/components/platform/page-header";
import { StatCard } from "@/components/platform/stat-card";
import { StatusBadge } from "@/components/platform/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  ShoppingCart,
  Package,
  Users,
  UserCheck,
  Banknote,
} from "lucide-react";
import { TenantsTable, type AdminTenant } from "@/components/admin/tenants-table";

export default async function SuperAdminPage() {
  await requireSuperAdmin();
  await connectDB();

  const [tenants, orders, products, users, customerAgg, revenueAgg] =
    await Promise.all([
      Tenant.find()
        .sort({ createdAt: -1 })
        .select("name slug rut status commissionRate ucpEnabled acpEnabled store payment shipping ownerId")
        .lean(),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(200)
        .select("orderId tenantId buyer totals status currency createdAt")
        .lean(),
      Product.find()
        .sort({ createdAt: -1 })
        .limit(200)
        .select("title tenantId price stock status category")
        .lean(),
      User.find()
        .sort({ createdAt: -1 })
        .select("name email role plan createdAt")
        .lean(),
      Order.aggregate([
        {
          $group: {
            _id: "$buyer.email",
            name: { $first: "$buyer.name" },
            email: { $first: "$buyer.email" },
            tenantId: { $first: "$tenantId" },
            orderCount: { $sum: 1 },
            totalSpent: { $sum: "$totals.total" },
            lastOrder: { $max: "$createdAt" },
          },
        },
        { $sort: { orderCount: -1 } },
        { $limit: 200 },
      ]),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totals.total" },
            commission: { $sum: "$commission.amount" },
          },
        },
      ]),
    ]);

  const tenantMap = Object.fromEntries(tenants.map((t) => [t._id.toString(), t.name]));
  const revenue = revenueAgg[0] ?? { total: 0, commission: 0 };

  const ownerIdToPlan = Object.fromEntries(
    users.map((u) => [u._id.toString(), u.plan ?? "free"])
  );

  const adminTenants: AdminTenant[] = tenants.map((t) => ({
    _id: t._id.toString(),
    name: t.name,
    slug: t.slug,
    rut: t.rut,
    status: t.status,
    commissionRate: t.commissionRate,
    ucpEnabled: t.ucpEnabled,
    acpEnabled: t.acpEnabled ?? false,
    plan: ownerIdToPlan[t.ownerId?.toString() ?? ""] ?? "free",
    store: { enabled: t.store?.enabled ?? false },
    payment: {
      provider: t.payment?.provider ?? "mock",
      providerConfig: (t.payment?.providerConfig ?? {}) as Record<string, string>,
    },
    shipping: {
      options: (t.shipping?.options ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        enabled: o.enabled,
      })),
    },
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin"
        description="Panel de control de la plataforma Mercadi"
      />

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tiendas" value={tenants.length} icon={Building2} description="Registradas" />
        <StatCard title="Pedidos" value={orders.length} icon={ShoppingCart} description="Últimos 200" />
        <StatCard title="Ingresos" value={formatPrice(revenue.total)} icon={Banknote} description="Sin cancelados" />
        <StatCard title="Comisiones" value={formatPrice(revenue.commission)} icon={Banknote} description="Acumuladas" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stores">
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="stores" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Tiendas <Badge variant="secondary" className="ml-1 text-xs">{tenants.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5" />
            Órdenes <Badge variant="secondary" className="ml-1 text-xs">{orders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Productos <Badge variant="secondary" className="ml-1 text-xs">{products.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Usuarios <Badge variant="secondary" className="ml-1 text-xs">{users.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-1.5">
            <UserCheck className="h-3.5 w-3.5" />
            Clientes <Badge variant="secondary" className="ml-1 text-xs">{customerAgg.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── Tiendas ─────────────────────────────────────────── */}
        <TabsContent value="stores" className="mt-4">
          <TenantsTable tenants={adminTenants} />
        </TabsContent>

        {/* ── Órdenes ─────────────────────────────────────────── */}
        <TabsContent value="orders" className="mt-4">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>ID</TableHead>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Sin órdenes
                    </TableCell>
                  </TableRow>
                ) : orders.map((o) => (
                  <TableRow key={o.orderId}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {o.orderId.slice(-8)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {tenantMap[o.tenantId.toString()] ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{o.buyer.name}</p>
                        <p className="text-xs text-muted-foreground">{o.buyer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatPrice(o.totals.total, o.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("es-CL")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Productos ─────────────────────────────────────────── */}
        <TabsContent value="products" className="mt-4">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Título</TableHead>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Sin productos
                    </TableCell>
                  </TableRow>
                ) : products.map((p) => (
                  <TableRow key={p._id.toString()}>
                    <TableCell className="font-medium text-sm">{p.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tenantMap[p.tenantId.toString()] ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{formatPrice(p.price)}</TableCell>
                    <TableCell className="text-sm">{p.stock}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.category || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Usuarios ─────────────────────────────────────────── */}
        <TabsContent value="users" className="mt-4">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u._id.toString()}>
                    <TableCell className="font-medium text-sm">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">
                        {u.role === "admin" ? "Admin" : "Negocio"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.plan === "pro" ? "default" : "outline"} className="text-xs capitalize">
                        {u.plan ?? "free"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("es-CL")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Clientes ─────────────────────────────────────────── */}
        <TabsContent value="customers" className="mt-4">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tienda</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Total gastado</TableHead>
                  <TableHead>Último pedido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerAgg.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Sin clientes aún
                    </TableCell>
                  </TableRow>
                ) : customerAgg.map((c) => (
                  <TableRow key={c._id as string}>
                    <TableCell className="font-medium text-sm">{c.name as string}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.email as string}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tenantMap[(c.tenantId as { toString(): string }).toString()] ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{c.orderCount as number}</TableCell>
                    <TableCell className="text-sm">{formatPrice(c.totalSpent as number)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.lastOrder as Date).toLocaleDateString("es-CL")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
