import { connectDB } from "@/lib/db/connect";
import { Coupon } from "@/lib/db/models/coupon";
import { requireTenant } from "@/lib/auth/guards";
import { updateCoupon } from "@/actions/coupons";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CouponForm from "@/components/coupons/coupon-form";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ couponId: string }>;
}) {
  const session = await requireTenant();
  await connectDB();

  const { couponId } = await params;
  const coupon = await Coupon.findOne({
    _id: couponId,
    tenantId: session.user.tenantId,
  }).lean();

  if (!coupon) {
    redirect("/dashboard/coupons");
  }

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateCoupon(couponId, formData);
    redirect("/dashboard/coupons");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Editar Cupón</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono">{coupon.code}</CardTitle>
            <Badge variant="secondary">
              {coupon.usageCount} uso{coupon.usageCount !== 1 ? "s" : ""}
              {coupon.maxUsageCount != null ? ` / ${coupon.maxUsageCount}` : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <CouponForm
            action={handleUpdate}
            defaultValues={{
              code: coupon.code,
              description: coupon.description,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              minimumOrderAmount: coupon.minimumOrderAmount ?? null,
              maxUsageCount: coupon.maxUsageCount ?? null,
              expiresAt: coupon.expiresAt
                ? coupon.expiresAt.toISOString().split("T")[0]
                : null,
              status: coupon.status,
            }}
            submitLabel="Guardar Cambios"
          />
        </CardContent>
      </Card>
    </div>
  );
}
