import mongoose, { Schema, Document, Model } from "mongoose";

export type SubscriptionStatus = "enrolling" | "active" | "past_due" | "cancelled";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: "pro";
  status: SubscriptionStatus;
  billingCycle: "monthly";
  amount: number;
  currency: string;

  // Transbank OneClick
  tbkEnvironment: "integration" | "production";
  tbkUser?: string;
  tbkUsername: string; // email used at enrollment
  cardType?: string;
  cardLast4?: string;

  // Billing
  nextBillingDate?: Date;
  failureCount: number; // resets on successful charge
  cancelledAt?: Date;
  cancellationReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["pro"], default: "pro" },
    status: {
      type: String,
      enum: ["enrolling", "active", "past_due", "cancelled"],
      default: "enrolling",
    },
    billingCycle: { type: String, enum: ["monthly"], default: "monthly" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "CLP" },

    tbkEnvironment: {
      type: String,
      enum: ["integration", "production"],
      required: true,
    },
    tbkUser: { type: String },
    tbkUsername: { type: String, required: true },
    cardType: { type: String },
    cardLast4: { type: String },

    nextBillingDate: { type: Date },
    failureCount: { type: Number, default: 0 },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1, nextBillingDate: 1 });

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
