"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStoreSettings } from "@/actions/store-settings";

interface StoreSettingsFormProps {
  enabled: boolean;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl: string;
    faviconUrl: string;
  };
  storeUrl: string;
  protocol: string;
}

export function StoreSettingsForm({
  enabled: initialEnabled,
  theme: initialTheme,
  storeUrl,
  protocol,
}: StoreSettingsFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [theme, setTheme] = useState(initialTheme);
  const [saving, setSaving] = useState(false);

  // Sync when server re-renders with AI-generated colors after router.refresh()
  useEffect(() => {
    setTheme(initialTheme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTheme.primaryColor, initialTheme.secondaryColor, initialTheme.accentColor, initialTheme.logoUrl, initialTheme.faviconUrl]);

  async function handleSave() {
    setSaving(true);
    const fd = new FormData();
    fd.set("enabled", String(enabled));
    fd.set("primaryColor", theme.primaryColor);
    fd.set("secondaryColor", theme.secondaryColor);
    fd.set("accentColor", theme.accentColor);
    fd.set("logoUrl", theme.logoUrl);
    fd.set("faviconUrl", theme.faviconUrl);
    await updateStoreSettings(fd);
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Tienda publica</p>
          <p className="text-sm text-muted-foreground">
            Habilita tu tienda en{" "}
            <a
              href={`${protocol}://${storeUrl}`}
              target="_blank"
              className="text-primary underline"
            >
              {storeUrl}
            </a>
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            enabled ? "bg-primary" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Theme colors */}
      <div className="space-y-4">
        <h3 className="font-medium">Colores del tema</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Color primario</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) =>
                  setTheme((t) => ({ ...t, primaryColor: e.target.value }))
                }
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input
                value={theme.primaryColor}
                onChange={(e) =>
                  setTheme((t) => ({ ...t, primaryColor: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Color secundario</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.secondaryColor}
                onChange={(e) =>
                  setTheme((t) => ({ ...t, secondaryColor: e.target.value }))
                }
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input
                value={theme.secondaryColor}
                onChange={(e) =>
                  setTheme((t) => ({ ...t, secondaryColor: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Color de acento</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.accentColor}
                onChange={(e) =>
                  setTheme((t) => ({ ...t, accentColor: e.target.value }))
                }
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input
                value={theme.accentColor}
                onChange={(e) =>
                  setTheme((t) => ({ ...t, accentColor: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logo & Favicon */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>URL del logo</Label>
          <Input
            placeholder="https://..."
            value={theme.logoUrl}
            onChange={(e) =>
              setTheme((t) => ({ ...t, logoUrl: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>URL del favicon</Label>
          <Input
            placeholder="https://..."
            value={theme.faviconUrl}
            onChange={(e) =>
              setTheme((t) => ({ ...t, faviconUrl: e.target.value }))
            }
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
