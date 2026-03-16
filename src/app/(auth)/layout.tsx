import { Store } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-primary to-primary/80 p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <Store className="h-4 w-4" />
          </div>
          Mercadi.cl
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            Comercio inteligente
            <br />
            para Chile
          </h1>
          <p className="max-w-md text-primary-foreground/80">
            Conecta tu negocio con agentes de compra IA a traves del Universal
            Commerce Protocol. Sin desarrollo tecnico.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          Mercadi.cl — Plataforma UCP para pymes chilenas
        </p>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 p-6 text-lg font-bold lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-4 w-4" />
          </div>
          Mercadi.cl
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
