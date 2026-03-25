import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { PaymentTransaction } from "@/lib/db/models/payment-transaction";
import { Tenant } from "@/lib/db/models/tenant";
import { TransbankProvider } from "@/lib/payments/transbank-provider";
import { finalizeSessionToOrder } from "@/lib/ucp/checkout-manager";
import type { TbkCommitResponse } from "@/lib/payments/transbank-types";

function failureRedirect(sessionId: string | null) {
  const params = sessionId
    ? `?status=failure&session_id=${sessionId}`
    : `?status=failure`;
  return NextResponse.redirect(
    new URL(`/checkout/result${params}`, process.env.NEXTAUTH_URL || "https://mercadi.cl")
  );
}

/**
 * POST — WebPay sends token_ws in the form body after the user pays (approved or rejected).
 * We must call commit(token) synchronously to confirm or reject the transaction.
 */
export async function POST(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const tenantId = request.nextUrl.searchParams.get("tenant_id");
  const baseUrl = process.env.NEXTAUTH_URL || "https://mercadi.cl";

  let token: string | null = null;
  try {
    const formData = await request.formData();
    token = formData.get("token_ws") as string | null;
  } catch {
    return failureRedirect(sessionId);
  }

  if (!token || !sessionId || !tenantId) {
    return failureRedirect(sessionId);
  }

  await connectDB();

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) return failureRedirect(sessionId);

  const provider = new TransbankProvider();
  const captureResult = await provider.capture(
    token,
    tenant.payment.providerConfig
  );

  // Update PaymentTransaction status
  await PaymentTransaction.findOneAndUpdate(
    { providerTransactionId: token },
    {
      status: captureResult.success ? "captured" : "failed",
      providerResponse: captureResult.providerResponse,
    }
  );

  if (captureResult.success) {
    const commitResponse = captureResult.providerResponse as unknown as TbkCommitResponse;
    const orderId = commitResponse.buyOrder;

    try {
      await finalizeSessionToOrder(sessionId, orderId);
    } catch (err) {
      console.error("[tbk-return] finalizeSessionToOrder failed:", err);
      // Session may already be completed (idempotent) — still show success
    }

    return NextResponse.redirect(
      new URL(
        `/checkout/result?status=success&session_id=${sessionId}`,
        baseUrl
      )
    );
  }

  return NextResponse.redirect(
    new URL(
      `/checkout/result?status=failure&session_id=${sessionId}`,
      baseUrl
    )
  );
}

/**
 * GET — WebPay redirects here when the user cancels or the session times out.
 * The TBK_TOKEN param identifies the aborted transaction; no commit needed.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const baseUrl = process.env.NEXTAUTH_URL || "https://mercadi.cl";

  // TBK_TOKEN present = timeout or cancellation
  // Regardless, direct to failure result page
  return NextResponse.redirect(
    new URL(
      `/checkout/result?status=failure&session_id=${sessionId}`,
      baseUrl
    )
  );
}
