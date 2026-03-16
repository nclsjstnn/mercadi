import { nanoid } from "nanoid";
import type { PaymentIntent, PaymentResult, PaymentProvider } from "./provider";

const transactions = new Map<string, PaymentResult>();

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";
  readonly supportsDirectCapture = true;

  async authorize(intent: PaymentIntent): Promise<PaymentResult> {
    const txnId = `mock_txn_${nanoid(12)}`;

    if (intent.amount < 0) {
      const result: PaymentResult = {
        success: false,
        transactionId: txnId,
        providerTransactionId: `mock_ext_${nanoid(8)}`,
        status: "failed",
        errorCode: "invalid_amount",
        errorMessage: "Amount must be positive",
      };
      transactions.set(txnId, result);
      return result;
    }

    if (intent.amount % 100 === 99) {
      const result: PaymentResult = {
        success: false,
        transactionId: txnId,
        providerTransactionId: `mock_ext_${nanoid(8)}`,
        status: "failed",
        errorCode: "card_declined",
        errorMessage: "Card was declined",
      };
      transactions.set(txnId, result);
      return result;
    }

    const result: PaymentResult = {
      success: true,
      transactionId: txnId,
      providerTransactionId: `mock_ext_${nanoid(8)}`,
      status: "captured",
      providerResponse: { mock: true, amount: intent.amount },
    };
    transactions.set(txnId, result);
    return result;
  }

  async capture(transactionId: string): Promise<PaymentResult> {
    const existing = transactions.get(transactionId);
    if (!existing) {
      return {
        success: false,
        transactionId,
        providerTransactionId: "",
        status: "failed",
        errorCode: "not_found",
        errorMessage: "Transaction not found",
      };
    }
    return { ...existing, status: "captured" };
  }

  async refund(transactionId: string): Promise<PaymentResult> {
    const existing = transactions.get(transactionId);
    return {
      success: true,
      transactionId,
      providerTransactionId: existing?.providerTransactionId || `mock_ref_${nanoid(8)}`,
      status: "captured",
      providerResponse: { refunded: true },
    };
  }

  async getStatus(transactionId: string): Promise<PaymentResult> {
    const existing = transactions.get(transactionId);
    if (!existing) {
      return {
        success: false,
        transactionId,
        providerTransactionId: "",
        status: "failed",
        errorCode: "not_found",
        errorMessage: "Transaction not found",
      };
    }
    return existing;
  }

  async verifyWebhook(): Promise<boolean> {
    return true;
  }
}
