import Link from "next/link";
import { connectDB } from "@/lib/db/connect";
import { Coupon } from "@/lib/db/models/coupon";
import { Tenant } from "@/lib/db/models/tenant";
import { requireTenant } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/platform/page-header";
import { EmptyState } from "@/components/platform/empty-state";
import CouponTable from "@/components/coupons/coupon-table";
import { Ticket, Plus } from "lucide-react";

export default async function CouponsPage() {
  const session = await requireTenant();
  await connectDB();

  const tenant = await Tenant.findById(session.user.tenantId).lean();
  const coupons = await Coupon.find({
    tenantId: session.user.tenantId,
  })
    .sort({ createdAt: -1 })
    .lean();

  const serialized = coupons.map((c) => ({
    _id: c._id.toString(),
    code: c.code,
    description: c.description,
    discountType: c.discountType,
    discountValue: c.discountValue,
    usageCount: c.usageCount,
    maxUsageCount: c.maxUsageCount ?? null,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    status: c.status,
  }));

  return (
    <div>
      <PageHeader
        title="Cupones"
        description="Administra tus códigos de descuento"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Cupones" },
        ]}
      >
        <Link href="/dashboard/coupons/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cupón
          </Button>
        </Link>
      </PageHeader>

      {serialized.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Sin cupones"
          description="Crea tu primer cupón de descuento para tus clientes."
          action={
            <Link href="/dashboard/coupons/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear Cupón
              </Button>
            </Link>
          }
        />
      ) : (
        <CouponTable
          coupons={serialized}
          currency={tenant?.locale?.currency}
        />
      )}
    </div>
  );
}
