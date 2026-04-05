import { nanoid } from "nanoid";
import { connectDB } from "@/lib/db/connect";
import { Subscription, type ISubscription } from "@/lib/db/models/subscription";
import { SubscriptionTransaction } from "@/lib/db/models/subscription-transaction";
import { User } from "@/lib/db/models/user";
import { authorize, getPlatformOneclickCredentials } from "@/lib/payments/transbank-oneclick";

const MAX_FAILURES = 3;

function nextMonthlyDate(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 30);
  return d;
}

function billingPeriod(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export interface ChargeResult {
  success: boolean;
  transactionId: string;
  errorMessage?: string;
  subscriptionCancelled?: boolean;
}

/**
 * Executes a single charge attempt against a subscription's saved card.
 * Updates subscription status, failure count, and next billing date.
 * Downgrades the user plan if max failures are exceeded.
 */
export async function chargeSubscription(
  subscription: ISubscription
): Promise<ChargeResult> {
  await connectDB();

  const creds = getPlatformOneclickCredentials();
  const buyOrder = `sub_${nanoid(16)}`;
  const attempt = subscription.failureCount + 1;
  const period = billingPeriod(new Date());

  // Create pending transaction record first (for traceability even on crash)
  const txn = await SubscriptionTransaction.create({
    subscriptionId: subscription._id,
    userId: subscription.userId,
    buyOrder,
    amount: subscription.amount,
    currency: subscription.currency,
    billingPeriod: period,
    attemptNumber: attempt,
    status: "pending",
  });

  try {
    const result = await authorize(creds, {
      username: subscription.tbkUsername,
      tbkUser:  subscription.tbkUser!,
      buyOrder,
      amount:   subscription.amount,
    });

    if (result.success && result.detail) {
      const d = result.detail;

      // Update transaction
      await SubscriptionTransaction.findByIdAndUpdate(txn._id, {
        status:                "authorized",
        tbkAuthorizationCode:  d.authorization_code,
        tbkResponseCode:       d.response_code,
        tbkPaymentTypeCode:    d.payment_type_code,
        tbkInstallmentsNumber: d.installments_number,
        tbkCardNumber:         d.buy_order, // Transbank doesn't echo card here; stored at enrollment
        tbkTransactionDate:    new Date(),
      });

      // Advance billing date, reset failures, ensure active
      await Subscription.findByIdAndUpdate(subscription._id, {
        status:          "active",
        failureCount:    0,
        nextBillingDate: nextMonthlyDate(new Date()),
      });

      // If subscription was past_due, restore Pro plan
      await User.findByIdAndUpdate(subscription.userId, { plan: "pro" });

      return { success: true, transactionId: txn._id.toString() };
    }

    // Charge declined
    const responseCode = result.detail?.response_code ?? -1;
    await SubscriptionTransaction.findByIdAndUpdate(txn._id, {
      status:       "failed",
      tbkResponseCode: responseCode,
      errorCode:    String(responseCode),
      errorMessage: `Transbank response_code: ${responseCode}`,
    });

    return await _handleFailure(subscription, txn._id.toString(), `Transbank response_code: ${responseCode}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";

    await SubscriptionTransaction.findByIdAndUpdate(txn._id, {
      status:       "failed",
      errorCode:    "exception",
      errorMessage: msg,
    });

    return await _handleFailure(subscription, txn._id.toString(), msg);
  }
}

async function _handleFailure(
  subscription: ISubscription,
  transactionId: string,
  errorMessage: string
): Promise<ChargeResult> {
  const newFailureCount = subscription.failureCount + 1;

  if (newFailureCount >= MAX_FAILURES) {
    // Cancel subscription and downgrade plan
    await Subscription.findByIdAndUpdate(subscription._id, {
      status:             "cancelled",
      failureCount:       newFailureCount,
      cancelledAt:        new Date(),
      cancellationReason: `Auto-cancelled after ${MAX_FAILURES} failed charge attempts`,
    });
    await User.findByIdAndUpdate(subscription.userId, { plan: "free" });

    return {
      success: false,
      transactionId,
      errorMessage,
      subscriptionCancelled: true,
    };
  }

  // Mark past_due — will be retried next cron run
  await Subscription.findByIdAndUpdate(subscription._id, {
    status:       "past_due",
    failureCount: newFailureCount,
  });

  return { success: false, transactionId, errorMessage };
}
