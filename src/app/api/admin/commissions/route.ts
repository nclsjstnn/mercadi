import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/order";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const report = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: {
            tenantId: "$tenantId",
            status: "$commission.status",
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$commission.amount" },
          totalMerchantAmount: { $sum: "$commission.merchantAmount" },
        },
      },
    ]);

    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
