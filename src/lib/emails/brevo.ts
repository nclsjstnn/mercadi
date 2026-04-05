export interface BrevoEmail {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
}

export async function sendEmail(email: BrevoEmail): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[emails] BREVO_API_KEY not set — skipping email");
    return;
  }

  const fromEmail = process.env.BREVO_FROM_EMAIL ?? "noreply@mercadi.cl";

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: "Mercadi" },
      to: email.to,
      subject: email.subject,
      htmlContent: email.htmlContent,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[emails] Brevo error ${res.status}: ${body}`);
  }
}

export function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="background:#f59e0b;padding:20px 40px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#000;">Mercadi.cl</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Mercadi SpA · Hecho en Chile 🇨🇱</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function btnStyle(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#f59e0b;color:#000;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">${label} →</a>`;
}
