import mongoose, { Schema, Document, Model } from "mongoose";

export type WhatsAppState =
  | "idle"
  | "main_menu"
  | "browsing"
  | "product_list"
  | "product_detail"
  | "search";

export interface IWhatsAppCartItem {
  productId: string;
  title: string;
  price: number;
  qty: number;
}

export interface IWhatsAppContext {
  selectedCategory?: string;
  selectedProductId?: string;
  productListOffset?: number;
}

export interface IWhatsAppConversation extends Document {
  phoneNumber: string;
  tenantId: mongoose.Types.ObjectId;
  state: WhatsAppState;
  context: IWhatsAppContext;
  expiresAt: Date;
  updatedAt: Date;
}

const WhatsAppConversationSchema = new Schema<IWhatsAppConversation>(
  {
    phoneNumber: { type: String, required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    state: {
      type: String,
      enum: ["idle", "main_menu", "browsing", "product_list", "product_detail", "search"],
      default: "idle",
    },
    context: {
      selectedCategory: { type: String },
      selectedProductId: { type: String },
      productListOffset: { type: Number, default: 0 },
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

WhatsAppConversationSchema.index({ phoneNumber: 1, tenantId: 1 }, { unique: true });
WhatsAppConversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const WhatsAppConversation: Model<IWhatsAppConversation> =
  mongoose.models.WhatsAppConversation ||
  mongoose.model<IWhatsAppConversation>("WhatsAppConversation", WhatsAppConversationSchema);
