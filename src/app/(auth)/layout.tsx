import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-amber-500 to-amber-600 p-10 text-black lg:flex">
        <div className="flex items-center">
          <Image
            src="/mercadi.png"
            alt="Mercadi"
            width={140}
            height={36}
            className="brightness-0 invert"
          />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            Comercio inteligente
            <br />
            para Chile
          </h1>
          <p className="max-w-md text-black/70">
            Conecta tu negocio con agentes de compra IA a traves del Universal
            Commerce Protocol. Sin desarrollo tecnico.
          </p>
        </div>
        <p className="text-sm text-black/50">
          Mercadi.cl — Plataforma UCP para pymes chilenas
        </p>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center p-6 lg:hidden">
          <Image
            src="/mercadi.png"
            alt="Mercadi"
            width={140}
            height={36}
          />
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
