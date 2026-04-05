import { connectDB } from "@/lib/db/connect";
import { Subscription } from "@/lib/db/models/subscription";
import { SubscriptionTransaction } from "@/lib/db/models/subscription-transaction";
import { requireAuth } from "@/lib/auth/guards";
import { User } from "@/lib/db/models/user";
import { PageHeader } from "@/components/platform/page-header";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/currency";
import { redirect } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  authorized: "Cobrado",
  failed:     "Fallido",
  pending:    "Pendiente",
  reversed:   "Revertido",
};

const STATUS_VARIANTS: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  authorized: "default",
  failed:     "destructive",
  pending:    "outline",
  reversed:   "secondary",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireAuth();
  // Admins don't have subscriptions
  if (session.user.role === "admin") redirect("/admin");

  await connectDB();

  const dbUser = await User.findById(session.user.id).select("plan").lean();
  const plan = (dbUser?.plan ?? "free") as "free" | "pro";

  const subscription = await Subscription.findOne({
    userId: session.user.id,
    status: { $in: ["active", "past_due", "enrolling"] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const transactions = subscription
    ? await SubscriptionTransaction.find({ subscriptionId: subscription._id })
        .sort({ createdAt: -1 })
        .limit(24)
        .lean()
    : [];

  const { status: flashStatus } = await searchParams;

  const flashMessages: Record<string, { text: string; type: "success" | "error" }> = {
    success:      { text: "¡Plan Pro activado! Tu tarjeta fue guardada y el primer cobro fue procesado.", type: "success" },
    charge_failed:{ text: "Tu tarjeta fue guardada, pero el primer cobro falló. Intenta nuevamente.", type: "error" },
    error:        { text: "Ocurrió un error durante la inscripción. Por favor intenta nuevamente.", type: "error" },
    cancelled:    { text: "Inscripción cancelada.", type: "error" },
  };
  const flash = flashStatus ? flashMessages[flashStatus] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan y Facturación"
        description="Administra tu suscripción y revisa el historial de cobros"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Facturación" },
        ]}
      />

      {flash && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          flash.type === "success"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-destructive/10 text-destructive border border-destructive/20"
        }`}>
          {flash.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tu suscripción</CardTitle>
            <CardDescription>Gestiona tu plan y método de pago</CardDescription>
          </CardHeader>
          <CardContent>
            <BillingPanel
              plan={plan}
              subscription={
                subscription
                  ? {
                      status:          subscription.status,
                      cardType:        subscription.cardType,
                      cardLast4:       subscription.cardLast4,
                      nextBillingDate: subscription.nextBillingDate?.toISOString(),
                      amount:          subscription.amount,
                      currency:        subscription.currency,
                      failureCount:    subscription.failureCount,
                    }
                  : null
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de cobros</CardTitle>
            <CardDescription>Últimos 24 intentos de cobro</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin historial aún.</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((txn) => (
                  <div
                    key={txn._id.toString()}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatPrice(txn.amount, txn.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {txn.billingPeriod} · Intento {txn.attemptNumber}
                        {txn.tbkAuthorizationCode && ` · Auth ${txn.tbkAuthorizationCode}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={STATUS_VARIANTS[txn.status] ?? "outline"}>
                        {STATUS_LABELS[txn.status] ?? txn.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(txn.createdAt).toLocaleDateString("es-CL")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
