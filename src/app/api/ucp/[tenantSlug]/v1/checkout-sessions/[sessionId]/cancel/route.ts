import { NextRequest, NextResponse } from "next/server";
import { validateUCPApiKey } from "@/lib/auth/guards";
import { parseUCPHeaders } from "@/lib/ucp/headers";
import { cancelSession } from "@/lib/ucp/checkout-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; sessionId: string }> }
) {
  try {
    const { tenantSlug, sessionId } = await params;
    const { apiKey } = parseUCPHeaders(request);

    const tenant = await validateUCPApiKey(tenantSlug, apiKey || null);
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await cancelSession(sessionId);

    return NextResponse.json({
      checkout_session_id: session.sessionId,
      status: "cancelled",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Cannot cancel") ? 409 : 500 }
    );
  }
}
