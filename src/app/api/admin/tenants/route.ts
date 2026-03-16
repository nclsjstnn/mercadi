import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const tenants = await Tenant.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ tenants });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
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
