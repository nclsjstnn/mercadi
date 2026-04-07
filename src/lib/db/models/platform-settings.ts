import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlatformReceiptSettings {
  activeProvider: string;
  enabled: boolean;
  providerConfig: Record<string, unknown>;
}

export interface IPlatformSettings extends Omit<Document, "_id"> {
  _id: string;
  receipt: IPlatformReceiptSettings;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    _id: { type: String },
    receipt: {
      activeProvider: { type: String, default: "mock" },
      enabled: { type: Boolean, default: false },
      providerConfig: { type: Schema.Types.Mixed, default: {} },
    },
  },
  { timestamps: true }
);

export const PlatformSettings: Model<IPlatformSettings> =
  mongoose.models.PlatformSettings ||
  mongoose.model<IPlatformSettings>(
    "PlatformSettings",
    PlatformSettingsSchema
  );

/** Fetch (or initialize) the singleton platform settings document. */
export async function getPlatformSettings(): Promise<IPlatformSettings> {
  const doc = await PlatformSettings.findByIdAndUpdate(
    "singleton",
    { $setOnInsert: { _id: "singleton" } },
    { upsert: true, new: true }
  );
  return doc!;
}
