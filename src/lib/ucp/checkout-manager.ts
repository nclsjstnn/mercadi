import { nanoid } from "nanoid";
import { connectDB } from "@/lib/db/connect";
import { CheckoutSession } from "@/lib/db/models/checkout-session";
import { Product } from "@/lib/db/models/product";
import { Order } from "@/lib/db/models/order";
import { PaymentTransaction } from "@/lib/db/models/payment-transaction";
import { Tenant, type ITenant } from "@/lib/db/models/tenant";
import { calculateTax } from "@/lib/utils/tax";
import { calculateCommission } from "@/lib/payments/commission";
import { getPaymentProvider } from "@/lib/payments/factory";
import { SESSION_TTL_MINUTES } from "./constants";
import { Coupon } from "@/lib/db/models/coupon";
import { validateAndCalculateCoupon } from "@/lib/utils/coupon";
import type { ILineItem, IBuyer, IFulfillment } from "@/lib/db/models/checkout-session";
import type { IShippingOption, ITenantPaymentConfig } from "@/lib/db/models/tenant";
import { getPlatformIntegrationConfig } from "@/lib/payments/platform-credentials";
import { notifyOrderReady, notifyPaymentReceived, notifyCustomerOrderCreated } from "@/lib/emails/notifications";

/** Returns the active payment configs for a tenant, preferring the new payments[] array
 *  and falling back to the legacy single payment field. */
function resolveActiveProviders(tenant: ITenant): ITenantPaymentConfig[] {
  if (tenant.payments?.length) {
    return tenant.payments.filter((p) => p.enabled);
  }
  // Legacy fallback
  if (tenant.payment?.provider) {
    return [{ provider: tenant.payment.provider, providerConfig: tenant.payment.providerConfig, enabled: true }];
  }
  return [];
}

interface CreateSessionInput {
  tenantSlug: string;
  lineItems: Array<{ ucpItemId: string; quantity: number }>;
  idempotencyKey?: string;
  ucpAgent?: string;
  source?: "ucp" | "storefront" | "acp";
  acpRequestId?: string;
}

interface CreateSessionResult {
  session: InstanceType<typeof CheckoutSession>;
  availableShippingOptions: IShippingOption[];
}

interface UpdateSessionInput {
  buyer?: IBuyer;
  fulfillment?: IFulfillment;
}

export async function createSession(input: CreateSessionInput): Promise<CreateSessionResult> {
  await connectDB();

  const source = input.source || "ucp";
  const query: Record<string, unknown> = {
    slug: input.tenantSlug,
    status: "active",
  };
  if (source === "storefront") {
    query["store.enabled"] = true;
  } else if (source === "acp") {
    query.acpEnabled = true;
  } else {
    query.ucpEnabled = true;
  }
  const tenant = await Tenant.findOne(query);
  if (!tenant) {
    const messages: Record<string, string> = {
      storefront: "Tienda no encontrada o no habilitada",
      acp: "Tenant not found or ACP not enabled",
      ucp: "Tenant not found or UCP not enabled",
    };
    throw new Error(messages[source] || messages.ucp);
  }

  const availableShippingOptions = (tenant.shipping?.options || []).filter(
    (o: IShippingOption) => o.enabled
  );

  // Check idempotency
  if (input.idempotencyKey) {
    const existing = await CheckoutSession.findOne({
      tenantId: tenant._id,
      idempotencyKey: input.idempotencyKey,
    });
    if (existing) return { session: existing, availableShippingOptions };
  }

  // Resolve products and check stock
  const resolvedItems: ILineItem[] = [];
  let subtotal = 0;
  let allIntangible = true;

  for (const item of input.lineItems) {
    const product = await Product.findOne({
      tenantId: tenant._id,
      ucpItemId: item.ucpItemId,
      status: "active",
    });
    if (!product) throw new Error(`Product not found: ${item.ucpItemId}`);
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.title}`);
    }

    if (!product.intangible) allIntangible = false;

    const totalPrice = product.price * item.quantity;
    subtotal += totalPrice;

    resolvedItems.push({
      productId: product._id.toString(),
      ucpItemId: product.ucpItemId,
      title: product.title,
      quantity: item.quantity,
      unitPrice: product.price,
      totalPrice,
    });
  }

  const fulfillmentRequired = !allIntangible;

  const taxBreakdown = calculateTax(
    subtotal,
    tenant.locale.taxRate,
    tenant.locale.taxInclusive
  );

  const session = await CheckoutSession.create({
    sessionId: `cs_${nanoid(16)}`,
    tenantId: tenant._id,
    source,
    status: "open",
    lineItems: resolvedItems,
    fulfillmentRequired,
    totals: {
      subtotal: taxBreakdown.net,
      discount: 0,
      tax: taxBreakdown.tax,
      shipping: 0,
      total: taxBreakdown.total,
    },
    currency: tenant.locale.currency,
    idempotencyKey: input.idempotencyKey,
    ucpAgent: input.ucpAgent,
    acpRequestId: input.acpRequestId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000),
  });

  return { session, availableShippingOptions };
}

export async function getSession(sessionId: string) {
  await connectDB();
  const session = await CheckoutSession.findOne({ sessionId });
  if (!session) throw new Error("Session not found");
  return session;
}

export async function updateSession(
  sessionId: string,
  updates: UpdateSessionInput
) {
  await connectDB();
  const session = await CheckoutSession.findOne({ sessionId });
  if (!session) throw new Error("Session not found");

  if (session.status === "completed" || session.status === "cancelled") {
    throw new Error(`Cannot update session in ${session.status} state`);
  }

  if (updates.buyer) {
    session.buyer = updates.buyer;
    if (session.status === "open") session.status = "buyer_set";
  }

  if (updates.fulfillment) {
    session.fulfillment = updates.fulfillment;

    // Look up shipping option price if provided
    if (updates.fulfillment.shippingOptionId) {
      const tenant = await Tenant.findById(session.tenantId);
      if (!tenant) throw new Error("Tenant not found");
      const option = (tenant.shipping?.options || []).find(
        (o: IShippingOption) =>
          o.id === updates.fulfillment!.shippingOptionId && o.enabled
      );
      if (!option) throw new Error("Opcion de envio no encontrada o no habilitada");
      if (option.type !== updates.fulfillment.type) {
        throw new Error("Tipo de envio no coincide con la opcion seleccionada");
      }
      session.totals.shipping = option.price;
    } else {
      session.totals.shipping = 0;
    }

    session.totals.total =
      session.totals.subtotal + session.totals.tax + session.totals.shipping;

    if (session.status === "buyer_set" || session.status === "open") {
      session.status = "fulfillment_set";
    }
  }

  await session.save();
  return session;
}

interface CompleteSessionOptions {
  /** ACP delegated payment data — when provided, skips internal payment provider */
  paymentData?: { token: string; provider: string };
  /** Storefront/UCP provider selection when tenant has multiple enabled providers */
  provider?: string;
}

export async function completeSession(sessionId: string, options?: CompleteSessionOptions) {
  await connectDB();
  const session = await CheckoutSession.findOne({ sessionId });
  if (!session) throw new Error("Session not found");

  if (!session.buyer?.email || !session.buyer?.name) {
    throw new Error("Buyer information required before completing");
  }

  if (session.fulfillmentRequired && !session.fulfillment) {
    throw new Error("Informacion de envio requerida para productos fisicos");
  }

  if (session.status === "completed") {
    throw new Error("Session already completed");
  }
  if (session.status === "cancelled") {
    throw new Error("Session was cancelled");
  }

  const tenant = (await Tenant.findById(session.tenantId)) as ITenant;
  if (!tenant) throw new Error("Tenant not found");

  // Calculate commission
  const commission = calculateCommission(
    session.totals.total,
    tenant.commissionRate,
    tenant.locale.taxRate,
    tenant.locale.taxInclusive,
    tenant.locale.currency
  );

  const orderId = `ord_${nanoid(16)}`;
  const isAcpDelegated = session.source === "acp" && options?.paymentData;

  if (isAcpDelegated) {
    // ACP delegated payment: ChatGPT already collected payment, we receive a token
    session.acpPaymentData = {
      token: options.paymentData!.token,
      provider: options.paymentData!.provider,
    };

    // Record the delegated payment transaction
    await PaymentTransaction.create({
      transactionId: `txn_${nanoid(16)}`,
      tenantId: tenant._id,
      orderId,
      provider: `acp_delegated_${options.paymentData!.provider}`,
      amount: session.totals.total,
      currency: session.currency,
      status: "captured",
      providerTransactionId: options.paymentData!.token,
      providerResponse: { delegated: true, acpProvider: options.paymentData!.provider },
    });
  } else {
    // Internal payment flow (UCP / storefront)
    const activeProviders = resolveActiveProviders(tenant);
    if (activeProviders.length === 0) {
      throw new Error("No hay proveedor de pago configurado para este negocio");
    }

    let providerConfig: ITenantPaymentConfig;
    if (options?.provider) {
      const match = activeProviders.find((p) => p.provider === options.provider);
      if (!match) {
        throw new Error(`Proveedor de pago '${options.provider}' no disponible`);
      }
      providerConfig = match;
    } else if (activeProviders.length === 1) {
      providerConfig = activeProviders[0];
    } else {
      throw new Error("Este negocio tiene multiples proveedores de pago. Selecciona uno antes de continuar.");
    }

    const provider = getPaymentProvider(providerConfig.provider);

    // For integration environment, substitute platform-managed test credentials
    // so tenants never need to supply their own sandbox API keys.
    const effectiveConfig: Record<string, unknown> =
      providerConfig.providerConfig.environment === "integration" &&
      (providerConfig.provider === "transbank" || providerConfig.provider === "mercadopago")
        ? getPlatformIntegrationConfig(providerConfig.provider)
        : providerConfig.providerConfig;

    const paymentResult = await provider.authorize(
      {
        amount: session.totals.total,
        currency: session.currency,
        orderId,
        description: `Compra en ${tenant.name} via Mercadi`,
        buyer: {
          email: session.buyer.email,
          name: session.buyer.name,
          rut: session.buyer.rut,
        },
        metadata: {
          tenantId: tenant._id.toString(),
          checkoutSessionId: session.sessionId,
          commissionAmount: commission.totalCommission,
        },
      },
      effectiveConfig
    );

    // Create payment transaction record
    await PaymentTransaction.create({
      transactionId: paymentResult.transactionId,
      tenantId: tenant._id,
      orderId,
      provider: providerConfig.provider,
      amount: session.totals.total,
      currency: session.currency,
      status: paymentResult.success ? paymentResult.status : "failed",
      providerTransactionId: paymentResult.providerTransactionId,
      providerResponse: paymentResult.providerResponse,
      errorCode: paymentResult.errorCode,
      errorMessage: paymentResult.errorMessage,
    });

    if (!paymentResult.success) {
      throw new Error(
        paymentResult.errorMessage || "Payment failed"
      );
    }

    // If provider needs redirect (Transbank/MP)
    if (!provider.supportsDirectCapture && paymentResult.redirectUrl) {
      session.status = "pending_payment";
      await session.save();
      return {
        session,
        redirectUrl: paymentResult.redirectUrl,
        orderId,
      };
    }
  }

  const order = await _createOrderFromSession(session, tenant, orderId, commission);
  return { session, order, orderId };
}

/**
 * Finalizes a pending_payment session into a confirmed order.
 * Called by the MercadoPago webhook handler after verifying an approved payment.
 *
 * @param sessionId  - The checkout session ID (from payment metadata)
 * @param orderId    - The order ID set during authorize() as external_reference
 */
export async function finalizeSessionToOrder(sessionId: string, orderId: string) {
  await connectDB();
  const session = await CheckoutSession.findOne({ sessionId });
  if (!session) throw new Error("Session not found");

  if (session.status === "completed") {
    // Idempotent — webhook may fire more than once
    const order = await Order.findOne({ checkoutSessionId: sessionId });
    return { session, order };
  }
  if (session.status === "cancelled") {
    throw new Error("Cannot finalize cancelled session");
  }

  const tenant = (await Tenant.findById(session.tenantId)) as ITenant;
  if (!tenant) throw new Error("Tenant not found");

  const commission = calculateCommission(
    session.totals.total,
    tenant.commissionRate,
    tenant.locale.taxRate,
    tenant.locale.taxInclusive,
    tenant.locale.currency
  );

  const order = await _createOrderFromSession(session, tenant, orderId, commission);
  return { session, order };
}

async function _createOrderFromSession(
  session: InstanceType<typeof CheckoutSession>,
  tenant: ITenant,
  orderId: string,
  commission: ReturnType<typeof calculateCommission>
) {
  const order = await Order.create({
    orderId,
    tenantId: tenant._id,
    checkoutSessionId: session.sessionId,
    source: session.source || "ucp",
    lineItems: session.lineItems,
    buyer: session.buyer,
    fulfillment: session.fulfillment,
    totals: session.totals,
    couponCode: session.couponCode || undefined,
    currency: session.currency,
    commission: {
      rate: commission.commissionRate,
      amount: commission.totalCommission,
      merchantAmount: commission.merchantPayout,
      status: "pending",
    },
    status: "confirmed",
  });

  // Increment coupon usage atomically
  if (session.couponId) {
    const coupon = await Coupon.findById(session.couponId);
    if (coupon) {
      if (coupon.maxUsageCount != null) {
        await Coupon.findOneAndUpdate(
          { _id: session.couponId, usageCount: { $lt: coupon.maxUsageCount } },
          { $inc: { usageCount: 1 } }
        );
      } else {
        await Coupon.findByIdAndUpdate(session.couponId, { $inc: { usageCount: 1 } });
      }
    }
  }

  // Decrement stock
  for (const item of session.lineItems) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: -item.quantity },
    });
  }

  // Mark session complete
  session.status = "completed";
  await session.save();

  // Fire email notifications (non-blocking — failures must not break order flow)

  notifyCustomerOrderCreated({
    orderId,
    tenantName: tenant.name,
    buyer: { name: session.buyer!.name, email: session.buyer!.email },
    lineItems: session.lineItems.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    totals: session.totals,
    currency: session.currency,
  }).catch((err) => console.error("[emails] notifyCustomerOrderCreated failed:", err));

  const txn = await PaymentTransaction.findOne({ orderId }).select("provider").lean();
  const provider = txn?.provider ?? "unknown";

  notifyOrderReady({
    orderId,
    tenantId: tenant._id.toString(),
    tenantName: tenant.name,
    buyer: { name: session.buyer!.name, email: session.buyer!.email },
    lineItems: session.lineItems.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    total: session.totals.total,
    currency: session.currency,
  }).catch((err) => console.error("[emails] notifyOrderReady failed:", err));

  notifyPaymentReceived({
    orderId,
    tenantId: tenant._id.toString(),
    tenantName: tenant.name,
    buyerName: session.buyer!.name,
    total: session.totals.total,
    currency: session.currency,
    provider,
  }).catch((err) => console.error("[emails] notifyPaymentReceived failed:", err));

  return order;
}

export async function applyCoupon(sessionId: string, couponCode: string) {
  await connectDB();
  const session = await CheckoutSession.findOne({ sessionId });
  if (!session) throw new Error("Session not found");

  if (session.status === "completed" || session.status === "cancelled") {
    throw new Error(`No se puede aplicar cupón a sesión ${session.status}`);
  }

  const coupon = await Coupon.findOne({
    tenantId: session.tenantId,
    code: couponCode.toUpperCase(),
    status: "active",
  });
  if (!coupon) throw new Error("Cupón no encontrado");

  const lineItemsTotal = session.lineItems.reduce((sum, li) => sum + li.totalPrice, 0);
  const result = validateAndCalculateCoupon(coupon, lineItemsTotal);
  if (!result.valid) throw new Error(result.error);

  const tenant = await Tenant.findById(session.tenantId);
  if (!tenant) throw new Error("Tenant not found");

  const discountedAmount = lineItemsTotal - result.discountAmount;
  const taxBreakdown = calculateTax(
    discountedAmount,
    tenant.locale.taxRate,
    tenant.locale.taxInclusive
  );

  session.totals.subtotal = taxBreakdown.net;
  session.totals.discount = result.discountAmount;
  session.totals.tax = taxBreakdown.tax;
  session.totals.total = taxBreakdown.total + session.totals.shipping;
  session.couponCode = coupon.code;
  session.couponId = coupon._id.toString();

  await session.save();
  return session;
}

export async function removeCoupon(sessionId: string) {
  await connectDB();
  const session = await CheckoutSession.findOne({ sessionId });
  if (!session) throw new Error("Session not found");

  if (session.status === "completed" || session.status === "cancelled") {
    throw new Error(`No se puede modificar sesión ${session.status}`);
  }

  const lineItemsTotal = session.lineItems.reduce((sum, li) => sum + li.totalPrice, 0);

  const tenant = await Tenant.findById(session.tenantId);
  if (!tenant) throw new Error("Tenant not found");

  const taxBreakdown = calculateTax(
    lineItemsTotal,
    tenant.locale.taxRate,
    tenant.locale.taxInclusive
  );

  session.totals.subtotal = taxBreakdown.net;
  session.totals.discount = 0;
  session.totals.tax = taxBreakdown.tax;
  session.totals.total = taxBreakdown.total + session.totals.shipping;
  session.couponCode = undefined;
  session.couponId = undefined;

  await session.save();
  return session;
}

export async function cancelSession(sessionId: string) {
  await connectDB();
  const session = await CheckoutSession.findOne({ sessionId });
  if (!session) throw new Error("Session not found");

  if (session.status === "completed") {
    throw new Error("Cannot cancel completed session");
  }

  session.status = "cancelled";
  await session.save();
  return session;
}
