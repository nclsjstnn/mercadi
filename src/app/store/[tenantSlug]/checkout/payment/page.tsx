"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/store/cart-provider";
import { completeStoreCheckout } from "@/actions/store-checkout";
import { formatPrice } from "@/lib/utils/currency";
import { Suspense } from "react";

function PaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const discount = parseInt(searchParams.get("discount") || "0") || 0;
  const couponCode = searchParams.get("coupon");
  const { clearCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId) return;

    setLoading(true);
    setError("");

    try {
      const result = await completeStoreCheckout(sessionId);
      if (!result.success) {
        setError(result.error || "Error al procesar el pago");
        setLoading(false);
        return;
      }
      clearCart();
      router.push(`/checkout/confirmation/${result.orderId}`);
    } catch {
      setError("Error inesperado");
      setLoading(false);
    }
  }

  if (!sessionId) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">Sesion de checkout no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Pago</h1>

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        Modo de prueba: usa cualquier dato. El pago es simulado.
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Order summary */}
      <div className="mb-6 rounded-xl border bg-white p-4 sm:p-6 text-sm">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatPrice(totalPrice, "CLP")}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuento{couponCode ? ` (${couponCode})` : ""}</span>
              <span>-{formatPrice(discount, "CLP")}</span>
            </div>
          )}
        </div>
        <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(totalPrice - discount, "CLP")}</span>
        </div>
      </div>

      <form onSubmit={handlePay} className="rounded-xl border bg-white p-4 sm:p-6">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre en la tarjeta
            </label>
            <input
              type="text"
              required
              value={card.name}
              onChange={(e) =>
                setCard((c) => ({ ...c, name: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Numero de tarjeta
            </label>
            <input
              type="text"
              required
              placeholder="4242 4242 4242 4242"
              value={card.number}
              onChange={(e) =>
                setCard((c) => ({ ...c, number: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Vencimiento
              </label>
              <input
                type="text"
                required
                placeholder="MM/AA"
                value={card.expiry}
                onChange={(e) =>
                  setCard((c) => ({ ...c, expiry: e.target.value }))
                }
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                CVV
              </label>
              <input
                type="text"
                required
                placeholder="123"
                value={card.cvv}
                onChange={(e) =>
                  setCard((c) => ({ ...c, cvv: e.target.value }))
                }
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg py-3 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--store-primary)" }}
        >
          {loading ? "Procesando pago..." : "Pagar"}
        </button>
      </form>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-gray-500">Cargando...</div>
      }
    >
      <PaymentForm />
    </Suspense>
  );
}
