"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, XCircle, Clock } from "lucide-react";
import { adminRetryCharge, adminCancelSubscription, adminPauseSubscription } from "@/actions/subscriptions";

interface SubscriptionActionsProps {
  subscriptionId: string;
  status: string;
}

export function SubscriptionActions({ subscriptionId, status }: SubscriptionActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function act(fn: () => Promise<{ success: boolean; error?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      setMessage(result.success
        ? { text: "Acción ejecutada correctamente.", ok: true }
        : { text: result.error ?? "Error desconocido", ok: false }
      );
    });
  }

  const canCharge = ["active", "past_due"].includes(status);
  const canCancel = status !== "cancelled";
  const canPause  = ["active", "past_due"].includes(status);

  return (
    <div className="space-y-3">
      {message && (
        <p className={`rounded-lg px-4 py-2 text-sm ${message.ok ? "bg-green-50 text-green-800" : "bg-destructive/10 text-destructive"}`}>
          {message.text}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {canCharge && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => act(() => adminRetryCharge(subscriptionId))}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Cobrar ahora
          </Button>
        )}
        {canPause && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => act(() => adminPauseSubscription(subscriptionId))}
          >
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Posponer 30 días
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              if (confirm("¿Cancelar esta suscripción y bajar el plan del usuario a Free?")) {
                act(() => adminCancelSubscription(subscriptionId));
              }
            }}
          >
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Cancelar suscripción
          </Button>
        )}
      </div>
    </div>
  );
}
