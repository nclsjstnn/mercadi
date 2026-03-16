import type { ICoupon } from "@/lib/db/models/coupon";

interface CouponResult {
  valid: boolean;
  error?: string;
  discountAmount: number;
}

export function validateAndCalculateCoupon(
  coupon: ICoupon,
  lineItemsTotal: number
): CouponResult {
  if (coupon.status !== "active") {
    return { valid: false, error: "Cupón no está activo", discountAmount: 0 };
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return { valid: false, error: "Cupón expirado", discountAmount: 0 };
  }

  if (
    coupon.maxUsageCount != null &&
    coupon.usageCount >= coupon.maxUsageCount
  ) {
    return {
      valid: false,
      error: "Cupón ha alcanzado el límite de usos",
      discountAmount: 0,
    };
  }

  if (
    coupon.minimumOrderAmount != null &&
    lineItemsTotal < coupon.minimumOrderAmount
  ) {
    return {
      valid: false,
      error: `Monto mínimo de compra: $${coupon.minimumOrderAmount.toLocaleString("es-CL")}`,
      discountAmount: 0,
    };
  }

  let discountAmount: number;
  if (coupon.discountType === "fixed") {
    discountAmount = Math.min(coupon.discountValue, lineItemsTotal);
  } else {
    discountAmount = Math.min(
      Math.round((lineItemsTotal * coupon.discountValue) / 100),
      lineItemsTotal
    );
  }

  return { valid: true, discountAmount };
}
