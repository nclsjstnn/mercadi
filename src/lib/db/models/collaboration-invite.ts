import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICollaborationInvite extends Document {
  tenantId: mongoose.Types.ObjectId;
  invitedEmail: string;
  invitedBy: mongoose.Types.ObjectId;
  token: string;
  status: "pending" | "accepted" | "revoked";
  acceptedBy?: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CollaborationInviteSchema = new Schema<ICollaborationInvite>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    invitedEmail: { type: String, required: true, lowercase: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked"],
      default: "pending",
    },
    acceptedBy: { type: Schema.Types.ObjectId, ref: "User" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

CollaborationInviteSchema.index({ token: 1 }, { unique: true });
CollaborationInviteSchema.index(
  { tenantId: 1, invitedEmail: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);
CollaborationInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CollaborationInvite: Model<ICollaborationInvite> =
  mongoose.models.CollaborationInvite ||
  mongoose.model<ICollaborationInvite>("CollaborationInvite", CollaborationInviteSchema);
