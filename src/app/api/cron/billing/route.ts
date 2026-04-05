import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Subscription } from "@/lib/db/models/subscription";
import { chargeSubscription } from "@/lib/billing/charge";

/**
 * Daily cron: charge subscriptions whose nextBillingDate has arrived.
 * Also retries past_due subscriptions (failureCount < 3).
 *
 * Secured by CRON_SECRET (Vercel injects this as Authorization: Bearer <secret>).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const now = new Date();

  // Find all active subscriptions due today + all past_due subscriptions pending retry
  const due = await Subscription.find({
    status: { $in: ["active", "past_due"] },
    nextBillingDate: { $lte: now },
    tbkUser: { $exists: true },
  });

  const results = await Promise.allSettled(
    due.map((sub) => chargeSubscription(sub))
  );

  const summary = results.map((r, i) => ({
    subscriptionId: due[i]._id.toString(),
    userId: due[i].userId.toString(),
    outcome: r.status === "fulfilled" ? r.value : { success: false, error: String(r.reason) },
  }));

  const succeeded = summary.filter((s) => (s.outcome as { success: boolean }).success).length;
  const failed    = summary.length - succeeded;

  console.log(`[cron/billing] processed ${summary.length} subscriptions — ${succeeded} OK, ${failed} failed`);

  return NextResponse.json({ processed: summary.length, succeeded, failed, detail: summary });
}
