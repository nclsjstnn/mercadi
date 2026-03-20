"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GeminiChat from "@/components/test/gemini-chat";
import { Bot, Store } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Tenant {
  _id: string;
  name: string;
  slug: string;
}

export default function TestPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");

  useEffect(() => {
    fetch("/api/admin/tenants")
      .then((r) => r.json())
      .then((data) => {
        const list = data.tenants || [];
        setTenants(list);
        if (list.length > 0) setSelectedSlug(list[0].slug);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">Mercadi.cl</span>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Ingresar
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Test Gemini + UCP</h1>
          </div>
          <p className="text-muted-foreground">
            Prueba como un agente IA interactua con un catalogo UCP
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">Negocio:</label>
          <Select value={selectedSlug} onValueChange={(v) => v && setSelectedSlug(v)}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Seleccionar negocio" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t._id} value={t.slug}>
                  {t.name} ({t.slug})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4" />
              Chat con Agente de Compras
            </CardTitle>
            <CardDescription>
              Escribe un mensaje para buscar productos via Gemini + UCP
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {selectedSlug ? (
              <GeminiChat tenantSlug={selectedSlug} />
            ) : (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                No hay negocios disponibles. Crea uno primero.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
