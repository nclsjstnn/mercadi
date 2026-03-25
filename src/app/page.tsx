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
          <Link href="/" className="flex items-center">
            <Image
              src="/mercadi.png"
              alt="Mercadi"
              width={140}
              height={36}
              priority
            />
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
            <Link href="/docs">
              <Button variant="ghost" size="sm">
                Docs
              </Button>
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
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="container relative mx-auto px-4 py-24 text-center lg:py-32">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              WhatsApp · ChatGPT · Tienda web
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-none text-black sm:text-5xl lg:text-6xl">
              Tu catalogo en todos
              <br />
              <span className="text-amber-500">los canales digitales</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-700">
              Mercadi conecta tu negocio con WhatsApp, ChatGPT y tu propia
              tienda web. Tus clientes te encuentran donde ya estan, y tu
              gestionas todo desde un solo lugar.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {isLoggedIn ? (
                <Link href={dashboardUrl}>
                  <Button
                    size="lg"
                    className="gap-2 bg-amber-500 text-black font-semibold text-lg hover:bg-amber-600 shadow-sm px-8"
                  >
                    Ir al Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button
                    size="lg"
                    className="gap-2 bg-amber-500 text-black font-semibold text-lg hover:bg-amber-600 shadow-sm px-8"
                  >
                    Prueba una tienda gratis!
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
          </div>
        </section>

        {/* Channels showcase */}
        <section className="border-t bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">
              Un catalogo. Tres canales.
            </p>
            <div className="grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
              <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-black">WhatsApp</h3>
                <p className="text-sm text-gray-600">
                  Tus clientes exploran el catalogo y reciben el link de compra
                  directo en WhatsApp.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <Bot className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-black">ChatGPT</h3>
                <p className="text-sm text-gray-600">
                  Usuarios de ChatGPT pueden buscar y comprar en tu tienda sin
                  salir del chat.
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
      <footer className="border-t py-12">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-4">
          <div>
            <div className="flex items-center">
              <Image
                src="/mercadi.png"
                alt="Mercadi"
                width={120}
                height={32}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Vende por WhatsApp, ChatGPT y tu tienda web. Todo desde un
              solo dashboard.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Producto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#how-it-works" className="hover:text-foreground">
                  Como funciona
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-foreground">
                  Caracteristicas
                </a>
              </li>
              <li>
                <Link href="/docs" className="hover:text-foreground">
                  Documentacion
                </Link>
              </li>
              <li>
                <Link href="/test" className="hover:text-foreground">
                  Demo
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Cuenta</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {isLoggedIn ? (
                <li>
                  <Link href={dashboardUrl} className="hover:text-foreground">
                    Mi Dashboard
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="hover:text-foreground">
                      Ingresar
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="hover:text-foreground">
                      Crear Cuenta
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Terminos de Servicio</li>
              <li>Politica de Privacidad</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto mt-8 border-t px-4 pt-8 text-center text-sm text-muted-foreground">
          Mercadi.cl — Vende por WhatsApp, ChatGPT y tu tienda web
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
