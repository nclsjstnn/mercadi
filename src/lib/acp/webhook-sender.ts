import { nanoid } from "nanoid";
import { connectDB } from "@/lib/db/connect";
import { AcpWebhookEvent } from "@/lib/db/models/acp-webhook-event";
import { Order } from "@/lib/db/models/order";
import type { ITenant } from "@/lib/db/models/tenant";
import { signACPPayload } from "./signature";

const ACP_WEBHOOK_URL = "https://api.openai.com/v1/commerce/webhooks";

interface WebhookOrderData {
  type: "order";
  checkout_session_id: string;
  permalink_url: string;
  status: string;
  refunds: Array<{ type: string; amount: number }>;
}

/**
 * Map internal order status to ACP order status.
 */
function toAcpOrderStatus(status: string): string {
  const map: Record<string, string> = {
    confirmed: "confirmed",
    processing: "confirmed",
    shipped: "shipped",
    delivered: "fulfilled",
    cancelled: "canceled",
    refunded: "canceled",
  };
  return map[status] || "created";
}

/**
 * Send order_created webhook to OpenAI after ACP checkout completion.
 */
export async function sendOrderCreatedWebhook(
  orderId: string,
  tenant: ITenant,
  permalinkUrl: string
) {
  await connectDB();

  const order = await Order.findOne({ orderId });
  if (!order) return;

  const eventId = `evt_${nanoid(16)}`;
  const payload = {
    type: "order_created",
    data: {
      type: "order",
      checkout_session_id: order.checkoutSessionId,
      permalink_url: permalinkUrl,
      status: "created",
      refunds: [],
    } as WebhookOrderData,
  };

  const event = await AcpWebhookEvent.create({
    eventId,
    tenantId: tenant._id,
    orderId,
    eventType: "order_created",
    payload,
    status: "pending",
    attempts: 0,
  });

  await deliverWebhook(event, tenant);
}

/**
 * Send order_updated webhook to OpenAI on order status changes.
 */
export async function sendOrderUpdatedWebhook(
  orderId: string,
  tenant: ITenant,
  permalinkUrl: string,
  refunds?: Array<{ type: "store_credit" | "original_payment"; amount: number }>
) {
  await connectDB();

  const order = await Order.findOne({ orderId });
  if (!order) return;

  const eventId = `evt_${nanoid(16)}`;
  const payload = {
    type: "order_updated",
    data: {
      type: "order",
      checkout_session_id: order.checkoutSessionId,
      permalink_url: permalinkUrl,
      status: toAcpOrderStatus(order.status),
      refunds: refunds || [],
    } as WebhookOrderData,
  };

  const event = await AcpWebhookEvent.create({
    eventId,
    tenantId: tenant._id,
    orderId,
    eventType: "order_updated",
    payload,
    status: "pending",
    attempts: 0,
  });

  await deliverWebhook(event, tenant);
}

/**
 * Deliver a webhook event to OpenAI. Updates the event record with result.
 */
async function deliverWebhook(
  event: InstanceType<typeof AcpWebhookEvent>,
  tenant: ITenant
) {
  try {
    const body = JSON.stringify(event.payload);
    const timestamp = new Date().toISOString();
    const signature = tenant.acpSigningSecret
      ? signACPPayload(body, timestamp, tenant.acpSigningSecret)
      : "";

    const response = await fetch(ACP_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${tenant.acpApiKey}`,
        signature,
        timestamp,
        "request-id": event.eventId,
      },
      body,
    });

    event.attempts += 1;
    event.lastAttemptAt = new Date();
    event.responseStatus = response.status;

    if (response.ok) {
      event.status = "sent";
    } else {
      event.status = "failed";
    }
  } catch {
    event.attempts += 1;
    event.lastAttemptAt = new Date();
    event.status = "failed";
  }

  await event.save();
}
