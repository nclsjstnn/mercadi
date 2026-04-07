import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();

    const { tenantId } = await params;
    const tenant = await Tenant.findById(tenantId)
      .select("receipt")
      .lean();

    if (!tenant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Never return raw SII credentials — mask password and clave_certificado
    const config = { ...(tenant.receipt?.providerConfig ?? {}) };
    if (config.password) config.password = "••••••••";
    if (config.clave_certificado) config.clave_certificado = "••••••••";

    return NextResponse.json({
      receipt: {
        ...tenant.receipt,
        providerConfig: config,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();

    const { tenantId } = await params;
    const body = await request.json();
    const { provider, enabled, providerConfig } = body as {
      provider?: string;
      enabled?: boolean;
      providerConfig?: Record<string, unknown>;
    };

    const update: Record<string, unknown> = {};
    if (provider !== undefined) update["receipt.provider"] = provider;
    if (enabled !== undefined) update["receipt.enabled"] = enabled;

    // Merge providerConfig — preserve existing secrets if masked value sent
    if (providerConfig !== undefined) {
      const existing = await Tenant.findById(tenantId)
        .select("receipt.providerConfig")
        .lean();
      const current = (existing?.receipt?.providerConfig ?? {}) as Record<string, unknown>;

      const merged: Record<string, unknown> = { ...current };
      for (const [key, value] of Object.entries(providerConfig)) {
        // Skip masked placeholder values so stored secrets are preserved
        if (value !== "••••••••") {
          merged[key] = value;
        }
      }
      update["receipt.providerConfig"] = merged;
    }

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: update },
      { new: true }
    ).select("receipt");

    if (!tenant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ receipt: tenant.receipt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
