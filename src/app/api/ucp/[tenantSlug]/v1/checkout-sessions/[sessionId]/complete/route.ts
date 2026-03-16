import { NextRequest, NextResponse } from "next/server";
import { validateUCPApiKey } from "@/lib/auth/guards";
import { parseUCPHeaders } from "@/lib/ucp/headers";
import { completeSession } from "@/lib/ucp/checkout-manager";

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

    const result = await completeSession(sessionId);

    if ("redirectUrl" in result && result.redirectUrl) {
      return NextResponse.json({
        status: "pending_payment",
        redirect_url: result.redirectUrl,
        order_id: result.orderId,
      });
    }

    const baseUrl = new URL(request.url).origin;

    return NextResponse.json({
      status: "completed",
      order_id: result.orderId,
      checkout_session_id: result.session.sessionId,
      totals: {
        subtotal: result.session.totals.subtotal,
        tax: result.session.totals.tax,
        shipping: result.session.totals.shipping,
        total: result.session.totals.total,
      },
      currency: result.session.currency,
      permalink_url: `${baseUrl}/orders/${result.orderId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("not found")
      ? 404
      : message.includes("already completed") || message.includes("cancelled")
        ? 409
        : message.includes("required")
          ? 400
          : message.includes("Payment failed")
            ? 402
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
