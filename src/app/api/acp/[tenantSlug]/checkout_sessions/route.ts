import { NextRequest, NextResponse } from "next/server";
import { validateACPApiKey } from "@/lib/auth/guards";
import { parseACPHeaders, acpResponseHeaders } from "@/lib/acp/headers";
import { verifyACPSignature } from "@/lib/acp/signature";
import { acpCreateSessionSchema } from "@/lib/validators/acp-checkout";
import { createSession } from "@/lib/ucp/checkout-manager";
import { parseAcpItems, parseAcpBuyer, parseAcpAddress } from "@/lib/acp/request-parser";
import { formatAcpSessionResponse, formatAcpError } from "@/lib/acp/response-formatter";
import { updateSession } from "@/lib/ucp/checkout-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const headers = parseACPHeaders(request);

    const tenant = await validateACPApiKey(tenantSlug, headers.apiKey || null);
    if (!tenant) {
      return NextResponse.json(
        formatAcpError("invalid_request", "unauthorized", "Invalid API key"),
        { status: 401, headers: acpResponseHeaders(headers) }
      );
    }

    // Verify HMAC signature
    const bodyText = await request.text();
    if (tenant.acpSigningSecret) {
      const sig = verifyACPSignature(
        bodyText,
        headers.signature,
        headers.timestamp,
        tenant.acpSigningSecret
      );
      if (!sig.valid) {
        return NextResponse.json(
          formatAcpError("invalid_request", "invalid_signature", sig.error || "Invalid signature"),
          { status: 401, headers: acpResponseHeaders(headers) }
        );
      }
    }

    const body = JSON.parse(bodyText);
    const parsed = acpCreateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        formatAcpError("invalid_request", "invalid_body", "Invalid request body", parsed.error.issues[0]?.path?.join(".")),
        { status: 400, headers: acpResponseHeaders(headers) }
      );
    }

    const { session, availableShippingOptions } = await createSession({
      tenantSlug,
      lineItems: parseAcpItems(parsed.data.items),
      idempotencyKey: headers.idempotencyKey,
      source: "acp",
      acpRequestId: headers.requestId,
    });

    // If buyer or address provided in create request, apply them immediately
    if (parsed.data.buyer || parsed.data.fulfillment_address) {
      const updates: { buyer?: ReturnType<typeof parseAcpBuyer>; fulfillment?: ReturnType<typeof parseAcpAddress> } = {};
      if (parsed.data.buyer) {
        updates.buyer = parseAcpBuyer(parsed.data.buyer);
      }
      if (parsed.data.fulfillment_address) {
        updates.fulfillment = parseAcpAddress(parsed.data.fulfillment_address);
      }
      await updateSession(session.sessionId, updates);
      // Re-fetch to get updated state
      const updatedSession = await import("@/lib/ucp/checkout-manager").then(m => m.getSession(session.sessionId));
      return NextResponse.json(
        formatAcpSessionResponse(updatedSession, tenant),
        { status: 201, headers: acpResponseHeaders(headers) }
      );
    }

    return NextResponse.json(
      formatAcpSessionResponse(session, tenant),
      { status: 201, headers: acpResponseHeaders(headers) }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("not found") ? 404 : message.includes("stock") ? 409 : 500;
    return NextResponse.json(
      formatAcpError("invalid_request", "server_error", message),
      { status }
    );
  }
}
