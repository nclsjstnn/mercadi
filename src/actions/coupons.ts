"use server";

import { connectDB } from "@/lib/db/connect";
import { Coupon } from "@/lib/db/models/coupon";
import { requireTenant } from "@/lib/auth/guards";
import { couponSchema } from "@/lib/validators/coupon";
import { revalidatePath } from "next/cache";

export async function createCoupon(formData: FormData) {
  const session = await requireTenant();
  await connectDB();

  const raw = {
    code: formData.get("code") as string,
    description: (formData.get("description") as string) || "",
    discountType: formData.get("discountType") as string,
    discountValue: parseInt(formData.get("discountValue") as string),
    minimumOrderAmount: formData.get("minimumOrderAmount")
      ? parseInt(formData.get("minimumOrderAmount") as string) || null
      : null,
    maxUsageCount: formData.get("maxUsageCount")
      ? parseInt(formData.get("maxUsageCount") as string) || null
      : null,
    expiresAt: formData.get("expiresAt")
      ? new Date(formData.get("expiresAt") as string)
      : null,
    status: (formData.get("status") as string) || "active",
  };

  const validated = couponSchema.parse(raw);

  await Coupon.create({
    tenantId: session.user!.tenantId,
    ...validated,
  });

  revalidatePath("/dashboard/coupons");
}

export async function updateCoupon(couponId: string, formData: FormData) {
  const session = await requireTenant();
  await connectDB();

  const raw = {
    code: formData.get("code") as string,
    description: (formData.get("description") as string) || "",
    discountType: formData.get("discountType") as string,
    discountValue: parseInt(formData.get("discountValue") as string),
    minimumOrderAmount: formData.get("minimumOrderAmount")
      ? parseInt(formData.get("minimumOrderAmount") as string) || null
      : null,
    maxUsageCount: formData.get("maxUsageCount")
      ? parseInt(formData.get("maxUsageCount") as string) || null
      : null,
    expiresAt: formData.get("expiresAt")
      ? new Date(formData.get("expiresAt") as string)
      : null,
    status: (formData.get("status") as string) || "active",
  };

  const validated = couponSchema.parse(raw);

  await Coupon.findOneAndUpdate(
    { _id: couponId, tenantId: session.user!.tenantId },
    validated
  );

  revalidatePath("/dashboard/coupons");
}

export async function deleteCoupon(couponId: string) {
  const session = await requireTenant();
  await connectDB();

  await Coupon.findOneAndDelete({
    _id: couponId,
    tenantId: session.user!.tenantId,
  });

  revalidatePath("/dashboard/coupons");
}

export async function toggleCouponStatus(couponId: string) {
  const session = await requireTenant();
  await connectDB();

  const coupon = await Coupon.findOne({
    _id: couponId,
    tenantId: session.user!.tenantId,
  });
  if (!coupon) throw new Error("Cupón no encontrado");

  coupon.status = coupon.status === "active" ? "inactive" : "active";
  await coupon.save();

  revalidatePath("/dashboard/coupons");
}
