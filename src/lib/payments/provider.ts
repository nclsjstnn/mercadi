export interface PaymentIntent {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  buyer: {
    email: string;
    name: string;
    rut?: string;
  };
  metadata: {
    tenantId: string;
    checkoutSessionId: string;
    commissionAmount: number;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  providerTransactionId: string;
  status: "authorized" | "captured" | "failed";
  errorCode?: string;
  errorMessage?: string;
  providerResponse?: Record<string, unknown>;
  redirectUrl?: string;
}

export interface PaymentProvider {
  readonly name: string;
  readonly supportsDirectCapture: boolean;

  authorize(
    intent: PaymentIntent,
    providerConfig: Record<string, unknown>
  ): Promise<PaymentResult>;

  capture(
    transactionId: string,
    providerConfig: Record<string, unknown>
  ): Promise<PaymentResult>;

  refund(
    transactionId: string,
    amount: number | undefined,
    providerConfig: Record<string, unknown>
  ): Promise<PaymentResult>;

  getStatus(
    transactionId: string,
    providerConfig: Record<string, unknown>
  ): Promise<PaymentResult>;

  verifyWebhook(
    headers: Record<string, string>,
    body: string,
    providerConfig: Record<string, unknown>
  ): Promise<boolean>;
}
