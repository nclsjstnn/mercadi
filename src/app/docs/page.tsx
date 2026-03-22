import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Store,
  ArrowLeft,
  BookOpen,
  UserPlus,
  Package,
  Settings,
  Globe,
  ShoppingCart,
  Bot,
  Key,
  ChevronRight,
  Terminal,
  Copy,
  Truck,
  Tag,
  Ticket,
  Users,
  FileSpreadsheet,
} from "lucide-react";

export const metadata = {
  title: "Documentacion - Mercadi.cl",
  description:
    "Guia completa para configurar tu negocio con UCP y Gemini en Mercadi.cl",
};

function CodeBlock({
  children,
  language,
}: {
  children: string;
  language?: string;
}) {
  return (
    <div className="group relative">
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 bg-muted/50 px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {language}
        </span>
      </div>
      <pre className="overflow-x-auto rounded-b-lg border bg-muted/30 p-4 text-sm leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function SectionHeading({
  id,
  step,
  icon: Icon,
  title,
}: {
  id: string;
  step?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3">
        {step && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {step}
          </div>
        )}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      </div>
      <div className="mt-3 h-px bg-border" />
    </div>
  );
}

function NavItem({
  href,
  step,
  label,
}: {
  href: string;
  step?: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {step && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
          {step}
        </span>
      )}
      <span>{label}</span>
    </a>
  );
}

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/mercadi.png"
                alt="Mercadi"
                width={130}
                height={34}
              />
            </Link>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <div className="hidden items-center gap-1.5 sm:flex">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Documentacion
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Inicio
              </Button>
            </Link>
            <Link href="/test">
              <Button variant="outline" size="sm">
                Demo
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Crear Cuenta</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex flex-1 gap-0 px-4 lg:gap-8">
        {/* Sidebar navigation */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <nav className="sticky top-20 space-y-1 border-r py-8 pr-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inicio Rapido
            </p>
            <NavItem href="#overview" label="Descripcion general" />
            <NavItem href="#prerequisites" label="Requisitos previos" />

            <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Configuracion
            </p>
            <NavItem href="#register" step="1" label="Crear cuenta" />
            <NavItem href="#onboarding" step="2" label="Registrar negocio" />
            <NavItem href="#products" step="3" label="Agregar productos" />
            <NavItem href="#import" step="4" label="Importar desde Sheets" />
            <NavItem href="#shipping" step="5" label="Configurar envio" />
            <NavItem href="#promotions" step="6" label="Promociones y cupones" />
            <NavItem href="#collaborators" step="7" label="Colaboradores" />
            <NavItem href="#ucp-settings" step="8" label="Configurar UCP" />

            <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              API UCP
            </p>
            <NavItem href="#discovery" label="Descubrimiento" />
            <NavItem href="#auth" label="Autenticacion" />
            <NavItem href="#checkout-flow" label="Flujo de checkout" />
            <NavItem href="#api-reference" label="Referencia API" />

            <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gemini
            </p>
            <NavItem href="#gemini-setup" step="9" label="Configurar Gemini" />
            <NavItem href="#gemini-functions" label="Function declarations" />
            <NavItem href="#gemini-example" label="Ejemplo completo" />
            <NavItem href="#gemini-test" label="Probar con demo" />
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 py-8 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-16">
            {/* Hero */}
            <section>
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Guia completa
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Documentacion de Mercadi.cl
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Aprende a configurar tu negocio, exponer tu catalogo via UCP y
                conectar agentes de compra IA como Google Gemini para que tus
                clientes compren de forma conversacional.
              </p>
            </section>

            {/* Overview */}
            <section id="overview" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                icon={Globe}
                title="Descripcion general"
              />
              <p className="text-muted-foreground">
                Mercadi.cl es una plataforma multi-tenant que permite a pequenas
                empresas chilenas exponer sus catalogos de productos a agentes
                de compra IA a traves del{" "}
                <strong>Universal Commerce Protocol (UCP)</strong>.
              </p>
              <div className="rounded-xl border bg-card p-6">
                <h3 className="mb-4 font-semibold">Como funciona el flujo completo</h3>
                <div className="space-y-3">
                  <FlowStep
                    number="1"
                    title="Registro y onboarding"
                    description="Creas tu cuenta, registras tu negocio con RUT y slug unico."
                  />
                  <FlowStep
                    number="2"
                    title="Catalogo de productos"
                    description="Agregas tus productos con precios en CLP, stock e imagenes."
                  />
                  <FlowStep
                    number="3"
                    title="UCP se activa automaticamente"
                    description="Tu catalogo queda disponible en /{slug}/.well-known/ucp para descubrimiento."
                  />
                  <FlowStep
                    number="4"
                    title="Agente IA descubre tu tienda"
                    description="Un agente como Gemini consulta tu perfil UCP y descubre tus endpoints."
                  />
                  <FlowStep
                    number="5"
                    title="Compra conversacional"
                    description="El agente busca productos, crea checkout, agrega datos del comprador y completa la compra."
                  />
                </div>
              </div>
            </section>

            {/* Prerequisites */}
            <section id="prerequisites" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                icon={Terminal}
                title="Requisitos previos"
              />
              <div className="rounded-xl border bg-card p-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <strong>RUT de empresa</strong> — Necesitas un RUT valido
                      para registrar tu negocio en la plataforma.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <strong>Catalogo de productos</strong> — Al menos un
                      producto con precio, descripcion y stock para que el
                      agente pueda operar.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <strong>API Key de Gemini</strong> (opcional) — Solo si
                      deseas ejecutar tu propio agente. Obtenla en{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        aistudio.google.com
                      </code>
                      .
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Step 1: Register */}
            <section id="register" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                step="1"
                icon={UserPlus}
                title="Crear cuenta"
              />
              <p className="text-muted-foreground">
                Visita{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary hover:underline"
                >
                  /register
                </Link>{" "}
                y crea tu cuenta con nombre, email y contrasena (minimo 8
                caracteres).
              </p>
              <div className="rounded-xl border bg-card p-6">
                <h4 className="mb-3 text-sm font-semibold">
                  Que sucede al registrarse:
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Se crea un usuario con rol <code className="rounded bg-muted px-1.5 py-0.5 text-xs">tenant_owner</code>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    La contrasena se hashea con bcrypt (salt 12)
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Seras redirigido al login para iniciar sesion
                  </li>
                </ul>
              </div>
            </section>

            {/* Step 2: Onboarding */}
            <section id="onboarding" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                step="2"
                icon={Store}
                title="Registrar tu negocio"
              />
              <p className="text-muted-foreground">
                Al iniciar sesion por primera vez, seras redirigido al{" "}
                <strong>wizard de onboarding</strong> de 3 pasos:
              </p>

              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-6">
                  <h4 className="mb-2 font-semibold">
                    Paso 1 — Datos del negocio
                  </h4>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li>
                      <strong>Nombre:</strong> El nombre visible de tu tienda
                    </li>
                    <li>
                      <strong>Slug:</strong> Se genera automaticamente desde el
                      nombre (ej: {`"Mi Tienda"`} → {`"mi-tienda"`}). Este slug
                      define tu URL UCP:{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        /mi-tienda/.well-known/ucp
                      </code>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border bg-card p-6">
                  <h4 className="mb-2 font-semibold">
                    Paso 2 — Datos legales
                  </h4>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li>
                      <strong>RUT:</strong> RUT de la empresa, validado con
                      modulo-11
                    </li>
                    <li>
                      <strong>Razon Social:</strong> Nombre legal de la empresa
                    </li>
                    <li>
                      <strong>Region y Comuna:</strong> Ubicacion del negocio
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border bg-card p-6">
                  <h4 className="mb-2 font-semibold">
                    Paso 3 — Confirmacion
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Revisa los datos y confirma. Se creara tu tenant con:
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    <li>
                      <strong>API Key UCP:</strong>{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        ucp_XXXXXXXXX...
                      </code>{" "}
                      (generada automaticamente)
                    </li>
                    <li>
                      <strong>UCP habilitado:</strong> Activo desde el primer
                      momento
                    </li>
                    <li>
                      <strong>Moneda:</strong> CLP (pesos chilenos)
                    </li>
                    <li>
                      <strong>IVA:</strong> 19% incluido en precios
                    </li>
                    <li>
                      <strong>Comision:</strong> 5% por defecto
                    </li>
                    <li>
                      <strong>Proveedor de pago:</strong> Mock (desarrollo)
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Step 3: Products */}
            <section id="products" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                step="3"
                icon={Package}
                title="Agregar productos"
              />
              <p className="text-muted-foreground">
                Desde el dashboard, navega a{" "}
                <strong>Productos → Nuevo Producto</strong>. Cada producto
                necesita:
              </p>

              <div className="rounded-xl border bg-card p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">
                      Campos requeridos
                    </h4>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li>
                        <strong>Titulo:</strong> Nombre del producto
                      </li>
                      <li>
                        <strong>SKU:</strong> Codigo unico (ej:{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          ZAP-RUN-42
                        </code>
                        )
                      </li>
                      <li>
                        <strong>Precio:</strong> En CLP como entero (ej: 59990)
                      </li>
                      <li>
                        <strong>Stock:</strong> Unidades disponibles
                      </li>
                      <li>
                        <strong>Descripcion:</strong> Detalle del producto
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">
                      Campos opcionales
                    </h4>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li>
                        <strong>Categoria:</strong> Para filtrar (ej:{" "}
                        {`"calzado"`})
                      </li>
                      <li>
                        <strong>Tags:</strong> Etiquetas de busqueda
                      </li>
                      <li>
                        <strong>Imagenes:</strong> URLs de imagenes
                      </li>
                      <li>
                        <strong>Intangible:</strong> Marca el producto como
                        digital, servicio o gift card. Si todos los productos
                        del carrito son intangibles, no se requiere informacion
                        de envio en el checkout.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm">
                  <strong>Importante:</strong> El producto debe tener estado{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    active
                  </code>{" "}
                  para aparecer en las busquedas del agente IA. Los productos en{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    draft
                  </code>{" "}
                  no son visibles. Cada producto recibe un{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    ucpItemId
                  </code>{" "}
                  unico que se usa en las operaciones de checkout.
                </p>
              </div>
            </section>

            {/* Step 4: Import from Google Sheets */}
            <section id="import" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                step="4"
                icon={FileSpreadsheet}
                title="Importar desde Google Sheets"
              />
              <p className="text-muted-foreground">
                Si tienes muchos productos, puedes importarlos masivamente
                desde una hoja de Google Sheets en lugar de agregarlos uno a uno.
              </p>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold">Como importar</h4>
                <div className="space-y-3">
                  <FlowStep
                    number="1"
                    title="Ir a Dashboard → Productos → Importar"
                    description="Accede desde el boton 'Importar' en la pagina de productos."
                  />
                  <FlowStep
                    number="2"
                    title="Pegar la URL de tu Google Sheet"
                    description="La hoja debe estar compartida como 'Cualquier persona con el enlace puede ver'."
                  />
                  <FlowStep
                    number="3"
                    title="Revisar preview"
                    description="Mercadi mostrara una tabla con los productos detectados y errores de validacion."
                  />
                  <FlowStep
                    number="4"
                    title="Confirmar importacion"
                    description="Los productos validos se crean como borradores (draft). Puedes activarlos despues."
                  />
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold">Columnas requeridas</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 pr-4 font-medium">Columna</th>
                        <th className="py-2 font-medium">Descripcion</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b"><td className="py-2 pr-4 font-mono">sku</td><td>Codigo unico del producto</td></tr>
                      <tr className="border-b"><td className="py-2 pr-4 font-mono">titulo / title</td><td>Nombre del producto</td></tr>
                      <tr className="border-b"><td className="py-2 pr-4 font-mono">precio / price</td><td>Precio en CLP (entero)</td></tr>
                      <tr className="border-b"><td className="py-2 pr-4 font-mono">stock</td><td>Unidades disponibles (opcional, default 0)</td></tr>
                      <tr className="border-b"><td className="py-2 pr-4 font-mono">descripcion / description</td><td>Detalle del producto (opcional)</td></tr>
                      <tr className="border-b"><td className="py-2 pr-4 font-mono">categoria / category</td><td>Categoria (opcional)</td></tr>
                      <tr><td className="py-2 pr-4 font-mono">imagen / image</td><td>URL de imagen (opcional)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm">
                  <strong>Tip:</strong> Los productos importados se crean en estado{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">draft</code>.
                  Revisalos y activalos desde la lista de productos para que aparezcan
                  en tu tienda y en las busquedas del agente IA.
                </p>
              </div>
            </section>

            {/* Step 5: Shipping */}
            <section id="shipping" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                step="5"
                icon={Truck}
                title="Configurar envio"
              />
              <p className="text-muted-foreground">
                En{" "}
                <strong>Dashboard → Configuracion → Envio</strong>, configura
                los metodos de envio y retiro disponibles para tus clientes.
              </p>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold">Opciones de envio</h4>
                <p className="text-sm text-muted-foreground">
                  Puedes crear hasta 5 opciones de envio. Cada opcion tiene:
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>
                    <strong>Nombre:</strong> Nombre visible (ej: {`"Envio estandar"`}, {`"Retiro en tienda"`})
                  </li>
                  <li>
                    <strong>Precio:</strong> Precio fijo en CLP como entero (ej: 3990)
                  </li>
                  <li>
                    <strong>Tipo:</strong>{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">shipping</code> (envio a domicilio) o{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">pickup</code> (retiro en tienda)
                  </li>
                  <li>
                    <strong>Habilitada:</strong> Toggle para activar/desactivar sin eliminar
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm">
                  <strong>Importante:</strong> El costo de envio se agrega al
                  total cuando el comprador selecciona una opcion de envio
                  durante el checkout. La comision de la plataforma se calcula
                  sobre el total incluyendo envio.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold">Productos intangibles</h4>
                <p className="text-sm text-muted-foreground">
                  Si todos los productos en un carrito estan marcados como{" "}
                  <strong>intangibles</strong> (digital, servicio, gift card),
                  el checkout no requiere informacion de envio. El campo{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    fulfillment_required
                  </code>{" "}
                  sera{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    false
                  </code>{" "}
                  en la respuesta de la API. Si el carrito tiene al menos un
                  producto fisico, se requiere envio.
                </p>
              </div>
            </section>

            {/* Step 5: Promotions & Coupons */}
            <section id="promotions" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                step="6"
                icon={Tag}
                title="Promociones y cupones"
              />
              <p className="text-muted-foreground">
                Mercadi ofrece dos mecanismos de descuento para impulsar tus
                ventas: <strong>precios de oferta</strong> por producto y{" "}
                <strong>cupones de descuento</strong> por codigo.
              </p>

              <div className="rounded-xl border bg-card p-6 space-y-6">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    Precio de oferta (compareAtPrice)
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Al editar un producto, puedes establecer un{" "}
                    <strong>precio original</strong> opcional. El cliente paga el
                    precio de venta y ve el precio original tachado con el
                    porcentaje de descuento. Este campo es puramente visual — el
                    checkout siempre usa el precio de venta.
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc pl-5">
                    <li>
                      Ve a <strong>Dashboard → Productos → Editar</strong>
                    </li>
                    <li>
                      Completa el campo <strong>Precio original</strong> (debe
                      ser mayor al precio de venta)
                    </li>
                    <li>
                      La tienda mostrara automaticamente el badge de descuento y
                      el precio tachado
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-primary" />
                    Cupones de descuento
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Crea codigos de descuento que tus clientes pueden aplicar en
                    el checkout. Soporta descuentos de <strong>monto fijo (CLP)</strong>{" "}
                    o <strong>porcentaje</strong>.
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc pl-5">
                    <li>
                      Ve a <strong>Dashboard → Cupones → Nuevo Cupon</strong>
                    </li>
                    <li>
                      Configura: codigo, tipo de descuento, valor, monto minimo
                      de compra (opcional), usos maximos (opcional) y fecha de
                      expiracion (opcional)
                    </li>
                    <li>
                      Los clientes ingresan el codigo en el checkout y el
                      descuento se aplica al subtotal antes de impuestos
                    </li>
                    <li>
                      El IVA y la comision se calculan sobre el monto con
                      descuento
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Step 6: Collaborators */}
            <section id="collaborators" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                step="7"
                icon={Users}
                title="Colaboradores"
              />
              <p className="text-muted-foreground">
                Invita a empleados o socios a gestionar tu negocio desde su
                propia cuenta, sin compartir credenciales. Disponible en el{" "}
                <strong>plan Pro</strong>.
              </p>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <div>
                  <h4 className="mb-1 text-sm font-semibold">Como funciona</h4>
                  <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                    <li>
                      Ve a{" "}
                      <strong>Dashboard → Configuracion → Colaboradores</strong>
                    </li>
                    <li>
                      Ingresa el email de la persona que quieres invitar y haz
                      clic en <strong>Invitar</strong>
                    </li>
                    <li>
                      Copia el enlace de invitacion y compartelo con tu
                      colaborador
                    </li>
                    <li>
                      El colaborador crea una cuenta (o inicia sesion) y acepta
                      la invitacion
                    </li>
                    <li>
                      El colaborador aparece en tu lista y puede gestionar
                      productos, pedidos y pagos
                    </li>
                  </ol>
                </div>

                <div>
                  <h4 className="mb-1 text-sm font-semibold">Limites y permisos</h4>
                  <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Hasta 5 colaboradores por negocio (plan Pro)</li>
                    <li>
                      Los colaboradores pueden gestionar productos, pedidos y
                      configuracion general
                    </li>
                    <li>
                      Los colaboradores <strong>no pueden</strong> invitar o
                      revocar otros colaboradores, ni cambiar la facturacion
                    </li>
                    <li>Las invitaciones expiran en 7 dias</li>
                    <li>
                      Puedes revocar el acceso de un colaborador en cualquier
                      momento
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Plan Free:</strong> Los colaboradores no estan
                    disponibles. Upgrade a Pro desde la pagina de planes para
                    habilitar esta funcionalidad.
                  </p>
                </div>
              </div>
            </section>

            {/* Step 7: UCP Settings */}
            <section id="ucp-settings" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                step="8"
                icon={Settings}
                title="Configurar UCP"
              />
              <p className="text-muted-foreground">
                En{" "}
                <strong>Dashboard → Configuracion → UCP</strong>, encontraras
                los datos clave para conectar agentes IA:
              </p>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <div>
                  <h4 className="mb-1 text-sm font-semibold">API Key</h4>
                  <p className="text-sm text-muted-foreground">
                    Tu clave de autenticacion para el protocolo UCP. Se incluye
                    como header{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      Authorization: Bearer ucp_xxx...
                    </code>
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-semibold">Discovery URL</h4>
                  <CodeBlock language="URL">
                    {`https://mercadi.cl/{tu-slug}/.well-known/ucp`}
                  </CodeBlock>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-semibold">
                    Checkout Endpoint
                  </h4>
                  <CodeBlock language="URL">
                    {`https://mercadi.cl/api/ucp/{tu-slug}/v1/checkout-sessions`}
                  </CodeBlock>
                </div>
              </div>
            </section>

            {/* UCP Discovery */}
            <section id="discovery" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                icon={Globe}
                title="Descubrimiento UCP"
              />
              <p className="text-muted-foreground">
                El protocolo UCP usa un endpoint de descubrimiento (
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  .well-known/ucp
                </code>
                ) para que los agentes IA encuentren automaticamente los
                servicios disponibles.
              </p>

              <CodeBlock language="bash">
                {`curl https://mercadi.cl/{tu-slug}/.well-known/ucp`}
              </CodeBlock>

              <p className="text-sm text-muted-foreground">Respuesta:</p>

              <CodeBlock language="json">
                {`{
  "ucp": { "version": "2026-01-23" },
  "services": {
    "dev.ucp.shopping": [
      {
        "transport": "rest",
        "endpoint": "https://mercadi.cl/api/ucp/{tu-slug}/v1"
      }
    ]
  },
  "capabilities": {
    "dev.ucp.shopping.checkout": [
      { "version": "2026-01-23" }
    ]
  },
  "payment": {
    "handlers": [
      {
        "type": "platform_managed",
        "description": "Payment handled by Mercadi platform"
      }
    ]
  }
}`}
              </CodeBlock>
            </section>

            {/* Authentication */}
            <section id="auth" className="scroll-mt-24 space-y-4">
              <SectionHeading id="" icon={Key} title="Autenticacion API" />
              <p className="text-muted-foreground">
                Todos los endpoints de checkout requieren autenticacion con tu
                API Key via header <code className="rounded bg-muted px-1.5 py-0.5 text-xs">Authorization</code>.
              </p>
              <CodeBlock language="http">
                {`Authorization: Bearer ucp_TU_API_KEY_AQUI`}
              </CodeBlock>
              <p className="text-sm text-muted-foreground">
                Headers opcionales:
              </p>
              <div className="rounded-xl border bg-card p-6">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      Idempotency-Key
                    </code>{" "}
                    — Evita crear sesiones duplicadas si se reintenta la
                    peticion
                  </li>
                  <li>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      X-UCP-Agent
                    </code>{" "}
                    — Identifica al agente que hace la peticion (ej:{" "}
                    {`"Gemini"`})
                  </li>
                </ul>
              </div>
            </section>

            {/* Checkout Flow */}
            <section id="checkout-flow" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                icon={ShoppingCart}
                title="Flujo de checkout"
              />
              <p className="text-muted-foreground">
                El checkout sigue una maquina de estados con transiciones
                lineales. La sesion expira a los 30 minutos.
              </p>

              <div className="rounded-xl border bg-card p-6">
                <div className="flex flex-wrap items-center gap-2 text-sm font-mono">
                  <span className="rounded bg-muted px-2 py-1">open</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="rounded bg-muted px-2 py-1">buyer_set</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="rounded bg-muted px-2 py-1">
                    fulfillment_set
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="rounded bg-muted px-2 py-1">
                    pending_payment
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="rounded bg-primary/10 px-2 py-1 text-primary font-semibold">
                    completed
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold">Paso a paso:</p>
                <div className="space-y-3">
                  <FlowStep
                    number="1"
                    title="Crear sesion (POST)"
                    description="Envias los productos y cantidades. Recibes sessionId y totales con IVA."
                  />
                  <FlowStep
                    number="2"
                    title="Agregar comprador (PUT)"
                    description="Envias email, nombre y telefono del comprador."
                  />
                  <FlowStep
                    number="3"
                    title="Agregar envio (PUT)"
                    description="Envias tipo (shipping/pickup), opcion de envio y direccion. Si el carrito es 100% intangible (fulfillment_required: false), puedes saltar este paso."
                  />
                  <FlowStep
                    number="4"
                    title="Completar (POST /complete)"
                    description="Se procesa el pago, se crea la orden, se descuenta stock."
                  />
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section id="api-reference" className="scroll-mt-24 space-y-6">
              <SectionHeading
                id=""
                icon={Terminal}
                title="Referencia API"
              />

              {/* Create */}
              <div className="rounded-xl border bg-card">
                <div className="flex items-center gap-2 border-b px-6 py-3">
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800 dark:bg-green-900 dark:text-green-200">
                    POST
                  </span>
                  <code className="text-sm">
                    /api/ucp/{`{slug}`}/v1/checkout-sessions
                  </code>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Crea una nueva sesion de checkout.
                  </p>
                  <CodeBlock language="json (Request body)">
                    {`{
  "line_items": [
    { "ucpItemId": "prod_abc123", "quantity": 2 },
    { "ucpItemId": "prod_def456", "quantity": 1 }
  ]
}`}
                  </CodeBlock>
                  <CodeBlock language="json (Response 201)">
                    {`{
  "checkout_session_id": "cs_xxxxxxxxxxxxxxxx",
  "status": "open",
  "line_items": [
    {
      "ucp_item_id": "prod_abc123",
      "title": "Zapatillas Running Pro",
      "quantity": 2,
      "unit_price": 59990,
      "total_price": 119980
    }
  ],
  "totals": {
    "subtotal": 119980,
    "tax": 22796,
    "shipping": 0,
    "total": 119980
  },
  "currency": "CLP",
  "fulfillment_required": true,
  "available_shipping_options": [
    {
      "id": "ship_abc12345",
      "name": "Envio estandar",
      "price": 3990,
      "type": "shipping"
    },
    {
      "id": "ship_xyz98765",
      "name": "Retiro en tienda",
      "price": 0,
      "type": "pickup"
    }
  ],
  "expires_at": "2026-03-15T10:30:00.000Z"
}`}
                  </CodeBlock>
                </div>
              </div>

              {/* Get */}
              <div className="rounded-xl border bg-card">
                <div className="flex items-center gap-2 border-b px-6 py-3">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    GET
                  </span>
                  <code className="text-sm">
                    /api/ucp/{`{slug}`}/v1/checkout-sessions/{`{sessionId}`}
                  </code>
                </div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground">
                    Obtiene el estado actual de una sesion de checkout. Retorna
                    los mismos campos que el POST (incluyendo{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      fulfillment_required
                    </code>{" "}
                    y{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      available_shipping_options
                    </code>
                    ), mas{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      buyer
                    </code>{" "}
                    y{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      fulfillment
                    </code>{" "}
                    si ya fueron establecidos.
                  </p>
                </div>
              </div>

              {/* Update */}
              <div className="rounded-xl border bg-card">
                <div className="flex items-center gap-2 border-b px-6 py-3">
                  <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    PUT
                  </span>
                  <code className="text-sm">
                    /api/ucp/{`{slug}`}/v1/checkout-sessions/{`{sessionId}`}
                  </code>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Actualiza la sesion con datos del comprador y/o envio.
                  </p>
                  <CodeBlock language="json (Request body)">
                    {`{
  "buyer": {
    "email": "cliente@example.com",
    "name": "Juan Perez",
    "phone": "+56912345678"
  },
  "fulfillment": {
    "type": "shipping",
    "shipping_option_id": "ship_abc12345",
    "address": {
      "street": "Av. Providencia 1234",
      "comuna": "Providencia",
      "region": "Region Metropolitana"
    }
  }
}`}
                  </CodeBlock>
                  <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                    <strong>shipping_option_id</strong> (opcional): ID de una
                    opcion de envio del tenant. Si se incluye, el precio de envio
                    se agrega automaticamente a los totales. El{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">type</code>{" "}
                    debe coincidir con el tipo de la opcion (shipping o pickup).
                  </div>
                </div>
              </div>

              {/* Complete */}
              <div className="rounded-xl border bg-card">
                <div className="flex items-center gap-2 border-b px-6 py-3">
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800 dark:bg-green-900 dark:text-green-200">
                    POST
                  </span>
                  <code className="text-sm">
                    /api/ucp/{`{slug}`}/v1/checkout-sessions/{`{sessionId}`}
                    /complete
                  </code>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Completa el checkout: procesa el pago, crea la orden y
                    descuenta el stock.
                  </p>
                  <CodeBlock language="json (Response 200)">
                    {`{
  "status": "completed",
  "order_id": "ord_xxxxxxxx",
  "checkout_session_id": "cs_xxxxxxxxxxxxxxxx",
  "totals": {
    "subtotal": 119980,
    "tax": 22796,
    "shipping": 0,
    "total": 119980
  },
  "currency": "CLP",
  "permalink_url": "https://mercadi.cl/orders/ord_xxxxxxxx"
}`}
                  </CodeBlock>
                </div>
              </div>

              {/* Cancel */}
              <div className="rounded-xl border bg-card">
                <div className="flex items-center gap-2 border-b px-6 py-3">
                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800 dark:bg-red-900 dark:text-red-200">
                    POST
                  </span>
                  <code className="text-sm">
                    /api/ucp/{`{slug}`}/v1/checkout-sessions/{`{sessionId}`}
                    /cancel
                  </code>
                </div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground">
                    Cancela una sesion de checkout abierta. No se puede cancelar
                    una sesion ya completada.
                  </p>
                </div>
              </div>
            </section>

            {/* Gemini Setup */}
            <section id="gemini-setup" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                step="9"
                icon={Bot}
                title="Configurar Gemini"
              />
              <p className="text-muted-foreground">
                Google Gemini puede actuar como agente de compras
                conversacional usando las{" "}
                <strong>Function Declarations</strong> para interactuar con tu
                API UCP.
              </p>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold">Requisitos</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      Instalar{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        @google/generative-ai
                      </code>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      Obtener un{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        GEMINI_API_KEY
                      </code>{" "}
                      desde Google AI Studio
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      Tener al menos un tenant con productos activos y su{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        ucpApiKey
                      </code>
                    </span>
                  </li>
                </ul>
              </div>

              <CodeBlock language="bash">
                {`npm install @google/generative-ai`}
              </CodeBlock>
            </section>

            {/* Gemini Function Declarations */}
            <section
              id="gemini-functions"
              className="scroll-mt-24 space-y-4"
            >
              <SectionHeading
                id=""
                icon={Terminal}
                title="Function Declarations"
              />
              <p className="text-muted-foreground">
                Gemini usa 4 funciones para interactuar con tu API UCP. Estas
                funciones se declaran al inicializar el modelo y Gemini las
                invoca automaticamente segun la conversacion.
              </p>

              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-6">
                  <h4 className="font-semibold font-mono text-sm">
                    search_products(query, category?)
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Busca productos en el catalogo del tenant. Filtra por titulo,
                    descripcion y tags. Retorna hasta 20 productos activos con
                    precio, stock y ucpItemId.
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-6">
                  <h4 className="font-semibold font-mono text-sm">
                    {`create_checkout(items: { ucpItemId, quantity }[])`}
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Crea una sesion de checkout via{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      POST /checkout-sessions
                    </code>
                    . Retorna el sessionId y totales con IVA.
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-6">
                  <h4 className="font-semibold font-mono text-sm">
                    update_checkout(sessionId, buyer?, fulfillment?)
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Actualiza la sesion con datos del comprador (email, nombre)
                    y/o metodo de entrega (shipping/pickup + direccion +
                    shipping_option_id). Si se incluye un{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      shipping_option_id
                    </code>
                    , el costo de envio se agrega a los totales automaticamente.
                    Si el carrito es 100% intangible, el envio no es requerido.
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-6">
                  <h4 className="font-semibold font-mono text-sm">
                    complete_checkout(sessionId)
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Completa el checkout: procesa el pago, crea la orden,
                    descuenta stock y retorna el orderId.
                  </p>
                </div>
              </div>
            </section>

            {/* Gemini Complete Example */}
            <section id="gemini-example" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                icon={Bot}
                title="Ejemplo completo"
              />
              <p className="text-muted-foreground">
                Este ejemplo muestra como configurar Gemini con las 4 funciones
                UCP y ejecutar un flujo de compra conversacional completo.
              </p>

              <CodeBlock language="typescript">
                {`import {
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclaration,
} from "@google/generative-ai";

// 1. Declarar las funciones UCP
const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "search_products",
    description: "Search for products in the catalog.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: "Search query for products",
        },
        category: {
          type: SchemaType.STRING,
          description: "Optional category filter",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "create_checkout",
    description: "Create a checkout session with products.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        items: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              ucpItemId: { type: SchemaType.STRING },
              quantity: { type: SchemaType.NUMBER },
            },
            required: ["ucpItemId", "quantity"],
          },
        },
      },
      required: ["items"],
    },
  },
  {
    name: "update_checkout",
    description: "Update checkout with buyer/fulfillment info.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        sessionId: { type: SchemaType.STRING },
        buyer: {
          type: SchemaType.OBJECT,
          properties: {
            email: { type: SchemaType.STRING },
            name: { type: SchemaType.STRING },
            phone: { type: SchemaType.STRING },
          },
          required: ["email", "name"],
        },
        fulfillment: {
          type: SchemaType.OBJECT,
          properties: {
            type: {
              type: SchemaType.STRING,
              format: "enum",
              enum: ["shipping", "pickup"],
            },
            shipping_option_id: {
              type: SchemaType.STRING,
              description: "ID of a shipping option from available_shipping_options",
            },
            address: {
              type: SchemaType.OBJECT,
              properties: {
                street: { type: SchemaType.STRING },
                comuna: { type: SchemaType.STRING },
                region: { type: SchemaType.STRING },
              },
            },
          },
          required: ["type"],
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "complete_checkout",
    description: "Complete checkout and process payment.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        sessionId: { type: SchemaType.STRING },
      },
      required: ["sessionId"],
    },
  },
];

// 2. Inicializar Gemini con funciones UCP
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
  systemInstruction: \`You are a shopping assistant for "Mi Tienda".
Help customers find products, answer questions, and complete
purchases. Prices are in CLP. Always speak in Spanish (Chile).\`,
});

// 3. Iniciar chat y manejar function calls
const chat = model.startChat();
let result = await chat.sendMessage("Busco zapatillas running");
let response = result.response;

// 4. Loop: ejecutar funciones hasta que Gemini responda con texto
while (response.functionCalls()?.length) {
  const functionCalls = response.functionCalls()!;
  const functionResponses = [];

  for (const fc of functionCalls) {
    // Ejecutar la funcion contra la API UCP
    const fnResult = await executeUCPFunction(fc.name, fc.args);
    functionResponses.push({
      functionResponse: { name: fc.name, response: fnResult },
    });
  }

  // Enviar resultados de vuelta a Gemini
  result = await chat.sendMessage(functionResponses);
  response = result.response;
}

// 5. Respuesta final en lenguaje natural
console.log(response.text());

// Funcion helper para ejecutar llamadas UCP
async function executeUCPFunction(name: string, args: any) {
  const BASE = "https://mercadi.cl/api/ucp/mi-tienda/v1";
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer ucp_TU_API_KEY",
  };

  switch (name) {
    case "search_products":
      // Buscar en DB o llamar a tu propio endpoint
      return { products: [/* ... */] };

    case "create_checkout":
      const res = await fetch(\`\${BASE}/checkout-sessions\`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          line_items: args.items.map((i: any) => ({
            ucpItemId: i.ucpItemId,
            quantity: i.quantity,
          })),
        }),
      });
      return await res.json();

    case "update_checkout":
      const upd = await fetch(
        \`\${BASE}/checkout-sessions/\${args.sessionId}\`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            buyer: args.buyer,
            fulfillment: args.fulfillment,
          }),
        }
      );
      return await upd.json();

    case "complete_checkout":
      const comp = await fetch(
        \`\${BASE}/checkout-sessions/\${args.sessionId}/complete\`,
        { method: "POST", headers }
      );
      return await comp.json();
  }
}`}
              </CodeBlock>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm">
                  <strong>Nota sobre schemas de Gemini:</strong> Los campos{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    enum
                  </code>{" "}
                  requieren la propiedad{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {`format: "enum"`}
                  </code>{" "}
                  junto al tipo{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    SchemaType.STRING
                  </code>
                  . Usa siempre{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    SchemaType
                  </code>{" "}
                  (no strings) para los tipos de schema.
                </p>
              </div>
            </section>

            {/* Gemini Test */}
            <section id="gemini-test" className="scroll-mt-24 space-y-4">
              <SectionHeading
                id=""
                icon={Bot}
                title="Probar con la demo"
              />
              <p className="text-muted-foreground">
                Mercadi incluye una pagina de prueba integrada que conecta
                Gemini con tu tienda UCP en tiempo real.
              </p>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <div className="space-y-3">
                  <FlowStep
                    number="1"
                    title="Ir a /test"
                    description="Abre la pagina de demo desde el menu o directamente en /test."
                  />
                  <FlowStep
                    number="2"
                    title="Seleccionar tenant"
                    description="Elige tu tienda del dropdown. Esto configura el slug y API key."
                  />
                  <FlowStep
                    number="3"
                    title="Conversar con el agente"
                    description='Escribe algo como "Busco zapatillas running talla 42" y observa como Gemini busca productos, crea checkout y completa la compra.'
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                En el chat, puedes ver cada intercambio UCP (funcion llamada,
                argumentos enviados y resultado recibido) en un visor
                expandible debajo de cada respuesta del agente.
              </p>

              <div className="flex gap-3">
                <Link href="/test">
                  <Button className="gap-2">
                    <Bot className="h-4 w-4" />
                    Ir a la Demo
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Crear Cuenta
                  </Button>
                </Link>
              </div>
            </section>

            {/* Conversation Example */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold">
                Ejemplo de conversacion
              </h3>
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <ChatBubble role="user">
                  Hola, busco zapatillas para correr
                </ChatBubble>
                <FunctionCall
                  name="search_products"
                  args='{ "query": "zapatillas correr" }'
                />
                <ChatBubble role="assistant">
                  Encontre estas opciones para ti: 1) Zapatillas Running Pro -
                  $59.990 (5 en stock), 2) Zapatillas Trail Ultra - $79.990 (3
                  en stock). Quieres agregar alguna al carrito?
                </ChatBubble>
                <ChatBubble role="user">
                  Quiero 1 par de las Running Pro
                </ChatBubble>
                <FunctionCall
                  name="create_checkout"
                  args='{ "items": [{ "ucpItemId": "prod_abc", "quantity": 1 }] }'
                />
                <ChatBubble role="assistant">
                  Listo! Tu carrito tiene 1x Zapatillas Running Pro por $59.990
                  (IVA incluido). Necesito tu nombre, email y direccion de
                  envio para continuar.
                </ChatBubble>
                <ChatBubble role="user">
                  Juan Perez, juan@email.com, envio a Providencia 1234
                </ChatBubble>
                <FunctionCall
                  name="update_checkout"
                  args='{ "sessionId": "cs_xxx", "buyer": { ... }, "fulfillment": { ... } }'
                />
                <FunctionCall
                  name="complete_checkout"
                  args='{ "sessionId": "cs_xxx" }'
                />
                <ChatBubble role="assistant">
                  Compra completada! Tu orden ord_yyy esta confirmada. Recibirás
                  tus Zapatillas Running Pro en Av. Providencia 1234,
                  Providencia. Gracias por tu compra!
                </ChatBubble>
              </div>
            </section>
            {/* Public Storefront */}
            <section className="space-y-6">
              <SectionHeading
                id="storefront"
                icon={Store}
                title="Tienda Publica"
              />
              <p className="text-muted-foreground">
                Cada negocio puede activar una tienda publica accesible desde
                un subdominio <code className="text-sm font-mono bg-muted px-1 rounded">slug.mercadi.cl</code>.
                Es una experiencia ecommerce completa: catalogo, carrito, checkout y pago.
              </p>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold">Activacion</h4>
                <div className="space-y-3">
                  <FlowStep
                    number="1"
                    title="Ir a Dashboard → Tienda"
                    description="Habilita la tienda publica desde el toggle."
                  />
                  <FlowStep
                    number="2"
                    title="Personalizar tema"
                    description="Configura colores primario, secundario y de acento. Agrega tu logo y favicon."
                  />
                  <FlowStep
                    number="3"
                    title="Visitar tu tienda"
                    description="Accede desde slug.mercadi.cl (o slug.localhost:3000 en desarrollo)."
                  />
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold">Plantilla Liquid</h4>
                <p className="text-sm text-muted-foreground">
                  Personaliza el layout completo de tu tienda con plantillas Liquid.
                  Variables disponibles:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 pr-4 font-medium">Variable</th>
                        <th className="py-2 font-medium">Descripcion</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b"><td className="py-2 pr-4 font-mono">{"{{ business_name }}"}</td><td>Nombre del negocio</td></tr>
                      <tr className="border-b"><td className="py-2 pr-4 font-mono">{"{{ theme.primaryColor }}"}</td><td>Color primario</td></tr>
                      <tr className="border-b"><td className="py-2 pr-4 font-mono">{"{{ theme.secondaryColor }}"}</td><td>Color secundario</td></tr>
                      <tr className="border-b"><td className="py-2 pr-4 font-mono">{"{{ theme.accentColor }}"}</td><td>Color de acento</td></tr>
                      <tr className="border-b"><td className="py-2 pr-4 font-mono">{"{{ content }}"}</td><td>Contenido de la pagina (requerido)</td></tr>
                      <tr><td className="py-2 pr-4 font-mono">{"{{ branding }}"}</td><td>true si muestra branding Mercadi (plan Free)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold">Dominio personalizado (Pro)</h4>
                <p className="text-sm text-muted-foreground">
                  Los usuarios Pro pueden conectar un dominio propio. Se requieren
                  los siguientes registros DNS:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 pr-4 font-medium">Tipo</th>
                        <th className="py-2 pr-4 font-medium">Nombre</th>
                        <th className="py-2 font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-muted-foreground">
                      <tr className="border-b"><td className="py-2 pr-4">A</td><td className="py-2 pr-4">@</td><td>76.76.21.21</td></tr>
                      <tr><td className="py-2 pr-4">CNAME</td><td className="py-2 pr-4">www</td><td>cname.vercel-dns.com</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <h4 className="font-semibold">Flujo de checkout</h4>
                <div className="space-y-3">
                  <FlowStep number="1" title="Agregar productos al carrito" description="El carrito se almacena en localStorage por tenant." />
                  <FlowStep number="2" title="Ir al checkout" description="Completa datos de comprador, selecciona opcion de envio y direccion. Para productos intangibles, el envio no es requerido." />
                  <FlowStep number="3" title="Pagar" description="Se usa el proveedor de pago mock. En produccion se conecta Transbank o MercadoPago." />
                  <FlowStep number="4" title="Confirmacion" description="Se muestra el detalle del pedido y numero de orden." />
                </div>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Branding por plan:</strong> En el plan Free, el footer muestra
                  &quot;Powered by Mercadi.cl&quot;. En el plan Pro, muestra el nombre del negocio.
                </p>
              </div>
            </section>

          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Mercadi.cl — Documentacion
        </div>
      </footer>
    </div>
  );
}

function FlowStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {number}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ChatBubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function FunctionCall({ name, args }: { name: string; args: string }) {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-1.5 text-xs text-muted-foreground">
        <Terminal className="h-3 w-3" />
        <span className="font-mono font-medium">{name}</span>
        <span className="hidden sm:inline text-muted-foreground/60">
          {args}
        </span>
      </div>
    </div>
  );
}
