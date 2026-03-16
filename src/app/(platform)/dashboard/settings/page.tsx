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
import { Building2, Globe, Receipt, Truck, Users } from "lucide-react";
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
        <TabsList>
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="h-4 w-4" />
            Negocio
          </TabsTrigger>
          <TabsTrigger value="ucp" className="gap-2">
            <Globe className="h-4 w-4" />
            UCP
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
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
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
