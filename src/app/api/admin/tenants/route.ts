import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { User } from "@/lib/db/models/user";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const tenants = await Tenant.find().sort({ createdAt: -1 }).lean();

    const ownerIds = tenants.map((t) => t.ownerId).filter(Boolean);
    const owners = await User.find({ _id: { $in: ownerIds } }).select("plan").lean();
    const planMap = Object.fromEntries(owners.map((u) => [u._id.toString(), u.plan ?? "free"]));

    const enriched = tenants.map((t) => ({
      ...t,
      ownerPlan: planMap[t.ownerId?.toString() ?? ""] ?? "free",
    }));

    return NextResponse.json({ tenants: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    console.error("[GET /api/admin/tenants]", message);
    return NextResponse.json(
      { error: message },
      { status: message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { name, slug, rut, legalName, address, ownerId, commissionRate } = body;

    if (!name || !slug || !rut || !legalName || !address || !ownerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const tenant = await Tenant.create({
      name,
      slug: slug.toLowerCase(),
      rut,
      legalName,
      address,
      ownerId,
      commissionRate: commissionRate || 0.05,
      ucpApiKey: `ucp_${nanoid(32)}`,
      payment: { provider: "mock", providerConfig: {} },
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json(
      { error: message },
      { status: message.includes("duplicate") ? 409 : 500 }
    );
  }
}
