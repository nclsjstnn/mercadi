"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, AlertTriangle, Lock, Sparkles, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { PLAN_DETAILS, type PlanType } from "@/lib/config/plans";
import { formatPrice } from "@/lib/utils/currency";
import { upgradePlan } from "@/actions/upgrade-plan";

interface OwnedTenant {
  _id: string;
  name: string;
  status: string;
}

interface SubscriptionInfo {
  status: string;
  nextBillingDate?: string;
  cardType?: string;
  cardLast4?: string;
  amount: number;
}

interface PlanPanelProps {
  currentPlan: PlanType;
  subscription: SubscriptionInfo | null;
  ownedTenants: OwnedTenant[];
  commissionRate: number;
}

export function PlanPanel({
  currentPlan,
  subscription,
  ownedTenants,
  commissionRate,
}: PlanPanelProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);
  const [loadingDowngrade, setLoadingDowngrade] = useState(false);
  const [keepTenantId, setKeepTenantId] = useState(
    ownedTenants.find((t) => t.status === "active")?._id ?? ownedTenants[0]?._id ?? ""
  );
  const [open, setOpen] = useState(false);

  const plan = PLAN_DETAILS[currentPlan];
  const needsStorePicker = currentPlan === "pro" && ownedTenants.length > 1;

  async function handleUpgrade() {
    setLoadingUpgrade(true);
    const result = await upgradePlan();
    if (result.success) {
      await updateSession();
      router.refresh();
    }
    setLoadingUpgrade(false);
  }

  async function handleDowngrade() {
    setLoadingDowngrade(true);
    const res = await fetch("/api/subscriptions/downgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keepTenantId }),
    });
    if (res.ok) {
      await updateSession();
      setOpen(false);
      window.location.href = "/dashboard";
    }
    setLoadingDowngrade(false);
  }

  const nextBilling = subscription?.nextBillingDate
    ? new Date(subscription.nextBillingDate).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const subStatusLabel: Record<string, string> = {
    active: "Activa",
    past_due: "Pago pendiente",
    enrolling: "Activando",
    cancelled: "Cancelada",
  };

  return (
    <div className="space-y-6">
      {/* Plan badge + features */}
      <div className="rounded-lg border p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{plan.name}</span>
              <Badge variant={currentPlan === "pro" ? "default" : "secondary"}>
                Plan actual
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.price === 0
                ? "Gratis"
                : `${formatPrice(plan.price, plan.currency)} / ${plan.period}`}
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p className="font-medium">
              Comisión:{" "}
              <span className="text-foreground font-bold">
                {(commissionRate * 100).toFixed(1)}%
              </span>
            </p>
            <p>por transacción completada</p>
          </div>
        </div>

        <ul className="grid gap-2 sm:grid-cols-2">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Billing info — Pro only */}
      {currentPlan === "pro" && subscription && (
        <div className="rounded-lg border p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Facturación
          </div>
          <div className="grid gap-2 text-sm">
            <BillingRow
              label="Estado"
              value={subStatusLabel[subscription.status] ?? subscription.status}
            />
            {subscription.cardLast4 && (
              <BillingRow
                label="Tarjeta"
                value={`${subscription.cardType ?? "Tarjeta"} •••• ${subscription.cardLast4}`}
              />
            )}
            {nextBilling && (
              <BillingRow label="Próximo cobro" value={nextBilling} />
            )}
            <BillingRow
              label="Monto mensual"
              value={formatPrice(subscription.amount, "CLP")}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      {currentPlan === "free" && (
        <Button
          onClick={handleUpgrade}
          disabled={loadingUpgrade}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {loadingUpgrade ? "Procesando..." : "Subir a Pro"}
        </Button>
      )}

      {currentPlan === "pro" && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/5"
              />
            }
          >
            Cancelar suscripción Pro
          </DialogTrigger>

          <DialogContent showCloseButton={false} className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                ¿Cancelar Plan Pro?
              </DialogTitle>
              <DialogDescription>
                Al bajar al plan Free perderás acceso a algunas funciones.
              </DialogDescription>
            </DialogHeader>

            {/* Consequence list */}
            <ul className="space-y-1.5 text-sm">
              {[
                "Proveedores de pago reales (Transbank, MercadoPago)",
                "Dominio personalizado",
                "Colaboradores por negocio",
                "Tienda sin branding Mercadi",
                ...(needsStorePicker
                  ? ["Solo podrás mantener 1 negocio activo"]
                  : []),
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {/* Store picker — only when user owns >1 tenant */}
            {needsStorePicker && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <p className="text-sm font-medium">¿Qué negocio quieres conservar?</p>
                <p className="text-xs text-muted-foreground">
                  Los demás quedarán deshabilitados — podrás verlos pero no editarlos ni
                  recibir pedidos. Se reactivan al volver a Pro.
                </p>
                <div className="space-y-2">
                  {ownedTenants.map((t) => (
                    <label
                      key={t._id}
                      className="flex items-center gap-3 rounded-md border bg-background px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors"
                    >
                      <input
                        type="radio"
                        name="keepTenant"
                        value={t._id}
                        checked={keepTenantId === t._id}
                        onChange={() => setKeepTenantId(t._id)}
                        className="accent-primary"
                      />
                      <span className="flex-1 text-sm font-medium">{t.name}</span>
                      {t.status === "active" && (
                        <Badge variant="secondary" className="text-xs">
                          activo
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Volver
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleDowngrade}
                disabled={
                  loadingDowngrade || (needsStorePicker && !keepTenantId)
                }
              >
                {loadingDowngrade ? "Procesando..." : "Confirmar cancelación"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function BillingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
