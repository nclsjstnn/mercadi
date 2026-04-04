"use server";

import {
  createSession,
  updateSession,
  completeSession,
  applyCoupon,
  removeCoupon,
} from "@/lib/ucp/checkout-manager";
import { connectDB } from "@/lib/db/connect";
import { CheckoutSession } from "@/lib/db/models/checkout-session";
import { Tenant } from "@/lib/db/models/tenant";
import type { IBuyer, IFulfillment, ITotals } from "@/lib/db/models/checkout-session";

interface ActionResult {
  success: boolean;
  error?: string;
  sessionId?: string;
  orderId?: string;
  redirectUrl?: string;
  discount?: number;
  totals?: ITotals;
}

export async function createStoreCheckout(
  tenantSlug: string,
  cartItems: Array<{ ucpItemId: string; quantity: number }>
): Promise<ActionResult> {
  try {
    const { session } = await createSession({
      tenantSlug,
      lineItems: cartItems,
      source: "storefront",
    });
    return { success: true, sessionId: session.sessionId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al crear checkout",
    };
  }
}

export async function updateStoreCheckout(
  sessionId: string,
  updates: { buyer?: IBuyer; fulfillment?: IFulfillment }
): Promise<ActionResult> {
  try {
    await updateSession(sessionId, updates);
    return { success: true, sessionId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al actualizar checkout",
    };
  }
}

export async function applyStoreCoupon(
  sessionId: string,
  couponCode: string
): Promise<ActionResult> {
  try {
    const session = await applyCoupon(sessionId, couponCode);
    return {
      success: true,
      sessionId,
      discount: session.totals.discount,
      totals: session.totals,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al aplicar cupón",
    };
  }
}

export async function removeStoreCoupon(
  sessionId: string
): Promise<ActionResult> {
  try {
    const session = await removeCoupon(sessionId);
    return { success: true, sessionId, totals: session.totals };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al remover cupón",
    };
  }
}

export async function getCheckoutProviders(
  sessionId: string
): Promise<{ success: boolean; providers?: { provider: string; label: string }[]; error?: string }> {
  try {
    await connectDB();
    const session = await CheckoutSession.findOne({ sessionId }).lean();
    if (!session) return { success: false, error: "Sesion no encontrada" };

    const tenant = await Tenant.findById(session.tenantId).lean();
    if (!tenant) return { success: false, error: "Negocio no encontrado" };

    const LABELS: Record<string, string> = {
      transbank: "WebPay (débito / crédito)",
      mercadopago: "MercadoPago",
      mock: "Pago de prueba",
    };

    let active: { provider: string; label: string }[] = [];

    if (tenant.payments?.length) {
      active = tenant.payments
        .filter((p) => p.enabled)
        .map((p) => ({ provider: p.provider, label: LABELS[p.provider] ?? p.provider }));
    } else if (tenant.payment?.provider) {
      active = [{ provider: tenant.payment.provider, label: LABELS[tenant.payment.provider] ?? tenant.payment.provider }];
    }

    return { success: true, providers: active };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export async function completeStoreCheckout(
  sessionId: string,
  provider?: string
): Promise<ActionResult> {
  try {
    const result = await completeSession(sessionId, { provider });
    if ("redirectUrl" in result && result.redirectUrl) {
      return { success: true, redirectUrl: result.redirectUrl, orderId: result.orderId };
    }
    return { success: true, orderId: result.orderId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al completar checkout",
    };
  }
}
