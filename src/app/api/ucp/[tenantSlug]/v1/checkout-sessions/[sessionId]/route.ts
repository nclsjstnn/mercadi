import { NextRequest, NextResponse } from "next/server";
import { validateUCPApiKey } from "@/lib/auth/guards";
import { parseUCPHeaders } from "@/lib/ucp/headers";
import { updateCheckoutSchema } from "@/lib/validators/checkout";
import { getSession, updateSession } from "@/lib/ucp/checkout-manager";
import { Tenant } from "@/lib/db/models/tenant";
import type { IShippingOption } from "@/lib/db/models/tenant";

export async function GET(
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

    const session = await getSession(sessionId);

    const tenantDoc = await Tenant.findById(session.tenantId);
    const availableShippingOptions = (tenantDoc?.shipping?.options || [])
      .filter((o: IShippingOption) => o.enabled)
      .map((o: IShippingOption) => ({ id: o.id, name: o.name, price: o.price, type: o.type }));

    return NextResponse.json({
      checkout_session_id: session.sessionId,
      status: session.status,
      line_items: session.lineItems.map((item) => ({
        ucp_item_id: item.ucpItemId,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      })),
      buyer: session.buyer
        ? {
            email: session.buyer.email,
            name: session.buyer.name,
            phone: session.buyer.phone,
          }
        : undefined,
      fulfillment: session.fulfillment,
      totals: {
        subtotal: session.totals.subtotal,
        tax: session.totals.tax,
        shipping: session.totals.shipping,
        total: session.totals.total,
      },
      currency: session.currency,
      fulfillment_required: session.fulfillmentRequired,
      available_shipping_options: availableShippingOptions,
      expires_at: session.expiresAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: message },
      { status: message.includes("not found") ? 404 : 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();
    const parsed = updateCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = {
      ...parsed.data,
      fulfillment: parsed.data.fulfillment
        ? {
            type: parsed.data.fulfillment.type,
            shippingOptionId: parsed.data.fulfillment.shipping_option_id,
            address: parsed.data.fulfillment.address,
          }
        : undefined,
    };
    const session = await updateSession(sessionId, updateData);

    return NextResponse.json({
      checkout_session_id: session.sessionId,
      status: session.status,
      buyer: session.buyer,
      fulfillment: session.fulfillment,
      totals: {
        subtotal: session.totals.subtotal,
        tax: session.totals.tax,
        shipping: session.totals.shipping,
        total: session.totals.total,
      },
      currency: session.currency,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: message },
      { status: message.includes("Cannot update") ? 409 : 500 }
    );
  }
}
