import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { PaymentTransaction } from "@/lib/db/models/payment-transaction";
import { Tenant } from "@/lib/db/models/tenant";
import { getPaymentProvider } from "@/lib/payments/factory";
import { finalizeSessionToOrder } from "@/lib/ucp/checkout-manager";
import type { MpWebhookPayload, MpPaymentResponse } from "@/lib/payments/mercadopago-types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const provider = request.nextUrl.searchParams.get("provider");
    const tenantId = request.nextUrl.searchParams.get("tenantId");

    if (!provider || !tenantId) {
      return NextResponse.json(
        { error: "Missing provider or tenantId" },
        { status: 400 }
      );
    }

    await connectDB();

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const paymentProvider = getPaymentProvider(provider);
    const isValid = await paymentProvider.verifyWebhook(
      headers,
      body,
      tenant.payment.providerConfig
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // MercadoPago-specific handling
    if (provider === "mercadopago") {
      const payload = JSON.parse(body) as MpWebhookPayload;

      // Only process payment events
      if (
        payload.action !== "payment.created" &&
        payload.action !== "payment.updated"
      ) {
        return NextResponse.json({ received: true });
      }

      const paymentId = payload.data?.id;
      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      // Fetch payment details from MercadoPago
      const accessToken = tenant.payment.providerConfig.accessToken as string;
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!mpResponse.ok) {
        console.error(
          `[mp-webhook] Failed to fetch payment ${paymentId}: ${mpResponse.status}`
        );
        return NextResponse.json(
          { error: "Failed to fetch payment details" },
          { status: 502 }
        );
      }

      const payment = (await mpResponse.json()) as MpPaymentResponse;

      // Update PaymentTransaction status (lookup by MP preference ID)
      const txnUpdate =
        payment.status === "approved"
          ? { status: "captured", providerResponse: payment }
          : payment.status === "rejected" || payment.status === "cancelled"
            ? { status: "failed", providerResponse: payment }
            : null;

      if (txnUpdate) {
        await PaymentTransaction.findOneAndUpdate(
          { providerTransactionId: payment.preference_id },
          txnUpdate
        );
      }

      // Only finalize the order on approval
      if (payment.status === "approved") {
        const checkoutSessionId = payment.metadata?.checkoutSessionId as
          | string
          | undefined;
        const orderId = payment.external_reference;

        if (!checkoutSessionId || !orderId) {
          console.error(
            `[mp-webhook] Missing checkoutSessionId or orderId in payment ${paymentId}`,
            { checkoutSessionId, orderId }
          );
          return NextResponse.json({ received: true });
        }

        try {
          await finalizeSessionToOrder(checkoutSessionId, orderId);
        } catch (err) {
          console.error(
            `[mp-webhook] finalizeSessionToOrder failed for session ${checkoutSessionId}:`,
            err
          );
          // Return 200 anyway to prevent MP from retrying indefinitely for already-completed sessions
          return NextResponse.json({ received: true });
        }
      }

      return NextResponse.json({ received: true });
    }

    // Generic fallback for other providers
    const payload = JSON.parse(body);
    if (payload.transactionId) {
      await PaymentTransaction.findOneAndUpdate(
        { transactionId: payload.transactionId },
        { status: payload.status, providerResponse: payload }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
