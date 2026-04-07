import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const to = request.nextUrl.searchParams.get("to");
  if (!to) {
    return NextResponse.json({ error: "Pass ?to=your@email.com" }, { status: 400 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL ?? "noreply@mercadi.cl";

  if (!apiKey) {
    return NextResponse.json({ error: "BREVO_API_KEY is not set in environment" }, { status: 500 });
  }

  const payload = {
    sender: { email: fromEmail, name: "Mercadi" },
    to: [{ email: to }],
    subject: "Mercadi — test de email",
    htmlContent: "<p>Si ves esto, Brevo está funcionando correctamente.</p>",
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.text();

  return NextResponse.json({
    status: res.status,
    ok: res.ok,
    brevoResponse: body,
    config: {
      BREVO_API_KEY: apiKey ? `set (${apiKey.slice(0, 8)}…)` : "NOT SET",
      BREVO_FROM_EMAIL: fromEmail,
    },
    payload,
  });
}
