import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoupon extends Document {
  tenantId: mongoose.Types.ObjectId;
  code: string;
  description: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minimumOrderAmount?: number | null;
  maxUsageCount?: number | null;
  usageCount: number;
  expiresAt?: Date | null;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    code: { type: String, required: true },
    description: { type: String, default: "" },
    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    minimumOrderAmount: { type: Number, default: null },
    maxUsageCount: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

CouponSchema.index({ tenantId: 1, code: 1 }, { unique: true });
CouponSchema.index({ tenantId: 1, status: 1 });

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);
