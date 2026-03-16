import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { PaymentTransaction } from "@/lib/db/models/payment-transaction";
import { Tenant } from "@/lib/db/models/tenant";
import { getPaymentProvider } from "@/lib/payments/factory";

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

    // Parse webhook payload and update transaction
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
