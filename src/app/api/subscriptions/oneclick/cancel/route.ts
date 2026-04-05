import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Subscription } from "@/lib/db/models/subscription";
import { User } from "@/lib/db/models/user";
import {
  inscriptionDelete,
  getPlatformOneclickCredentials,
} from "@/lib/payments/transbank-oneclick";

export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const subscription = await Subscription.findOne({
      userId: session.user.id,
      status: { $in: ["active", "past_due"] },
    });

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    // Delete inscription at Transbank (best-effort — don't block on failure)
    if (subscription.tbkUser) {
      const creds = getPlatformOneclickCredentials();
      try {
        await inscriptionDelete(creds, subscription.tbkUser, subscription.tbkUsername);
      } catch (err) {
        console.error("[oneclick/cancel] inscriptionDelete failed (continuing):", err);
      }
    }

    // Cancel subscription and downgrade plan
    await Subscription.findByIdAndUpdate(subscription._id, {
      status:             "cancelled",
      cancelledAt:        new Date(),
      cancellationReason: "Cancelled by user",
    });

    await User.findByIdAndUpdate(session.user.id, { plan: "free" });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[oneclick/cancel]", err);
    return NextResponse.json({ error: "Error al cancelar suscripción" }, { status: 500 });
  }
}
