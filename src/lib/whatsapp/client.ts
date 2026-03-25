const WA_API_VERSION = "v21.0";
const WA_BASE = `https://graph.facebook.com/${WA_API_VERSION}`;

export interface WaTextMessage {
  type: "text";
  body: string;
}

export interface WaInteractiveRow {
  id: string;
  title: string;
  description?: string;
}

export interface WaInteractiveSection {
  title?: string;
  rows: WaInteractiveRow[];
}

export interface WaListMessage {
  type: "list";
  header?: string;
  body: string;
  footer?: string;
  buttonLabel: string;
  sections: WaInteractiveSection[];
}

export interface WaButtonReply {
  id: string;
  title: string;
}

export interface WaButtonMessage {
  type: "buttons";
  header?: string;
  body: string;
  footer?: string;
  buttons: WaButtonReply[];
}

export interface WaImageMessage {
  type: "image";
  imageUrl: string;
  caption?: string;
}

export type WaMessage =
  | WaTextMessage
  | WaListMessage
  | WaButtonMessage
  | WaImageMessage;

export async function sendWhatsAppMessage(
  to: string,
  message: WaMessage,
  phoneNumberId: string,
  accessToken: string
): Promise<void> {
  const url = `${WA_BASE}/${phoneNumberId}/messages`;

  let body: Record<string, unknown>;

  if (message.type === "text") {
    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: message.body, preview_url: false },
    };
  } else if (message.type === "image") {
    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "image",
      image: { link: message.imageUrl, caption: message.caption ?? "" },
    };
  } else if (message.type === "list") {
    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        ...(message.header ? { header: { type: "text", text: message.header } } : {}),
        body: { text: message.body },
        ...(message.footer ? { footer: { text: message.footer } } : {}),
        action: {
          button: message.buttonLabel,
          sections: message.sections,
        },
      },
    };
  } else {
    // buttons
    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        ...(message.header ? { header: { type: "text", text: message.header } } : {}),
        body: { text: message.body },
        ...(message.footer ? { footer: { text: message.footer } } : {}),
        action: {
          buttons: message.buttons.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[WhatsApp] send error", res.status, err);
  }
}

/** Mark incoming message as read (removes clock icon in WhatsApp) */
export async function markAsRead(
  messageId: string,
  phoneNumberId: string,
  accessToken: string
): Promise<void> {
  const url = `${WA_BASE}/${phoneNumberId}/messages`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}
