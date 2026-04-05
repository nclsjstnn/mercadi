import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import { Subscription } from "@/lib/db/models/subscription";
import { SubscriptionTransaction } from "@/lib/db/models/subscription-transaction";
import { User } from "@/lib/db/models/user";
import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionActions } from "@/components/admin/subscription-actions";
import { formatPrice } from "@/lib/utils/currency";

const STATUS_VARIANTS: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  active:    "default",
  past_due:  "destructive",
  cancelled: "secondary",
  enrolling: "outline",
};

const TXN_STATUS_VARIANTS: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  authorized: "default",
  failed:     "destructive",
  pending:    "outline",
  reversed:   "secondary",
};

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>;
}) {
  await requireAdmin();
  await connectDB();

  const { subscriptionId } = await params;

  const subscription = await Subscription.findById(subscriptionId).lean();
  if (!subscription) return notFound();

  const [user, transactions] = await Promise.all([
    User.findById(subscription.userId).select("name email plan").lean(),
    SubscriptionTransaction.find({ subscriptionId: subscription._id })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const totalCharged = transactions
    .filter((t) => t.status === "authorized")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalle de suscripción"
        description={user ? `${user.name} · ${user.email}` : subscriptionId}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Suscripciones", href: "/admin/subscriptions" },
          { label: subscriptionId.slice(-8) },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subscription info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Suscripción</CardTitle>
              <Badge variant={STATUS_VARIANTS[subscription.status] ?? "outline"}>
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="ID"          value={subscription._id.toString()} mono />
            <InfoRow label="Usuario"     value={user?.name ?? "—"} />
            <InfoRow label="Email"       value={user?.email ?? "—"} />
            <InfoRow label="Plan actual" value={user?.plan ?? "—"} />
            <InfoRow label="Tarjeta"     value={subscription.cardLast4 ? `${subscription.cardType} ••••${subscription.cardLast4}` : "—"} />
            <InfoRow label="TBK User"    value={subscription.tbkUser ? `${subscription.tbkUser.slice(0, 16)}…` : "—"} mono />
            <InfoRow label="Username"    value={subscription.tbkUsername} />
            <InfoRow label="Entorno"     value={subscription.tbkEnvironment} />
            <InfoRow label="Próximo cobro" value={subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString("es-CL") : "—"} />
            <InfoRow label="Fallos"      value={`${subscription.failureCount}/3`} />
            <InfoRow label="Total cobrado" value={formatPrice(totalCharged, subscription.currency)} />
            {subscription.cancellationReason && (
              <InfoRow label="Motivo"    value={subscription.cancellationReason} />
            )}
            <InfoRow label="Creada"      value={new Date(subscription.createdAt).toLocaleString("es-CL")} />
          </CardContent>
        </Card>

        {/* Actions + Transaction history */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones</CardTitle>
              <CardDescription>Cobrar manualmente, posponer o cancelar</CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionActions
                subscriptionId={subscriptionId}
                status={subscription.status}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Historial de transacciones ({transactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">Sin transacciones aún.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Fecha</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Período</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Monto</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Estado</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Auth</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Intento</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Buy order</th>
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn._id.toString()} className="border-b last:border-0">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(txn.createdAt).toLocaleString("es-CL")}
                        </td>
                        <td className="px-4 py-3">{txn.billingPeriod}</td>
                        <td className="px-4 py-3 font-medium">
                          {formatPrice(txn.amount, txn.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={TXN_STATUS_VARIANTS[txn.status] ?? "outline"}>
                            {txn.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {txn.tbkAuthorizationCode ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center">{txn.attemptNumber}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {txn.buyOrder}
                        </td>
                        <td className="px-4 py-3 text-xs text-destructive">
                          {txn.errorMessage ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={`text-right break-all ${mono ? "font-mono text-xs" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}
