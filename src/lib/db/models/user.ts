import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotificationPreferences {
  // Tenant owner / collaborator preferences
  orderReady: boolean;
  paymentReceived: boolean;
  storeConfigured: boolean;
  // Admin-only preferences
  tenantCreated: boolean;
  adminPaymentReceived: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: INotificationPreferences = {
  orderReady: true,
  paymentReceived: true,
  storeConfigured: true,
  tenantCreated: true,
  adminPaymentReceived: true,
};

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "tenant_owner";
  plan: "free" | "pro";
  tenantId?: mongoose.Types.ObjectId;
  rut?: string;
  notificationPreferences?: INotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "tenant_owner"], required: true },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
    rut: { type: String },
    notificationPreferences: {
      type: {
        orderReady: { type: Boolean, default: true },
        paymentReceived: { type: Boolean, default: true },
        storeConfigured: { type: Boolean, default: true },
        tenantCreated: { type: Boolean, default: true },
        adminPaymentReceived: { type: Boolean, default: true },
      },
      default: () => ({ ...DEFAULT_NOTIFICATION_PREFERENCES }),
    },
  },
  { timestamps: true }
);


export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
