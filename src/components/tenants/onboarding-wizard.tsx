"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { REGIONES } from "@/lib/config/chile-geo";
import { isReservedSubdomain } from "@/lib/config/reserved-subdomains";
import { Building2, FileText, CheckCircle2 } from "lucide-react";

const STEPS = [
  { label: "Negocio", icon: Building2 },
  { label: "Legal", icon: FileText },
  { label: "Revision", icon: CheckCircle2 },
];

export default function OnboardingWizard() {
  const { update: updateSession } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugError, setSlugError] = useState("");
  const [data, setData] = useState({
    name: "",
    slug: "",
    rut: "",
    legalName: "",
    comuna: "",
    region: "",
  });

  function update(field: string, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    if (field === "slug") {
      setSlugError(
        isReservedSubdomain(value.toLowerCase())
          ? "Este nombre está reservado y no puede usarse"
          : ""
      );
    }
    if (field === "name" && !data.slug) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+$/, "");
      setData((prev) => ({
        ...prev,
        [field]: value,
        slug: autoSlug,
      }));
      setSlugError(
        isReservedSubdomain(autoSlug)
          ? "Este nombre está reservado y no puede usarse"
          : ""
      );
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/tenant/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      await updateSession();
      router.push("/dashboard");
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Error al crear el negocio");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={cn(
                    "h-px w-8",
                    isDone ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isDone
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:block",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Negocio</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Mi Tienda"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL del catalogo</Label>
                <div className="flex items-center gap-1">
                  <span className="shrink-0 text-sm text-muted-foreground">
                    mercadi.cl/
                  </span>
                  <Input
                    id="slug"
                    value={data.slug}
                    onChange={(e) => update("slug", e.target.value)}
                    placeholder="mi-tienda"
                  />
                </div>
                {slugError && (
                  <p className="text-sm text-destructive">{slugError}</p>
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="rut">RUT del Negocio</Label>
                <Input
                  id="rut"
                  value={data.rut}
                  onChange={(e) => update("rut", e.target.value)}
                  placeholder="12.345.678-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalName">Razon Social</Label>
                <Input
                  id="legalName"
                  value={data.legalName}
                  onChange={(e) => update("legalName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Región</Label>
                <Select
                  value={data.region}
                  onValueChange={(value) => {
                    setData((prev) => ({ ...prev, region: value ?? "", comuna: "" }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una región" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONES.map((r) => (
                      <SelectItem key={r.name} value={r.name}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Comuna</Label>
                <Select
                  value={data.comuna}
                  onValueChange={(value) => update("comuna", value ?? "")}
                  disabled={!data.region}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={data.region ? "Selecciona una comuna" : "Primero selecciona una región"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(REGIONES.find((r) => r.name === data.region)?.comunas || []).map(
                      (comuna) => (
                        <SelectItem key={comuna} value={comuna}>
                          {comuna}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h3 className="font-medium">Confirma tus datos</h3>
              <div className="rounded-lg border divide-y">
                <ReviewRow label="Nombre" value={data.name} />
                <ReviewRow label="URL" value={`mercadi.cl/${data.slug}`} />
                <ReviewRow label="RUT" value={data.rut} />
                <ReviewRow label="Razon Social" value={data.legalName} />
                <ReviewRow label="Comuna" value={data.comuna} />
                <ReviewRow label="Region" value={data.region} />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Anterior
              </Button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!!slugError}>Siguiente</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Creando..." : "Crear Negocio"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}
