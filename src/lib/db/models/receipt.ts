import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReceipt extends Document {
  orderId: string;
  tenantId: mongoose.Types.ObjectId;
  provider: string;
  status: "issued" | "failed" | "pending";
  folio?: number;
  trackId?: string;
  documentType?: number;
  totals?: { neto: number; iva: number; total: number };
  pdfBase64?: string;
  errorCode?: string;
  errorMessage?: string;
  issuedAt?: Date;
  providerResponse?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    orderId: { type: String, required: true, unique: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    provider: { type: String, required: true },
    status: {
      type: String,
      enum: ["issued", "failed", "pending"],
      default: "pending",
    },
    folio: { type: Number },
    trackId: { type: String },
    documentType: { type: Number },
    totals: {
      neto: { type: Number },
      iva: { type: Number },
      total: { type: Number },
    },
    pdfBase64: { type: String },
    errorCode: { type: String },
    errorMessage: { type: String },
    issuedAt: { type: Date },
    providerResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ReceiptSchema.index({ tenantId: 1, createdAt: -1 });

export const Receipt: Model<IReceipt> =
  mongoose.models.Receipt || mongoose.model<IReceipt>("Receipt", ReceiptSchema);
