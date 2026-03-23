import type { z } from "zod";
import type {
  acpCreateSessionSchema,
  acpUpdateSessionSchema,
  acpBuyerSchema,
  acpAddressSchema,
} from "@/lib/validators/acp-checkout";
import type { IBuyer, IFulfillment } from "@/lib/db/models/checkout-session";

type AcpCreateInput = z.infer<typeof acpCreateSessionSchema>;
type AcpUpdateInput = z.infer<typeof acpUpdateSessionSchema>;
type AcpBuyer = z.infer<typeof acpBuyerSchema>;
type AcpAddress = z.infer<typeof acpAddressSchema>;

/**
 * Convert ACP items to internal lineItems format for checkout-manager.
 */
export function parseAcpItems(
  items: AcpCreateInput["items"]
): Array<{ ucpItemId: string; quantity: number }> {
  return items.map((item) => ({
    ucpItemId: item.id,
    quantity: item.quantity,
  }));
}

/**
 * Convert ACP buyer to internal IBuyer format.
 */
export function parseAcpBuyer(buyer: AcpBuyer): IBuyer {
  return {
    email: buyer.email,
    name: buyer.name,
    phone: buyer.phone_number,
  };
}

/**
 * Convert ACP fulfillment address to internal IFulfillment format.
 * Maps ACP address fields to Chilean-style internal fields.
 */
export function parseAcpAddress(address: AcpAddress): IFulfillment {
  return {
    type: "shipping",
    address: {
      street: [address.line_one, address.line_two].filter(Boolean).join(", "),
      comuna: address.city,
      region: address.state,
      postalCode: address.postal_code,
    },
  };
}

/**
 * Build internal update input from ACP update request.
 */
export function parseAcpUpdateRequest(body: AcpUpdateInput): {
  buyer?: IBuyer;
  fulfillment?: IFulfillment;
  fulfillmentOptionId?: string;
  items?: Array<{ ucpItemId: string; quantity: number }>;
} {
  const result: {
    buyer?: IBuyer;
    fulfillment?: IFulfillment;
    fulfillmentOptionId?: string;
    items?: Array<{ ucpItemId: string; quantity: number }>;
  } = {};

  if (body.buyer) {
    result.buyer = parseAcpBuyer(body.buyer);
  }

  if (body.fulfillment_address) {
    result.fulfillment = parseAcpAddress(body.fulfillment_address);
  }

  if (body.fulfillment_option_id) {
    result.fulfillmentOptionId = body.fulfillment_option_id;
  }

  if (body.items) {
    result.items = parseAcpItems(body.items);
  }

  return result;
}
