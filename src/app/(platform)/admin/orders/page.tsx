import { connectDB } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/order";
import { Tenant } from "@/lib/db/models/tenant";
import { requireAdmin } from "@/lib/auth/guards";
import { formatPrice } from "@/lib/utils/currency";
import { PageHeader } from "@/components/platform/page-header";
import { EmptyState } from "@/components/platform/empty-state";
import { ShoppingCart } from "lucide-react";
import { AdminOrderTableWrapper } from "./order-table-wrapper";

export default async function AdminOrdersPage() {
  await requireAdmin();
  await connectDB();

  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const tenantIds = [...new Set(orders.map((o) => o.tenantId.toString()))];
  const tenants = await Tenant.find({ _id: { $in: tenantIds } }).lean();
  const tenantMap = new Map(tenants.map((t) => [t._id.toString(), t.name]));

  const serialized = orders.map((order) => ({
    orderId: order.orderId,
    tenantName: tenantMap.get(order.tenantId.toString()) || "—",
    buyerName: order.buyer.name,
    total: formatPrice(order.totals.total, order.currency),
    commission: formatPrice(order.commission.amount, order.currency),
    status: order.status,
    date: new Date(order.createdAt).toLocaleDateString("es-CL"),
  }));

  return (
    <div>
      <PageHeader
        title="Todos los Pedidos"
        description="Pedidos de todos los negocios de la plataforma"
      />

      {serialized.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Sin pedidos"
          description="No hay pedidos registrados en la plataforma."
        />
      ) : (
        <AdminOrderTableWrapper orders={serialized} />
      )}
    </div>
  );
}
