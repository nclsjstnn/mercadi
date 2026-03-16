"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateCustomDomain, verifyCustomDomain } from "@/actions/store-settings";

interface CustomDomainSettingsProps {
  domain: string;
  verified: boolean;
  isPro: boolean;
}

export function CustomDomainSettings({
  domain: initialDomain,
  verified: initialVerified,
  isPro,
}: CustomDomainSettingsProps) {
  const [domain, setDomain] = useState(initialDomain);
  const [verified, setVerified] = useState(initialVerified);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateCustomDomain(domain);
      setVerified(false);
    } catch {}
    setSaving(false);
  }

  async function handleVerify() {
    setVerifying(true);
    try {
      await verifyCustomDomain();
      setVerified(true);
    } catch {}
    setVerifying(false);
  }

  if (!isPro) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="mb-2 font-medium text-muted-foreground">
          Dominio personalizado
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          Conecta tu propio dominio a tu tienda con el plan Pro.
        </p>
        <Button variant="outline" nativeButton={false} render={<a href="/plans" />}>
          Actualizar a Pro
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Dominio personalizado</Label>
        <div className="flex gap-2">
          <Input
            placeholder="tienda.tudominio.cl"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
        {domain && (
          <div className="flex items-center gap-2">
            <Badge variant={verified ? "default" : "secondary"}>
              {verified ? "Verificado" : "Sin verificar"}
            </Badge>
            {!verified && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerify}
                disabled={verifying}
              >
                {verifying ? "Verificando..." : "Verificar DNS"}
              </Button>
            )}
          </div>
        )}
      </div>

      {domain && !verified && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="mb-3 text-sm font-medium">
            Registra tu propio dominio o subdominio a tu Mercadi. Debes setear
            los siguientes registros en el proveedor DNS de tu dominio para
            conectar tu tienda.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 text-left font-medium">Tipo</th>
                  <th className="py-2 pr-4 text-left font-medium">Nombre</th>
                  <th className="py-2 text-left font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-mono">A</td>
                  <td className="py-2 pr-4 font-mono">@</td>
                  <td className="py-2 font-mono">76.76.21.21</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono">CNAME</td>
                  <td className="py-2 pr-4 font-mono">www</td>
                  <td className="py-2 font-mono">cname.vercel-dns.com</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
