import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaymentTransaction extends Document {
  transactionId: string;
  tenantId: mongoose.Types.ObjectId;
  orderId: string;
  provider: string;
  amount: number;
  currency: string;
  status: "pending" | "authorized" | "captured" | "failed" | "refunded";
  providerTransactionId?: string;
  providerResponse?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    transactionId: { type: String, required: true, unique: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    orderId: { type: String, required: true },
    provider: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "CLP" },
    status: {
      type: String,
      enum: ["pending", "authorized", "captured", "failed", "refunded"],
      default: "pending",
    },
    providerTransactionId: { type: String },
    providerResponse: { type: Schema.Types.Mixed },
    errorCode: { type: String },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

PaymentTransactionSchema.index({ transactionId: 1 });
PaymentTransactionSchema.index({ orderId: 1 });
PaymentTransactionSchema.index({ tenantId: 1, createdAt: -1 });

export const PaymentTransaction: Model<IPaymentTransaction> =
  mongoose.models.PaymentTransaction ||
  mongoose.model<IPaymentTransaction>("PaymentTransaction", PaymentTransactionSchema);
