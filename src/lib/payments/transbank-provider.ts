import type { PaymentIntent, PaymentResult, PaymentProvider } from "./provider";

/**
 * Transbank WebPay integration stub.
 *
 * Future flow:
 * 1. authorize() → Create transaction via Transbank REST API
 * 2. Returns redirectUrl to WebPay payment form
 * 3. User completes payment on WebPay
 * 4. WebPay redirects back to return URL
 * 5. capture() → Confirm transaction with Transbank
 * 6. Webhook receives async confirmation
 *
 * Requirements:
 * - Commerce code from Transbank
 * - API key from Transbank developer portal
 * - CLP only
 *
 * @see https://www.transbankdevelopers.cl/
 */
export class TransbankProvider implements PaymentProvider {
  readonly name = "transbank";
  readonly supportsDirectCapture = false;

  async authorize(_intent: PaymentIntent): Promise<PaymentResult> {
    throw new Error(
      "Transbank WebPay integration not yet implemented. See https://www.transbankdevelopers.cl/"
    );
  }

  async capture(_transactionId: string): Promise<PaymentResult> {
    throw new Error("Transbank WebPay integration not yet implemented.");
  }

  async refund(_transactionId: string): Promise<PaymentResult> {
    throw new Error("Transbank WebPay integration not yet implemented.");
  }

  async getStatus(_transactionId: string): Promise<PaymentResult> {
    throw new Error("Transbank WebPay integration not yet implemented.");
  }

  async verifyWebhook(): Promise<boolean> {
    throw new Error("Transbank WebPay integration not yet implemented.");
  }
}
