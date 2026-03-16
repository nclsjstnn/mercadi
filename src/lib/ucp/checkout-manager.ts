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
import type { ILineItem, IBuyer, IFulfillment } from "@/lib/db/models/checkout-session";

interface CreateSessionInput {
  tenantSlug: string;
  lineItems: Array<{ ucpItemId: string; quantity: number }>;
  idempotencyKey?: string;
  ucpAgent?: string;
}

interface UpdateSessionInput {
  buyer?: IBuyer;
  fulfillment?: IFulfillment;
}

export async function createSession(input: CreateSessionInput) {
  await connectDB();

  const tenant = await Tenant.findOne({
    slug: input.tenantSlug,
    ucpEnabled: true,
    status: "active",
  });
  if (!tenant) throw new Error("Tenant not found or UCP not enabled");

  // Check idempotency
  if (input.idempotencyKey) {
    const existing = await CheckoutSession.findOne({
      tenantId: tenant._id,
      idempotencyKey: input.idempotencyKey,
    });
    if (existing) return existing;
  }

  // Resolve products and check stock
  const resolvedItems: ILineItem[] = [];
  let subtotal = 0;

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

  const taxBreakdown = calculateTax(
    subtotal,
    tenant.locale.taxRate,
    tenant.locale.taxInclusive
  );

  const session = await CheckoutSession.create({
    sessionId: `cs_${nanoid(16)}`,
    tenantId: tenant._id,
    status: "open",
    lineItems: resolvedItems,
    totals: {
      subtotal: taxBreakdown.net,
      tax: taxBreakdown.tax,
      shipping: 0,
      total: taxBreakdown.total,
    },
    currency: tenant.locale.currency,
    idempotencyKey: input.idempotencyKey,
    ucpAgent: input.ucpAgent,
    expiresAt: new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000),
  });

  return session;
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
    if (session.status === "buyer_set" || session.status === "open") {
      session.status = "fulfillment_set";
    }
  }

  await session.save();
  return session;
}

export async function completeSession(sessionId: string) {
  await connectDB();
  const session = await CheckoutSession.findOne({ sessionId });
  if (!session) throw new Error("Session not found");

  if (!session.buyer?.email || !session.buyer?.name) {
    throw new Error("Buyer information required before completing");
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

  // Process payment
  const provider = getPaymentProvider(tenant.payment.provider);
  const orderId = `ord_${nanoid(16)}`;

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
    tenant.payment.providerConfig
  );

  // Create payment transaction record
  await PaymentTransaction.create({
    transactionId: paymentResult.transactionId,
    tenantId: tenant._id,
    orderId,
    provider: tenant.payment.provider,
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

  // If provider needs redirect (future Transbank/MP)
  if (!provider.supportsDirectCapture && paymentResult.redirectUrl) {
    session.status = "pending_payment";
    await session.save();
    return {
      session,
      redirectUrl: paymentResult.redirectUrl,
      orderId,
    };
  }

  // Create order
  const order = await Order.create({
    orderId,
    tenantId: tenant._id,
    checkoutSessionId: session.sessionId,
    lineItems: session.lineItems,
    buyer: session.buyer,
    fulfillment: session.fulfillment,
    totals: session.totals,
    currency: session.currency,
    commission: {
      rate: commission.commissionRate,
      amount: commission.totalCommission,
      merchantAmount: commission.merchantPayout,
      status: "pending",
    },
    status: "confirmed",
  });

  // Decrement stock
  for (const item of session.lineItems) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: -item.quantity },
    });
  }

  // Mark session complete
  session.status = "completed";
  await session.save();

  return { session, order, orderId };
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
