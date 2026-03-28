"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, MessageCircle, Clock, Mail } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center">
            <Image src="/mercadi.png" alt="Mercadi" width={130} height={34} priority />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Ingresar</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-amber-500 text-black font-semibold hover:bg-amber-600">
                Prueba gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-muted/30 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-black">Soporte</h1>
            <p className="mt-3 text-lg text-gray-600 max-w-xl mx-auto">
              Estamos para ayudarte. Cuéntanos qué necesitas y te respondemos
              a la brevedad.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid gap-12 lg:grid-cols-5">
              {/* Contact info */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-black mb-4">
                    Canales de contacto
                  </h2>
                  <div className="space-y-4">
                    <InfoItem
                      icon={Mail}
                      title="Correo"
                      value="soporte@mercadi.cl"
                    />
                    <InfoItem
                      icon={MessageCircle}
                      title="WhatsApp"
                      value="+56 9 0000 0000"
                    />
                    <InfoItem
                      icon={Clock}
                      title="Horario"
                      value="Lun–Vie · 9:00–18:00"
                    />
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-5 space-y-3">
                  <p className="text-sm font-medium text-black">
                    ¿Buscas la documentación?
                  </p>
                  <p className="text-sm text-gray-600">
                    Consulta guías de integración, referencia de API y
                    ejemplos paso a paso.
                  </p>
                  <Link href="/docs">
                    <Button variant="outline" size="sm" className="mt-1">
                      Ver documentación
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Form */}
              <div className="lg:col-span-3">
                <div className="rounded-xl border bg-card p-8">
                  <h2 className="text-xl font-semibold text-black mb-6">
                    Envíanos un mensaje
                  </h2>
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Mercadi.cl — Hecho en Chile</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/" className="hover:text-foreground">Inicio</Link>
            <Link href="/docs" className="hover:text-foreground">Docs</Link>
            <Link href="/support" className="hover:text-foreground text-foreground font-medium">Soporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1200);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-7 w-7 text-green-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-black">Mensaje enviado</p>
          <p className="mt-1 text-sm text-gray-600">
            Te responderemos en menos de 24 horas hábiles.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSent(false)}>
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" placeholder="Tu nombre" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" placeholder="tu@empresa.cl" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subject">Asunto</Label>
        <Input id="subject" placeholder="¿En qué podemos ayudarte?" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Mensaje</Label>
        <textarea
          id="message"
          required
          rows={5}
          placeholder="Describe tu consulta con el mayor detalle posible..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-500 text-black font-semibold hover:bg-amber-600"
      >
        {loading ? "Enviando..." : "Enviar mensaje"}
      </Button>
    </form>
  );
}

function InfoItem({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-sm font-medium text-black">{value}</p>
      </div>
    </div>
  );
}
