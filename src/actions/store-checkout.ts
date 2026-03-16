"use server";

import {
  createSession,
  updateSession,
  completeSession,
  applyCoupon,
  removeCoupon,
} from "@/lib/ucp/checkout-manager";
import type { IBuyer, IFulfillment, ITotals } from "@/lib/db/models/checkout-session";

interface ActionResult {
  success: boolean;
  error?: string;
  sessionId?: string;
  orderId?: string;
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

export async function completeStoreCheckout(
  sessionId: string
): Promise<ActionResult> {
  try {
    const result = await completeSession(sessionId);
    return { success: true, orderId: result.orderId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al completar checkout",
    };
  }
}
