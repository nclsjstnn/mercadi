"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export function MobileNav({
  isLoggedIn,
  dashboardUrl,
}: {
  isLoggedIn: boolean;
  dashboardUrl: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" />
        }
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menu</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
        <nav className="mt-8 flex flex-col gap-4">
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Como funciona
          </a>
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Caracteristicas
          </a>
          <Link
            href="/docs"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Docs
          </Link>
          <Link
            href="/test"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Demo
          </Link>
        </nav>
        <div className="mt-8 flex flex-col gap-3">
          {isLoggedIn ? (
            <Link href={dashboardUrl} onClick={() => setOpen(false)}>
              <Button className="w-full" size="sm">
                Ir al Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full">
                  Ingresar
                </Button>
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button
                  size="sm"
                  className="w-full bg-amber-500 text-black font-semibold hover:bg-amber-600 shadow-sm"
                >
                  Inscribete gratis
                </Button>
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
