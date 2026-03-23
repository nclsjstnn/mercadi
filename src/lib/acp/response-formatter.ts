import type { ICheckoutSession } from "@/lib/db/models/checkout-session";
import type { ITenant, IShippingOption } from "@/lib/db/models/tenant";
import { toAcpStatus } from "./status-mapper";
import { ACP_SUPPORTED_PAYMENT_METHODS } from "./constants";

interface AcpLineItem {
  id: string;
  item: { id: string; quantity: number };
  base_amount: number;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
}

interface AcpTotal {
  type: string;
  display_text: string;
  amount: number;
}

interface AcpFulfillmentOption {
  type: "shipping" | "digital";
  id: string;
  title: string;
  subtitle?: string;
  subtotal: number;
  tax: number;
  total: number;
}

interface AcpLink {
  type: "terms_of_use" | "privacy_policy" | "seller_shop_policies";
  url: string;
}

interface AcpMessage {
  type: "info" | "error";
  content_type: "plain";
  content: string;
  param?: string;
}

interface AcpOrder {
  id: string;
  checkout_session_id: string;
  permalink_url: string;
}

interface AcpSessionResponse {
  id: string;
  status: string;
  currency: string;
  line_items: AcpLineItem[];
  payment_provider: {
    provider: string;
    supported_payment_methods: string[];
  };
  fulfillment_options: AcpFulfillmentOption[];
  totals: AcpTotal[];
  messages: AcpMessage[];
  links: AcpLink[];
  order?: AcpOrder;
}

/**
 * Format a checkout session into the ACP response shape.
 */
export function formatAcpSessionResponse(
  session: ICheckoutSession,
  tenant: ITenant,
  options?: {
    messages?: AcpMessage[];
    order?: { orderId: string; permalinkUrl: string };
  }
): AcpSessionResponse {
  const acpStatus = toAcpStatus(session);
  const lineItemCount = session.lineItems.length;

  // Distribute session-level discount and tax proportionally across line items
  const lineItems: AcpLineItem[] = session.lineItems.map((item, index) => {
    const baseAmount = item.totalPrice;
    const proportion = session.totals.subtotal > 0
      ? baseAmount / session.totals.subtotal
      : 1 / lineItemCount;

    // For the last item, use the remainder to avoid rounding errors
    let discount: number;
    let tax: number;
    if (index === lineItemCount - 1) {
      const prevDiscounts = session.lineItems
        .slice(0, -1)
        .reduce((sum, li, i) => {
          const p = session.totals.subtotal > 0
            ? li.totalPrice / session.totals.subtotal
            : 1 / lineItemCount;
          return sum + Math.round(session.totals.discount * p);
        }, 0);
      const prevTaxes = session.lineItems
        .slice(0, -1)
        .reduce((sum, li, i) => {
          const p = session.totals.subtotal > 0
            ? li.totalPrice / session.totals.subtotal
            : 1 / lineItemCount;
          return sum + Math.round(session.totals.tax * p);
        }, 0);
      discount = session.totals.discount - prevDiscounts;
      tax = session.totals.tax - prevTaxes;
    } else {
      discount = Math.round(session.totals.discount * proportion);
      tax = Math.round(session.totals.tax * proportion);
    }

    const subtotal = baseAmount - discount;
    const total = subtotal + tax;

    return {
      id: item.productId,
      item: { id: item.ucpItemId, quantity: item.quantity },
      base_amount: baseAmount,
      discount,
      subtotal,
      tax,
      total,
    };
  });

  // Build totals array
  const totals: AcpTotal[] = [
    {
      type: "items_base_amount",
      display_text: "Subtotal",
      amount: session.totals.subtotal,
    },
  ];

  if (session.totals.discount > 0) {
    totals.push({
      type: "discount",
      display_text: "Descuento",
      amount: session.totals.discount,
    });
  }

  totals.push({
    type: "subtotal",
    display_text: "Subtotal",
    amount: session.totals.subtotal - session.totals.discount,
  });

  if (session.totals.shipping > 0) {
    totals.push({
      type: "fulfillment",
      display_text: "Envío",
      amount: session.totals.shipping,
    });
  }

  totals.push({
    type: "tax",
    display_text: "IVA",
    amount: session.totals.tax,
  });

  totals.push({
    type: "total",
    display_text: "Total",
    amount: session.totals.total,
  });

  // Build fulfillment options from tenant shipping config
  const fulfillmentOptions: AcpFulfillmentOption[] = session.fulfillmentRequired
    ? tenant.shipping.options
        .filter((opt: IShippingOption) => opt.enabled)
        .map((opt: IShippingOption) => ({
          type: "shipping" as const,
          id: opt.id,
          title: opt.name,
          subtitle: opt.type === "pickup" ? "Retiro en tienda" : undefined,
          subtotal: opt.price,
          tax: 0,
          total: opt.price,
        }))
    : [
        {
          type: "digital" as const,
          id: "digital_delivery",
          title: "Entrega digital",
          subtotal: 0,
          tax: 0,
          total: 0,
        },
      ];

  // Build legal links
  const links: AcpLink[] = [];
  if (tenant.acpLegalLinks?.termsOfService) {
    links.push({
      type: "terms_of_use",
      url: tenant.acpLegalLinks.termsOfService,
    });
  }
  if (tenant.acpLegalLinks?.privacyPolicy) {
    links.push({
      type: "privacy_policy",
      url: tenant.acpLegalLinks.privacyPolicy,
    });
  }
  if (tenant.acpLegalLinks?.refundPolicy) {
    links.push({
      type: "seller_shop_policies",
      url: tenant.acpLegalLinks.refundPolicy,
    });
  }

  const response: AcpSessionResponse = {
    id: session.sessionId,
    status: acpStatus,
    currency: session.currency.toLowerCase(),
    line_items: lineItems,
    payment_provider: {
      provider: tenant.acpPaymentProvider || "stripe",
      supported_payment_methods: [...ACP_SUPPORTED_PAYMENT_METHODS],
    },
    fulfillment_options: fulfillmentOptions,
    totals,
    messages: options?.messages || [],
    links,
  };

  if (options?.order) {
    response.order = {
      id: options.order.orderId,
      checkout_session_id: session.sessionId,
      permalink_url: options.order.permalinkUrl,
    };
  }

  return response;
}

/**
 * Format an ACP error response.
 */
export function formatAcpError(
  type: string,
  code: string,
  message: string,
  param?: string
) {
  return {
    type,
    code,
    message,
    ...(param ? { param } : {}),
  };
}
