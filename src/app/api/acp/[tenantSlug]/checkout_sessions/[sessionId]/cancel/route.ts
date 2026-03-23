import { NextRequest, NextResponse } from "next/server";
import { validateACPApiKey } from "@/lib/auth/guards";
import { parseACPHeaders, acpResponseHeaders } from "@/lib/acp/headers";
import { cancelSession, getSession } from "@/lib/ucp/checkout-manager";
import { formatAcpSessionResponse, formatAcpError } from "@/lib/acp/response-formatter";
import { Tenant } from "@/lib/db/models/tenant";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; sessionId: string }> }
) {
  try {
    const { tenantSlug, sessionId } = await params;
    const headers = parseACPHeaders(request);

    const tenant = await validateACPApiKey(tenantSlug, headers.apiKey || null);
    if (!tenant) {
      return NextResponse.json(
        formatAcpError("invalid_request", "unauthorized", "Invalid API key"),
        { status: 401, headers: acpResponseHeaders(headers) }
      );
    }

    // Check if session can be canceled (ACP only allows not_ready_for_payment / ready_for_payment)
    const session = await getSession(sessionId);
    if (session.status === "completed") {
      return NextResponse.json(
        formatAcpError("invalid_request", "session_completed", "Cannot cancel a completed session"),
        { status: 405, headers: acpResponseHeaders(headers) }
      );
    }
    if (session.status === "cancelled") {
      return NextResponse.json(
        formatAcpError("invalid_request", "session_canceled", "Session is already canceled"),
        { status: 405, headers: acpResponseHeaders(headers) }
      );
    }

    await cancelSession(sessionId);

    const canceledSession = await getSession(sessionId);
    const tenantDoc = await Tenant.findById(canceledSession.tenantId);

    return NextResponse.json(
      formatAcpSessionResponse(canceledSession, tenantDoc!),
      { headers: acpResponseHeaders(headers) }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      formatAcpError("invalid_request", "server_error", message),
      { status }
    );
  }
}
