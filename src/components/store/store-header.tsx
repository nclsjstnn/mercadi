"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./cart-provider";

interface StoreHeaderProps {
  businessName: string;
  tenantSlug: string;
  logoUrl?: string;
}

export function StoreHeader({ businessName, tenantSlug, logoUrl }: StoreHeaderProps) {
  const { totalItems } = useCart();

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: "var(--store-surface, white)", borderColor: "var(--store-muted, #e5e7eb)33" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href={`/store/${tenantSlug}`} className="flex items-center gap-3">
          {logoUrl && (
            <img src={logoUrl} alt={businessName} className="h-10 w-auto" />
          )}
          <span
            className="text-xl font-bold"
            style={{ color: "var(--store-primary)", fontFamily: "var(--store-font-heading)" }}
          >
            {businessName}
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href={`/store/${tenantSlug}`}
            className="text-sm font-medium"
            style={{ color: "var(--store-muted, #6b7280)" }}
          >
            Productos
          </Link>
          <Link
            href={`/store/${tenantSlug}/cart`}
            className="relative flex items-center gap-1 text-sm font-medium"
            style={{ color: "var(--store-muted, #6b7280)" }}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: "var(--store-accent, #f59e0b)" }}
              >
                {totalItems}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
