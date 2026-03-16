import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { generateUCPProfile } from "@/lib/ucp/profile-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;

  await connectDB();
  const tenant = await Tenant.findOne({
    slug: tenantSlug,
    ucpEnabled: true,
    status: "active",
  });

  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not found or UCP not enabled" },
      { status: 404 }
    );
  }

  const baseUrl = new URL(request.url).origin;
  const profile = generateUCPProfile(tenantSlug, baseUrl);

  return NextResponse.json(profile, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
