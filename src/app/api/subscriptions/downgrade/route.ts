import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Subscription } from "@/lib/db/models/subscription";
import { Tenant } from "@/lib/db/models/tenant";
import { User } from "@/lib/db/models/user";
import {
  inscriptionDelete,
  getPlatformOneclickCredentials,
} from "@/lib/payments/transbank-oneclick";

/**
 * POST /api/subscriptions/downgrade
 * Body: { keepTenantId: string }
 *
 * Cancels the active Pro subscription, downgrades user to Free, and
 * deactivates all owned tenants except the one specified by keepTenantId.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { keepTenantId } = (await req.json()) as { keepTenantId?: string };

    // Fetch all owned tenants
    const ownedTenants = await Tenant.find({ ownerId: session.user.id })
      .select("_id status")
      .lean();

    if (ownedTenants.length > 1 && !keepTenantId) {
      return NextResponse.json(
        { error: "Debes elegir qué negocio conservar al bajar al plan Free" },
        { status: 400 }
      );
    }

    const keptId = keepTenantId || ownedTenants[0]?._id.toString();

    // Validate keepTenantId belongs to this user
    if (keptId && !ownedTenants.some((t) => t._id.toString() === keptId)) {
      return NextResponse.json(
        { error: "El negocio seleccionado no te pertenece" },
        { status: 403 }
      );
    }

    // Find the active subscription
    const subscription = await Subscription.findOne({
      userId: session.user.id,
      status: { $in: ["active", "past_due", "enrolling"] },
    });

    if (subscription?.tbkUser) {
      const creds = getPlatformOneclickCredentials();
      try {
        await inscriptionDelete(
          creds,
          subscription.tbkUser,
          subscription.tbkUsername
        );
      } catch (err) {
        console.error("[downgrade] inscriptionDelete failed (continuing):", err);
      }
    }

    if (subscription) {
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: "Downgraded to Free by user",
      });
    }

    // Deactivate all owned tenants except the kept one
    const toDisable = ownedTenants
      .map((t) => t._id.toString())
      .filter((id) => id !== keptId);

    if (toDisable.length > 0) {
      await Tenant.updateMany(
        { _id: { $in: toDisable } },
        { $set: { status: "inactive" } }
      );
    }

    // Ensure the kept tenant is active
    if (keptId) {
      await Tenant.findByIdAndUpdate(keptId, { $set: { status: "active" } });
    }

    // Switch user's active tenant to the kept one if needed
    await User.findByIdAndUpdate(session.user.id, {
      plan: "free",
      ...(keptId ? { tenantId: keptId } : {}),
    });

    return NextResponse.json({ success: true, keptTenantId: keptId });
  } catch (err) {
    console.error("[downgrade]", err);
    return NextResponse.json(
      { error: "Error al procesar el downgrade" },
      { status: 500 }
    );
  }
}
