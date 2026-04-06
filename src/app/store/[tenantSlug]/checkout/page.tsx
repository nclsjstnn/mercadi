"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { BookmarkCheck, X } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { AddressAutocomplete, type AddressResult } from "@/components/store/address-autocomplete";
import { useSavedCheckout } from "@/hooks/use-saved-checkout";
import {
  createStoreCheckout,
  updateStoreCheckout,
  applyStoreCoupon,
  removeStoreCoupon,
} from "@/actions/store-checkout";
import { formatPrice } from "@/lib/utils/currency";

const INPUT_CLASS =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function CheckoutPage() {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { items, totalPrice } = useCart();
  const { profile, save: saveProfile, clear: clearProfile } = useSavedCheckout();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usingsSaved, setUsingSaved] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    rut: "",
    street: "",
    comuna: "",
    region: "",
    postalCode: "",
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  // Pre-fill from localStorage once the profile is loaded
  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.buyer.name,
      email: profile.buyer.email,
      phone: profile.buyer.phone,
      rut: profile.buyer.rut,
      street: profile.address.street,
      comuna: profile.address.comuna,
      region: profile.address.region,
      postalCode: profile.address.postalCode,
    });
    setUsingSaved(true);
  }, [profile]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleDismissSaved() {
    clearProfile();
    setUsingSaved(false);
    setForm({ name: "", email: "", phone: "", rut: "", street: "", comuna: "", region: "", postalCode: "" });
  }

  function handleAddressSelect(result: AddressResult) {
    setForm((prev) => ({
      ...prev,
      street: result.street,
      comuna: result.comuna,
      region: result.region,
      postalCode: result.postalCode,
    }));
  }

  async function ensureSession(): Promise<string | null> {
    if (sessionIdRef.current) return sessionIdRef.current;
    const cartItems = items.map((i) => ({ ucpItemId: i.ucpItemId, quantity: i.quantity }));
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
      if (!sid) { setCouponLoading(false); return; }
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
      if (!sid) { setLoading(false); return; }

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
            postalCode: form.postalCode || undefined,
          },
        },
      });

      if (!updateResult.success) {
        setError(updateResult.error || "Error al actualizar datos");
        setLoading(false);
        return;
      }

      // Persist to localStorage for future purchases
      saveProfile(
        { name: form.name, email: form.email, phone: form.phone, rut: form.rut },
        {
          street: form.street,
          comuna: form.comuna,
          region: form.region,
          postalCode: form.postalCode,
          formattedAddress: form.street,
        }
      );

      const paymentParams = new URLSearchParams({ session: sid });
      if (couponDiscount > 0) {
        paymentParams.set("discount", String(couponDiscount));
        if (appliedCoupon) paymentParams.set("coupon", appliedCoupon);
      }
      router.push(`/store/${tenantSlug}/checkout/payment?${paymentParams.toString()}`);
    } catch {
      setError("Error inesperado");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold" style={{ color: "var(--store-text, #111827)" }}>
          No hay productos en tu carrito
        </h1>
        <a
          href={`/store/${tenantSlug}`}
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
      <h1
        className="mb-8 text-2xl font-bold"
        style={{ color: "var(--store-text, #111827)", fontFamily: "var(--store-font-heading)" }}
      >
        Checkout
      </h1>

      {/* Saved data banner */}
      {usingsSaved && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-700">
            <BookmarkCheck className="h-4 w-4 shrink-0" />
            <span>Tus datos han sido pre-completados desde tu última compra.</span>
          </div>
          <button
            type="button"
            onClick={handleDismissSaved}
            className="ml-4 shrink-0 rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
            title="Limpiar datos guardados"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Buyer info */}
        <div
          className="rounded-xl border p-4 sm:p-6"
          style={{ backgroundColor: "var(--store-surface, white)" }}
        >
          <h2
            className="mb-4 text-lg font-bold"
            style={{ color: "var(--store-text, #111827)", fontFamily: "var(--store-font-heading)" }}
          >
            Datos del comprador
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium" style={{ color: "var(--store-text, #374151)" }}>
                Nombre completo *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "var(--store-text, #374151)" }}>
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "var(--store-text, #374151)" }}>
                Teléfono
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={INPUT_CLASS}
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "var(--store-text, #374151)" }}>
                RUT
              </label>
              <input
                type="text"
                value={form.rut}
                onChange={(e) => update("rut", e.target.value)}
                className={INPUT_CLASS}
                placeholder="12.345.678-9"
              />
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div
          className="rounded-xl border p-4 sm:p-6"
          style={{ backgroundColor: "var(--store-surface, white)" }}
        >
          <h2
            className="mb-1 text-lg font-bold"
            style={{ color: "var(--store-text, #111827)", fontFamily: "var(--store-font-heading)" }}
          >
            Dirección de envío
          </h2>
          <p className="mb-4 text-xs" style={{ color: "var(--store-muted, #6b7280)" }}>
            Escribe tu calle para ver sugerencias. Se completarán automáticamente la comuna, región y código postal.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Address autocomplete — full width */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium" style={{ color: "var(--store-text, #374151)" }}>
                Dirección *
              </label>
              <AddressAutocomplete
                value={form.street}
                onChange={(v) => update("street", v)}
                onSelect={handleAddressSelect}
                required
                inputClassName={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "var(--store-text, #374151)" }}>
                Comuna *
              </label>
              <input
                type="text"
                required
                value={form.comuna}
                onChange={(e) => update("comuna", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Ej: Providencia"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "var(--store-text, #374151)" }}>
                Región *
              </label>
              <input
                type="text"
                required
                value={form.region}
                onChange={(e) => update("region", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Ej: Región Metropolitana"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "var(--store-text, #374151)" }}>
                Código postal
              </label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Ej: 7500000"
              />
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div
          className="rounded-xl border p-4 sm:p-6"
          style={{ backgroundColor: "var(--store-surface, white)" }}
        >
          <h2
            className="mb-4 text-lg font-bold"
            style={{ color: "var(--store-text, #111827)", fontFamily: "var(--store-font-heading)" }}
          >
            Resumen del pedido
          </h2>
          <div className="divide-y text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between py-2">
                <span style={{ color: "var(--store-muted, #6b7280)" }}>
                  {item.title} x{item.quantity}
                </span>
                <span className="font-medium" style={{ color: "var(--store-text, #111827)" }}>
                  {formatPrice(item.price * item.quantity, "CLP")}
                </span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mt-4 border-t pt-4">
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                <span className="text-emerald-700">
                  Cupón <span className="font-mono font-bold">{appliedCoupon}</span> aplicado:{" "}
                  -{formatPrice(couponDiscount, "CLP")}
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
                    className={`flex-1 uppercase ${INPUT_CLASS}`}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                    style={{ color: "var(--store-text, #374151)" }}
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

          {/* Totals */}
          <div className="mt-4 border-t pt-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--store-muted, #6b7280)" }}>Subtotal</span>
                <span style={{ color: "var(--store-text, #111827)" }}>{formatPrice(totalPrice, "CLP")}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Descuento</span>
                  <span>-{formatPrice(couponDiscount, "CLP")}</span>
                </div>
              )}
            </div>
            <div className="mt-2 flex justify-between text-lg font-bold" style={{ color: "var(--store-text, #111827)" }}>
              <span>Total</span>
              <span>{formatPrice(totalPrice - couponDiscount, "CLP")}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-sm font-semibold text-white disabled:opacity-50"
          style={{
            backgroundColor: "var(--store-primary, #2563eb)",
            borderRadius: "var(--store-radius, 8px)",
          }}
        >
          {loading ? "Procesando..." : "Continuar al pago →"}
        </button>
      </form>
    </div>
  );
}
