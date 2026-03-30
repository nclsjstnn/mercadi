import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { WaitlistEntry } from "@/lib/db/models/waitlist-entry";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = 50;

    const filter = status && status !== "all" ? { status } : {};
    const [entries, total] = await Promise.all([
      WaitlistEntry.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      WaitlistEntry.countDocuments(filter),
    ]);

    return NextResponse.json({ entries, total, page, limit });
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
}
