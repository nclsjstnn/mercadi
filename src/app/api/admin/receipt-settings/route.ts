import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import {
  PlatformSettings,
  getPlatformSettings,
} from "@/lib/db/models/platform-settings";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const settings = await getPlatformSettings();
    return NextResponse.json({ receipt: settings.receipt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { activeProvider, enabled, providerConfig } = body as {
      activeProvider?: string;
      enabled?: boolean;
      providerConfig?: Record<string, unknown>;
    };

    const update: Record<string, unknown> = {};
    if (activeProvider !== undefined)
      update["receipt.activeProvider"] = activeProvider;
    if (enabled !== undefined) update["receipt.enabled"] = enabled;
    if (providerConfig !== undefined)
      update["receipt.providerConfig"] = providerConfig;

    const settings = await PlatformSettings.findByIdAndUpdate(
      "singleton",
      { $set: update },
      { upsert: true, new: true }
    );

    return NextResponse.json({ receipt: settings!.receipt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
