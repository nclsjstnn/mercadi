import { connectDB } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/order";
import { Tenant } from "@/lib/db/models/tenant";
import { requireTenant } from "@/lib/auth/guards";
import { formatPrice } from "@/lib/utils/currency";
import { PageHeader } from "@/components/platform/page-header";
import { EmptyState } from "@/components/platform/empty-state";
import { StatusBadge } from "@/components/platform/status-badge";
import { DataTable, type Column } from "@/components/platform/data-table";
import { ShoppingCart } from "lucide-react";
import { OrderTableWrapper } from "./order-table-wrapper";

export default async function TenantOrdersPage() {
  const session = await requireTenant();
  await connectDB();

  const tenant = await Tenant.findById(session.user.tenantId).lean();
  const currency = tenant?.locale?.currency || "CLP";

  const orders = await Order.find({ tenantId: session.user.tenantId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const serialized = orders.map((o) => ({
    orderId: o.orderId,
    buyerName: o.buyer.name,
    itemCount: o.lineItems.length,
    total: formatPrice(o.totals.total, currency),
    merchantAmount: formatPrice(o.commission.merchantAmount, currency),
    status: o.status,
    date: new Date(o.createdAt).toLocaleDateString("es-CL"),
  }));

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Historial de pedidos de tu negocio"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pedidos" },
        ]}
      />

      {serialized.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Sin pedidos"
          description="Los pedidos apareceran aqui cuando los agentes IA realicen compras en tu catalogo."
        />
      ) : (
        <OrderTableWrapper orders={serialized} />
      )}
    </div>
  );
}
