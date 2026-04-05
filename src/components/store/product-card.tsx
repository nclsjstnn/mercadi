"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Check, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/currency";
import { useCart } from "./cart-provider";

interface ProductCardProps {
  id: string;
  ucpItemId: string;
  tenantSlug: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  image?: string;
  category?: string;
  stock: number;
  intangible: boolean;
}

export function ProductCard({
  id,
  ucpItemId,
  tenantSlug,
  title,
  price,
  compareAtPrice,
  currency,
  image,
  category,
  stock,
  intangible,
}: ProductCardProps) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const cartItem = items.find((i) => i.productId === id);
  const hasDiscount = compareAtPrice != null && compareAtPrice > price;
  const discountPct = hasDiscount
    ? Math.round(((compareAtPrice! - price) / compareAtPrice!) * 100)
    : 0;
  const outOfStock = !intangible && stock <= 0;
  const lowStock = !intangible && stock > 0 && stock <= 5;

  function handleAdd() {
    addItem({ productId: id, ucpItemId, title, price, compareAtPrice, image }, quantity);
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 1600);
  }

  const pdpHref = `/store/${tenantSlug}/product/${id}`;

  return (
    <Card
      className="group flex flex-col overflow-hidden border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        backgroundColor: "var(--store-surface, white)",
        borderRadius: "var(--store-radius, 8px)",
        borderColor: "var(--store-muted, #e5e7eb)22",
      }}
    >
      {/* Image */}
      <Link href={pdpHref} className="relative block aspect-square overflow-hidden bg-muted shrink-0">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/30">
            <ImageIcon className="h-16 w-16" strokeWidth={1} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <Badge className="bg-red-500 hover:bg-red-500 text-white text-xs font-bold px-2 py-0.5">
              -{discountPct}%
            </Badge>
          )}
          {lowStock && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              ¡Últimas {stock}!
            </Badge>
          )}
        </div>

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              Agotado
            </span>
          </div>
        )}
      </Link>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {/* Category + title */}
        <div className="flex-1 space-y-1">
          {category && (
            <p
              className="text-[11px] font-medium uppercase tracking-widest"
              style={{ color: "var(--store-muted, #6b7280)" }}
            >
              {category}
            </p>
          )}
          <Link href={pdpHref}>
            <h3
              className="line-clamp-2 text-sm font-semibold leading-snug transition-colors"
              style={{
                color: "var(--store-text, #111827)",
                fontFamily: "var(--store-font-heading)",
              }}
            >
              {title}
            </h3>
          </Link>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold" style={{ color: "var(--store-primary, #2563eb)" }}>
            {formatPrice(price, currency)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(compareAtPrice!, currency)}
            </span>
          )}
        </div>

        {/* Cart in-progress indicator */}
        {cartItem && cartItem.quantity > 0 && (
          <p className="text-xs text-muted-foreground">
            {cartItem.quantity} en el carrito
          </p>
        )}

        {/* Add to cart controls */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-2">
            <div
              className="flex items-center overflow-hidden border bg-background"
              style={{ borderRadius: "var(--store-radius, 8px)" }}
            >
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || outOfStock}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-9 text-center text-sm font-semibold tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                disabled={outOfStock || (!intangible && quantity >= stock)}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={outOfStock}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderRadius: "var(--store-radius, 8px)",
                backgroundColor: added
                  ? "#16a34a"
                  : outOfStock
                  ? undefined
                  : "var(--store-primary, #2563eb)",
              }}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" />
                  Agregado
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Agregar
                </>
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
