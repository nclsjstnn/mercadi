import { connectDB } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/order";
import { Tenant } from "@/lib/db/models/tenant";
import { requireAdmin } from "@/lib/auth/guards";
import { formatPrice } from "@/lib/utils/currency";
import { PageHeader } from "@/components/platform/page-header";
import { StatCard } from "@/components/platform/stat-card";
import { EmptyState } from "@/components/platform/empty-state";
import { Receipt, Banknote, TrendingUp } from "lucide-react";
import { CommissionTableWrapper } from "./commission-table-wrapper";

export default async function CommissionsPage() {
  await requireAdmin();
  await connectDB();

  const commissionsByTenant = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: "$tenantId",
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totals.total" },
        totalCommission: { $sum: "$commission.amount" },
        totalMerchantPayout: { $sum: "$commission.merchantAmount" },
        pendingCommission: {
          $sum: {
            $cond: [
              { $eq: ["$commission.status", "pending"] },
              "$commission.amount",
              0,
            ],
          },
        },
      },
    },
  ]);

  const tenantIds = commissionsByTenant.map((c) => c._id);
  const tenants = await Tenant.find({ _id: { $in: tenantIds } }).lean();
  const tenantMap = new Map(
    tenants.map((t) => [
      t._id.toString(),
      { name: t.name, currency: t.locale.currency },
    ])
  );

  const totalCommission = commissionsByTenant.reduce(
    (sum, c) => sum + c.totalCommission,
    0
  );
  const totalPending = commissionsByTenant.reduce(
    (sum, c) => sum + c.pendingCommission,
    0
  );
  const totalRevenue = commissionsByTenant.reduce(
    (sum, c) => sum + c.totalRevenue,
    0
  );

  const serialized = commissionsByTenant.map((c) => {
    const info = tenantMap.get(c._id.toString());
    const currency = info?.currency || "CLP";
    return {
      tenantName: info?.name || "—",
      totalOrders: c.totalOrders,
      totalRevenue: formatPrice(c.totalRevenue, currency),
      totalCommission: formatPrice(c.totalCommission, currency),
      pendingCommission: formatPrice(c.pendingCommission, currency),
      totalMerchantPayout: formatPrice(c.totalMerchantPayout, currency),
    };
  });

  return (
    <div>
      <PageHeader
        title="Comisiones"
        description="Resumen de comisiones por negocio"
      />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard
          title="Comision Total"
          value={formatPrice(totalCommission)}
          icon={Receipt}
        />
        <StatCard
          title="Pendiente de Cobro"
          value={formatPrice(totalPending)}
          icon={TrendingUp}
        />
        <StatCard
          title="Ingresos Totales"
          value={formatPrice(totalRevenue)}
          icon={Banknote}
        />
      </div>

      {serialized.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin comisiones"
          description="Las comisiones apareceran cuando se procesen pedidos."
        />
      ) : (
        <CommissionTableWrapper commissions={serialized} />
      )}
    </div>
  );
}
