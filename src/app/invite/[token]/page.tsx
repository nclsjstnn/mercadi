import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { CollaborationInvite } from "@/lib/db/models/collaboration-invite";
import { Tenant } from "@/lib/db/models/tenant";
import { acceptInvite } from "@/actions/collaborators";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertCircle } from "lucide-react";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await connectDB();

  const invite = await CollaborationInvite.findOne({ token }).lean();

  if (!invite || invite.status !== "pending" || invite.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invitacion no valida</CardTitle>
            <CardDescription>
              Esta invitacion ha expirado, fue revocada, o no existe.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button variant="outline">Ir al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tenant = await Tenant.findById(invite.tenantId).select("name").lean();
  const tenantName = tenant?.name || "un negocio";
  const session = await auth();

  if (!session?.user) {
    const callbackUrl = encodeURIComponent(`/invite/${token}`);
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Invitacion a colaborar</CardTitle>
            <CardDescription>
              Has sido invitado a colaborar en <strong>{tenantName}</strong>.
              Crea una cuenta o inicia sesion para aceptar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href={`/register?callbackUrl=${callbackUrl}`}>
              <Button className="w-full">Crear una cuenta</Button>
            </Link>
            <Link href={`/login?callbackUrl=${callbackUrl}`}>
              <Button variant="outline" className="w-full">
                Iniciar sesion
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is logged in — show accept form
  async function handleAccept() {
    "use server";
    const result = await acceptInvite(token);
    if (result.success) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Invitacion a colaborar</CardTitle>
          <CardDescription>
            Has sido invitado a colaborar en <strong>{tenantName}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleAccept}>
            <Button type="submit" className="w-full">
              Aceptar invitacion
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
