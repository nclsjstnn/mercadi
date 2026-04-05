import { sendEmail, emailLayout, btnStyle } from "@/lib/emails/brevo";

interface SendInviteEmailParams {
  to: string;
  name: string;
  inviteUrl: string;
}

export async function sendInviteEmail({ to, name, inviteUrl }: SendInviteEmailParams) {
  const html = emailLayout(`
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#111;">
      ¡Tu invitación está lista, ${name}!
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
      Hemos revisado tu solicitud y nos alegra darte acceso a Mercadi.<br>
      Usa el siguiente enlace para crear tu cuenta y abrir tu primera tienda.
    </p>
    <p style="margin:0 0 32px;">${btnStyle(inviteUrl, "Crear mi cuenta")}</p>
    <p style="margin:0;font-size:13px;color:#888;line-height:1.5;">
      Este enlace es válido por <strong>7 días</strong> y solo puede usarse una vez.<br>
      Si no solicitaste una invitación, puedes ignorar este mensaje.
    </p>
  `);

  await sendEmail({
    to: [{ email: to, name }],
    subject: "Tu invitación a Mercadi está lista",
    htmlContent: html,
  });
}
