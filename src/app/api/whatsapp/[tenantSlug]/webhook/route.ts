import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { handleIncomingMessage, type IncomingMessage } from "@/lib/whatsapp/handler";

// ─── GET: Webhook verification ────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;
  const { searchParams } = request.nextUrl;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !challenge) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await connectDB();
  const tenant = await Tenant.findOne({ slug: tenantSlug }).lean();

  if (!tenant?.whatsapp?.enabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (token !== tenant.whatsapp.verifyToken) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return new NextResponse(challenge, { status: 200 });
}

// ─── POST: Incoming messages ──────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;

  let payload: WhatsAppWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  // Always respond 200 immediately — Meta retries on non-200
  const processAsync = async () => {
    try {
      await connectDB();
      const tenant = await Tenant.findOne({ slug: tenantSlug });

      if (!tenant?.whatsapp?.enabled || !tenant.whatsapp.phoneNumberId) return;

      const baseUrl =
        process.env.NEXTAUTH_URL || "https://mercadi.cl";

      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const messages = value?.messages;

      if (!messages?.length) return;

      for (const rawMsg of messages) {
        const msg = parseMessage(rawMsg);
        if (!msg) continue;
        await handleIncomingMessage(msg, tenant as never, baseUrl);
      }
    } catch (err) {
      console.error("[WhatsApp webhook]", err);
    }
  };

  // Fire-and-forget — respond 200 immediately
  processAsync();
  return NextResponse.json({ status: "ok" });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawWaMessage {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: "button_reply" | "list_reply";
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
}

interface WhatsAppWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value?: {
        messages?: RawWaMessage[];
      };
    }>;
  }>;
}

function parseMessage(raw: RawWaMessage): IncomingMessage | null {
  if (!raw.from || !raw.id) return null;

  let interactiveId: string | undefined;
  let interactiveTitle: string | undefined;

  if (raw.type === "interactive" && raw.interactive) {
    const reply =
      raw.interactive.button_reply ?? raw.interactive.list_reply;
    interactiveId = reply?.id;
    interactiveTitle = reply?.title;
  }

  return {
    messageId: raw.id,
    from: raw.from,
    type: raw.type,
    text: raw.text?.body,
    interactiveId,
    interactiveTitle,
  };
}
