import type { PaymentIntent, PaymentResult, PaymentProvider } from "./provider";

/**
 * MercadoPago integration stub.
 *
 * Future flow:
 * 1. authorize() → Create preference via MercadoPago API
 * 2. Returns redirectUrl to MercadoPago checkout
 * 3. User completes payment on MercadoPago
 * 4. MercadoPago sends webhook notification (IPN)
 * 5. capture() → Verify payment status via API
 *
 * Requirements:
 * - Access token from MercadoPago
 * - Public key for frontend integration
 * - Supports multiple currencies (CLP, ARS, BRL, MXN, etc.)
 *
 * @see https://www.mercadopago.cl/developers
 */
export class MercadoPagoProvider implements PaymentProvider {
  readonly name = "mercadopago";
  readonly supportsDirectCapture = false;

  async authorize(_intent: PaymentIntent): Promise<PaymentResult> {
    throw new Error(
      "MercadoPago integration not yet implemented. See https://www.mercadopago.cl/developers"
    );
  }

  async capture(_transactionId: string): Promise<PaymentResult> {
    throw new Error("MercadoPago integration not yet implemented.");
  }

  async refund(_transactionId: string): Promise<PaymentResult> {
    throw new Error("MercadoPago integration not yet implemented.");
  }

  async getStatus(_transactionId: string): Promise<PaymentResult> {
    throw new Error("MercadoPago integration not yet implemented.");
  }

  async verifyWebhook(): Promise<boolean> {
    throw new Error("MercadoPago integration not yet implemented.");
  }
}
