import type { ICheckoutSession } from "@/lib/db/models/checkout-session";

export type AcpSessionStatus =
  | "not_ready_for_payment"
  | "ready_for_payment"
  | "completed"
  | "canceled";

/**
 * Map internal checkout session status to ACP status.
 * ACP considers a session `ready_for_payment` when all required info is present.
 * For intangible-only orders (fulfillmentRequired=false), `buyer_set` is enough.
 */
export function toAcpStatus(session: {
  status: ICheckoutSession["status"];
  fulfillmentRequired: boolean;
}): AcpSessionStatus {
  switch (session.status) {
    case "open":
      return "not_ready_for_payment";
    case "buyer_set":
      return session.fulfillmentRequired
        ? "not_ready_for_payment"
        : "ready_for_payment";
    case "fulfillment_set":
      return "ready_for_payment";
    case "pending_payment":
      return "not_ready_for_payment";
    case "completed":
      return "completed";
    case "cancelled":
    case "expired":
      return "canceled";
    default:
      return "not_ready_for_payment";
  }
}
