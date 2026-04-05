"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connect";
import { Subscription } from "@/lib/db/models/subscription";
import { User } from "@/lib/db/models/user";
import { requireAdmin } from "@/lib/auth/guards";
import {
  inscriptionDelete,
  getPlatformOneclickCredentials,
} from "@/lib/payments/transbank-oneclick";
import { chargeSubscription } from "@/lib/billing/charge";

/** Admin: manually retry a failed charge on a past_due subscription. */
export async function adminRetryCharge(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  const sub = await Subscription.findById(subscriptionId);
  if (!sub) return { success: false, error: "Subscription not found" };
  if (!["past_due", "active"].includes(sub.status)) {
    return { success: false, error: "Subscription is not in a chargeable state" };
  }
  if (!sub.tbkUser) return { success: false, error: "No saved card on file" };

  const result = await chargeSubscription(sub);

  revalidatePath("/admin/subscriptions");
  revalidatePath(`/admin/subscriptions/${subscriptionId}`);

  return result.success
    ? { success: true }
    : { success: false, error: result.errorMessage };
}

/** Admin: cancel a subscription immediately and downgrade the user's plan. */
export async function adminCancelSubscription(
  subscriptionId: string,
  reason = "Cancelled by admin"
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  const sub = await Subscription.findById(subscriptionId);
  if (!sub) return { success: false, error: "Subscription not found" };
  if (sub.status === "cancelled") return { success: false, error: "Already cancelled" };

  if (sub.tbkUser) {
    const creds = getPlatformOneclickCredentials();
    try {
      await inscriptionDelete(creds, sub.tbkUser, sub.tbkUsername);
    } catch (err) {
      console.error("[admin] inscriptionDelete failed (continuing):", err);
    }
  }

  await Subscription.findByIdAndUpdate(subscriptionId, {
    status:             "cancelled",
    cancelledAt:        new Date(),
    cancellationReason: reason,
  });

  await User.findByIdAndUpdate(sub.userId, { plan: "free" });

  revalidatePath("/admin/subscriptions");
  revalidatePath(`/admin/subscriptions/${subscriptionId}`);
  return { success: true };
}

/** Admin: pause a subscription (skip next billing, keep plan active). */
export async function adminPauseSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await connectDB();

  const sub = await Subscription.findById(subscriptionId);
  if (!sub) return { success: false, error: "Subscription not found" };
  if (!["active", "past_due"].includes(sub.status)) {
    return { success: false, error: "Can only pause active/past_due subscriptions" };
  }

  // Push next billing date 30 days forward and reset failures
  const next = new Date(sub.nextBillingDate ?? new Date());
  next.setDate(next.getDate() + 30);

  await Subscription.findByIdAndUpdate(subscriptionId, {
    nextBillingDate: next,
    failureCount:    0,
    status:          "active",
  });

  revalidatePath("/admin/subscriptions");
  revalidatePath(`/admin/subscriptions/${subscriptionId}`);
  return { success: true };
}
