import { createHmac, timingSafeEqual } from "crypto";
import { nanoid } from "nanoid";
import type { PaymentIntent, PaymentResult, PaymentProvider } from "./provider";
import type {
  MpPreferenceRequest,
  MpPreferenceResponse,
  MpPaymentResponse,
  MpWebhookPayload,
} from "./mercadopago-types";

const MP_API_BASE = "https://api.mercadopago.com";

/**
 * MercadoPago Checkout Pro provider.
 *
 * Flow:
 * 1. authorize() → POST /checkout/preferences → returns init_point as redirectUrl
 * 2. User pays on MercadoPago hosted page
 * 3. MP redirects back to back_urls.success/failure/pending
 * 4. MP sends webhook → POST /api/payments/webhook?provider=mercadopago&tenantId=...
 * 5. Webhook handler fetches payment details, finalizes order
 *
 * providerConfig shape:
 *   accessToken: string   — MP access token (server-side only)
 *   publicKey: string     — MP public key (for future Checkout Bricks)
 *   webhookSecret: string — HMAC key for webhook signature verification
 *   baseUrl?: string      — Override for back_urls / notification_url (defaults to NEXTAUTH_URL)
 */
export class MercadoPagoProvider implements PaymentProvider {
  readonly name = "mercadopago";
  readonly supportsDirectCapture = false;

  async authorize(
    intent: PaymentIntent,
    providerConfig: Record<string, unknown>
  ): Promise<PaymentResult> {
    const accessToken = providerConfig.accessToken as string;
    const baseUrl =
      (providerConfig.baseUrl as string) ||
      process.env.NEXTAUTH_URL ||
      "https://mercadi.cl";

    const sessionId = intent.metadata.checkoutSessionId as string;
    const tenantId = intent.metadata.tenantId as string;

    const body: MpPreferenceRequest = {
      items: [
        {
          title: intent.description,
          quantity: 1,
          unit_price: intent.amount,
          currency_id: intent.currency,
        },
      ],
      payer: {
        email: intent.buyer.email,
        name: intent.buyer.name,
      },
      back_urls: {
        success: `${baseUrl}/checkout/result?status=success&session_id=${sessionId}`,
        failure: `${baseUrl}/checkout/result?status=failure&session_id=${sessionId}`,
        pending: `${baseUrl}/checkout/result?status=pending&session_id=${sessionId}`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/payments/webhook?provider=mercadopago&tenantId=${tenantId}`,
      external_reference: intent.orderId,
      metadata: {
        tenantId,
        checkoutSessionId: sessionId,
        commissionAmount: intent.metadata.commissionAmount,
      },
    };

    const response = await fetch(`${MP_API_BASE}/checkout/preferences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        transactionId: `txn_${nanoid(16)}`,
        providerTransactionId: "",
        status: "failed",
        errorCode: String(response.status),
        errorMessage: `MercadoPago preference creation failed: ${errorText}`,
      };
    }

    const preference = (await response.json()) as MpPreferenceResponse;

    return {
      success: true,
      transactionId: `txn_${nanoid(16)}`,
      providerTransactionId: preference.id,
      status: "authorized",
      redirectUrl: preference.init_point,
    };
  }

  async capture(
    transactionId: string,
    _providerConfig: Record<string, unknown>
  ): Promise<PaymentResult> {
    // Checkout Pro captures on MP side; capture is a no-op for us
    return {
      success: true,
      transactionId,
      providerTransactionId: transactionId,
      status: "captured",
    };
  }

  async getStatus(
    paymentId: string,
    providerConfig: Record<string, unknown>
  ): Promise<PaymentResult> {
    const accessToken = providerConfig.accessToken as string;

    const response = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return {
        success: false,
        transactionId: paymentId,
        providerTransactionId: paymentId,
        status: "failed",
        errorCode: String(response.status),
        errorMessage: "Failed to fetch payment status from MercadoPago",
      };
    }

    const payment = (await response.json()) as MpPaymentResponse;

    const statusMap: Record<string, PaymentResult["status"]> = {
      approved: "captured",
      pending: "authorized",
      in_process: "authorized",
      rejected: "failed",
      cancelled: "failed",
      refunded: "refunded",
      charged_back: "refunded",
    };

    return {
      success: payment.status === "approved",
      transactionId: paymentId,
      providerTransactionId: String(payment.id),
      status: statusMap[payment.status] ?? "failed",
      providerResponse: payment as unknown as Record<string, unknown>,
    };
  }

  async refund(
    paymentId: string,
    amount: number | undefined,
    providerConfig: Record<string, unknown>
  ): Promise<PaymentResult> {
    const accessToken = providerConfig.accessToken as string;

    const body = amount != null ? { amount } : {};
    const response = await fetch(
      `${MP_API_BASE}/v1/payments/${paymentId}/refunds`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        transactionId: paymentId,
        providerTransactionId: paymentId,
        status: "failed",
        errorMessage: `MercadoPago refund failed: ${errorText}`,
      };
    }

    return {
      success: true,
      transactionId: paymentId,
      providerTransactionId: paymentId,
      status: "refunded",
    };
  }

  async verifyWebhook(
    headers: Record<string, string>,
    body: string,
    providerConfig: Record<string, unknown>
  ): Promise<boolean> {
    const webhookSecret = providerConfig.webhookSecret as string | undefined;
    if (!webhookSecret) return false;

    const sigHeader = headers["x-signature"];
    const requestId = headers["x-request-id"] || "";
    if (!sigHeader) return false;

    let ts = "";
    let v1 = "";
    for (const part of sigHeader.split(",")) {
      const eqIdx = part.indexOf("=");
      if (eqIdx === -1) continue;
      const key = part.slice(0, eqIdx).trim();
      const value = part.slice(eqIdx + 1).trim();
      if (key === "ts") ts = value;
      else if (key === "v1") v1 = value;
    }

    if (!ts || !v1) return false;

    let dataId = "";
    try {
      const parsed = JSON.parse(body) as MpWebhookPayload;
      dataId = parsed.data?.id ?? "";
    } catch {
      return false;
    }

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const computed = createHmac("sha256", webhookSecret)
      .update(manifest)
      .digest("hex");

    try {
      return timingSafeEqual(Buffer.from(computed), Buffer.from(v1));
    } catch {
      return false;
    }
  }
}
