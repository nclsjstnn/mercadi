"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const RECEIPT_PROVIDERS = [
  { value: "", label: "Usar configuración de plataforma" },
  { value: "mock", label: "Mock (desarrollo)" },
  { value: "baseapi", label: "BaseAPI.cl (SII)" },
];

interface TenantReceiptConfig {
  provider: string;
  enabled: boolean;
  providerConfig: {
    rut?: string;
    password?: string;
    clave_certificado?: string;
    rut_empresa?: string;
    apiKey?: string;
  };
}

interface TenantData {
  _id: string;
  name: string;
  slug: string;
  rut: string;
  legalName: string;
  commissionRate: number;
  status: string;
  ucpEnabled: boolean;
  ucpApiKey: string;
  payment: { provider: string };
  locale: { currency: string; taxRate: number; taxInclusive: boolean };
  receipt?: TenantReceiptConfig;
}

export default function EditTenantPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<TenantReceiptConfig>({
    provider: "",
    enabled: false,
    providerConfig: {},
  });
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/tenants/${tenantId}`)
      .then((r) => r.json())
      .then((data) => {
        setTenant(data.tenant);
        if (data.tenant?.receipt) {
          setReceipt(data.tenant.receipt);
        }
      });
  }, [tenantId]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    await fetch(`/api/admin/tenants/${tenantId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        commissionRate: parseFloat(formData.get("commissionRate") as string) / 100,
        status: formData.get("status"),
        ucpEnabled: formData.get("ucpEnabled") === "on",
      }),
    });

    setSaving(false);
    router.push("/admin/tenants");
  }

  async function handleSaveReceipt() {
    setSavingReceipt(true);
    setSavedReceipt(false);
    await fetch(`/api/admin/tenants/${tenantId}/receipt`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(receipt),
    });
    setSavingReceipt(false);
    setSavedReceipt(true);
    setTimeout(() => setSavedReceipt(false), 2500);
  }

  if (!tenant) return <p>Cargando...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Editar Negocio</h1>
      <Card>
        <CardHeader>
          <CardTitle>{tenant.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={tenant.name} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={tenant.slug} disabled />
            </div>
            <div className="space-y-2">
              <Label>RUT</Label>
              <Input value={tenant.rut} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Comisión (%)</Label>
              <Input
                id="commissionRate"
                name="commissionRate"
                type="number"
                step="0.1"
                defaultValue={(tenant.commissionRate * 100).toFixed(1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                defaultValue={tenant.status}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="pending">Pendiente</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ucpEnabled"
                name="ucpEnabled"
                defaultChecked={tenant.ucpEnabled}
              />
              <Label htmlFor="ucpEnabled">UCP Habilitado</Label>
            </div>
            <div className="space-y-2">
              <Label>API Key UCP</Label>
              <Input value={tenant.ucpApiKey} disabled className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label>Proveedor de Pago</Label>
              <Input value={tenant.payment.provider} disabled />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Facturación Electrónica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="receiptEnabled"
              checked={receipt.enabled}
              onChange={(e) =>
                setReceipt((r) => ({ ...r, enabled: e.target.checked }))
              }
            />
            <Label htmlFor="receiptEnabled">Habilitar facturas para este negocio</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptProvider">Proveedor</Label>
            <select
              id="receiptProvider"
              value={receipt.provider}
              onChange={(e) =>
                setReceipt((r) => ({ ...r, provider: e.target.value }))
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              {RECEIPT_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {(receipt.provider === "baseapi" || receipt.provider === "") && (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Credenciales SII (BaseAPI.cl)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="siiRut">RUT Representante Legal</Label>
                  <Input
                    id="siiRut"
                    placeholder="12345678-9"
                    value={(receipt.providerConfig.rut as string) ?? ""}
                    onChange={(e) =>
                      setReceipt((r) => ({
                        ...r,
                        providerConfig: { ...r.providerConfig, rut: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="siiRutEmpresa">RUT Empresa Emisora</Label>
                  <Input
                    id="siiRutEmpresa"
                    placeholder="76543210-3"
                    value={(receipt.providerConfig.rut_empresa as string) ?? ""}
                    onChange={(e) =>
                      setReceipt((r) => ({
                        ...r,
                        providerConfig: {
                          ...r.providerConfig,
                          rut_empresa: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="siiPassword">Clave SII</Label>
                  <Input
                    id="siiPassword"
                    type="password"
                    placeholder="••••••••"
                    value={(receipt.providerConfig.password as string) ?? ""}
                    onChange={(e) =>
                      setReceipt((r) => ({
                        ...r,
                        providerConfig: {
                          ...r.providerConfig,
                          password: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="siiClave">Clave Certificado Digital</Label>
                  <Input
                    id="siiClave"
                    type="password"
                    placeholder="••••••••"
                    value={
                      (receipt.providerConfig.clave_certificado as string) ?? ""
                    }
                    onChange={(e) =>
                      setReceipt((r) => ({
                        ...r,
                        providerConfig: {
                          ...r.providerConfig,
                          clave_certificado: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="baserapiKeyTenant">
                    BaseAPI.cl API Key (opcional — sobreescribe la de plataforma)
                  </Label>
                  <Input
                    id="baserapiKeyTenant"
                    type="password"
                    placeholder="••••••••"
                    value={(receipt.providerConfig.apiKey as string) ?? ""}
                    onChange={(e) =>
                      setReceipt((r) => ({
                        ...r,
                        providerConfig: {
                          ...r.providerConfig,
                          apiKey: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSaveReceipt}
            disabled={savingReceipt}
            size="sm"
          >
            {savingReceipt
              ? "Guardando..."
              : savedReceipt
              ? "Guardado"
              : "Guardar Facturación"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
