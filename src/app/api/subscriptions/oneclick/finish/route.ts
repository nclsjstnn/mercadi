import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Subscription } from "@/lib/db/models/subscription";
import { User } from "@/lib/db/models/user";
import {
  inscriptionFinish,
  getPlatformOneclickCredentials,
} from "@/lib/payments/transbank-oneclick";
import { chargeSubscription } from "@/lib/billing/charge";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://mercadi.cl";

function redirect(path: string) {
  return NextResponse.redirect(new URL(path, BASE_URL));
}

/**
 * POST — Transbank sends TBK_TOKEN in the form body after the user enrolls their card.
 * GET  — Transbank GETs here on cancellation/timeout (TBK_TOKEN in query params).
 */

async function handleFinish(tbkToken: string | null) {
  if (!tbkToken) return redirect("/dashboard/billing?status=cancelled");

  await connectDB();

  const creds = getPlatformOneclickCredentials();

  // Call Transbank to confirm enrollment
  let finishData;
  try {
    finishData = await inscriptionFinish(creds, tbkToken);
  } catch (err) {
    console.error("[oneclick/finish] inscriptionFinish error:", err);
    return redirect("/dashboard/billing?status=error");
  }

  if (finishData.response_code !== 0) {
    console.error("[oneclick/finish] non-zero response_code:", finishData.response_code);
    return redirect("/dashboard/billing?status=error");
  }

  // Find the most recent enrolling subscription to link
  const subscription = await Subscription.findOne({ status: "enrolling" })
    .sort({ createdAt: -1 });

  if (!subscription) {
    console.error("[oneclick/finish] no enrolling subscription found");
    return redirect("/dashboard/billing?status=error");
  }

  // Save card data
  subscription.tbkUser  = finishData.tbk_user;
  subscription.cardType = finishData.card_type;
  subscription.cardLast4 = finishData.card_number.slice(-4);
  await subscription.save();

  // Execute first charge immediately
  const chargeResult = await chargeSubscription(subscription);

  if (!chargeResult.success) {
    // First charge failed — mark subscription cancelled, don't upgrade plan
    await Subscription.findByIdAndUpdate(subscription._id, {
      status: "cancelled",
      cancellationReason: "First charge failed: " + chargeResult.errorMessage,
    });
    return redirect("/dashboard/billing?status=charge_failed");
  }

  // Upgrade user plan to pro
  await User.findByIdAndUpdate(subscription.userId, { plan: "pro" });

  return redirect("/dashboard/billing?status=success");
}

export async function POST(request: NextRequest) {
  let tbkToken: string | null = null;
  try {
    const formData = await request.formData();
    tbkToken = formData.get("TBK_TOKEN") as string | null;
  } catch {
    // ignore parse errors
  }
  return handleFinish(tbkToken);
}

export async function GET(request: NextRequest) {
  const tbkToken = request.nextUrl.searchParams.get("TBK_TOKEN");
  // A GET without TBK_TOKEN means the user cancelled at Transbank
  if (!tbkToken) return redirect("/dashboard/billing?status=cancelled");
  return handleFinish(tbkToken);
}
