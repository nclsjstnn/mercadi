import Link from "next/link";
import { connectDB } from "@/lib/db/connect";
import { Subscription } from "@/lib/db/models/subscription";
import { SubscriptionTransaction } from "@/lib/db/models/subscription-transaction";
import { User } from "@/lib/db/models/user";
import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/currency";
import { CreditCard, Users, TrendingUp, AlertTriangle } from "lucide-react";

const STATUS_VARIANTS: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  active:    "default",
  past_due:  "destructive",
  cancelled: "secondary",
  enrolling: "outline",
};

const STATUS_LABELS: Record<string, string> = {
  active:    "Activa",
  past_due:  "Vencida",
  cancelled: "Cancelada",
  enrolling: "Activando",
};

export default async function AdminSubscriptionsPage() {
  await requireAdmin();
  await connectDB();

  const subscriptions = await Subscription.find()
    .sort({ createdAt: -1 })
    .lean();

  const userIds = [...new Set(subscriptions.map((s) => s.userId.toString()))];
  const users = await User.find({ _id: { $in: userIds } })
    .select("_id name email")
    .lean();
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  // Revenue stats
  const successfulTxns = await SubscriptionTransaction.find({
    status: "authorized",
  })
    .select("amount currency")
    .lean();

  const totalRevenue = successfulTxns.reduce((sum, t) => sum + t.amount, 0);
  const activeCount   = subscriptions.filter((s) => s.status === "active").length;
  const pastDueCount  = subscriptions.filter((s) => s.status === "past_due").length;
  const mrr           = activeCount * 9990; // CLP

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suscripciones"
        description="Gestión de planes Pro y facturación recurrente"
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Users className="h-4 w-4" />}   label="Activas"    value={String(activeCount)} />
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="MRR"      value={formatPrice(mrr, "CLP")} />
        <KpiCard icon={<CreditCard className="h-4 w-4" />} label="Ingresos totales" value={formatPrice(totalRevenue, "CLP")} />
        <KpiCard icon={<AlertTriangle className="h-4 w-4" />} label="Pago vencido" value={String(pastDueCount)} alert={pastDueCount > 0} />
      </div>

      {/* Subscriptions table */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las suscripciones ({subscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tarjeta</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Próximo cobro</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fallos</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entorno</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Creada</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const user = userMap[sub.userId.toString()];
                  return (
                    <tr key={sub._id.toString()} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{user?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{user?.email ?? sub.userId.toString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANTS[sub.status] ?? "outline"}>
                          {STATUS_LABELS[sub.status] ?? sub.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sub.cardLast4
                          ? `${sub.cardType ?? "Tarjeta"} ••••${sub.cardLast4}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sub.nextBillingDate
                          ? new Date(sub.nextBillingDate).toLocaleDateString("es-CL")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={sub.failureCount > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {sub.failureCount}/3
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {sub.tbkEnvironment}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString("es-CL")}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/subscriptions/${sub._id.toString()}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {subscriptions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No hay suscripciones aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon, label, value, alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${alert ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
