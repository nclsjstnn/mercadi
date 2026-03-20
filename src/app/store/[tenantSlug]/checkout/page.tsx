"use client";

import { useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCart } from "@/components/store/cart-provider";
import {
  createStoreCheckout,
  updateStoreCheckout,
  applyStoreCoupon,
  removeStoreCoupon,
} from "@/actions/store-checkout";
import { formatPrice } from "@/lib/utils/currency";

export default function CheckoutPage() {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { items, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    rut: "",
    street: "",
    comuna: "",
    region: "",
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function ensureSession(): Promise<string | null> {
    if (sessionIdRef.current) return sessionIdRef.current;

    const cartItems = items.map((i) => ({
      ucpItemId: i.ucpItemId,
      quantity: i.quantity,
    }));

    const result = await createStoreCheckout(tenantSlug, cartItems);
    if (!result.success) {
      setError(result.error || "Error al crear el checkout");
      return null;
    }
    sessionIdRef.current = result.sessionId!;
    return result.sessionId!;
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");

    try {
      const sid = await ensureSession();
      if (!sid) {
        setCouponLoading(false);
        return;
      }

      const result = await applyStoreCoupon(sid, couponCode.trim());
      if (!result.success) {
        setCouponError(result.error || "Cupón inválido");
      } else {
        setAppliedCoupon(couponCode.trim().toUpperCase());
        setCouponDiscount(result.discount || 0);
        setCouponError("");
      }
    } catch {
      setCouponError("Error al aplicar cupón");
    }
    setCouponLoading(false);
  }

  async function handleRemoveCoupon() {
    if (!sessionIdRef.current) return;
    setCouponLoading(true);

    try {
      const result = await removeStoreCoupon(sessionIdRef.current);
      if (result.success) {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponCode("");
        setCouponError("");
      }
    } catch {}
    setCouponLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const sid = await ensureSession();
      if (!sid) {
        setLoading(false);
        return;
      }

      const updateResult = await updateStoreCheckout(sid, {
        buyer: {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          rut: form.rut || undefined,
        },
        fulfillment: {
          type: "shipping" as const,
          address: {
            street: form.street,
            comuna: form.comuna,
            region: form.region,
          },
        },
      });

      if (!updateResult.success) {
        setError(updateResult.error || "Error al actualizar datos");
        setLoading(false);
        return;
      }

      const paymentParams = new URLSearchParams({ session: sid });
      if (couponDiscount > 0) {
        paymentParams.set("discount", String(couponDiscount));
        if (appliedCoupon) paymentParams.set("coupon", appliedCoupon);
      }
      router.push(`/checkout/payment?${paymentParams.toString()}`);
    } catch {
      setError("Error inesperado");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          No hay productos en tu carrito
        </h1>
        <a
          href="/"
          className="text-sm font-medium"
          style={{ color: "var(--store-primary)" }}
        >
          Volver a la tienda
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Checkout</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Buyer info */}
        <div className="rounded-xl border bg-white p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Datos del comprador
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nombre completo *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Telefono
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                RUT
              </label>
              <input
                type="text"
                value={form.rut}
                onChange={(e) => update("rut", e.target.value)}
                placeholder="12.345.678-9"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="rounded-xl border bg-white p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Direccion de envio
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Direccion *
              </label>
              <input
                type="text"
                required
                value={form.street}
                onChange={(e) => update("street", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Comuna *
              </label>
              <input
                type="text"
                required
                value={form.comuna}
                onChange={(e) => update("comuna", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Region *
              </label>
              <input
                type="text"
                required
                value={form.region}
                onChange={(e) => update("region", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border bg-white p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Resumen del pedido
          </h2>
          <div className="divide-y text-sm">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between py-2"
              >
                <span className="text-gray-600">
                  {item.title} x{item.quantity}
                </span>
                <span className="font-medium">
                  {formatPrice(item.price * item.quantity, "CLP")}
                </span>
              </div>
            ))}
          </div>

          {/* Coupon section */}
          <div className="mt-4 border-t pt-4">
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">
                <span className="text-green-700">
                  Cupón <span className="font-mono font-bold">{appliedCoupon}</span> aplicado:
                  {" "}-{formatPrice(couponDiscount, "CLP")}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  disabled={couponLoading}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Código de cupón"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {couponLoading ? "..." : "Aplicar"}
                  </button>
                </div>
                {couponError && (
                  <p className="mt-1 text-xs text-red-600">{couponError}</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(totalPrice, "CLP")}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>-{formatPrice(couponDiscount, "CLP")}</span>
                </div>
              )}
            </div>
            <div className="mt-2 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(totalPrice - couponDiscount, "CLP")}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-3 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--store-primary)" }}
        >
          {loading ? "Procesando..." : "Continuar al pago"}
        </button>
      </form>
    </div>
  );
}
