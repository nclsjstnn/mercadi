"use client";

import { useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setPaymentProvider } from "@/actions/super-admin";

interface Props {
  tenantId: string;
  tenantName: string;
  currentProvider: string;
  currentConfig: Record<string, string>;
  open: boolean;
  onClose: () => void;
}

export function PaymentConfigSheet({
  tenantId,
  tenantName,
  currentProvider,
  currentConfig,
  open,
  onClose,
}: Props) {
  const [provider, setProvider] = useState(currentProvider || "mock");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const config: Record<string, string> = {};
    if (provider === "mercadopago") {
      config.accessToken = fd.get("accessToken") as string;
      config.webhookSecret = fd.get("webhookSecret") as string;
      config.baseUrl = fd.get("baseUrl") as string;
    } else if (provider === "transbank") {
      config.commerceCode = fd.get("commerceCode") as string;
      config.apiKey = fd.get("apiKey") as string;
      config.environment = fd.get("environment") as string;
      config.baseUrl = fd.get("baseUrl") as string;
    }
    startTransition(async () => {
      await setPaymentProvider(tenantId, provider, config);
      onClose();
    });
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Proveedor de Pago</SheetTitle>
          <SheetDescription>{tenantName}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Proveedor</Label>
            <Select value={provider} onValueChange={(v) => v && setProvider(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mock">Mock (pruebas)</SelectItem>
                <SelectItem value="transbank">Transbank WebPay</SelectItem>
                <SelectItem value="mercadopago">MercadoPago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {provider === "transbank" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="commerceCode">Código de Comercio</Label>
                <Input
                  id="commerceCode"
                  name="commerceCode"
                  defaultValue={currentConfig.commerceCode ?? "597055555532"}
                  placeholder="597055555532"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  defaultValue={currentConfig.apiKey ?? ""}
                  placeholder="579B532A..."
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <Select name="environment" defaultValue={currentConfig.environment ?? "integration"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="integration">Integración (pruebas)</SelectItem>
                    <SelectItem value="production">Producción</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  name="baseUrl"
                  defaultValue={currentConfig.baseUrl ?? "https://mercadi.cl"}
                />
              </div>
            </>
          )}

          {provider === "mercadopago" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  name="accessToken"
                  defaultValue={currentConfig.accessToken ?? ""}
                  placeholder="APP_USR-..."
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Webhook Secret</Label>
                <Input
                  id="webhookSecret"
                  name="webhookSecret"
                  defaultValue={currentConfig.webhookSecret ?? ""}
                  placeholder="secret"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  name="baseUrl"
                  defaultValue={currentConfig.baseUrl ?? "https://mercadi.cl"}
                />
              </div>
            </>
          )}

          {provider === "mock" && (
            <p className="text-sm text-muted-foreground rounded-lg bg-muted px-4 py-3">
              El proveedor Mock no requiere configuración. Úsalo solo para pruebas.
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
