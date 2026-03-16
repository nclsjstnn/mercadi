import Link from "next/link";
import { requireAuth } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/user";
import { Tenant } from "@/lib/db/models/tenant";
import { PLAN_LIMITS, PlanType } from "@/lib/config/plans";
import { PageHeader } from "@/components/platform/page-header";
import { ProfileForm } from "@/components/platform/profile-form";
import { UpgradeBanner } from "@/components/platform/upgrade-banner";
import { StatusBadge } from "@/components/platform/status-badge";
import { TenantRowSwitch } from "@/components/platform/tenant-row-switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ProfilePage() {
  const session = await requireAuth();
  await connectDB();

  const user = await User.findById(session.user.id)
    .select("name email role plan createdAt")
    .lean();

  if (!user) {
    return null;
  }

  const isOwner = user.role === "tenant_owner";
  let tenants: { _id: string; name: string; slug: string; status: string; createdAt: Date }[] = [];
  let canCreateMore = false;

  if (isOwner) {
    const rawTenants = await Tenant.find({ ownerId: user._id })
      .select("_id name slug status createdAt")
      .lean();
    tenants = rawTenants.map((t) => ({
      _id: String(t._id),
      name: t.name,
      slug: t.slug,
      status: t.status,
      createdAt: t.createdAt,
    }));
    const plan = (user.plan || "free") as PlanType;
    canCreateMore = tenants.length < PLAN_LIMITS[plan].maxTenants;
  }

  const createdAt = new Date(user.createdAt).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <PageHeader
        title="Mi Perfil"
        description="Administra tu cuenta y negocios"
        breadcrumbs={[{ label: "Mi Perfil" }]}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mi Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              name={user.name}
              email={user.email}
              role={user.role}
              plan={user.plan || "free"}
              createdAt={createdAt}
            />
          </CardContent>
        </Card>

        <UpgradeBanner />

        {isOwner && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mis Negocios</CardTitle>
              {canCreateMore ? (
                <Button size="sm" nativeButton={false} render={<Link href="/onboarding" />}>
                  Crear nuevo negocio
                </Button>
              ) : (
                <Button size="sm" disabled title="Has alcanzado el límite de tu plan">
                  Crear nuevo negocio
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {tenants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no tienes negocios registrados.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant._id}>
                        <TableCell>
                          <TenantRowSwitch
                            tenantId={tenant._id}
                            tenantName={tenant.name}
                            activeTenantId={session.user.tenantId ?? ""}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tenant.slug}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={tenant.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(tenant.createdAt).toLocaleDateString("es-CL")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
