import { requireAdmin } from "@/lib/auth/guards";
import { connectDB } from "@/lib/db/connect";
import { User, DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/db/models/user";
import { PageHeader } from "@/components/platform/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Globe, CreditCard, Receipt } from "lucide-react";
import { NotificationPreferencesPanel } from "@/components/settings/notification-preferences-panel";

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  await connectDB();

  const dbUser = await User.findById(session.user.id)
    .select("notificationPreferences")
    .lean();
  const userPrefs = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(dbUser?.notificationPreferences ?? {}),
  };

  return (
    <div>
      <PageHeader
        title="Configuracion de Plataforma"
        description="Parametros generales de Mercadi"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">General</CardTitle>
              <CardDescription>Configuracion basica</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow label="Plataforma" value="Mercadi.cl" />
            <SettingRow label="Moneda Default" value="CLP (Peso Chileno)" />
            <SettingRow label="IVA Default" value="19%" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Comisiones</CardTitle>
              <CardDescription>Tasa por defecto</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <SettingRow label="Comision Default" value="5%" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Pagos</CardTitle>
              <CardDescription>Proveedores disponibles</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow label="Mock" value="Habilitado" />
            <SettingRow label="Transbank" value="Pendiente" />
            <SettingRow label="MercadoPago" value="Pendiente" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Notificaciones por correo</CardTitle>
              <CardDescription>Elige qué eventos te notificamos como administrador de plataforma</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <NotificationPreferencesPanel
              items={[
                {
                  key: "tenantCreated",
                  label: "Nuevo negocio registrado",
                  description: "Cuando un usuario crea una nueva tienda en la plataforma",
                  value: userPrefs.tenantCreated,
                },
                {
                  key: "adminPaymentReceived",
                  label: "Pago procesado",
                  description: "Cuando se confirma un pago en cualquier tienda de la plataforma",
                  value: userPrefs.adminPaymentReceived,
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-1 rounded-lg border px-4 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}
