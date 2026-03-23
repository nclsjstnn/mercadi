import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAcpWebhookEvent extends Document {
  eventId: string;
  tenantId: mongoose.Types.ObjectId;
  orderId: string;
  eventType: "order_created" | "order_updated";
  payload: Record<string, unknown>;
  status: "pending" | "sent" | "failed";
  attempts: number;
  lastAttemptAt?: Date;
  responseStatus?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AcpWebhookEventSchema = new Schema<IAcpWebhookEvent>(
  {
    eventId: { type: String, required: true, unique: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    orderId: { type: String, required: true },
    eventType: {
      type: String,
      enum: ["order_created", "order_updated"],
      required: true,
    },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    responseStatus: { type: Number },
  },
  { timestamps: true }
);

AcpWebhookEventSchema.index({ tenantId: 1, status: 1 });
AcpWebhookEventSchema.index({ orderId: 1 });

export const AcpWebhookEvent: Model<IAcpWebhookEvent> =
  mongoose.models.AcpWebhookEvent ||
  mongoose.model<IAcpWebhookEvent>("AcpWebhookEvent", AcpWebhookEventSchema);
