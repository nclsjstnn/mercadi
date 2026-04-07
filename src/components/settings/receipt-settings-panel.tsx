"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PROVIDERS = [
  { value: "mock", label: "Mock (desarrollo)" },
  { value: "baseapi", label: "BaseAPI.cl (SII)" },
];

interface ReceiptSettings {
  activeProvider: string;
  enabled: boolean;
  providerConfig: { apiKey?: string };
}

export function ReceiptSettingsPanel({
  initial,
}: {
  initial: ReceiptSettings;
}) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/receipt-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activeProvider: settings.activeProvider,
        enabled: settings.enabled,
        providerConfig: { apiKey: settings.providerConfig.apiKey ?? "" },
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="receiptEnabled"
          checked={settings.enabled}
          onChange={(e) =>
            setSettings((s) => ({ ...s, enabled: e.target.checked }))
          }
        />
        <Label htmlFor="receiptEnabled">Habilitar emisión de facturas</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="activeProvider">Proveedor activo</Label>
        <select
          id="activeProvider"
          value={settings.activeProvider}
          onChange={(e) =>
            setSettings((s) => ({ ...s, activeProvider: e.target.value }))
          }
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {settings.activeProvider === "baseapi" && (
        <div className="space-y-2">
          <Label htmlFor="baserapiKey">BaseAPI.cl API Key</Label>
          <Input
            id="baserapiKey"
            type="password"
            placeholder="tu-api-key-de-baseapi"
            value={settings.providerConfig.apiKey ?? ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                providerConfig: { ...s.providerConfig, apiKey: e.target.value },
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Clave de plataforma. Los tenants pueden sobreescribir con su propia key.
          </p>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? "Guardando..." : saved ? "Guardado" : "Guardar"}
      </Button>
    </div>
  );
}
