interface SendInviteEmailParams {
  to: string;
  name: string;
  inviteUrl: string;
}

export async function sendInviteEmail({ to, name, inviteUrl }: SendInviteEmailParams) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("[invitations] SENDGRID_API_KEY not set — skipping email");
    return;
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? "noreply@mercadi.cl";
  const fromName = "Mercadi";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <!-- Header -->
        <tr>
          <td style="background:#f59e0b;padding:28px 40px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#000;">Mercadi.cl</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#111;">
              ¡Tu invitación está lista, ${name}!
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
              Hemos revisado tu solicitud y nos alegra darte acceso a Mercadi.<br>
              Usa el siguiente enlace para crear tu cuenta y abrir tu primera tienda.
            </p>
            <p style="margin:0 0 32px;">
              <a href="${inviteUrl}"
                 style="display:inline-block;background:#f59e0b;color:#000;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">
                Crear mi cuenta →
              </a>
            </p>
            <p style="margin:0;font-size:13px;color:#888;line-height:1.5;">
              Este enlace es válido por <strong>7 días</strong> y solo puede usarse una vez.<br>
              Si no solicitaste una invitación, puedes ignorar este mensaje.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              © ${new Date().getFullYear()} Mercadi SpA · Hecho en Chile 🇨🇱
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to, name }] }],
      from: { email: fromEmail, name: fromName },
      subject: "Tu invitación a Mercadi está lista",
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${body}`);
  }
}
