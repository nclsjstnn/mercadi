import { WebpayPlus } from "transbank-sdk";
import { nanoid } from "nanoid";
import type { PaymentIntent, PaymentResult, PaymentProvider } from "./provider";
import type { TbkCommitResponse, TbkRefundResponse } from "./transbank-types";

/**
 * Transbank WebPay Plus provider.
 *
 * Flow:
 * 1. authorize() → WebpayPlus.Transaction.create(buyOrder, sessionId, amount, returnUrl)
 *    Returns { token, url } → redirectUrl points to /checkout/transbank-redirect
 *    (intermediate page that auto-POSTs the form to WebPay)
 *
 * 2. User pays on WebPay
 *
 * 3a. Success/Failure → WebPay POSTs { token_ws } back to returnUrl
 *     /api/payments/transbank/return calls capture(token) → commit(token)
 *     If responseCode === 0 → finalizeSessionToOrder() → success page
 *
 * 3b. Timeout/Cancellation → WebPay GETs returnUrl with TBK_TOKEN param
 *     /api/payments/transbank/return detects TBK_TOKEN → failure page
 *
 * providerConfig shape:
 *   commerceCode: string     — Commerce code from Transbank
 *   apiKey: string           — API key from Transbank developer portal
 *   environment: string      — "integration" | "production"
 *   baseUrl?: string         — Override for returnUrl (defaults to NEXTAUTH_URL)
 */
export class TransbankProvider implements PaymentProvider {
  readonly name = "transbank";
  readonly supportsDirectCapture = false;

  private getTransaction(providerConfig: Record<string, unknown>) {
    const commerceCode = providerConfig.commerceCode as string;
    const apiKey = providerConfig.apiKey as string;
    const isProduction = providerConfig.environment === "production";

    return isProduction
      ? WebpayPlus.Transaction.buildForProduction(commerceCode, apiKey)
      : WebpayPlus.Transaction.buildForIntegration(commerceCode, apiKey);
  }

  async authorize(
    intent: PaymentIntent,
    providerConfig: Record<string, unknown>
  ): Promise<PaymentResult> {
    const baseUrl =
      (providerConfig.baseUrl as string) ||
      process.env.NEXTAUTH_URL ||
      "https://mercadi.cl";

    const sessionId = intent.metadata.checkoutSessionId;
    const tenantId = intent.metadata.tenantId;
    const returnUrl = `${baseUrl}/api/payments/transbank/return?session_id=${sessionId}&tenant_id=${tenantId}`;

    const tx = this.getTransaction(providerConfig);
    const response = (await tx.create(
      intent.orderId,
      sessionId,
      intent.amount,
      returnUrl
    )) as { token: string; url: string };

    return {
      success: true,
      transactionId: `txn_${nanoid(16)}`,
      providerTransactionId: response.token,
      status: "authorized",
      // Redirect to intermediate page that auto-POSTs the form to WebPay
      redirectUrl: `/checkout/transbank-redirect?token=${encodeURIComponent(response.token)}&url=${encodeURIComponent(response.url)}`,
    };
  }

  async capture(
    token: string,
    providerConfig: Record<string, unknown>
  ): Promise<PaymentResult> {
    const tx = this.getTransaction(providerConfig);
    const response = (await tx.commit(token)) as TbkCommitResponse;
    const success = response.responseCode === 0;

    return {
      success,
      transactionId: token,
      providerTransactionId: token,
      status: success ? "captured" : "failed",
      errorCode: success ? undefined : String(response.responseCode),
      providerResponse: response as unknown as Record<string, unknown>,
    };
  }

  async getStatus(
    token: string,
    providerConfig: Record<string, unknown>
  ): Promise<PaymentResult> {
    const tx = this.getTransaction(providerConfig);
    const response = (await tx.status(token)) as TbkCommitResponse;
    const success =
      response.responseCode === 0 && response.status === "AUTHORIZED";

    return {
      success,
      transactionId: token,
      providerTransactionId: token,
      status: success ? "captured" : "failed",
      providerResponse: response as unknown as Record<string, unknown>,
    };
  }

  async refund(
    token: string,
    amount: number | undefined,
    providerConfig: Record<string, unknown>
  ): Promise<PaymentResult> {
    const tx = this.getTransaction(providerConfig);
    // SDK requires amount; for full refund pass 0 or the original amount
    const response = (await tx.refund(
      token,
      amount ?? 0
    )) as TbkRefundResponse;
    const success = response.responseCode === 0;

    return {
      success,
      transactionId: token,
      providerTransactionId: token,
      status: success ? "refunded" : "failed",
      providerResponse: response as unknown as Record<string, unknown>,
    };
  }

  async verifyWebhook(): Promise<boolean> {
    // Transbank uses synchronous return URL confirmation — no async webhook signature to verify
    return true;
  }
}
