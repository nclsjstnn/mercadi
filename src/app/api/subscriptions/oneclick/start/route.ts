import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Subscription } from "@/lib/db/models/subscription";
import { User } from "@/lib/db/models/user";
import { PLAN_DETAILS } from "@/lib/config/plans";
import {
  inscriptionStart,
  getPlatformOneclickCredentials,
} from "@/lib/payments/transbank-oneclick";

export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select("email name plan").lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.plan === "pro") {
      return NextResponse.json({ error: "Ya tienes el plan Pro activo" }, { status: 400 });
    }

    // Cancel any stale enrolling subscriptions for this user
    await Subscription.updateMany(
      { userId: session.user.id, status: "enrolling" },
      { status: "cancelled", cancellationReason: "Replaced by new enrollment" }
    );

    const creds = getPlatformOneclickCredentials();
    const baseUrl = process.env.NEXTAUTH_URL ?? "https://mercadi.cl";
    const responseUrl = `${baseUrl}/api/subscriptions/oneclick/finish`;

    const tbkResponse = await inscriptionStart(
      creds,
      user.email,           // username = email (unique per user)
      user.email,
      responseUrl
    );

    // Persist a pending subscription so finish route can update it
    await Subscription.create({
      userId:         session.user.id,
      plan:           "pro",
      status:         "enrolling",
      billingCycle:   "monthly",
      amount:         PLAN_DETAILS.pro.price,
      currency:       PLAN_DETAILS.pro.currency,
      tbkEnvironment: creds.environment,
      tbkUsername:    user.email,
    });

    return NextResponse.json({ redirectUrl: tbkResponse.url_webpay });
  } catch (err) {
    console.error("[oneclick/start]", err);
    return NextResponse.json(
      { error: "Error al iniciar inscripción" },
      { status: 500 }
    );
  }
}
