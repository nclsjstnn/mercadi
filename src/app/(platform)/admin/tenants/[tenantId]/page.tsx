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
}

export default function EditTenantPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/tenants/${tenantId}`)
      .then((r) => r.json())
      .then((data) => setTenant(data.tenant));
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
    </div>
  );
}
