"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function UpgradeBanner({ className }: { className?: string }) {
  const { data: session } = useSession();

  if (!session?.user || session.user.plan === "pro" || session.user.role === "admin") {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
        <Sparkles className="h-8 w-8 text-yellow-500" />
        <div>
          <p className="font-semibold">Pasa a Pro</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Desbloquea más negocios y proveedores de pago reales
          </p>
        </div>
        <Link href="/plans">
          <Button size="sm">Ver planes</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
