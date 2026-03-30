"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

export function WaitlistForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          businessDescription: fd.get("businessDescription"),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al enviar la solicitud");
        return;
      }
      setSent(true);
    } catch {
      setError("Error de conexión, intenta nuevamente");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-black">¡Solicitud recibida!</p>
          <p className="mt-1 text-sm text-gray-600">
            Revisaremos tu solicitud y te enviaremos una invitación por email
            cuando estés listo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="wl-name">Nombre</Label>
          <Input id="wl-name" name="name" placeholder="Tu nombre" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wl-email">Correo electrónico</Label>
          <Input
            id="wl-email"
            name="email"
            type="email"
            placeholder="tu@empresa.cl"
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wl-desc">
          ¿A qué se dedica tu negocio?{" "}
          <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="wl-desc"
          name="businessDescription"
          placeholder="Ej: Vendo ropa de mujer en Santiago"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-500 text-black font-semibold hover:bg-amber-600"
      >
        {loading ? "Enviando..." : "Unirme a la lista de espera"}
      </Button>
    </form>
  );
}
