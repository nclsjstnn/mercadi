"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./cart-provider";

export function CartButton({ tenantSlug }: { tenantSlug: string }) {
  const { totalItems } = useCart();

  return (
    <Link
      href={`/store/${tenantSlug}/cart`}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
      style={{ backgroundColor: "var(--store-primary, #2563eb)" }}
    >
      <ShoppingCart className="h-6 w-6 text-white" />
      {totalItems > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: "var(--store-accent, #f59e0b)" }}
        >
          {totalItems}
        </span>
      )}
    </Link>
  );
}
