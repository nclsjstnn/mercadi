"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import GeminiChat from "@/components/test/gemini-chat";
import { Bot, MessageCircle } from "lucide-react";

export default function ChatWidget({ tenantSlug }: { tenantSlug: string }) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            size="icon"
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
          />
        }
      >
        <MessageCircle className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Probar tu Catalogo
          </SheetTitle>
          <SheetDescription>
            Chatea con Gemini para probar tu catalogo UCP
          </SheetDescription>
        </SheetHeader>
        <GeminiChat tenantSlug={tenantSlug} className="h-full min-h-0" />
      </SheetContent>
    </Sheet>
  );
}
