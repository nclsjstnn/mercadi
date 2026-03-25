import { connectDB } from "@/lib/db/connect";
import { Tenant } from "@/lib/db/models/tenant";
import { User } from "@/lib/db/models/user";
import { CollaborationInvite } from "@/lib/db/models/collaboration-invite";
import { requireTenant } from "@/lib/auth/guards";
import { PLAN_LIMITS, type PlanType } from "@/lib/config/plans";
import { PageHeader } from "@/components/platform/page-header";
import { CopyButton } from "@/components/platform/copy-button";
import { StatusBadge } from "@/components/platform/status-badge";
import { CollaboratorsPanel } from "@/components/settings/collaborators-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Bot, CreditCard, Globe, Receipt, Truck, Users } from "lucide-react";
import ShippingOptionsForm from "@/components/settings/shipping-options-form";

export default async function TenantSettingsPage() {
  const session = await requireTenant();
  await connectDB();

  const tenant = await Tenant.findById(session.user.tenantId).lean();
  if (!tenant) return <p>Error: negocio no encontrado</p>;

  const isOwner = tenant.ownerId.toString() === session.user.id;

  // Fetch collaborator data only for owner
  let collaborators: { _id: string; name: string; email: string }[] = [];
  let pendingInvites: { _id: string; invitedEmail: string; token: string; expiresAt: string }[] = [];
  let isPro = false;
  let maxCollaborators = 0;

  if (isOwner) {
    const dbUser = await User.findById(session.user.id).select("plan").lean();
    const plan = ((dbUser?.plan as string) || "free") as PlanType;
    isPro = plan === "pro";
    maxCollaborators = PLAN_LIMITS[plan].maxCollaboratorsPerTenant;

    if (tenant.collaborators?.length) {
      const collabUsers = await User.find({
        _id: { $in: tenant.collaborators },
      })
        .select("_id name email")
        .lean();
      collaborators = collabUsers.map((u) => ({
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
      }));
    }

    const rawInvites = await CollaborationInvite.find({
      tenantId: session.user.tenantId,
      status: "pending",
    })
      .select("_id invitedEmail token expiresAt")
      .lean();
    pendingInvites = rawInvites.map((i) => ({
      _id: i._id.toString(),
      invitedEmail: i.invitedEmail,
      token: i.token,
      expiresAt: i.expiresAt.toISOString(),
    }));
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://mercadi.cl";
  const discoveryUrl = `${baseUrl}/${tenant.slug}/.well-known/ucp`;
  const checkoutUrl = `${baseUrl}/api/ucp/${tenant.slug}/v1/checkout-sessions`;
  const acpCheckoutUrl = `${baseUrl}/api/acp/${tenant.slug}/checkout_sessions`;
  const acpFeedUrl = `${baseUrl}/api/acp/${tenant.slug}/feed`;

  return (
    <div>
      <PageHeader
        title="Configuracion"
        description="Administra la configuracion de tu negocio"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Configuracion" },
        ]}
      />

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="h-4 w-4" />
            Negocio
          </TabsTrigger>
          <TabsTrigger value="ucp" className="gap-2">
            <Globe className="h-4 w-4" />
            UCP
          </TabsTrigger>
          <TabsTrigger value="acp" className="gap-2">
            <Bot className="h-4 w-4" />
            ACP / OpenAI
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="commission" className="gap-2">
            <Receipt className="h-4 w-4" />
            Comision
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <Truck className="h-4 w-4" />
            Envio
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="collaborators" className="gap-2">
              <Users className="h-4 w-4" />
              Colaboradores
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Informacion del Negocio</CardTitle>
              <CardDescription>
                Datos registrados de tu empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Nombre" value={tenant.name} />
              <InfoRow label="RUT" value={tenant.rut} />
              <InfoRow label="Razon Social" value={tenant.legalName} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ucp">
          <Card>
            <CardHeader>
              <CardTitle>Universal Commerce Protocol</CardTitle>
              <CardDescription>
                Configuracion de tu endpoint UCP para agentes IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Estado:</span>
                <StatusBadge
                  status={tenant.ucpEnabled ? "active" : "inactive"}
                />
              </div>
              <CopyableField label="API Key" value={tenant.ucpApiKey} />
              <CopyableField label="Discovery URL" value={discoveryUrl} />
              <CopyableField label="Checkout Endpoint" value={checkoutUrl} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acp">
          <Card>
            <CardHeader>
              <CardTitle>Agentic Commerce Protocol (OpenAI)</CardTitle>
              <CardDescription>
                Configuracion para Instant Checkout en ChatGPT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Estado:</span>
                <StatusBadge
                  status={tenant.acpEnabled ? "active" : "inactive"}
                />
              </div>
              {tenant.acpApiKey && (
                <CopyableField label="API Key" value={tenant.acpApiKey} />
              )}
              {tenant.acpSigningSecret && (
                <CopyableField label="Signing Secret" value={tenant.acpSigningSecret} />
              )}
              <InfoRow
                label="Payment Provider"
                value={(tenant.acpPaymentProvider || "stripe").toUpperCase()}
              />
              <CopyableField label="Checkout Endpoint" value={acpCheckoutUrl} />
              <CopyableField label="Product Feed URL" value={acpFeedUrl} />
              {(tenant.acpLegalLinks?.privacyPolicy || tenant.acpLegalLinks?.termsOfService) && (
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium">Links Legales</p>
                  {tenant.acpLegalLinks.privacyPolicy && (
                    <InfoRow label="Politica de Privacidad" value={tenant.acpLegalLinks.privacyPolicy} />
                  )}
                  {tenant.acpLegalLinks.termsOfService && (
                    <InfoRow label="Terminos de Servicio" value={tenant.acpLegalLinks.termsOfService} />
                  )}
                  {tenant.acpLegalLinks.refundPolicy && (
                    <InfoRow label="Politica de Reembolso" value={tenant.acpLegalLinks.refundPolicy} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Proveedor de Pagos</CardTitle>
              <CardDescription>
                Configuracion del metodo de pago para tus ventas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <InfoRow
                label="Proveedor activo"
                value={(tenant.payment?.provider || "mock").toUpperCase()}
              />
              {tenant.payment?.provider === "mercadopago" ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Estado:</span>
                    <StatusBadge
                      status={
                        tenant.payment.providerConfig?.accessToken
                          ? "active"
                          : "inactive"
                      }
                    />
                  </div>
                  {tenant.payment.providerConfig?.accessToken && (
                    <InfoRow
                      label="Access Token"
                      value={`APP_USR-...${String(tenant.payment.providerConfig.accessToken).slice(-6)}`}
                    />
                  )}
                  <CopyableField
                    label="Webhook URL"
                    value={`${baseUrl}/api/payments/webhook?provider=mercadopago&tenantId=${tenant._id.toString()}`}
                  />
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Configura esta URL como notificacion en tu panel de MercadoPago
                    para que los pagos se confirmen automaticamente.
                  </div>
                </>
              ) : tenant.payment?.provider === "transbank" ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Estado:</span>
                    <StatusBadge
                      status={
                        tenant.payment.providerConfig?.commerceCode
                          ? "active"
                          : "inactive"
                      }
                    />
                  </div>
                  {tenant.payment.providerConfig?.commerceCode && (
                    <InfoRow
                      label="Codigo de Comercio"
                      value={String(tenant.payment.providerConfig.commerceCode)}
                    />
                  )}
                  <InfoRow
                    label="Ambiente"
                    value={
                      tenant.payment.providerConfig?.environment === "production"
                        ? "Produccion"
                        : "Integracion (pruebas)"
                    }
                  />
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    Transbank confirma pagos en el retorno del comprador. No requiere
                    configuracion de webhook adicional.
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Usando proveedor de prueba (mock). Contacta al administrador
                  de la plataforma para activar MercadoPago o Transbank WebPay.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle>Comision</CardTitle>
              <CardDescription>
                Tasa de comision aplicada a tus ventas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-3xl font-bold">
                  {(tenant.commissionRate * 100).toFixed(1)}%
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  por transaccion completada
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Opciones de Envio</CardTitle>
              <CardDescription>
                Configura los metodos de envio y retiro disponibles para tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShippingOptionsForm
                initialOptions={
                  (tenant.shipping?.options || []).map((o) => ({
                    id: o.id,
                    name: o.name,
                    price: o.price,
                    type: o.type as "shipping" | "pickup",
                    enabled: o.enabled,
                  }))
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
        {isOwner && (
          <TabsContent value="collaborators">
            <Card>
              <CardHeader>
                <CardTitle>Colaboradores</CardTitle>
                <CardDescription>
                  Invita a otras personas a gestionar tu negocio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CollaboratorsPanel
                  collaborators={collaborators}
                  pendingInvites={pendingInvites}
                  isPro={isPro}
                  maxCollaborators={maxCollaborators}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-1 rounded-lg border px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}

function CopyableField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
        <code className="flex-1 truncate text-xs">{value}</code>
        <CopyButton value={value} />
      </div>
    </div>
  );
}
