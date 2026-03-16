import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { User } from "@/lib/db/models/user";
import { PLAN_LIMITS, type PlanType } from "@/lib/config/plans";
import { isReservedSubdomain } from "@/lib/config/reserved-subdomains";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug, rut, legalName, comuna, region } =
      await request.json();

    if (!name || !slug || !rut || !legalName || !comuna || !region) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    if (isReservedSubdomain(slug)) {
      return NextResponse.json(
        { error: "Este nombre está reservado y no puede usarse" },
        { status: 400 }
      );
    }

    await connectDB();

    // Read plan from DB to avoid stale JWT values
    const dbUser = await User.findById(session.user.id).select("plan").lean();
    const plan = (dbUser?.plan || "free") as PlanType;
    const maxTenants = PLAN_LIMITS[plan].maxTenants;
    const tenantCount = await Tenant.countDocuments({ ownerId: session.user.id });
    if (tenantCount >= maxTenants) {
      return NextResponse.json(
        { error: `Has alcanzado el limite de negocios para tu plan (${maxTenants})` },
        { status: 403 }
      );
    }

    const existing = await Tenant.findOne({ slug: slug.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "Este slug ya está en uso" },
        { status: 409 }
      );
    }

    const tenant = await Tenant.create({
      name,
      slug: slug.toLowerCase(),
      rut,
      legalName,
      address: { comuna, region },
      ownerId: session.user.id,
      ucpApiKey: `ucp_${nanoid(32)}`,
      payment: { provider: "mock", providerConfig: {} },
      status: "active",
      ucpEnabled: true,
    });

    // Link user to tenant
    await User.findByIdAndUpdate(session.user.id, {
      tenantId: tenant._id,
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
