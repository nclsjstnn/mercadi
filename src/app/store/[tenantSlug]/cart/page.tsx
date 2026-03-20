"use client";

import Link from "next/link";
import { Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { formatPrice } from "@/lib/utils/currency";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          Tu carrito esta vacio
        </h1>
        <p className="mb-8 text-gray-500">
          Agrega productos para comenzar tu compra.
        </p>
        <Link
          href="/"
          className="rounded-lg px-6 py-3 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--store-primary)" }}
        >
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Carrito</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="divide-y rounded-xl border bg-white">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex flex-wrap items-center gap-4 p-4"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300 text-xs">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <div className="flex items-center gap-2">
                    {item.compareAtPrice && item.compareAtPrice > item.price && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(item.compareAtPrice, "CLP")}
                      </span>
                    )}
                    <p
                      className="text-sm font-bold"
                      style={{ color: "var(--store-primary)" }}
                    >
                      {formatPrice(item.price, "CLP")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center rounded-lg border">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="px-2 py-1 text-gray-500 hover:text-gray-700"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="px-2 py-1 text-gray-500 hover:text-gray-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="w-24 text-right font-bold text-gray-900">
                  {formatPrice(item.price * item.quantity, "CLP")}
                </p>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="rounded-xl border bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Resumen</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">
                  {formatPrice(totalPrice, "CLP")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Envio</span>
                <span className="text-gray-500">Por calcular</span>
              </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(totalPrice, "CLP")}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-6 block w-full rounded-lg py-3 text-center text-sm font-medium text-white"
              style={{ backgroundColor: "var(--store-primary)" }}
            >
              Ir al checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
