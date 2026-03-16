import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILineItem {
  productId: string;
  ucpItemId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IBuyer {
  email: string;
  name: string;
  phone?: string;
  rut?: string;
}

export interface IFulfillment {
  type: "shipping" | "pickup";
  shippingOptionId?: string;
  address?: {
    street: string;
    comuna: string;
    region: string;
    postalCode?: string;
  };
}

export interface ITotals {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface ICheckoutSession extends Document {
  sessionId: string;
  tenantId: mongoose.Types.ObjectId;
  status:
    | "open"
    | "buyer_set"
    | "fulfillment_set"
    | "pending_payment"
    | "completed"
    | "cancelled"
    | "expired";
  lineItems: ILineItem[];
  buyer?: IBuyer;
  fulfillment?: IFulfillment;
  fulfillmentRequired: boolean;
  totals: ITotals;
  couponCode?: string;
  couponId?: string;
  currency: string;
  idempotencyKey?: string;
  ucpAgent?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CheckoutSessionSchema = new Schema<ICheckoutSession>(
  {
    sessionId: { type: String, required: true, unique: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    status: {
      type: String,
      enum: [
        "open",
        "buyer_set",
        "fulfillment_set",
        "pending_payment",
        "completed",
        "cancelled",
        "expired",
      ],
      default: "open",
    },
    lineItems: [
      {
        productId: { type: String, required: true },
        ucpItemId: { type: String, required: true },
        title: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
      },
    ],
    buyer: {
      email: { type: String },
      name: { type: String },
      phone: { type: String },
      rut: { type: String },
    },
    fulfillment: {
      type: {
        type: String,
        enum: ["shipping", "pickup"],
      },
      shippingOptionId: { type: String },
      address: {
        street: { type: String },
        comuna: { type: String },
        region: { type: String },
        postalCode: { type: String },
      },
    },
    fulfillmentRequired: { type: Boolean, default: true },
    totals: {
      subtotal: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    couponCode: { type: String, default: null },
    couponId: { type: String, default: null },
    currency: { type: String, default: "CLP" },
    idempotencyKey: { type: String },
    ucpAgent: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

CheckoutSessionSchema.index({ sessionId: 1 });
CheckoutSessionSchema.index({ tenantId: 1 });
CheckoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CheckoutSession: Model<ICheckoutSession> =
  mongoose.models.CheckoutSession ||
  mongoose.model<ICheckoutSession>("CheckoutSession", CheckoutSessionSchema);
