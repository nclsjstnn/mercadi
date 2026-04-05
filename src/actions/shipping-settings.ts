"use server";

import { nanoid } from "nanoid";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { requireTenant } from "@/lib/auth/guards";
import { shippingOptionsSchema } from "@/lib/validators/shipping";
import { revalidatePath } from "next/cache";
import { notifyShippingConfigured } from "@/lib/emails/notifications";

export async function updateShippingOptions(
  options: Array<{
    id?: string;
    name: string;
    price: number;
    type: "shipping" | "pickup";
    enabled: boolean;
  }>
) {
  const session = await requireTenant();
  await connectDB();

  const parsed = shippingOptionsSchema.safeParse(options);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().formErrors.join(", ") || "Datos invalidos" };
  }

  const withIds = parsed.data.map((opt) => ({
    ...opt,
    id: opt.id || `ship_${nanoid(8)}`,
  }));

  await Tenant.findByIdAndUpdate(session.user.tenantId, {
    "shipping.options": withIds,
  });

  notifyShippingConfigured({
    tenantId: session.user.tenantId,
    optionCount: withIds.length,
  }).catch((err) => console.error("[emails] notifyShippingConfigured failed:", err));

  revalidatePath("/dashboard/settings");
  return { success: true };
}
