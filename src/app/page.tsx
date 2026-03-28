import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/landing/mobile-nav";
import { auth } from "@/lib/auth";
import {
  Store,
  Zap,
  CreditCard,
  Shield,
  Globe,
  Bot,
  ArrowRight,
  FileSpreadsheet,
  Ticket,
  ShoppingCart,
  MessageCircle,
  Sparkles,
} from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const dashboardUrl = session?.user?.role === "admin" ? "/admin" : "/dashboard";
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/mercadi.png"
              alt="Mercadi"
              width={140}
              height={36}
              priority
            />
            <span className="hidden items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground sm:inline-flex">
              🇨🇱 Chile
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Como funciona
            </a>
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Caracteristicas
            </a>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
              Docs
            </Link>
            <Link href="/support" className="text-sm text-muted-foreground hover:text-foreground">
              Soporte
            </Link>
            <Link href="/test">
              <Button variant="ghost" size="sm">
                Demo
              </Button>
            </Link>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {isLoggedIn ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {session.user?.name}
                </span>
                <Link href={dashboardUrl}>
                  <Button size="sm">Ir al Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Ingresar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-amber-500 text-black font-semibold hover:bg-amber-600 shadow-sm"
                  >
                    Inscribete gratis
                  </Button>
                </Link>
              </>
            )}
          </div>
          <MobileNav isLoggedIn={isLoggedIn} dashboardUrl={dashboardUrl} />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-transparent to-primary/5" />
          <div className="container relative mx-auto px-4 py-24 text-center lg:py-36">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-700">
              <Sparkles className="h-3.5 w-3.5" />
              Compatible con agentes de IA — Gemini, ChatGPT y mas
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-black sm:text-5xl lg:text-[3.75rem]">
              Vende por WhatsApp, Gemini
              <br />
              <span className="text-amber-500">y ChatGPT. Sin codigo.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600 leading-relaxed">
              Sube tu catalogo una vez. Mercadi lo publica en WhatsApp, Google
              Gemini, ChatGPT y tu tienda web — con pagos integrados y todo
              centralizado en un dashboard.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {isLoggedIn ? (
                <Link href={dashboardUrl}>
                  <Button
                    size="lg"
                    className="gap-2 bg-amber-500 text-black font-semibold text-base hover:bg-amber-600 shadow-sm px-8"
                  >
                    Ir al Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button
                    size="lg"
                    className="gap-2 bg-amber-500 text-black font-semibold text-base hover:bg-amber-600 shadow-sm px-8"
                  >
                    Abre tu tienda gratis
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link href="/test">
                <Button size="lg" variant="outline">
                  Ver Demo
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Sin tarjeta de credito · Listo en minutos
            </p>
          </div>
        </section>

        {/* Channels showcase */}
        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">
              Un catalogo. Cuatro canales.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
              <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-black">WhatsApp</h3>
                <p className="text-sm text-gray-600">
                  Tus clientes exploran el catalogo y reciben el link de compra
                  directo en el chat.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-black">Google Gemini</h3>
                <p className="text-sm text-gray-600">
                  Gemini descubre tu catalogo via UCP y permite comprar
                  directamente desde la busqueda de Google.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <Bot className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-black">ChatGPT</h3>
                <p className="text-sm text-gray-600">
                  Usuarios de ChatGPT compran en tu tienda via Instant
                  Checkout, sin salir del chat.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <Store className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-black">Tienda web</h3>
                <p className="text-sm text-gray-600">
                  Tu propia tienda online con carrito, checkout y pago
                  integrado con Transbank y MercadoPago.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-black">Como funciona?</h2>
              <p className="mt-2 text-gray-700">
                Tres pasos para llegar a tus clientes en todos lados
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <StepCard
                step="1"
                icon={Store}
                title="Registra tu negocio"
                description="Crea tu cuenta, agrega tu RUT y sube tus productos manualmente o desde Google Sheets."
              />
              <StepCard
                step="2"
                icon={Globe}
                title="Activa tus canales"
                description="Configura tu numero de WhatsApp, habilita ChatGPT y tu tienda web queda lista automaticamente."
              />
              <StepCard
                step="3"
                icon={Zap}
                title="Vende donde estan tus clientes"
                description="Recibe pedidos desde WhatsApp, ChatGPT o tu tienda web. Todo centralizado en un solo dashboard."
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-black">Por que Mercadi?</h2>
              <p className="mt-2 text-gray-700">
                Todo lo que necesitas para vender en los canales que importan
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={ShoppingCart}
                title="Tienda publica lista"
                description="Cada negocio obtiene una tienda online con catalogo, carrito, checkout y pago. Personaliza colores, logo y dominio."
              />
              <FeatureCard
                icon={MessageCircle}
                title="Bot de WhatsApp"
                description="Tus clientes exploran el catalogo, buscan productos y reciben el link de compra directo en WhatsApp."
              />
              <FeatureCard
                icon={Bot}
                title="Instant Checkout en ChatGPT"
                description="Usuarios de ChatGPT pueden buscar y comprar en tu tienda sin salir del chat, via la integracion ACP/OpenAI."
              />
              <FeatureCard
                icon={CreditCard}
                title="Pagos integrados"
                description="Soporte para Transbank WebPay y MercadoPago. Recibe pagos directamente en tu cuenta."
              />
              <FeatureCard
                icon={Shield}
                title="Hecho para Chile"
                description="Validacion de RUT, precios en CLP, IVA 19% incluido. Todo pensado para pymes chilenas."
              />
              <FeatureCard
                icon={FileSpreadsheet}
                title="Importa desde Google Sheets"
                description="Carga masivamente tus productos desde una hoja de calculo. Sin escribir codigo."
              />
              <FeatureCard
                icon={Ticket}
                title="Cupones de descuento"
                description="Crea codigos de descuento por monto fijo o porcentaje. Tus clientes los aplican en el checkout."
              />
              <FeatureCard
                icon={Globe}
                title="Un dashboard para todo"
                description="Gestiona tu catalogo, pedidos, cupones y configuracion de todos los canales desde un solo lugar."
              />
              <FeatureCard
                icon={Zap}
                title="Nuevos canales sin codigo"
                description="Activa WhatsApp o ChatGPT con tus credenciales. Sin desarrollo adicional, sin integraciones complejas."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 py-20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-4xl font-bold text-black">
                Llega a tus clientes donde estan
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-gray-700">
                Abre tu tienda, activa WhatsApp y ChatGPT. Todo en minutos,
                sin escribir una linea de codigo.
              </p>
              {isLoggedIn ? (
                <Link href={dashboardUrl}>
                  <Button
                    size="lg"
                    className="mt-8 gap-2 bg-amber-500 text-black font-semibold hover:bg-amber-600 shadow-sm px-8"
                  >
                    Ir al Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button
                    size="lg"
                    className="mt-8 gap-2 bg-amber-500 text-black font-semibold hover:bg-amber-600 shadow-sm px-8"
                  >
                    Abrir mi tienda
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-14">
        <div className="container mx-auto grid gap-10 px-4 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Image src="/mercadi.png" alt="Mercadi" width={120} height={32} />
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              La plataforma para pymes chilenas que quieren vender por
              WhatsApp, Gemini y ChatGPT.
            </p>
            <p className="mt-4 text-xs text-muted-foreground/60">
              Hecho en Chile 🇨🇱
            </p>
          </div>

          {/* Producto */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Producto
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  Como funciona
                </a>
              </li>
              <li>
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Caracteristicas
                </a>
              </li>
              <li>
                <Link href="/test" className="text-muted-foreground hover:text-foreground transition-colors">
                  Demo interactiva
                </Link>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recursos
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentacion
                </Link>
              </li>
              <li>
                <Link href="/docs#api" className="text-muted-foreground hover:text-foreground transition-colors">
                  API UCP / ACP
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                  Soporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Cuenta + Legal */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cuenta
            </h4>
            <ul className="space-y-2.5 text-sm">
              {isLoggedIn ? (
                <li>
                  <Link href={dashboardUrl} className="text-muted-foreground hover:text-foreground transition-colors">
                    Mi Dashboard
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                      Ingresar
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">
                      Crear cuenta gratis
                    </Link>
                  </li>
                </>
              )}
            </ul>
            <h4 className="mb-4 mt-7 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="text-muted-foreground/60 cursor-default">Terminos de Servicio</span>
              </li>
              <li>
                <span className="text-muted-foreground/60 cursor-default">Politica de Privacidad</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="container mx-auto mt-10 border-t px-4 pt-8 flex flex-col items-center justify-between gap-3 sm:flex-row text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Mercadi SpA · RUT 00.000.000-0</span>
          <span className="hidden sm:block">WhatsApp · Gemini · ChatGPT · Tienda web</span>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border bg-card p-6 text-center transition-shadow hover:shadow-md">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-black">
        <span className="text-sm font-bold">{step}</span>
      </div>
      <div className="mb-2 flex items-center justify-center gap-2">
        <Icon className="h-4 w-4 text-amber-500" />
        <h3 className="text-lg font-semibold text-black">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-2 font-semibold text-black">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
