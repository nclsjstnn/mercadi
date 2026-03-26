"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, Settings2 } from "lucide-react";
import { PaymentConfigSheet } from "./payment-config-sheet";
import {
  setTenantStatus,
  setStoreEnabled,
  setShippingOptionEnabled,
  setUcpEnabled,
  setAcpEnabled,
} from "@/actions/super-admin";

export interface AdminTenant {
  _id: string;
  name: string;
  slug: string;
  rut: string;
  status: string;
  commissionRate: number;
  ucpEnabled: boolean;
  acpEnabled: boolean;
  store: { enabled: boolean };
  payment: { provider: string; providerConfig: Record<string, string> };
  shipping: { options: { id: string; name: string; enabled: boolean }[] };
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  pending: "bg-amber-100 text-amber-700",
};

const PROVIDER_LABELS: Record<string, string> = {
  mock: "Mock",
  transbank: "Transbank",
  mercadopago: "MercadoPago",
};

export function TenantsTable({ tenants: initial }: { tenants: AdminTenant[] }) {
  const [tenants, setTenants] = useState(initial);
  const [paymentSheet, setPaymentSheet] = useState<AdminTenant | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function optimistic(id: string, patch: Partial<AdminTenant>) {
    setTenants((prev) =>
      prev.map((t) => (t._id === id ? { ...t, ...patch } : t))
    );
  }

  function toggleStore(t: AdminTenant) {
    const next = !t.store.enabled;
    optimistic(t._id, { store: { ...t.store, enabled: next } });
    startTransition(() => setStoreEnabled(t._id, next));
  }

  function toggleUcp(t: AdminTenant) {
    const next = !t.ucpEnabled;
    optimistic(t._id, { ucpEnabled: next });
    startTransition(() => setUcpEnabled(t._id, next));
  }

  function toggleAcp(t: AdminTenant) {
    const next = !t.acpEnabled;
    optimistic(t._id, { acpEnabled: next });
    startTransition(() => setAcpEnabled(t._id, next));
  }

  function changeStatus(t: AdminTenant, status: "active" | "inactive" | "pending") {
    optimistic(t._id, { status });
    startTransition(() => setTenantStatus(t._id, status));
  }

  function toggleShipping(t: AdminTenant, optionId: string, enabled: boolean) {
    const next = {
      ...t.shipping,
      options: t.shipping.options.map((o) =>
        o.id === optionId ? { ...o, enabled } : o
      ),
    };
    optimistic(t._id, { shipping: next });
    startTransition(() => setShippingOptionEnabled(t._id, optionId, enabled));
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">Negocio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Tienda</TableHead>
              <TableHead>UCP</TableHead>
              <TableHead>ACP</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Comisión</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((t) => (
              <>
                <TableRow key={t._id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={t.status}
                      onValueChange={(v) =>
                        v && changeStatus(t, v as "active" | "inactive" | "pending")
                      }
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue>
                          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] ?? ""}`}>
                            {t.status}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={t.store.enabled}
                      onCheckedChange={() => toggleStore(t)}
                      className="scale-90"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={t.ucpEnabled}
                      onCheckedChange={() => toggleUcp(t)}
                      className="scale-90"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={t.acpEnabled}
                      onCheckedChange={() => toggleAcp(t)}
                      className="scale-90"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {PROVIDER_LABELS[t.payment.provider] ?? t.payment.provider}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setPaymentSheet(t)}
                        title="Configurar pago"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(t.commissionRate * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    {t.shipping.options.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleExpanded(t._id)}
                      >
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded.has(t._id) ? "rotate-180" : ""}`} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {t.shipping.options.length > 0 && expanded.has(t._id) && (
                  <TableRow key={`${t._id}-shipping`} className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={8} className="py-3 pl-8">
                      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Opciones de envío
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {t.shipping.options.map((opt) => (
                          <label
                            key={opt.id}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <Switch
                              checked={opt.enabled}
                              onCheckedChange={(v) =>
                                toggleShipping(t, opt.id, v)
                              }
                              className="scale-75"
                            />
                            <span>{opt.name}</span>
                          </label>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {paymentSheet && (
        <PaymentConfigSheet
          tenantId={paymentSheet._id}
          tenantName={paymentSheet.name}
          currentProvider={paymentSheet.payment.provider}
          currentConfig={paymentSheet.payment.providerConfig}
          open
          onClose={() => setPaymentSheet(null)}
        />
      )}
    </>
  );
}
