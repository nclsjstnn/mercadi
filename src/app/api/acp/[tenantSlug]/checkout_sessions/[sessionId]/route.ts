import { NextRequest, NextResponse } from "next/server";
import { validateACPApiKey } from "@/lib/auth/guards";
import { parseACPHeaders, acpResponseHeaders } from "@/lib/acp/headers";
import { verifyACPSignature } from "@/lib/acp/signature";
import { acpUpdateSessionSchema } from "@/lib/validators/acp-checkout";
import { getSession, updateSession } from "@/lib/ucp/checkout-manager";
import { parseAcpUpdateRequest } from "@/lib/acp/request-parser";
import { formatAcpSessionResponse, formatAcpError } from "@/lib/acp/response-formatter";
import { Tenant } from "@/lib/db/models/tenant";

type RouteParams = { params: Promise<{ tenantSlug: string; sessionId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const session = await getSession(sessionId);
    return NextResponse.json(
      formatAcpSessionResponse(session, tenant),
      { headers: acpResponseHeaders(headers) }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      formatAcpError("invalid_request", "server_error", message),
      { status: message.includes("not found") ? 404 : 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const parsed = acpUpdateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        formatAcpError("invalid_request", "invalid_body", "Invalid request body"),
        { status: 400, headers: acpResponseHeaders(headers) }
      );
    }

    const updateData = parseAcpUpdateRequest(parsed.data);

    // If fulfillment option selected, set it on the fulfillment object
    if (updateData.fulfillmentOptionId && updateData.fulfillment) {
      updateData.fulfillment.shippingOptionId = updateData.fulfillmentOptionId;
    } else if (updateData.fulfillmentOptionId) {
      // Option selected without address change — get existing session fulfillment
      const existingSession = await getSession(sessionId);
      if (existingSession.fulfillment) {
        updateData.fulfillment = {
          ...existingSession.fulfillment,
          shippingOptionId: updateData.fulfillmentOptionId,
        };
      }
    }

    const session = await updateSession(sessionId, {
      buyer: updateData.buyer,
      fulfillment: updateData.fulfillment,
    });

    const tenantDoc = await Tenant.findById(session.tenantId);
    return NextResponse.json(
      formatAcpSessionResponse(session, tenantDoc!),
      { headers: acpResponseHeaders(headers) }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("Cannot update") ? 409 : message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      formatAcpError("invalid_request", "server_error", message),
      { status }
    );
  }
}
