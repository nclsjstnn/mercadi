import mongoose, { Schema, Document, Model } from "mongoose";

export type SubscriptionTransactionStatus = "pending" | "authorized" | "failed" | "reversed";

export interface ISubscriptionTransaction extends Document {
  subscriptionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  buyOrder: string; // unique charge identifier sent to Transbank
  amount: number;
  currency: string;
  billingPeriod: string; // "2026-04"
  attemptNumber: number;

  status: SubscriptionTransactionStatus;

  // Transbank response (on success)
  tbkAuthorizationCode?: string;
  tbkResponseCode?: number;
  tbkPaymentTypeCode?: string;
  tbkInstallmentsNumber?: number;
  tbkCardType?: string;
  tbkCardNumber?: string;
  tbkTransactionDate?: Date;

  // On failure
  errorCode?: string;
  errorMessage?: string;

  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionTransactionSchema = new Schema<ISubscriptionTransaction>(
  {
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    buyOrder: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "CLP" },
    billingPeriod: { type: String, required: true },
    attemptNumber: { type: Number, default: 1 },

    status: {
      type: String,
      enum: ["pending", "authorized", "failed", "reversed"],
      default: "pending",
    },

    tbkAuthorizationCode: { type: String },
    tbkResponseCode: { type: Number },
    tbkPaymentTypeCode: { type: String },
    tbkInstallmentsNumber: { type: Number },
    tbkCardType: { type: String },
    tbkCardNumber: { type: String },
    tbkTransactionDate: { type: Date },

    errorCode: { type: String },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

SubscriptionTransactionSchema.index({ subscriptionId: 1, createdAt: -1 });
SubscriptionTransactionSchema.index({ userId: 1, createdAt: -1 });
SubscriptionTransactionSchema.index({ buyOrder: 1 }, { unique: true });

export const SubscriptionTransaction: Model<ISubscriptionTransaction> =
  mongoose.models.SubscriptionTransaction ||
  mongoose.model<ISubscriptionTransaction>(
    "SubscriptionTransaction",
    SubscriptionTransactionSchema
  );
