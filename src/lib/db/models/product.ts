import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  tenantId: mongoose.Types.ObjectId;
  sku: string;
  ucpItemId: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  tags: string[];
  stock: number;
  status: "active" | "draft" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    sku: { type: String, required: true },
    ucpItemId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    images: [{ type: String }],
    category: { type: String, default: "" },
    tags: [{ type: String }],
    stock: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "draft",
    },
  },
  { timestamps: true }
);

ProductSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ tenantId: 1, status: 1 });
ProductSchema.index({ tenantId: 1, ucpItemId: 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
