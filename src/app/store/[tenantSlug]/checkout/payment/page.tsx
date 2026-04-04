"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useCart } from "@/components/store/cart-provider";
import { completeStoreCheckout, getCheckoutProviders } from "@/actions/store-checkout";
import { formatPrice } from "@/lib/utils/currency";
import { Suspense } from "react";

const PROVIDER_META: Record<string, { label: string; description: string }> = {
  transbank: {
    label: "WebPay",
    description: "Débito, crédito o prepago Redcompra",
  },
  mercadopago: {
    label: "MercadoPago",
    description: "Tarjeta, transferencia o efectivo",
  },
  mock: {
    label: "Pago de prueba",
    description: "Aprobación instantánea (modo demo)",
  },
};

function PaymentForm() {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const discount = parseInt(searchParams.get("discount") || "0") || 0;
  const couponCode = searchParams.get("coupon");
  const { clearCart, totalPrice } = useCart();

  const [providers, setProviders] = useState<{ provider: string; label: string }[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) return;
    getCheckoutProviders(sessionId).then((res) => {
      if (res.success && res.providers) {
        setProviders(res.providers);
        if (res.providers.length === 1) {
          setSelectedProvider(res.providers[0].provider);
        }
      }
      setLoadingProviders(false);
    });
  }, [sessionId]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !selectedProvider) return;

    setLoading(true);
    setError("");

    try {
      const result = await completeStoreCheckout(sessionId, selectedProvider);
      if (!result.success) {
        setError(result.error || "Error al procesar el pago");
        setLoading(false);
        return;
      }
      clearCart();
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
      router.push(`/store/${tenantSlug}/checkout/confirmation/${result.orderId}`);
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

      {loadingProviders ? (
        <div className="py-8 text-center text-sm text-gray-400">Cargando métodos de pago...</div>
      ) : (
        <form onSubmit={handlePay} className="space-y-4">
          {/* Provider selector — only shown when more than one option */}
          {providers.length > 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Elige cómo pagar</p>
              {providers.map(({ provider }) => {
                const meta = PROVIDER_META[provider] ?? { label: provider, description: "" };
                const selected = selectedProvider === provider;
                return (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => setSelectedProvider(provider)}
                    className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                      selected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${selected ? "text-blue-700" : "text-gray-900"}`}>
                      {meta.label}
                    </p>
                    {meta.description && (
                      <p className="mt-0.5 text-xs text-gray-500">{meta.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedProvider}
            className="w-full rounded-lg py-3 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--store-primary)" }}
          >
            {loading
              ? "Redirigiendo al pago..."
              : providers.length > 1 && selectedProvider
              ? `Pagar con ${PROVIDER_META[selectedProvider]?.label ?? selectedProvider}`
              : "Continuar al pago"}
          </button>
        </form>
      )}
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
