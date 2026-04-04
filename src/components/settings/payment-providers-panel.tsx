"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
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
import { togglePaymentProvider, savePaymentProvider } from "@/actions/tenant-settings";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

// ─── types ─────────────────────────────────────────────────────────────────────

export interface ProviderEntry {
  provider: "transbank" | "mercadopago";
  enabled: boolean;
  /** Whether any config has been saved for this provider */
  configured: boolean;
  environment: "integration" | "production";
  /** Whether production credentials are already stored (last 6 chars for display) */
  hasProductionCredentials: boolean;
  maskedCommerceCode?: string;
  maskedAccessToken?: string;
  webhookUrl?: string;
}

const PROVIDER_INFO = {
  transbank: {
    label: "WebPay (Transbank)",
    description: "Débito, crédito y prepago Redcompra",
  },
  mercadopago: {
    label: "MercadoPago",
    description: "Tarjeta, transferencia o efectivo",
  },
} as const;

// ─── main component ─────────────────────────────────────────────────────────────

export function PaymentProvidersPanel({
  providers,
}: {
  providers: ProviderEntry[];
}) {
  return (
    <div className="space-y-4">
      {providers.map((p) => (
        <ProviderCard key={p.provider} entry={p} />
      ))}
    </div>
  );
}

// ─── single card ────────────────────────────────────────────────────────────────

function ProviderCard({ entry }: { entry: ProviderEntry }) {
  const info = PROVIDER_INFO[entry.provider];
  const [enabled, setEnabled] = useState(entry.enabled);
  const [open, setOpen] = useState(false);
  const [toggleError, setToggleError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleToggle(value: boolean) {
    // Can't enable if not yet configured
    if (value && !entry.configured) {
      setOpen(true);
      return;
    }
    setEnabled(value);
    setToggleError("");
    startTransition(async () => {
      const res = await togglePaymentProvider(entry.provider, value);
      if (!res.success) {
        setEnabled(!value);
        setToggleError(res.error ?? "Error");
      }
    });
  }

  return (
    <div
      className={`rounded-xl border transition-colors ${
        enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold ${enabled ? "text-gray-900" : "text-gray-400"}`}>
              {info.label}
            </p>
            {entry.configured && (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{info.description}</p>
          {entry.configured && (
            <p className="mt-1 text-xs font-medium text-gray-400">
              {entry.environment === "production" ? "🔴 Producción" : "🟡 Integración (pruebas)"}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            {entry.configured ? "Editar" : "Configurar"}
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isPending}
            aria-label={`${enabled ? "Desactivar" : "Activar"} ${info.label}`}
          />
        </div>
      </div>

      {toggleError && (
        <p className="px-4 pb-2 text-xs text-red-500">{toggleError}</p>
      )}

      {open && entry.provider === "transbank" && (
        <TransbankForm entry={entry} onSaved={() => setOpen(false)} />
      )}
      {open && entry.provider === "mercadopago" && (
        <MercadoPagoForm entry={entry} onSaved={() => setOpen(false)} />
      )}
    </div>
  );
}

// ─── Transbank form ─────────────────────────────────────────────────────────────

function TransbankForm({
  entry,
  onSaved,
}: {
  entry: ProviderEntry;
  onSaved: () => void;
}) {
  const [environment, setEnvironment] = useState<"integration" | "production">(
    entry.environment
  );
  const [commerceCode, setCommerceCode] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const needsCredentials =
    environment === "production" &&
    !entry.hasProductionCredentials;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (needsCredentials && (!commerceCode.trim() || !apiKey.trim())) {
      setError("Código de comercio y API Key son requeridos para producción");
      return;
    }

    startTransition(async () => {
      const res = await savePaymentProvider("transbank", {
        environment,
        commerceCode: commerceCode.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(onSaved, 700);
      } else {
        setError(res.error ?? "Error al guardar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t p-4">
      {/* Environment selector — the primary control */}
      <div className="space-y-1.5">
        <Label className="text-sm">Ambiente</Label>
        <Select
          value={environment}
          onValueChange={(v) => {
            setEnvironment(v as "integration" | "production");
            setError("");
          }}
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="integration">🟡 Integración — credenciales de prueba (Mercadi)</SelectItem>
            <SelectItem value="production">🔴 Producción — mis propias credenciales</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {environment === "integration" ? (
        <div className="rounded-md bg-blue-50 px-3 py-3 text-xs text-blue-700 space-y-1">
          <p className="font-medium">Mercadi gestiona las credenciales de integración.</p>
          <p>No necesitas ingresar nada — usaremos nuestras claves de prueba de Transbank para que puedas testear el flujo de pago completo.</p>
        </div>
      ) : (
        <>
          {entry.hasProductionCredentials && (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Credenciales de producción guardadas. Deja un campo vacío para conservar el valor actual.
            </div>
          )}

          <Field
            label="Código de Comercio"
            required={needsCredentials}
            placeholder={
              entry.maskedCommerceCode
                ? `●●●●●● ${entry.maskedCommerceCode}`
                : "597055555532"
            }
            value={commerceCode}
            onChange={setCommerceCode}
          />

          <Field
            label="API Key"
            required={needsCredentials}
            placeholder={
              entry.hasProductionCredentials
                ? "Dejar vacío para conservar"
                : "579B532A7440BB0C..."
            }
            value={apiKey}
            onChange={setApiKey}
            mono
          />

          <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-600">
            No requiere configuración de webhook — Transbank confirma pagos en el retorno del comprador.
          </div>
        </>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending || success}>
          {success ? "¡Guardado!" : isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

// ─── MercadoPago form ───────────────────────────────────────────────────────────

function MercadoPagoForm({
  entry,
  onSaved,
}: {
  entry: ProviderEntry;
  onSaved: () => void;
}) {
  const [environment, setEnvironment] = useState<"integration" | "production">(
    entry.environment
  );
  const [accessToken, setAccessToken] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const needsCredentials =
    environment === "production" &&
    !entry.hasProductionCredentials;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (needsCredentials && (!accessToken.trim() || !publicKey.trim() || !webhookSecret.trim())) {
      setError("Access Token, Public Key y Webhook Secret son requeridos para producción");
      return;
    }

    startTransition(async () => {
      const res = await savePaymentProvider("mercadopago", {
        environment,
        accessToken: accessToken.trim() || undefined,
        publicKey: publicKey.trim() || undefined,
        webhookSecret: webhookSecret.trim() || undefined,
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(onSaved, 700);
      } else {
        setError(res.error ?? "Error al guardar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t p-4">
      <div className="space-y-1.5">
        <Label className="text-sm">Ambiente</Label>
        <Select
          value={environment}
          onValueChange={(v) => {
            setEnvironment(v as "integration" | "production");
            setError("");
          }}
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="integration">🟡 Integración — credenciales de prueba (Mercadi)</SelectItem>
            <SelectItem value="production">🔴 Producción — mis propias credenciales</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {environment === "integration" ? (
        <div className="rounded-md bg-blue-50 px-3 py-3 text-xs text-blue-700 space-y-1">
          <p className="font-medium">Mercadi gestiona las credenciales de integración.</p>
          <p>Usaremos nuestro sandbox de MercadoPago para que puedas testear el flujo completo sin necesitar una cuenta propia.</p>
        </div>
      ) : (
        <>
          {entry.hasProductionCredentials && (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Credenciales de producción guardadas. Deja un campo vacío para conservar el valor actual.
            </div>
          )}

          <Field
            label="Access Token"
            required={needsCredentials}
            placeholder={
              entry.maskedAccessToken
                ? `APP_USR-...${entry.maskedAccessToken}`
                : "APP_USR-xxxxxxxxxxxx"
            }
            value={accessToken}
            onChange={setAccessToken}
            mono
          />

          <Field
            label="Public Key"
            required={needsCredentials}
            placeholder={
              entry.hasProductionCredentials
                ? "Dejar vacío para conservar"
                : "APP_USR-xxxxxxxxxxxx"
            }
            value={publicKey}
            onChange={setPublicKey}
            mono
          />

          <Field
            label="Webhook Secret"
            required={needsCredentials}
            placeholder={
              entry.hasProductionCredentials
                ? "Dejar vacío para conservar"
                : "Tu clave secreta de webhook"
            }
            value={webhookSecret}
            onChange={setWebhookSecret}
            mono
          />

          {entry.webhookUrl && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600">URL de notificación</p>
              <div className="rounded-lg bg-gray-100 px-3 py-2">
                <code className="break-all text-xs text-gray-700">{entry.webhookUrl}</code>
              </div>
              <p className="text-xs text-amber-600">
                Copia esta URL en la sección Webhooks de tu cuenta MercadoPago.
              </p>
            </div>
          )}
        </>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending || success}>
          {success ? "¡Guardado!" : isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────────

function Field({
  label,
  placeholder,
  value,
  onChange,
  required,
  mono,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={mono ? "font-mono text-xs" : "text-sm"}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}
