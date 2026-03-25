import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import { CheckoutSession } from "@/lib/db/models/checkout-session";
import { Order } from "@/lib/db/models/order";
import { Tenant } from "@/lib/db/models/tenant";
import { formatPrice } from "@/lib/utils/currency";

interface Props {
  searchParams: Promise<{
    status?: string;
    session_id?: string;
    payment_id?: string;
  }>;
}

export default async function CheckoutResultPage({ searchParams }: Props) {
  const { status, session_id } = await searchParams;

  if (!session_id) return notFound();

  await connectDB();
  const session = await CheckoutSession.findOne({
    sessionId: session_id,
  }).lean();
  if (!session) return notFound();

  const tenant = await Tenant.findById(session.tenantId).lean();

  // Look for a completed order (may not exist yet if webhook hasn't fired)
  const order = await Order.findOne({
    checkoutSessionId: session_id,
    status: "confirmed",
  }).lean();

  const isSuccess = status === "success" || session.status === "completed";
  const isFailure = status === "failure";
  const storeHref = tenant ? `/store/${tenant.slug}` : "/";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-8 text-center">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Pago exitoso!
            </h1>
            {order ? (
              <>
                <p className="text-gray-500 mb-6">
                  Tu pedido <span className="font-mono font-medium text-gray-700">#{order.orderId}</span> ha sido confirmado.
                </p>
                <div className="rounded-lg bg-gray-50 border p-4 text-left mb-6 space-y-2 text-sm">
                  {session.lineItems.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-700">
                        {item.title} × {item.quantity}
                      </span>
                      <span className="text-gray-900 font-medium">
                        {formatPrice(item.totalPrice, session.currency)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(session.totals.total, session.currency)}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500 mb-6">
                Tu pago fue recibido. Estamos procesando tu pedido y te
                notificaremos pronto.
              </p>
            )}
          </>
        ) : isFailure ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pago rechazado
            </h1>
            <p className="text-gray-500 mb-6">
              No pudimos procesar tu pago. Puedes intentarlo nuevamente.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pago en proceso
            </h1>
            <p className="text-gray-500 mb-6">
              Tu pago está siendo procesado. Te notificaremos cuando se
              confirme.
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          {isFailure && (
            <Link
              href={storeHref}
              className="w-full rounded-lg py-3 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors text-center"
            >
              Volver a la tienda
            </Link>
          )}
          <Link
            href={storeHref}
            className={`w-full rounded-lg py-3 text-sm font-medium transition-colors text-center ${
              isFailure
                ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                : "text-white bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {isFailure ? "Cancelar" : "Ir a la tienda"}
          </Link>
        </div>
      </div>
    </div>
  );
}
