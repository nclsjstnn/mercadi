import mongoose, { Document, Schema } from "mongoose";

export interface IWaitlistEntry extends Document {
  name: string;
  email: string;
  businessDescription?: string;
  status: "pending" | "approved" | "rejected" | "converted";
  inviteCode?: string;
  inviteExpiresAt?: Date;
  inviteSentAt?: Date;
  convertedAt?: Date;
  convertedUserId?: mongoose.Types.ObjectId;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistEntrySchema = new Schema<IWaitlistEntry>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    businessDescription: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "converted"],
      default: "pending",
    },
    inviteCode: { type: String, sparse: true, unique: true },
    inviteExpiresAt: { type: Date },
    inviteSentAt: { type: Date },
    convertedAt: { type: Date },
    convertedUserId: { type: Schema.Types.ObjectId, ref: "User" },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

export const WaitlistEntry =
  mongoose.models.WaitlistEntry ||
  mongoose.model<IWaitlistEntry>("WaitlistEntry", WaitlistEntrySchema);
