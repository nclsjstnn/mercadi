import { NextRequest, NextResponse } from "next/server";
import { validateUCPApiKey } from "@/lib/auth/guards";
import { parseUCPHeaders } from "@/lib/ucp/headers";
import { createCheckoutSchema } from "@/lib/validators/checkout";
import { createSession } from "@/lib/ucp/checkout-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const { apiKey, idempotencyKey, ucpAgent } = parseUCPHeaders(request);

    const tenant = await validateUCPApiKey(tenantSlug, apiKey || null);
    if (!tenant) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { session, availableShippingOptions } = await createSession({
      tenantSlug,
      lineItems: parsed.data.line_items,
      idempotencyKey,
      ucpAgent,
    });

    return NextResponse.json(
      {
        checkout_session_id: session.sessionId,
        status: session.status,
        line_items: session.lineItems.map((item) => ({
          ucp_item_id: item.ucpItemId,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
        })),
        totals: {
          subtotal: session.totals.subtotal,
          tax: session.totals.tax,
          shipping: session.totals.shipping,
          total: session.totals.total,
        },
        currency: session.currency,
        fulfillment_required: session.fulfillmentRequired,
        available_shipping_options: availableShippingOptions.map((o) => ({
          id: o.id,
          name: o.name,
          price: o.price,
          type: o.type,
        })),
        expires_at: session.expiresAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("not found") ? 404 : message.includes("stock") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
