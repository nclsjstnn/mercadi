import mongoose, { Schema, Document, Model } from "mongoose";
import type { ILineItem, IBuyer, IFulfillment, ITotals } from "./checkout-session";

export interface ICommission {
  rate: number;
  amount: number;
  merchantAmount: number;
  status: "pending" | "collected" | "paid_out";
}

export interface IOrder extends Document {
  orderId: string;
  tenantId: mongoose.Types.ObjectId;
  checkoutSessionId: string;
  lineItems: ILineItem[];
  buyer: IBuyer;
  fulfillment?: IFulfillment;
  totals: ITotals;
  currency: string;
  commission: ICommission;
  status: "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    checkoutSessionId: { type: String, required: true },
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
      email: { type: String, required: true },
      name: { type: String, required: true },
      phone: { type: String },
      rut: { type: String },
    },
    fulfillment: {
      type: {
        type: String,
        enum: ["shipping", "pickup"],
      },
      address: {
        street: { type: String },
        comuna: { type: String },
        region: { type: String },
        postalCode: { type: String },
      },
    },
    totals: {
      subtotal: { type: Number, required: true },
      tax: { type: Number, required: true },
      shipping: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    currency: { type: String, default: "CLP" },
    commission: {
      rate: { type: Number, required: true },
      amount: { type: Number, required: true },
      merchantAmount: { type: Number, required: true },
      status: {
        type: String,
        enum: ["pending", "collected", "paid_out"],
        default: "pending",
      },
    },
    status: {
      type: String,
      enum: ["confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

// orderId already has unique:true which creates an index
OrderSchema.index({ tenantId: 1, createdAt: -1 });
OrderSchema.index({ checkoutSessionId: 1 });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
