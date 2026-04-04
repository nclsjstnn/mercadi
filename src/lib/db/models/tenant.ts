import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITenantLocale {
  currency: string;
  taxRate: number;
  taxInclusive: boolean;
  country: string;
  locale: string;
}

export interface ITenantPaymentConfig {
  provider: string;
  providerConfig: Record<string, unknown>;
  enabled: boolean;
}

/** @deprecated Use payments[] array instead */
export interface ITenantPayment {
  provider: string;
  providerConfig: Record<string, unknown>;
}

export interface ITenantStoreTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
}

export interface ITenantStore {
  enabled: boolean;
  theme: ITenantStoreTheme;
  template: string;
  customDomain: string;
  customDomainVerified: boolean;
}

export interface IShippingOption {
  id: string;
  name: string;
  price: number;
  type: "shipping" | "pickup";
  enabled: boolean;
}

export interface ITenantShipping {
  options: IShippingOption[];
}

export interface ITenantAcpLegalLinks {
  privacyPolicy: string;
  termsOfService: string;
  refundPolicy?: string;
}

export interface ITenantWhatsApp {
  enabled: boolean;
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
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
  acpEnabled: boolean;
  acpApiKey: string;
  acpSigningSecret: string;
  acpPaymentProvider: string;
  acpPaymentConfig: Record<string, unknown>;
  acpLegalLinks: ITenantAcpLegalLinks;
  /** Legacy single-provider field. Use payments[] for new tenants. */
  payment: ITenantPayment;
  payments: ITenantPaymentConfig[];
  store: ITenantStore;
  shipping: ITenantShipping;
  commissionRate: number;
  status: "active" | "inactive" | "pending";
  ownerId: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  locale: ITenantLocale;
  whatsapp: ITenantWhatsApp;
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
    acpEnabled: { type: Boolean, default: false },
    acpApiKey: { type: String, default: "" },
    acpSigningSecret: { type: String, default: "" },
    acpPaymentProvider: { type: String, default: "stripe" },
    acpPaymentConfig: { type: Schema.Types.Mixed, default: {} },
    acpLegalLinks: {
      privacyPolicy: { type: String, default: "" },
      termsOfService: { type: String, default: "" },
      refundPolicy: { type: String, default: "" },
    },
    payment: {
      provider: { type: String, default: "mock" },
      providerConfig: { type: Schema.Types.Mixed, default: {} },
    },
    payments: {
      type: [
        {
          provider: { type: String, required: true },
          providerConfig: { type: Schema.Types.Mixed, default: {} },
          enabled: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
    store: {
      enabled: { type: Boolean, default: false },
      theme: {
        primaryColor: { type: String, default: "#2563eb" },
        secondaryColor: { type: String, default: "#1e40af" },
        accentColor: { type: String, default: "#f59e0b" },
        logoUrl: { type: String, default: "" },
        faviconUrl: { type: String, default: "" },
      },
      template: { type: String, default: "" },
      customDomain: { type: String, default: "" },
      customDomainVerified: { type: Boolean, default: false },
    },
    shipping: {
      options: {
        type: [
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            type: { type: String, enum: ["shipping", "pickup"], required: true },
            enabled: { type: Boolean, default: true },
          },
        ],
        default: [],
      },
    },
    commissionRate: { type: Number, default: 0.05 },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "pending",
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collaborators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    locale: {
      currency: { type: String, default: "CLP" },
      taxRate: { type: Number, default: 0.19 },
      taxInclusive: { type: Boolean, default: true },
      country: { type: String, default: "CL" },
      locale: { type: String, default: "es-CL" },
    },
    whatsapp: {
      enabled: { type: Boolean, default: false },
      phoneNumberId: { type: String, default: "" },
      accessToken: { type: String, default: "" },
      verifyToken: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// slug already has unique:true which creates an index
TenantSchema.index({ ownerId: 1 });
TenantSchema.index({ collaborators: 1 });
TenantSchema.index(
  { "store.customDomain": 1 },
  { unique: true, sparse: true, partialFilterExpression: { "store.customDomain": { $ne: "" } } }
);

export const Tenant: Model<ITenant> =
  mongoose.models.Tenant || mongoose.model<ITenant>("Tenant", TenantSchema);
