import { NextRequest, NextResponse } from "next/server";
import { validateACPApiKey } from "@/lib/auth/guards";
import { parseACPHeaders } from "@/lib/acp/headers";
import { generateProductFeed, feedToCSV } from "@/lib/acp/feed-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const headers = parseACPHeaders(request);

    const tenant = await validateACPApiKey(tenantSlug, headers.apiKey || null);
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feed = await generateProductFeed(tenant);

    const format =
      request.nextUrl.searchParams.get("format") ||
      (request.headers.get("accept")?.includes("text/csv") ? "csv" : "json");

    if (format === "csv") {
      const csv = feedToCSV(feed);
      return new NextResponse(csv, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${tenantSlug}-product-feed.csv"`,
        },
      });
    }

    return NextResponse.json({
      items: feed,
      total: feed.length,
      currency: tenant.locale.currency,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
