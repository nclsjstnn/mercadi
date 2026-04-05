"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/user";
import { requireAuth } from "@/lib/auth/guards";

export type NotificationPrefsInput = {
  orderReady?: boolean;
  paymentReceived?: boolean;
  storeConfigured?: boolean;
  tenantCreated?: boolean;
  adminPaymentReceived?: boolean;
};

export async function updateNotificationPreferences(
  prefs: NotificationPrefsInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    await connectDB();

    await User.findByIdAndUpdate(session.user.id, {
      $set: Object.fromEntries(
        Object.entries(prefs).map(([k, v]) => [
          `notificationPreferences.${k}`,
          v,
        ])
      ),
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Error al guardar preferencias" };
  }
}
