import { NextRequest, NextResponse } from "next/server";
import { validateACPApiKey } from "@/lib/auth/guards";
import { parseACPHeaders, acpResponseHeaders } from "@/lib/acp/headers";
import { verifyACPSignature } from "@/lib/acp/signature";
import { acpCompleteSessionSchema } from "@/lib/validators/acp-checkout";
import { completeSession, updateSession, getSession } from "@/lib/ucp/checkout-manager";
import { parseAcpBuyer } from "@/lib/acp/request-parser";
import { formatAcpSessionResponse, formatAcpError } from "@/lib/acp/response-formatter";
import { sendOrderCreatedWebhook } from "@/lib/acp/webhook-sender";
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

    const bodyText = await request.text();
    if (tenant.acpSigningSecret) {
      const sig = verifyACPSignature(bodyText, headers.signature, headers.timestamp, tenant.acpSigningSecret);
      if (!sig.valid) {
        return NextResponse.json(
          formatAcpError("invalid_request", "invalid_signature", sig.error || "Invalid signature"),
          { status: 401, headers: acpResponseHeaders(headers) }
        );
      }
    }

    const body = JSON.parse(bodyText);
    const parsed = acpCompleteSessionSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      // Check for payment-specific errors
      if (firstIssue?.path?.includes("payment_data")) {
        return NextResponse.json(
          formatAcpError("invalid_request", "invalid_body", "Invalid payment data"),
          { status: 400, headers: acpResponseHeaders(headers) }
        );
      }
      return NextResponse.json(
        formatAcpError("invalid_request", "invalid_body", "Invalid request body"),
        { status: 400, headers: acpResponseHeaders(headers) }
      );
    }

    // Update buyer info from the complete request
    const buyer = parseAcpBuyer(parsed.data.buyer);
    await updateSession(sessionId, { buyer });

    // Complete with delegated payment data
    const result = await completeSession(sessionId, {
      paymentData: {
        token: parsed.data.payment_data.token,
        provider: parsed.data.payment_data.provider,
      },
    });

    const session = await getSession(sessionId);
    const tenantDoc = await Tenant.findById(session.tenantId);

    // Build store URL for order permalink
    const baseUrl = tenant.store?.customDomain
      ? `https://${tenant.store.customDomain}`
      : `${request.nextUrl.origin}`;
    const permalinkUrl = `${baseUrl}/store/${tenantSlug}/orders/${"orderId" in result ? result.orderId : ""}`;

    // Send webhook to OpenAI (fire-and-forget, don't block response)
    if ("orderId" in result) {
      sendOrderCreatedWebhook(result.orderId, tenant, permalinkUrl).catch(() => {});
    }

    return NextResponse.json(
      formatAcpSessionResponse(session, tenantDoc!, {
        order: "orderId" in result
          ? { orderId: result.orderId, permalinkUrl }
          : undefined,
      }),
      { headers: acpResponseHeaders(headers) }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";

    // Map specific errors to ACP error codes
    if (message.includes("already completed")) {
      return NextResponse.json(
        formatAcpError("invalid_request", "session_completed", message),
        { status: 405 }
      );
    }
    if (message.includes("cancelled") || message.includes("canceled")) {
      return NextResponse.json(
        formatAcpError("invalid_request", "session_canceled", message),
        { status: 405 }
      );
    }
    if (message.includes("Payment failed")) {
      return NextResponse.json(
        formatAcpError("invalid_request", "payment_declined", message),
        { status: 422 }
      );
    }

    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      formatAcpError("invalid_request", "server_error", message),
      { status }
    );
  }
}
