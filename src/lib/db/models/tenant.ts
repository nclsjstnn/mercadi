import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITenantLocale {
  currency: string;
  taxRate: number;
  taxInclusive: boolean;
  country: string;
  locale: string;
}

export interface ITenantPayment {
  provider: string;
  providerConfig: Record<string, unknown>;
}

export interface ITenant extends Document {
  name: string;
  slug: string;
  rut: string;
  legalName: string;
  address: {
    street?: string;
    comuna: string;
    region: string;
  };
  ucpEnabled: boolean;
  ucpApiKey: string;
  payment: ITenantPayment;
  commissionRate: number;
  status: "active" | "inactive" | "pending";
  ownerId: mongoose.Types.ObjectId;
  locale: ITenantLocale;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    rut: { type: String, required: true },
    legalName: { type: String, required: true },
    address: {
      street: { type: String },
      comuna: { type: String, required: true },
      region: { type: String, required: true },
    },
    ucpEnabled: { type: Boolean, default: false },
    ucpApiKey: { type: String, required: true },
    payment: {
      provider: { type: String, default: "mock" },
      providerConfig: { type: Schema.Types.Mixed, default: {} },
    },
    commissionRate: { type: Number, default: 0.05 },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "pending",
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    locale: {
      currency: { type: String, default: "CLP" },
      taxRate: { type: Number, default: 0.19 },
      taxInclusive: { type: Boolean, default: true },
      country: { type: String, default: "CL" },
      locale: { type: String, default: "es-CL" },
    },
  },
  { timestamps: true }
);

// slug already has unique:true which creates an index
TenantSchema.index({ ownerId: 1 });

export const Tenant: Model<ITenant> =
  mongoose.models.Tenant || mongoose.model<ITenant>("Tenant", TenantSchema);
