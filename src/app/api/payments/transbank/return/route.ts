import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { PaymentTransaction } from "@/lib/db/models/payment-transaction";
import { Tenant } from "@/lib/db/models/tenant";
import { TransbankProvider } from "@/lib/payments/transbank-provider";
import { finalizeSessionToOrder } from "@/lib/ucp/checkout-manager";
import { getPlatformIntegrationConfig } from "@/lib/payments/platform-credentials";
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

  // Resolve Transbank config: prefer payments[] array, fall back to legacy payment field
  const tbkEntry =
    tenant.payments?.find((p: { provider: string }) => p.provider === "transbank") ??
    (tenant.payment?.provider === "transbank" ? tenant.payment : null);

  if (!tbkEntry) return failureRedirect(sessionId);

  // Inject platform credentials for integration environment
  const tbkConfig: Record<string, unknown> =
    tbkEntry.providerConfig?.environment === "integration"
      ? getPlatformIntegrationConfig("transbank")
      : (tbkEntry.providerConfig as Record<string, unknown>);

  const provider = new TransbankProvider();

  let captureResult: Awaited<ReturnType<typeof provider.capture>>;
  try {
    captureResult = await provider.capture(token, tbkConfig);
  } catch (err) {
    console.error("[tbk-return] capture() threw:", err);
    return failureRedirect(sessionId);
  }

  const commitResponse = captureResult.providerResponse as unknown as TbkCommitResponse;
  console.info("[tbk-return] commit result:", {
    sessionId,
    tenantId,
    success: captureResult.success,
    responseCode: commitResponse?.responseCode,
    status: commitResponse?.status,
    paymentTypeCode: commitResponse?.paymentTypeCode,
    amount: commitResponse?.amount,
    authorizationCode: commitResponse?.authorizationCode,
    environment: tbkConfig.environment,
  });

  // Update PaymentTransaction status
  await PaymentTransaction.findOneAndUpdate(
    { providerTransactionId: token },
    {
      status: captureResult.success ? "captured" : "failed",
      providerResponse: captureResult.providerResponse,
    }
  );

  if (captureResult.success) {
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

  console.warn("[tbk-return] payment rejected by TBK:", {
    sessionId,
    responseCode: commitResponse?.responseCode,
    status: commitResponse?.status,
  });

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
