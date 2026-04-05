"use client";

import { useState } from "react";
import { CreditCard, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BillingPanelProps {
  plan: "free" | "pro";
  subscription?: {
    status: string;
    cardType?: string;
    cardLast4?: string;
    nextBillingDate?: string;
    amount: number;
    currency: string;
    failureCount: number;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  active:    { label: "Activa",      variant: "default",     icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  past_due:  { label: "Pago vencido",variant: "destructive", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  cancelled: { label: "Cancelada",   variant: "secondary",   icon: <XCircle className="h-3.5 w-3.5" /> },
  enrolling: { label: "Activando…",  variant: "outline",     icon: <Clock className="h-3.5 w-3.5" /> },
};

export function BillingPanel({ plan, subscription }: BillingPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions/oneclick/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      window.location.href = data.redirectUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al iniciar suscripción");
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm("¿Confirmas que deseas cancelar tu suscripción Pro? Tu plan bajará a Free inmediatamente.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions/oneclick/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cancelar");
      setLoading(false);
    }
  }

  const statusCfg = subscription ? STATUS_CONFIG[subscription.status] : null;

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm text-muted-foreground">Plan actual</p>
          <p className="text-xl font-bold mt-0.5">{plan === "pro" ? "Pro" : "Free"}</p>
        </div>
        {plan === "pro" && statusCfg && (
          <Badge variant={statusCfg.variant} className="gap-1">
            {statusCfg.icon}
            {statusCfg.label}
          </Badge>
        )}
      </div>

      {/* Active subscription details */}
      {subscription && subscription.status !== "cancelled" && (
        <div className="rounded-lg border divide-y">
          {subscription.cardLast4 && (
            <Row
              icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
              label="Tarjeta"
              value={`${subscription.cardType ?? "Tarjeta"} •••• ${subscription.cardLast4}`}
            />
          )}
          {subscription.nextBillingDate && (
            <Row
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              label="Próximo cobro"
              value={`${new Date(subscription.nextBillingDate).toLocaleDateString("es-CL")} · $${subscription.amount.toLocaleString("es-CL")} ${subscription.currency}`}
            />
          )}
          {subscription.status === "past_due" && (
            <div className="flex items-start gap-3 p-4">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">
                El último cobro falló ({subscription.failureCount}/3 intentos). Intentaremos nuevamente automáticamente.
                Después de 3 intentos tu plan bajará a Free.
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
      )}

      {/* Actions */}
      {plan === "free" ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            El Plan Pro incluye hasta 3 negocios, dominio personalizado, colaboradores, y tienda sin branding Mercadi.
          </div>
          <Button onClick={handleSubscribe} disabled={loading} className="w-full">
            {loading ? "Redirigiendo a Transbank…" : "Activar Plan Pro · $9.990/mes"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Pago seguro con Transbank WebPay OneClick. Puedes cancelar en cualquier momento.
          </p>
        </div>
      ) : subscription && ["active", "past_due"].includes(subscription.status) ? (
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="w-full text-destructive hover:text-destructive"
        >
          {loading ? "Cancelando…" : "Cancelar suscripción"}
        </Button>
      ) : null}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      {icon}
      <span className="text-sm text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
