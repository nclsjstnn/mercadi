import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/user";
import { Tenant } from "@/lib/db/models/tenant";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/db/models/user";
import { formatPrice } from "@/lib/utils/currency";
import { sendEmail, emailLayout, btnStyle } from "./brevo";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://mercadi.cl";
const DASHBOARD_URL = `${BASE_URL}/dashboard`;
const ADMIN_URL = `${BASE_URL}/admin`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type UserDoc = { _id: string; email: string; name: string; notificationPreferences?: Record<string, boolean> };

function pref(user: UserDoc, key: keyof typeof DEFAULT_NOTIFICATION_PREFERENCES): boolean {
  if (!user.notificationPreferences) return DEFAULT_NOTIFICATION_PREFERENCES[key];
  const val = user.notificationPreferences[key];
  return val === undefined ? DEFAULT_NOTIFICATION_PREFERENCES[key] : !!val;
}

async function getOwnerDoc(ownerId: string): Promise<UserDoc | null> {
  await connectDB();
  return User.findById(ownerId).select("email name notificationPreferences").lean() as unknown as Promise<UserDoc | null>;
}

async function getCollaboratorDocs(ids: string[]): Promise<UserDoc[]> {
  if (!ids.length) return [];
  await connectDB();
  return User.find({ _id: { $in: ids } })
    .select("email name notificationPreferences")
    .lean() as unknown as Promise<UserDoc[]>;
}

/** Returns all admin users who have a given notification preference enabled. */
async function getAdminRecipients(
  prefKey: keyof typeof DEFAULT_NOTIFICATION_PREFERENCES
): Promise<UserDoc[]> {
  await connectDB();
  const admins = (await User.find({ role: "admin" })
    .select("email name notificationPreferences")
    .lean()) as unknown as UserDoc[];
  return admins.filter((u) => pref(u, prefKey));
}

// ---------------------------------------------------------------------------
// Customer — order confirmation
// ---------------------------------------------------------------------------

export async function notifyCustomerOrderCreated(params: {
  orderId: string;
  tenantName: string;
  buyer: { name: string; email: string };
  lineItems: Array<{ title: string; quantity: number; unitPrice: number }>;
  totals: { subtotal: number; discount: number; tax: number; shipping: number; total: number };
  currency: string;
}) {
  const itemRows = params.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#374151;">${item.title}</td>
        <td style="padding:6px 0;font-size:14px;color:#374151;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 0;font-size:14px;color:#374151;text-align:right;">${formatPrice(item.unitPrice, params.currency)}</td>
      </tr>`
    )
    .join("");

  const { subtotal, discount, tax, shipping, total } = params.totals;

  const totalsRows = [
    discount > 0
      ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Descuento</td><td style="padding:4px 0;font-size:13px;color:#16a34a;text-align:right;">-${formatPrice(discount, params.currency)}</td></tr>`
      : "",
    tax > 0
      ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">IVA</td><td style="padding:4px 0;font-size:13px;color:#6b7280;text-align:right;">${formatPrice(tax, params.currency)}</td></tr>`
      : "",
    shipping > 0
      ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Envío</td><td style="padding:4px 0;font-size:13px;color:#6b7280;text-align:right;">${formatPrice(shipping, params.currency)}</td></tr>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const html = emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">¡Pedido confirmado!</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">
      Hola ${params.buyer.name}, tu pedido en <strong>${params.tenantName}</strong> fue recibido y está siendo preparado.
    </p>

    <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">N° de orden</p>
    <p style="margin:0 0 20px;"><code style="background:#f3f4f6;padding:4px 10px;border-radius:6px;font-size:14px;font-weight:600;">${params.orderId}</code></p>

    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.05em;">Detalle</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;margin-bottom:8px;">
      <thead>
        <tr>
          <th style="padding:6px 0;font-size:12px;color:#9ca3af;font-weight:500;text-align:left;">Producto</th>
          <th style="padding:6px 0;font-size:12px;color:#9ca3af;font-weight:500;text-align:center;">Cant.</th>
          <th style="padding:6px 0;font-size:12px;color:#9ca3af;font-weight:500;text-align:right;">Precio</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;margin-bottom:28px;">
      ${totalsRows}
      <tr>
        <td style="padding:10px 0 0;font-size:15px;font-weight:700;color:#111;border-top:1px solid #e5e7eb;">Total</td>
        <td style="padding:10px 0 0;font-size:15px;font-weight:700;color:#111;text-align:right;border-top:1px solid #e5e7eb;">${formatPrice(total, params.currency)}</td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
      Recibirás actualizaciones sobre el estado de tu pedido. Si tienes dudas, contacta directamente a ${params.tenantName}.
    </p>
  `);

  await sendEmail({
    to: [{ email: params.buyer.email, name: params.buyer.name }],
    subject: `Pedido confirmado — ${params.tenantName}`,
    htmlContent: html,
  });
}

// ---------------------------------------------------------------------------
// Order ready to fulfill — admin + all collaborators (respect preferences)
// ---------------------------------------------------------------------------

export async function notifyOrderReady(params: {
  orderId: string;
  tenantId: string;
  tenantName: string;
  buyer: { name: string; email: string };
  lineItems: Array<{ title: string; quantity: number; unitPrice: number }>;
  total: number;
  currency: string;
}) {
  await connectDB();
  const tenant = await Tenant.findById(params.tenantId)
    .select("ownerId collaborators")
    .lean();
  if (!tenant) return;

  const ownerDoc = await getOwnerDoc(tenant.ownerId.toString());
  const collabDocs = await getCollaboratorDocs(
    (tenant.collaborators ?? []).map((c) => c.toString())
  );

  const recipients = [
    ...(ownerDoc && pref(ownerDoc, "orderReady") ? [{ email: ownerDoc.email, name: ownerDoc.name }] : []),
    ...collabDocs
      .filter((c) => pref(c, "orderReady"))
      .map((c) => ({ email: c.email, name: c.name })),
  ];
  if (!recipients.length) return;

  const itemRows = params.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#374151;">${item.title}</td>
        <td style="padding:6px 0;font-size:14px;color:#374151;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 0;font-size:14px;color:#374151;text-align:right;">${formatPrice(item.unitPrice, params.currency)}</td>
      </tr>`
    )
    .join("");

  const html = emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">Nuevo pedido por preparar</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">
      Tienda: <strong>${params.tenantName}</strong> &nbsp;·&nbsp; Orden: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${params.orderId}</code>
    </p>

    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.05em;">Comprador</p>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">${params.buyer.name} &lt;${params.buyer.email}&gt;</p>

    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:.05em;">Productos</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;margin-bottom:20px;">
      <thead>
        <tr>
          <th style="padding:6px 0;font-size:12px;color:#9ca3af;font-weight:500;text-align:left;">Producto</th>
          <th style="padding:6px 0;font-size:12px;color:#9ca3af;font-weight:500;text-align:center;">Cant.</th>
          <th style="padding:6px 0;font-size:12px;color:#9ca3af;font-weight:500;text-align:right;">Precio</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:10px 0 0;font-size:14px;font-weight:700;color:#111;border-top:1px solid #e5e7eb;">Total</td>
          <td style="padding:10px 0 0;font-size:14px;font-weight:700;color:#111;text-align:right;border-top:1px solid #e5e7eb;">${formatPrice(params.total, params.currency)}</td>
        </tr>
      </tfoot>
    </table>

    <p style="margin:0 0 24px;">${btnStyle(`${DASHBOARD_URL}/orders`, "Ver pedido en dashboard")}</p>
    <p style="margin:0;font-size:12px;color:#9ca3af;">Este correo se envió a todos los miembros del equipo de ${params.tenantName}.</p>
  `);

  await sendEmail({
    to: recipients,
    subject: `Nuevo pedido ${params.orderId} — ${params.tenantName}`,
    htmlContent: html,
  });
}

// ---------------------------------------------------------------------------
// Payment received — tenant admin + platform admins (respect preferences)
// ---------------------------------------------------------------------------

export async function notifyPaymentReceived(params: {
  orderId: string;
  tenantId: string;
  tenantName: string;
  buyerName: string;
  total: number;
  currency: string;
  provider: string;
}) {
  await connectDB();
  const tenant = await Tenant.findById(params.tenantId)
    .select("ownerId")
    .lean();
  if (!tenant) return;

  const providerLabel: Record<string, string> = {
    transbank: "Transbank WebPay",
    mercadopago: "MercadoPago",
    mock: "Pago simulado",
  };
  const providerName =
    providerLabel[params.provider] ??
    (params.provider.startsWith("acp_delegated_") ? "ACP Delegado" : params.provider);

  // Tenant owner
  const owner = await getOwnerDoc(tenant.ownerId.toString());
  const tenantRecipients = owner && pref(owner, "paymentReceived")
    ? [{ email: owner.email, name: owner.name }]
    : [];

  // Platform admins
  const adminRecipients = (await getAdminRecipients("adminPaymentReceived")).map((u) => ({
    email: u.email,
    name: u.name,
  }));

  const makeHtml = (isAdmin: boolean) => emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">Pago recibido</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#555;">
      Tienda: <strong>${params.tenantName}</strong>
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#6b7280;width:40%;">Orden</td>
        <td style="padding:8px 0;font-size:14px;color:#111;font-weight:600;"><code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${params.orderId}</code></td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#6b7280;">Comprador</td>
        <td style="padding:8px 0;font-size:14px;color:#111;">${params.buyerName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#6b7280;">Monto</td>
        <td style="padding:8px 0;font-size:18px;color:#111;font-weight:700;">${formatPrice(params.total, params.currency)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#6b7280;">Proveedor</td>
        <td style="padding:8px 0;font-size:14px;color:#111;">${providerName}</td>
      </tr>
    </table>

    <p style="margin:0;">${btnStyle(isAdmin ? `${ADMIN_URL}/orders` : `${DASHBOARD_URL}/orders`, "Ver en dashboard")}</p>
  `);

  if (tenantRecipients.length) {
    await sendEmail({
      to: tenantRecipients,
      subject: `Pago recibido ${formatPrice(params.total, params.currency)} — ${params.tenantName}`,
      htmlContent: makeHtml(false),
    });
  }

  if (adminRecipients.length) {
    await sendEmail({
      to: adminRecipients,
      subject: `[Admin] Pago ${formatPrice(params.total, params.currency)} — ${params.tenantName}`,
      htmlContent: makeHtml(true),
    });
  }
}

// ---------------------------------------------------------------------------
// New store created — tenant admin + platform admins (respect preferences)
// ---------------------------------------------------------------------------

export async function notifyStoreCreated(params: {
  ownerEmail: string;
  ownerName: string;
  ownerId?: string;
  storeName: string;
  storeSlug: string;
}) {
  const tenantHtml = emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">¡Tu tienda está lista!</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#555;">
      Hola ${params.ownerName}, tu tienda <strong>${params.storeName}</strong> fue creada exitosamente en Mercadi.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#6b7280;width:40%;">Nombre</td>
        <td style="padding:8px 0;font-size:14px;color:#111;">${params.storeName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#6b7280;">Slug</td>
        <td style="padding:8px 0;font-size:14px;color:#111;"><code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${params.storeSlug}</code></td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:#555;">Configura tus métodos de pago, agrega productos y empieza a vender.</p>
    <p style="margin:0;">${btnStyle(DASHBOARD_URL, "Ir al dashboard")}</p>
  `);

  // Check owner preferences before sending (if ownerId provided)
  let sendToOwner = true;
  if (params.ownerId) {
    const ownerDoc = await getOwnerDoc(params.ownerId);
    if (ownerDoc) sendToOwner = pref(ownerDoc, "storeConfigured");
  }

  if (sendToOwner) {
    await sendEmail({
      to: [{ email: params.ownerEmail, name: params.ownerName }],
      subject: `Tu tienda "${params.storeName}" fue creada en Mercadi`,
      htmlContent: tenantHtml,
    });
  }

  // Platform admins
  const adminDocs = await getAdminRecipients("tenantCreated");
  if (adminDocs.length) {
    const adminHtml = emailLayout(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">Nuevo negocio registrado</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#555;">Un nuevo tenant se ha creado en la plataforma.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;width:40%;">Nombre</td>
          <td style="padding:8px 0;font-size:14px;color:#111;font-weight:600;">${params.storeName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Slug</td>
          <td style="padding:8px 0;font-size:14px;color:#111;"><code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${params.storeSlug}</code></td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#6b7280;">Dueño</td>
          <td style="padding:8px 0;font-size:14px;color:#111;">${params.ownerName} &lt;${params.ownerEmail}&gt;</td>
        </tr>
      </table>
      <p style="margin:0;">${btnStyle(`${ADMIN_URL}/tenants`, "Ver en admin")}</p>
    `);

    await sendEmail({
      to: adminDocs.map((u) => ({ email: u.email, name: u.name })),
      subject: `[Admin] Nuevo negocio: ${params.storeName}`,
      htmlContent: adminHtml,
    });
  }
}

// ---------------------------------------------------------------------------
// Payment method configured — admin only (respect preferences)
// ---------------------------------------------------------------------------

export async function notifyPaymentMethodConfigured(params: {
  tenantId: string;
  provider: string;
  environment: string;
}) {
  await connectDB();
  const tenant = await Tenant.findById(params.tenantId)
    .select("ownerId name")
    .lean();
  if (!tenant) return;

  const owner = await getOwnerDoc(tenant.ownerId.toString());
  if (!owner || !pref(owner, "storeConfigured")) return;

  const providerLabel: Record<string, string> = {
    transbank: "Transbank WebPay",
    mercadopago: "MercadoPago",
  };
  const providerName = providerLabel[params.provider] ?? params.provider;
  const envLabel = params.environment === "production" ? "Producción" : "Integración (sandbox)";

  const html = emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">Método de pago configurado</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">
      Tu tienda <strong>${tenant.name}</strong> tiene un nuevo método de pago activo.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#6b7280;width:40%;">Proveedor</td>
        <td style="padding:8px 0;font-size:14px;color:#111;font-weight:600;">${providerName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#6b7280;">Entorno</td>
        <td style="padding:8px 0;font-size:14px;color:#111;">${envLabel}</td>
      </tr>
    </table>
    <p style="margin:0;">${btnStyle(`${DASHBOARD_URL}/settings`, "Ver configuración")}</p>
  `);

  await sendEmail({
    to: [{ email: owner.email, name: owner.name }],
    subject: `${providerName} configurado en ${tenant.name}`,
    htmlContent: html,
  });
}

// ---------------------------------------------------------------------------
// Shipping configured — admin only (respect preferences)
// ---------------------------------------------------------------------------

export async function notifyShippingConfigured(params: {
  tenantId: string;
  optionCount: number;
}) {
  await connectDB();
  const tenant = await Tenant.findById(params.tenantId)
    .select("ownerId name")
    .lean();
  if (!tenant) return;

  const owner = await getOwnerDoc(tenant.ownerId.toString());
  if (!owner || !pref(owner, "storeConfigured")) return;

  const html = emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">Opciones de envío actualizadas</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">
      Las opciones de envío de tu tienda <strong>${tenant.name}</strong> han sido actualizadas.
      Ahora tienes <strong>${params.optionCount} opción${params.optionCount !== 1 ? "es" : ""}</strong> configurada${params.optionCount !== 1 ? "s" : ""}.
    </p>
    <p style="margin:0;">${btnStyle(`${DASHBOARD_URL}/settings`, "Ver configuración")}</p>
  `);

  await sendEmail({
    to: [{ email: owner.email, name: owner.name }],
    subject: `Opciones de envío actualizadas — ${tenant.name}`,
    htmlContent: html,
  });
}

// ---------------------------------------------------------------------------
// Collaborator added — the collaborator
// ---------------------------------------------------------------------------

export async function notifyCollaboratorAdded(params: {
  collaboratorEmail: string;
  collaboratorName: string;
  storeName: string;
}) {
  const html = emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">Ahora eres colaborador de ${params.storeName}</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">
      Hola ${params.collaboratorName}, has aceptado la invitación y ahora tienes acceso a la tienda <strong>${params.storeName}</strong> en Mercadi.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#555;">Desde el dashboard puedes gestionar productos, ver pedidos y más.</p>
    <p style="margin:0;">${btnStyle(DASHBOARD_URL, "Ir al dashboard")}</p>
  `);

  await sendEmail({
    to: [{ email: params.collaboratorEmail, name: params.collaboratorName }],
    subject: `Bienvenido al equipo de ${params.storeName}`,
    htmlContent: html,
  });
}

// ---------------------------------------------------------------------------
// Collaborator removed — the collaborator
// ---------------------------------------------------------------------------

export async function notifyCollaboratorRemoved(params: {
  collaboratorEmail: string;
  collaboratorName: string;
  storeName: string;
}) {
  const html = emailLayout(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">Tu acceso a ${params.storeName} fue revocado</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">
      Hola ${params.collaboratorName}, el dueño de la tienda <strong>${params.storeName}</strong> ha eliminado tu acceso como colaborador.
    </p>
    <p style="margin:0;font-size:13px;color:#9ca3af;">Si crees que esto es un error, contacta directamente al dueño de la tienda.</p>
  `);

  await sendEmail({
    to: [{ email: params.collaboratorEmail, name: params.collaboratorName }],
    subject: `Tu acceso a ${params.storeName} fue revocado`,
    htmlContent: html,
  });
}
